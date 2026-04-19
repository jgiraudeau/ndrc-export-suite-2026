"use client";

import { useEffect, useState } from "react";
import {
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Package,
  Layers,
  CreditCard,
  Target,
} from "lucide-react";
import { DIGITAL_COMPETENCIES } from "@/data/digital-competencies";
import type { Competency } from "@/types";

const PS_SKILLS = DIGITAL_COMPETENCIES.filter(
  (s): s is Competency & { platform: "PRESTASHOP" } => s.platform === "PRESTASHOP"
);

export default function PrestaShopSkills() {
  const [prestaUrl, setPrestaUrl] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("ndrc_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setPrestaUrl(user.prestaUrl || null);
    }
  }, []);

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
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Target size={22} className="text-amber-600" />
            Référentiel E-Commerce
          </h3>
          <div className="space-y-3">
            {PS_SKILLS.map((skill) => (
              <div
                key={skill.id}
                className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 group hover:border-amber-200 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                  {skill.category === "Commandes" ? <CreditCard size={18} /> : skill.category === "Contenu" ? <Package size={18} /> : <Layers size={18} />}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">{skill.category}</div>
                  <div className="text-sm font-bold text-slate-700 leading-tight">{skill.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info + AI Card */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 shadow-inner shadow-indigo-100">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight leading-4">Vérification de Session</h3>
            <p className="text-slate-400 font-bold text-sm leading-relaxed">
              Votre boutique doit être paramétrée selon les consignes de mission. N&apos;oubliez pas de mettre vos produits &quot;En ligne&quot; pour qu&apos;ils soient détectables lors du contrôle final.
            </p>
          </div>

          <div className="bg-amber-500 rounded-[40px] p-10 text-white flex flex-col justify-between shadow-2xl shadow-amber-200 relative overflow-hidden flex-1 min-h-[300px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-10">
                <Sparkles size={32} />
              </div>
              <h3 className="text-3xl font-black mb-4 leading-tight shrink-0">Boost de Validation</h3>
              <p className="text-amber-50 font-bold mb-10 leading-relaxed text-sm">
                Prêt pour l&apos;examen ? L&apos;IA peut simuler un parcours client sur votre boutique pour détecter d&apos;éventuels oublis critiques dans le cycle de vente.
              </p>
            </div>
            <button
              disabled={!prestaUrl}
              className="relative z-10 w-full py-5 bg-white text-amber-600 rounded-[20px] font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:grayscale"
            >
              Scanner ma Boutique
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
