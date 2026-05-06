"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  ScrollText,
  Search,
  Shield,
  Clock3,
  UserRound,
  Target,
} from "lucide-react";

type AuditLog = {
  id: string;
  actorId: string | null;
  actorRole: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  createdAt: string;
};

type AuditResponse = {
  logs: AuditLog[];
};

function formatDateTime(value: string): string {
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

function actionLabel(action: string): string {
  return action
    .replace(/^admin\./, "Admin · ")
    .replace(/^teacher\./, "Prof · ")
    .replace(/^student\./, "Eleve · ")
    .replaceAll(".", " ");
}

function metadataPreview(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "-";
  const entries = Object.entries(metadata as Record<string, unknown>);
  if (entries.length === 0) return "-";
  return entries
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}

export default function AdminAuditPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);
    setError("");

    try {
      const res = await fetch("/api/admin/audit-logs?limit=100");
      const data = (await res.json()) as AuditResponse | { error?: string };
      if (!res.ok) {
        throw new Error("error" in data ? data.error || "Erreur audit" : "Erreur audit");
      }
      setLogs((data as AuditResponse).logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les logs");
    } finally {
      setLoading(false);
      setRefreshing(false);
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

    void fetchLogs();
  }, [fetchLogs, router]);

  const filteredLogs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((log) =>
      [
        log.action,
        log.actorRole,
        log.actorId,
        log.targetType,
        log.targetId,
        log.ipAddress,
        metadataPreview(log.metadata),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [logs, searchTerm]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-950 text-white px-6 py-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center">
              <ScrollText size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black leading-none">Journal d&apos;audit</h1>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                Actions sensibles admin, prof et eleve
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchLogs("refresh")}
              disabled={refreshing}
              className="inline-flex h-10 items-center gap-2 px-3 rounded-lg bg-white/10 text-xs font-black uppercase tracking-wider text-slate-200 hover:bg-white/15 disabled:opacity-50"
              title="Rafraichir les logs"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
              Rafraichir
            </button>
            <Link
              href="/admin"
              className="inline-flex h-10 items-center gap-2 px-3 rounded-lg bg-white text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-amber-100"
            >
              <ArrowLeft size={15} />
              Admin
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider font-black text-slate-400 flex items-center gap-1.5">
                <Clock3 size={13} /> Volume
              </div>
              <div className="text-2xl font-black">{logs.length}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider font-black text-slate-400 flex items-center gap-1.5">
                <Shield size={13} /> Admin
              </div>
              <div className="text-2xl font-black">
                {logs.filter((log) => log.actorRole === "ADMIN").length}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider font-black text-slate-400 flex items-center gap-1.5">
                <Target size={13} /> Cibles
              </div>
              <div className="text-2xl font-black">
                {new Set(logs.map((log) => log.targetType).filter(Boolean)).size}
              </div>
            </div>
          </div>

          <label className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full h-11 rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
              placeholder="Rechercher action, acteur, cible, IP..."
            />
          </label>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {loading ? (
            <div className="py-20 text-center text-sm font-black uppercase tracking-wider text-slate-400">
              Chargement des logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-20 text-center text-sm font-black uppercase tracking-wider text-slate-400">
              Aucun log d&apos;audit
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-black">Date</th>
                    <th className="px-4 py-3 font-black">Action</th>
                    <th className="px-4 py-3 font-black">Acteur</th>
                    <th className="px-4 py-3 font-black">Cible</th>
                    <th className="px-4 py-3 font-black">Details</th>
                    <th className="px-4 py-3 font-black">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-amber-50/40">
                      <td className="px-4 py-3 text-xs font-bold text-slate-600 whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md bg-slate-900 px-2 py-1 text-[11px] font-black text-white">
                          {actionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex items-center gap-2 font-black text-slate-800">
                          <UserRound size={14} className="text-slate-400" />
                          {log.actorRole}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">{log.actorId || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-black text-slate-800">{log.targetType || "-"}</div>
                        <div className="font-mono text-[10px] text-slate-400">{log.targetId || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-600 max-w-sm truncate">
                        {metadataPreview(log.metadata)}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.ipAddress || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
