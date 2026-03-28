"use client";

import { useState, useEffect } from "react";
import { 
  Briefcase, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  MessageSquare,
  Loader2,
  AlertCircle
} from "lucide-react";
import { apiGetExperiences, apiStudentDashboard, type ProfessionalExperience, type StudentDashboardData } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { ExperienceModal } from "@/components/teacher/ExperienceModal";
import { PDFService } from "@/lib/pdf-service";
import { FileDown } from "lucide-react";

export default function StudentPortfolioPage() {
  const [experiences, setExperiences] = useState<ProfessionalExperience[]>([]);
  const [studentData, setStudentData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<ProfessionalExperience | null>(null);
  const [selectedExp, setSelectedExp] = useState<ProfessionalExperience | null>(null);

  const loadData = async () => {
    setLoading(true);
    const { data: dash } = await apiStudentDashboard();
    if (dash) {
      setStudentData(dash);
      const { data: exps } = await apiGetExperiences({ studentId: dash.id });
      if (exps) setExperiences(exps);
    }
    setLoading(false);
  };

  const handleDownloadPDF = () => {
    if (!studentData) return;
    const validatedExps = experiences.filter(e => e.status === "VALIDATED");
    PDFService.generateProPassport(studentData, validatedExps);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VALIDATED": return "bg-green-50 text-green-600 border-green-100";
      case "SUBMITTED": return "bg-blue-50 text-blue-600 border-blue-100";
      default: return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "VALIDATED": return "Validé par le prof";
      case "SUBMITTED": return "En attente de revue";
      default: return "Brouillon";
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-10 min-h-screen bg-slate-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <header>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-purple-600 rounded-xl text-white shadow-lg shadow-purple-100">
              <Briefcase size={20} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Mon Passeport Pro</h1>
          </div>
          <p className="text-slate-400 font-medium text-sm ml-11">Documente tes expériences et valide tes blocs E4-E5-E6.</p>
        </header>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleDownloadPDF}
            disabled={experiences.filter(e => e.status === "VALIDATED").length === 0}
            className="flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-2xl font-bold shadow-lg border border-indigo-100 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <FileDown size={20} /> Exporter PDF
          </button>
          
          <button 
            onClick={() => { setEditingExp(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all active:scale-95"
          >
            <Plus size={20} /> Ajouter une expérience
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Chargement de ton dossier...</p>
        </div>
      ) : (
        <div className="space-y-8">
           {experiences.length === 0 ? (
             <div className="bg-white rounded-[40px] p-12 border border-dashed border-slate-200 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Briefcase size={40} />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-xl font-black text-slate-800">Ton passeport est vide !</h3>
                  <p className="text-slate-400 text-sm font-medium mt-2">
                    Commence par ajouter ton premier stage, projet ou mission ponctuelle pour lier tes compétences.
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Créer ma première fiche
                </button>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {experiences.map(exp => (
                  <div key={exp.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all p-6 flex flex-col gap-4 group relative overflow-hidden">
                    <div className="flex justify-between items-start relative z-10">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase",
                        exp.type === "STAGE" ? "bg-blue-50 text-blue-600" : exp.type === "PROJET" ? "bg-purple-50 text-purple-600" : "bg-orange-50 text-orange-600"
                      )}>
                        {exp.type}
                      </div>
                      <div className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase border",
                        getStatusColor(exp.status)
                      )}>
                        {exp.status === "VALIDATED" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {getStatusLabel(exp.status)}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-2 relative z-10">{exp.title}</h3>
                    
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium relative z-10">
                      <Calendar size={14} className="text-slate-300" />
                      <span>{new Date(exp.startDate).toLocaleDateString("fr-FR", { month: 'long', year: 'numeric' })}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2 relative z-10">
                       {exp.competencyIds.slice(0, 3).map(id => (
                         <span key={id} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-[9px] font-bold border border-slate-100">
                           {id.split(".")[1] || id.split("_")[0]}
                         </span>
                       ))}
                       {exp.competencyIds.length > 3 && <span className="text-[9px] font-bold text-slate-300">+{exp.competencyIds.length - 3}</span>}
                    </div>

                    {exp.feedback && (
                      <div className="mt-2 p-3 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-2 relative z-10">
                        <MessageSquare size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-700 font-bold line-clamp-2 italic">{exp.feedback}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-4 relative z-10">
                      <button 
                        onClick={() => setSelectedExp(exp)}
                        className="py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                      >
                        Détails <ChevronRight size={12} />
                      </button>
                      <button 
                        onClick={() => { setEditingExp(exp); setIsModalOpen(true); }}
                        className="py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                      >
                        Modifier
                      </button>
                    </div>
                  </div>
                ))}
             </div>
           )}

           {/* Tips / Info */}
           <div className="bg-indigo-900 text-white rounded-[40px] p-8 md:p-12 relative overflow-hidden shadow-2xl shadow-indigo-200">
              <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-500 rounded-lg">
                    <AlertCircle size={20} />
                  </div>
                  <h3 className="text-xl font-bold">Conseils pour ton Passeport</h3>
                </div>
                <p className="text-indigo-100/80 leading-relaxed text-sm">
                  Chaque expérience (stage en entreprise, projet de classe, mission ponctuelle) mobilie des compétences différentes. 
                  Prends le temps de bien cocher toutes les compétences des blocs **E4, E5 et E6** que tu as réellement pratiquées. 
                  C&apos;est ce doument qui servira de base pour tes oraux d&apos;examen !
                </p>
              </div>
              <div className="absolute right-[-40px] bottom-[-40px] w-64 h-64 bg-indigo-800 rounded-full opacity-50 blur-3xl" />
           </div>
        </div>
      )}

      {/* Modals reuse */}
      <ExperienceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
        experience={editingExp}
        studentId={studentData?.id}
      />

      {/* Details View (Optional, for now use the modal for both) */}
      {selectedExp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-800">{selectedExp.title}</h2>
                <button onClick={() => setSelectedExp(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">✕</button>
             </div>
             <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                  <p className="text-sm text-slate-600 leading-relaxed">{selectedExp.description || "Pas de description."}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compétences ({selectedExp.competencyIds.length})</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedExp.competencyIds.map(id => (
                      <span key={id} className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold border border-purple-100">
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
                {selectedExp.feedback && (
                   <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                     <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-2">Commentaire du professeur</label>
                     <p className="text-sm text-amber-800 font-medium italic">&quot;{selectedExp.feedback}&quot;</p>
                   </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
