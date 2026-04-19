"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Circle,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { DIGITAL_COMPETENCIES } from "@/data/digital-competencies";
import type { Competency } from "@/types";
import { cn } from "@/lib/utils";

const WP_SKILLS = DIGITAL_COMPETENCIES.filter(
  (s): s is Competency & { platform: "WORDPRESS" } => s.platform === "WORDPRESS"
);

export default function WordPressSkills() {
  const router = useRouter();
  const [wpUrl, setWpUrl] = useState<string | null>(null);
  const [acquired, setAcquired] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("ndrc_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setWpUrl(user.wpUrl || null);
    }

    const token = localStorage.getItem("ndrc_token");
    if (!token) { setLoading(false); return; }

    fetch("/api/progress", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: { competencyId: string; acquired: boolean }[]) => {
        setAcquired(new Set(data.filter((p) => p.acquired).map((p) => p.competencyId)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleSkill = useCallback(async (skillId: string) => {
    const token = localStorage.getItem("ndrc_token");
    if (!token || saving) return;

    const next = !acquired.has(skillId);
    setSaving(skillId);
    setAcquired((prev) => {
      const s = new Set(prev);
      next ? s.add(skillId) : s.delete(skillId);
      return s;
    });

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ competencyId: skillId, acquired: next, status: "SELF_DECLARED" }),
      });
    } catch {
      // rollback on error
      setAcquired((prev) => {
        const s = new Set(prev);
        next ? s.delete(skillId) : s.add(skillId);
        return s;
      });
    } finally {
      setSaving(null);
    }
  }, [acquired, saving]);

  const doneCount = WP_SKILLS.filter((s) => acquired.has(s.id)).length;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[20px] bg-sky-50 text-sky-600 flex items-center justify-center shadow-inner shadow-sky-100">
            <Globe size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Compétences WordPress</h1>
            <p className="text-slate-500 font-bold">Maîtrise de l&apos;écosystème CMS pour la relation client digitale.</p>
          </div>
        </div>
      </header>

      {/* Site Access Card */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Globe size={20} className="text-sky-500" />
            Voici l&apos;accès à votre site WordPress
          </h3>
          {wpUrl ? (
            <p className="text-sky-600 font-bold text-sm break-all">{wpUrl}</p>
          ) : (
            <p className="text-slate-400 font-bold text-sm italic">
              URL non encore assignée — contactez votre formateur.
            </p>
          )}
        </div>
        {wpUrl && (
          <a
            href={wpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-sky-600 text-white px-8 py-4 rounded-[20px] flex items-center gap-3 hover:bg-sky-700 transition-colors shadow-lg shadow-sky-100 font-black text-sm shrink-0"
          >
            <ExternalLink size={20} />
            Ouvrir mon site
          </a>
        )}
      </div>

      {/* Skill Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Checklist */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <ShieldCheck size={22} className="text-indigo-600" />
              Référentiel Technique E5B
            </h3>
            {!loading && (
              <span className="text-sm font-black text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
                {doneCount}/{WP_SKILLS.length}
              </span>
            )}
          </div>
          <div className="space-y-3">
            {WP_SKILLS.map((skill) => {
              const done = acquired.has(skill.id);
              const isSaving = saving === skill.id;
              return (
                <button
                  key={skill.id}
                  onClick={() => toggleSkill(skill.id)}
                  disabled={isSaving || loading}
                  className={cn(
                    "w-full bg-white p-5 rounded-2xl border flex items-center gap-4 transition-all text-left",
                    done
                      ? "border-sky-200 bg-sky-50/50"
                      : "border-slate-100 hover:border-sky-200 hover:bg-slate-50/50",
                    "disabled:cursor-wait"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    done ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-300"
                  )}>
                    {isSaving
                      ? <Loader2 size={18} className="animate-spin" />
                      : done
                        ? <CheckCircle2 size={20} />
                        : <Circle size={20} />
                    }
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">{skill.category}</div>
                    <div className={cn("text-sm font-bold leading-tight", done ? "text-sky-700" : "text-slate-700")}>
                      {skill.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tuteur IA */}
        <div className="flex flex-col gap-6">
          {/* Progress summary */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Ma progression</h3>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-sky-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${WP_SKILLS.length ? (doneCount / WP_SKILLS.length) * 100 : 0}%` }}
              />
            </div>
            <p className="text-sm text-slate-500 font-bold">
              {doneCount === WP_SKILLS.length && WP_SKILLS.length > 0
                ? "🎉 Toutes les compétences validées !"
                : `${doneCount} compétence${doneCount > 1 ? "s" : ""} validée${doneCount > 1 ? "s" : ""} sur ${WP_SKILLS.length}`}
            </p>
            <p className="text-xs text-slate-400">
              Cochez les compétences au fur et à mesure que vous les maîtrisez. Votre formateur peut aussi les valider de son côté.
            </p>
          </div>

          {/* Tuteur IA CTA */}
          <div className="bg-indigo-600 rounded-[32px] p-8 text-white flex flex-col gap-6 shadow-2xl shadow-indigo-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-xl font-black mb-2">Une question sur WordPress ?</h3>
              <p className="text-indigo-100 text-sm font-bold leading-relaxed">
                Le Tuteur IA répond à vos questions sur la configuration, le SEO, les plugins et l&apos;examen E5B.
              </p>
            </div>
            <button
              onClick={() => router.push("/student/chat")}
              className="relative z-10 w-full py-4 bg-white text-indigo-600 rounded-[20px] font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
            >
              <MessageSquare size={18} />
              Poser une question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
