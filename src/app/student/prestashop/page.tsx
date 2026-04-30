"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  ExternalLink,
  CheckCircle2,
  Target,
  Package,
  Layers,
  CreditCard,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { DIGITAL_COMPETENCIES } from "@/data/digital-competencies";
import type { Competency } from "@/types";
import { cn } from "@/lib/utils";

const PS_SKILLS = DIGITAL_COMPETENCIES.filter(
  (s): s is Competency & { platform: "PRESTASHOP" } => s.platform === "PRESTASHOP"
);

export default function PrestaShopSkills() {
  const router = useRouter();
  const [prestaUrl, setPrestaUrl] = useState<string | null>(null);
  const [acquired, setAcquired] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("ndrc_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setPrestaUrl(user.prestaUrl || null);
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
      if (next) {
        s.add(skillId);
      } else {
        s.delete(skillId);
      }
      return s;
    });

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ competencyId: skillId, acquired: next, status: "SELF_DECLARED" }),
      });
    } catch {
      setAcquired((prev) => {
        const s = new Set(prev);
        if (next) {
          s.delete(skillId);
        } else {
          s.add(skillId);
        }
        return s;
      });
    } finally {
      setSaving(null);
    }
  }, [acquired, saving]);

  const doneCount = PS_SKILLS.filter((s) => acquired.has(s.id)).length;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[20px] bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner shadow-amber-100">
            <ShoppingBag size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Compétences PrestaShop</h1>
            <p className="text-slate-500 font-bold">Maîtrise du commerce connecté et de la vente en ligne.</p>
          </div>
        </div>
      </header>

      {/* Site Access Card */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ShoppingBag size={20} className="text-amber-500" />
            Voici l&apos;accès à votre boutique PrestaShop
          </h3>
          {prestaUrl ? (
            <p className="text-amber-600 font-bold text-sm break-all">{prestaUrl}</p>
          ) : (
            <p className="text-slate-400 font-bold text-sm italic">
              URL non encore assignée — contactez votre formateur.
            </p>
          )}
        </div>
        {prestaUrl && (
          <a
            href={prestaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber-600 text-white px-8 py-4 rounded-[20px] flex items-center gap-3 hover:bg-amber-700 transition-colors shadow-lg shadow-amber-100 font-black text-sm shrink-0"
          >
            <ExternalLink size={20} />
            Ouvrir ma boutique
          </a>
        )}
      </div>

      {/* Skill Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Checklist */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Target size={22} className="text-amber-600" />
              Référentiel E-Commerce
            </h3>
            {!loading && (
              <span className="text-sm font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                {doneCount}/{PS_SKILLS.length}
              </span>
            )}
          </div>
          <div className="space-y-3">
            {PS_SKILLS.map((skill) => {
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
                      ? "border-amber-200 bg-amber-50/50"
                      : "border-slate-100 hover:border-amber-200 hover:bg-slate-50/50",
                    "disabled:cursor-wait"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    done ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-300"
                  )}>
                    {isSaving
                      ? <Loader2 size={18} className="animate-spin" />
                      : done
                        ? <CheckCircle2 size={20} />
                        : skill.category === "Commandes"
                          ? <CreditCard size={18} />
                          : skill.category === "Contenu"
                            ? <Package size={18} />
                            : <Layers size={18} />
                    }
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">{skill.category}</div>
                    <div className={cn("text-sm font-bold leading-tight", done ? "text-amber-700" : "text-slate-700")}>
                      {skill.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Progression + Tuteur */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Ma progression</h3>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${PS_SKILLS.length ? (doneCount / PS_SKILLS.length) * 100 : 0}%` }}
              />
            </div>
            <p className="text-sm text-slate-500 font-bold">
              {doneCount === PS_SKILLS.length && PS_SKILLS.length > 0
                ? "🎉 Toutes les compétences validées !"
                : `${doneCount} compétence${doneCount > 1 ? "s" : ""} validée${doneCount > 1 ? "s" : ""} sur ${PS_SKILLS.length}`}
            </p>
            <p className="text-xs text-slate-400">
              Cochez les compétences au fur et à mesure que vous les maîtrisez. Votre formateur peut aussi les valider de son côté.
            </p>
          </div>

          <div className="bg-amber-500 rounded-[32px] p-8 text-white flex flex-col gap-6 shadow-2xl shadow-amber-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-xl font-black mb-2">Une question sur PrestaShop ?</h3>
              <p className="text-amber-50 text-sm font-bold leading-relaxed">
                Le Tuteur IA répond à vos questions sur la gestion de boutique, le catalogue, les commandes et l&apos;examen E5B.
              </p>
            </div>
            <button
              onClick={() => router.push("/student/chat")}
              className="relative z-10 w-full py-4 bg-white text-amber-600 rounded-[20px] font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
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
