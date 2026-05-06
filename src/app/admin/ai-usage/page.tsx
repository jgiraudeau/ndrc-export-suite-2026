"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BrainCircuit,
  Clock3,
  Gauge,
  RefreshCw,
  Search,
  Shield,
  Zap,
} from "lucide-react";

type AiUsageLog = {
  id: string;
  actorId: string | null;
  actorRole: string;
  feature: string;
  model: string | null;
  status: string;
  promptChars: number;
  responseChars: number;
  estimatedTokens: number;
  errorMessage: string | null;
  metadata: unknown;
  ipAddress: string | null;
  createdAt: string;
};

type AiUsageSummary = {
  feature: string;
  calls: number;
  estimatedTokens: number;
};

type AiUsageResponse = {
  logs: AiUsageLog[];
  summary24h: AiUsageSummary[];
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

function featureLabel(feature: string): string {
  const labels: Record<string, string> = {
    "student.chat": "Chat élève",
    "teacher.generate_course": "Génération cours",
    "teacher.refine_document": "Affinage document",
    "teacher.generate_mission": "Mission IA",
    "teacher.export_quiz": "Export quiz",
    "teacher.evaluate_student": "Évaluation IA",
    "teacher.transcribe_audio": "Transcription",
  };
  return labels[feature] || feature;
}

function statusClass(status: string): string {
  if (status === "success") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "blocked") return "bg-amber-50 text-amber-700 border-amber-100";
  if (status === "error") return "bg-red-50 text-red-700 border-red-100";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

export default function AdminAiUsagePage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AiUsageLog[]>([]);
  const [summary, setSummary] = useState<AiUsageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsage = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);
    setError("");

    try {
      const res = await fetch("/api/admin/ai-usage?limit=150");
      const data = (await res.json()) as AiUsageResponse | { error?: string };
      if (!res.ok) {
        throw new Error("error" in data ? data.error || "Erreur usage IA" : "Erreur usage IA");
      }
      const usageData = data as AiUsageResponse;
      setLogs(usageData.logs || []);
      setSummary(usageData.summary24h || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les usages IA");
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

    void fetchUsage();
  }, [fetchUsage, router]);

  const filteredLogs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((log) =>
      [
        log.feature,
        featureLabel(log.feature),
        log.actorRole,
        log.actorId,
        log.model,
        log.status,
        log.errorMessage,
        log.ipAddress,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [logs, searchTerm]);

  const totalCalls = summary.reduce((sum, item) => sum + item.calls, 0);
  const totalTokens = summary.reduce((sum, item) => sum + item.estimatedTokens, 0);
  const blockedCount = logs.filter((log) => log.status === "blocked").length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-950 text-white px-6 py-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-400 text-slate-950 flex items-center justify-center">
              <BrainCircuit size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black leading-none">Usage IA</h1>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                Quotas, appels et estimation de volume
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchUsage("refresh")}
              disabled={refreshing}
              className="inline-flex h-10 items-center gap-2 px-3 rounded-lg bg-white/10 text-xs font-black uppercase tracking-wider text-slate-200 hover:bg-white/15 disabled:opacity-50"
              title="Rafraichir les usages IA"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
              Rafraichir
            </button>
            <Link
              href="/admin"
              className="inline-flex h-10 items-center gap-2 px-3 rounded-lg bg-white text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-emerald-100"
            >
              <ArrowLeft size={15} />
              Admin
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider font-black text-slate-400 flex items-center gap-1.5">
              <Zap size={13} /> Appels 24h
            </div>
            <div className="text-2xl font-black">{compactNumber(totalCalls)}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider font-black text-slate-400 flex items-center gap-1.5">
              <Gauge size={13} /> Tokens estimés
            </div>
            <div className="text-2xl font-black">{compactNumber(totalTokens)}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider font-black text-slate-400 flex items-center gap-1.5">
              <Shield size={13} /> Blocages
            </div>
            <div className="text-2xl font-black">{compactNumber(blockedCount)}</div>
          </div>
          <label className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full h-full min-h-16 rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              placeholder="Filtrer..."
            />
          </label>
        </div>

        {summary.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {summary.map((item) => (
              <div key={item.feature} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <div className="text-[10px] uppercase tracking-wider font-black text-slate-400">
                  {featureLabel(item.feature)}
                </div>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <span className="text-xl font-black">{compactNumber(item.calls)}</span>
                  <span className="text-xs font-bold text-slate-500">
                    {compactNumber(item.estimatedTokens)} tokens
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {loading ? (
            <div className="py-20 text-center text-sm font-black uppercase tracking-wider text-slate-400">
              Chargement des usages IA...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-20 text-center text-sm font-black uppercase tracking-wider text-slate-400">
              Aucun usage IA
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left">
                <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-black">Date</th>
                    <th className="px-4 py-3 font-black">Fonction</th>
                    <th className="px-4 py-3 font-black">Statut</th>
                    <th className="px-4 py-3 font-black">Acteur</th>
                    <th className="px-4 py-3 font-black">Modèle</th>
                    <th className="px-4 py-3 font-black">Volume</th>
                    <th className="px-4 py-3 font-black">Erreur</th>
                    <th className="px-4 py-3 font-black">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-emerald-50/40">
                      <td className="px-4 py-3 text-xs font-bold text-slate-600 whitespace-nowrap">
                        <Clock3 size={13} className="inline mr-1 text-slate-400" />
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-xs font-black text-slate-800">
                        {featureLabel(log.feature)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-black ${statusClass(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-black text-slate-800">{log.actorRole}</div>
                        <div className="font-mono text-[10px] text-slate-400">{log.actorId || "-"}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        {log.model || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-600">
                        {compactNumber(log.estimatedTokens)} tokens
                        <div className="text-[10px] text-slate-400">
                          {compactNumber(log.promptChars)} in · {compactNumber(log.responseChars)} out
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-red-600 max-w-xs truncate">
                        {log.errorMessage || "-"}
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
