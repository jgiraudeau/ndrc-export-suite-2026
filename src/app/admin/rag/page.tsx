"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Database,
  FileText,
  RefreshCw,
  Trash2,
  UploadCloud,
  FolderSync,
  Shield,
  Search,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type RagDoc = {
  name: string;
  displayName: string;
  mimeType: string | null;
  state: string | null;
  sizeBytes: number | null;
  createTime: string | null;
  updateTime: string | null;
  sourceType?: string | null;
  sourcePath?: string | null;
};

type RagListResponse = {
  storeName: string;
  documents: RagDoc[];
};

type SyncResponse = {
  storeName: string;
  folderPath: string;
  discovered: number;
  indexed: number;
  skipped: number;
  removed: number;
  failed: number;
  errors: string[];
};

type StateFilter =
  | "ALL"
  | "STATE_ACTIVE"
  | "STATE_PENDING"
  | "STATE_FAILED"
  | "STATE_UNSPECIFIED";

type SourceFilter = "ALL" | "knowledge_folder" | "uploaded_file_admin" | "OTHER";

function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDateTime(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stateBadge(state: string | null): { label: string; className: string } {
  switch (state) {
    case "STATE_ACTIVE":
      return {
        label: "Actif",
        className: "bg-emerald-50 text-emerald-700 border border-emerald-100",
      };
    case "STATE_PENDING":
      return {
        label: "En cours",
        className: "bg-amber-50 text-amber-700 border border-amber-100",
      };
    case "STATE_FAILED":
      return {
        label: "Erreur",
        className: "bg-red-50 text-red-700 border border-red-100",
      };
    default:
      return {
        label: "Inconnu",
        className: "bg-slate-100 text-slate-600 border border-slate-200",
      };
  }
}

function sourceLabel(sourceType: string | null | undefined): string {
  if (sourceType === "knowledge_folder") return "Knowledge";
  if (sourceType === "uploaded_file_admin") return "Upload admin";
  return sourceType || "Autre";
}

export default function AdminRagPage() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [documents, setDocuments] = useState<RagDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [folderPath, setFolderPath] = useState("knowledge");
  const [error, setError] = useState("");
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("ALL");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");
  const [visibleCount, setVisibleCount] = useState(120);
  const [showSyncErrors, setShowSyncErrors] = useState(false);

  const authHeaders = (): HeadersInit => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("ndrc_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchRagDocuments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/rag/documents", {
        headers: authHeaders(),
      });
      const data = (await res.json()) as RagListResponse | { error?: string };
      if (!res.ok) {
        const message = "error" in data ? data.error || "Erreur RAG" : "Erreur RAG";
        throw new Error(message);
      }
      const ragData = data as RagListResponse;
      setStoreName(ragData.storeName || "");
      setDocuments(ragData.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger le RAG");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const userRaw = localStorage.getItem("ndrc_user");
    if (!userRaw) {
      router.push("/admin/login");
      return;
    }

    try {
      const user = JSON.parse(userRaw) as { role?: string };
      if (user.role !== "ADMIN") {
        router.push("/admin/login");
        return;
      }
    } catch {
      router.push("/admin/login");
      return;
    }

    void fetchRagDocuments();
  }, [fetchRagDocuments, router]);

  useEffect(() => {
    setVisibleCount(120);
  }, [searchTerm, stateFilter, sourceFilter, documents.length]);

  const uploadDocument = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/rag/documents", {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Echec de l'indexation");

      await fetchRagDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Echec de l'indexation");
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (documentName: string) => {
    setError("");
    try {
      const res = await fetch("/api/rag/documents", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ documentName }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Suppression impossible");

      await fetchRagDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible");
    }
  };

  const syncKnowledgeFolder = async () => {
    setSyncing(true);
    setError("");
    setSyncResult(null);
    try {
      const payload: { folderPath?: string; removeMissing: boolean } = {
        removeMissing: true,
      };
      if (folderPath.trim().length > 0) {
        payload.folderPath = folderPath.trim();
      }

      const res = await fetch("/api/rag/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as SyncResponse | { error?: string };
      if (!res.ok) {
        const message = "error" in data ? data.error || "Echec de synchronisation" : "Echec";
        throw new Error(message);
      }

      setSyncResult(data as SyncResponse);
      setShowSyncErrors(false);
      await fetchRagDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Echec de synchronisation");
    } finally {
      setSyncing(false);
    }
  };

  const statusStats = useMemo(() => {
    const stats = {
      total: documents.length,
      active: 0,
      pending: 0,
      failed: 0,
      unknown: 0,
    };

    for (const doc of documents) {
      if (doc.state === "STATE_ACTIVE") stats.active++;
      else if (doc.state === "STATE_PENDING") stats.pending++;
      else if (doc.state === "STATE_FAILED") stats.failed++;
      else stats.unknown++;
    }

    return stats;
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const sorted = [...documents].sort((a, b) => {
      const aTime = new Date(a.updateTime || a.createTime || 0).getTime();
      const bTime = new Date(b.updateTime || b.createTime || 0).getTime();
      return bTime - aTime;
    });

    return sorted.filter((doc) => {
      if (stateFilter !== "ALL" && (doc.state || "STATE_UNSPECIFIED") !== stateFilter) {
        return false;
      }

      if (sourceFilter !== "ALL") {
        if (sourceFilter === "OTHER") {
          if (doc.sourceType === "knowledge_folder" || doc.sourceType === "uploaded_file_admin") {
            return false;
          }
        } else if ((doc.sourceType || "") !== sourceFilter) {
          return false;
        }
      }

      if (!normalizedSearch) return true;

      const searchable = [
        doc.displayName,
        doc.name,
        doc.sourcePath || "",
        doc.mimeType || "",
        doc.sourceType || "",
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [documents, searchTerm, stateFilter, sourceFilter]);

  const visibleDocuments = filteredDocuments.slice(0, visibleCount);

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Admin RAG</p>
              <h1 className="text-2xl font-black text-slate-900">Base documentaire globale</h1>
            </div>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-100"
          >
            <ArrowLeft size={14} /> Retour admin
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Database size={18} className="text-indigo-600" />
            <div>
              <p className="font-black text-slate-800">Store RAG global</p>
              <p className="text-xs text-slate-400 font-bold">Store: {storeName || "-"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] uppercase font-black text-slate-400">Total</p>
              <p className="text-lg font-black text-slate-800">{statusStats.total}</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
              <p className="text-[10px] uppercase font-black text-emerald-600">Actifs</p>
              <p className="text-lg font-black text-emerald-700">{statusStats.active}</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
              <p className="text-[10px] uppercase font-black text-amber-600">En cours</p>
              <p className="text-lg font-black text-amber-700">{statusStats.pending}</p>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2">
              <p className="text-[10px] uppercase font-black text-red-600">Erreurs</p>
              <p className="text-lg font-black text-red-700">{statusStats.failed}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] uppercase font-black text-slate-400">Inconnu</p>
              <p className="text-lg font-black text-slate-700">{statusStats.unknown}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <input
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              placeholder="knowledge"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400"
            />
            <button
              onClick={syncKnowledgeFolder}
              disabled={syncing}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-60"
            >
              {syncing ? <RefreshCw size={14} className="animate-spin" /> : <FolderSync size={14} />}
              {syncing ? "Sync..." : "Synchroniser Knowledge"}
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-black">
              <UploadCloud size={14} />
              {uploading ? "Upload..." : "Ajouter un document"}
              <input
                type="file"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadDocument(file);
                  e.currentTarget.value = "";
                }}
              />
            </label>

            <button
              onClick={() => void fetchRagDocuments()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-slate-100"
            >
              <RefreshCw size={14} /> Rafraichir
            </button>
          </div>

          {syncResult && (
            <div
              className={`rounded-xl px-3 py-2 text-xs font-semibold border ${
                syncResult.failed > 0
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-emerald-100 bg-emerald-50 text-emerald-700"
              }`}
            >
              <div>
                Sync: {syncResult.indexed} indexes, {syncResult.skipped} inchanges, {syncResult.removed} supprimes, {syncResult.failed} erreurs.
              </div>
              {syncResult.failed > 0 && syncResult.errors.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setShowSyncErrors((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-[11px] font-black underline"
                  >
                    {showSyncErrors ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {showSyncErrors ? "Masquer" : "Afficher"} les erreurs ({syncResult.errors.length})
                  </button>
                  {showSyncErrors && (
                    <div className="mt-2 max-h-40 overflow-auto rounded-lg border border-amber-200 bg-white p-2">
                      {syncResult.errors.map((item) => (
                        <p key={item} className="text-[11px] leading-5 text-amber-800 break-words">
                          {item}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, chemin, MIME..."
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400"
              />
            </div>

            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value as StateFilter)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 bg-white"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="STATE_ACTIVE">Actif</option>
              <option value="STATE_PENDING">En cours</option>
              <option value="STATE_FAILED">Erreur</option>
              <option value="STATE_UNSPECIFIED">Inconnu</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 bg-white"
            >
              <option value="ALL">Toutes les sources</option>
              <option value="knowledge_folder">Knowledge</option>
              <option value="uploaded_file_admin">Upload admin</option>
              <option value="OTHER">Autres</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-bold">
            {filteredDocuments.length} document(s) affiche(s) sur {documents.length}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm font-bold text-slate-400 flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin" /> Chargement des documents...
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-10 text-center">
              <FileText size={28} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-400">Aucun document ne correspond aux filtres.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {visibleDocuments.map((doc) => {
                  const badge = stateBadge(doc.state);
                  return (
                    <div key={doc.name} className="p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{doc.displayName || doc.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-black ${badge.className}`}>
                            {doc.state === "STATE_ACTIVE" ? <CheckCircle2 size={12} /> : null}
                            {doc.state === "STATE_PENDING" ? <Clock3 size={12} /> : null}
                            {doc.state === "STATE_FAILED" ? <XCircle size={12} /> : null}
                            {!doc.state || doc.state === "STATE_UNSPECIFIED" ? <AlertTriangle size={12} /> : null}
                            {badge.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-slate-600 font-black">
                            {sourceLabel(doc.sourceType)}
                          </span>
                          <span className="text-slate-500 font-bold">{doc.mimeType || "mime inconnu"}</span>
                          <span className="text-slate-400">{formatBytes(doc.sizeBytes)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-1">
                          {doc.sourcePath || "source manuelle"} - MAJ: {formatDateTime(doc.updateTime || doc.createTime)}
                        </p>
                      </div>
                      <button
                        onClick={() => void deleteDocument(doc.name)}
                        className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Supprimer du store RAG global"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {visibleCount < filteredDocuments.length && (
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 120)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-black uppercase tracking-wider hover:bg-slate-100"
                  >
                    Charger plus ({Math.min(120, filteredDocuments.length - visibleCount)} de plus)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
