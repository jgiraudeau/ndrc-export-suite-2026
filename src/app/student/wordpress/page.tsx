"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { DIGITAL_COMPETENCIES } from "@/data/digital-competencies";
import type { Competency } from "@/types";

const WP_SKILLS = DIGITAL_COMPETENCIES.filter(
  (s): s is Competency & { platform: "WORDPRESS" } => s.platform === "WORDPRESS"
);

export default function WordPressSkills() {
  const [wpUrl, setWpUrl] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("ndrc_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setWpUrl(user.wpUrl || null);
    }
  }, []);

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
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldCheck size={22} className="text-indigo-600" />
            Référentiel Technique E5B
          </h3>
          <div className="space-y-3">
            {WP_SKILLS.map((skill) => (
              <div
                key={skill.id}
                className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 group hover:border-sky-200 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
                  <CheckCircle2 size={20} />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">{skill.category}</div>
                  <div className="text-sm font-bold text-slate-700 leading-tight">{skill.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Assistant Section */}
        <div className="bg-indigo-600 rounded-[40px] p-10 text-white flex flex-col justify-between shadow-2xl shadow-indigo-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-10">
              <Sparkles size={32} />
            </div>
            <h3 className="text-3xl font-black mb-4 leading-tight shrink-0">Vérifier mon site par IA</h3>
            <p className="text-indigo-100 font-bold mb-10 leading-relaxed text-sm">
              L&apos;Assistant IA NDRC peut analyser votre site WordPress en temps réel pour valider les critères SEO et de structure demandés à l&apos;examen.
            </p>
          </div>
          <button
            disabled={!wpUrl}
            className="relative z-10 w-full py-5 bg-white text-indigo-600 rounded-[20px] font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:grayscale"
          >
            Lancer l&apos;Analyse E5B
          </button>
        </div>
      </div>
    </div>
  );
}
