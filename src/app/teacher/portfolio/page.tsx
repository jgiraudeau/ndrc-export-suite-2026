"use client";

import { useState, useEffect } from "react";
import { TeacherLayout } from "@/components/layout/TeacherLayout";
import { 
  Briefcase, 
  Search, 
  Filter, 
  ChevronRight, 
  Plus, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  MessageSquare,
  Loader2
} from "lucide-react";
import { apiGetExperiences, apiGetStudents, apiUpdateExperience, type ProfessionalExperience, type StudentWithProgress } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { ExperienceMatrix } from "@/components/teacher/ExperienceMatrix";
import { ExperienceModal } from "@/components/teacher/ExperienceModal";
import { PDFService } from "@/lib/pdf-service";
import { FileDown } from "lucide-react";

export default function PortfolioPage() {
  const [experiences, setExperiences] = useState<ProfessionalExperience[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [selectedExp, setSelectedExp] = useState<ProfessionalExperience | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<ProfessionalExperience | null>(null);

  const loadData = async () => {
    setLoading(true);
    const { data: exps } = await apiGetExperiences({ classId: selectedClass !== "ALL" ? selectedClass : undefined });
    const { data: students } = await apiGetStudents();
    
    if (exps) setExperiences(exps);
    if (students) {
      setClasses(Array.from(new Set(students.map(s => s.classCode))));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedClass]);

  const filtered = experiences.filter(exp => {
    if (selectedType !== "ALL" && exp.type !== selectedType) return false;
    if (searchTerm && !exp.title.toLowerCase().includes(searchTerm.toLowerCase()) && !exp.student?.lastName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleStatusUpdate = async (id: string, status: "VALIDATED" | "SUBMITTED", feedback?: string) => {
    setIsUpdating(true);
    const { data } = await apiUpdateExperience(id, { status, feedback });
    if (data) {
      setExperiences(prev => prev.map(e => e.id === id ? { ...e, status, feedback } : e));
      setSelectedExp(null);
    }
    setIsUpdating(false);
  };

  const handleExportPassport = (exp: ProfessionalExperience) => {
    const studentExps = experiences.filter(e => e.studentId === exp.studentId && e.status === "VALIDATED");
    if (exp.student) {
        PDFService.generateProPassport(exp.student, studentExps);
    }
  };

  return (
    <TeacherLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Passeport Pro <span className="text-purple-600">Transversal</span></h1>
            <p className="text-slate-500 mt-2 font-medium">Suivi des stages, projets et missions transversales E4-E5-E6.</p>
          </div>
          <button 
            onClick={() => { setEditingExp(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-purple-100 hover:scale-[1.02] transition-all"
          >
            <Plus size={20} /> Nouvelle Expérience
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex gap-2 overflow-x-auto p-1">
            {["ALL", ...classes].map(c => (
              <button 
                key={c}
                onClick={() => setSelectedClass(c)}
                className={cn(
                  "px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all",
                  selectedClass === c ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {c === "ALL" ? "TOUTES LES CLASSES" : c}
              </button>
            ))}
          </div>
          <div className="flex gap-4 w-full md:w-auto px-2">
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 border-0 text-xs font-black rounded-xl px-4 py-2 outline-none focus:ring-2 ring-purple-100"
            >
              <option value="ALL">TOUS LES TYPES</option>
              <option value="STAGE">STAGE</option>
              <option value="PROJET">PROJET</option>
              <option value="MISSION">MISSION</option>
            </select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border-0 text-xs font-bold outline-none focus:ring-2 ring-purple-100"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin text-purple-600" size={40} /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(exp => (
              <div key={exp.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 transition-all p-6 flex flex-col gap-4 group">
                <div className="flex justify-between items-start">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase",
                    exp.type === "STAGE" ? "bg-blue-50 text-blue-600" : exp.type === "PROJET" ? "bg-purple-50 text-purple-600" : "bg-orange-50 text-orange-600"
                  )}>
                    {exp.type}
                  </div>
                  {exp.status === "VALIDATED" ? (
                    <CheckCircle2 className="text-green-500" size={20} />
                  ) : (
                    <Clock className="text-orange-400" size={20} />
                  )}
                </div>
                
                <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-2">{exp.title}</h3>
                
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                  <User size={14} className="text-slate-300" />
                  <span>{exp.student?.firstName} {exp.student?.lastName}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                  <Calendar size={14} className="text-slate-300" />
                  <span>{new Date(exp.startDate).toLocaleDateString("fr-FR")}</span>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                   {exp.competencyIds.slice(0, 3).map(id => (
                     <span key={id} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-[9px] font-bold border border-slate-100">
                       {id.split(".")[1] || id.split("_")[0]}
                     </span>
                   ))}
                   {exp.competencyIds.length > 3 && <span className="text-[9px] font-bold text-slate-300">+{exp.competencyIds.length - 3}</span>}
                </div>

                <button 
                  onClick={() => setSelectedExp(exp)}
                  className="mt-4 w-full py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  Dossier Experience <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal Experience Details (Simplified) */}
        {selectedExp && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">{selectedExp.title}</h2>
                  <p className="text-slate-500 font-medium">Par {selectedExp.student?.firstName} {selectedExp.student?.lastName}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleExportPassport(selectedExp)}
                        className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold text-xs"
                    >
                        <FileDown size={14} /> Exporter Passeport
                    </button>
                    <button onClick={() => setSelectedExp(null)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">✕</button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="md:col-span-2 space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description de la mission</label>
                        <div className="p-6 bg-slate-50 rounded-3xl text-sm text-slate-600 leading-relaxed min-h-[150px]">
                          {selectedExp.description || "Aucune description fournie."}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compétences mobilisées (Matrix)</label>
                        <div className="opacity-70 pointer-events-none">
                            <ExperienceMatrix selectedIds={selectedExp.competencyIds} onChange={() => {}} />
                        </div>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100 space-y-4">
                        <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Évaluation du Professeur</label>
                        <textarea 
                          placeholder="Donnez votre avis sur cette expérience..."
                          defaultValue={selectedExp.feedback || ""}
                          id="exp-feedback"
                          className="w-full h-32 bg-white border border-purple-100 rounded-2xl p-4 text-xs font-medium focus:ring-2 ring-purple-200 outline-none transition-all"
                        />
                        <div className="flex gap-2">
                           <button 
                             onClick={() => handleStatusUpdate(selectedExp.id, "VALIDATED", (document.getElementById("exp-feedback") as HTMLTextAreaElement).value)}
                             disabled={isUpdating}
                             className="flex-1 h-12 bg-purple-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-purple-200 flex items-center justify-center gap-2 hover:bg-purple-700 disabled:opacity-50"
                           >
                             {isUpdating ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                             Valider
                           </button>
                           <button 
                             onClick={() => handleStatusUpdate(selectedExp.id, "SUBMITTED", (document.getElementById("exp-feedback") as HTMLTextAreaElement).value)}
                             disabled={isUpdating}
                             className="flex-1 h-12 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 disabled:opacity-50"
                           >
                             Save Feedback
                           </button>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Détails</label>
                         <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold">
                               <span className="text-slate-400">Début</span>
                               <span className="text-slate-700">{new Date(selectedExp.startDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold">
                               <span className="text-slate-400">Statut</span>
                               <span className={cn(selectedExp.status === "VALIDATED" ? "text-green-600" : "text-orange-500")}>{selectedExp.status}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
