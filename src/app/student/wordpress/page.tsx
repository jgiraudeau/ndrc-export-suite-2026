"use client";

import { useEffect, useState } from "react";
import { 
  Globe, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  Settings,
  Sparkles,
  Save,
  Loader2
} from "lucide-react";
import { DIGITAL_COMPETENCIES } from "@/data/digital-competencies";
import type { Competency } from "@/types";

type StudentSessionUser = {
  wpUrl?: string | null;
};

const WP_SKILLS = DIGITAL_COMPETENCIES.filter(
  (s): s is Competency & { platform: "WORDPRESS" } => s.platform === "WORDPRESS"
);

export default function WordPressSkills() {
  const [wpUrl, setWpUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [student, setStudent] = useState<StudentSessionUser | null>(null);

  useEffect(() => {
    const fetchData = async () => {
       const userStr = localStorage.getItem("ndrc_user");
       if (userStr) {
         const user = JSON.parse(userStr);
         setStudent(user);
         setWpUrl(user.wpUrl || "");
       }
    };
    fetchData();
  }, []);

  const handleSaveUrl = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("ndrc_token");
      const res = await fetch("/api/student/profile", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ wpUrl })
      });
      if (res.ok) {
        // Update local storage
        const newUser = { ...student, wpUrl };
        localStorage.setItem("ndrc_user", JSON.stringify(newUser));
        setStudent(newUser);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

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

      {/* URL Settings Card */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-8">
         <div className="flex-1 space-y-2">
            <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Settings size={20} className="text-slate-400" />
              Configuration de votre Site
            </h3>
            <p className="text-sm text-slate-400 font-bold">Renseignez l&apos;URL de votre application WordPress pour permettre l&apos;évaluation.</p>
            <div className="flex gap-2 mt-4">
              <input 
                className="flex-1 bg-slate-50 border-none rounded-xl px-5 py-3 text-sm font-bold text-sky-600 focus:ring-2 focus:ring-sky-500/20 outline-none"
                placeholder="https://votre-site-ndrc.fr"
                value={wpUrl}
                onChange={(e) => setWpUrl(e.target.value)}
              />
              <button 
                onClick={handleSaveUrl}
                disabled={isSaving}
                className="bg-sky-600 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-sky-100"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Enregistrer
              </button>
            </div>
         </div>
         {wpUrl && (
            <a 
              href={wpUrl} 
              target="_blank" 
              className="bg-slate-900 text-white p-6 rounded-[24px] flex flex-col items-center justify-center gap-3 hover:bg-slate-800 transition-colors shadow-xl shadow-slate-200 min-w-[160px]"
            >
               <ExternalLink size={24} />
               <span className="text-[10px] font-black uppercase tracking-widest leading-none">Voir mon site</span>
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
