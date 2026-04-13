"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  CheckCircle2, 
  Loader2, 
  Calendar, 
  Type, 
  AlignLeft, 
  LayoutGrid,
  Users
} from "lucide-react";
import { ExperienceMatrix } from "./ExperienceMatrix";
import { apiCreateExperience, apiUpdateExperience, apiGetStudents, type ProfessionalExperience, type StudentWithProgress } from "@/lib/api-client";

interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  experience?: ProfessionalExperience | null;
  studentId?: string; // If creating for a specific student
}

type ExperienceType = NonNullable<ProfessionalExperience["type"]>;

export function ExperienceModal({ isOpen, onClose, onSuccess, experience, studentId: initialStudentId }: ExperienceModalProps) {
  const [formData, setFormData] = useState<Partial<ProfessionalExperience>>({
    title: "",
    type: "STAGE",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    competencyIds: [],
    studentId: initialStudentId || ""
  });
  
  const [students, setStudents] = useState<StudentWithProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);

  useEffect(() => {
    const nextFormData: Partial<ProfessionalExperience> = experience
      ? {
          ...experience,
          startDate: new Date(experience.startDate).toISOString().split("T")[0],
          endDate: experience.endDate ? new Date(experience.endDate).toISOString().split("T")[0] : undefined
        }
      : {
          title: "",
          type: "STAGE",
          description: "",
          startDate: new Date().toISOString().split("T")[0],
          competencyIds: [],
          studentId: initialStudentId || ""
        };

    queueMicrotask(() => {
      setFormData(nextFormData);
    });
  }, [experience, initialStudentId, isOpen]);

  useEffect(() => {
    if (experience) {
      return;
    }

    if (isOpen && !initialStudentId) {
      async function loadStudents() {
        setFetchingStudents(true);
        const { data } = await apiGetStudents();
        if (data) setStudents(data);
        setFetchingStudents(false);
      }
      void loadStudents();
    }
  }, [isOpen, initialStudentId, experience]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.studentId) return;

    setLoading(true);
    const result = experience 
      ? await apiUpdateExperience(experience.id, formData)
      : await apiCreateExperience(formData);

    setLoading(false);
    if (result.data) {
      onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
              <Type size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {experience ? "Modifier l'expérience" : "Nouvelle Expérience Pro"}
              </h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">
                {experience ? `ID: ${experience.id}` : "PASSEPORT DE PROFESSIONNALISATION"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Form Details */}
              <div className="lg:col-span-12 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Title & Type */}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        <Type size={12} /> Titre de la mission / stage
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-purple-100 outline-none transition-all placeholder:text-slate-300"
                        placeholder="Ex: Stage de prospection B2B..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          <LayoutGrid size={12} /> Type
                        </label>
                        <select
                          value={formData.type}
                          onChange={e => setFormData({ ...formData, type: e.target.value as ExperienceType })}
                          className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-purple-100 outline-none transition-all cursor-pointer"
                        >
                          <option value="STAGE">STAGE</option>
                          <option value="PROJET">PROJET</option>
                          <option value="MISSION">MISSION</option>
                          <option value="ALTERNANCE">ALTERNANCE</option>
                        </select>
                      </div>
                      
                      {!initialStudentId && !experience && (
                        <div className="space-y-3">
                          <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            <Users size={12} /> Étudiant
                          </label>
                          <select
                            required
                            disabled={fetchingStudents}
                            value={formData.studentId}
                            onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                            className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-purple-100 outline-none transition-all cursor-pointer"
                          >
                            <option value="">{fetchingStudents ? "Chargement..." : "Sélectionner..."}</option>
                            {students.map(s => (
                              <option key={s.id} value={s.id}>{s.lastName} {s.firstName} ({s.classCode})</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          <Calendar size={12} /> Date de début
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.startDate}
                          onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-purple-100 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          <Calendar size={12} /> Date de fin (optionnel)
                        </label>
                        <input
                          type="date"
                          value={formData.endDate || ""}
                          onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 ring-purple-100 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      <AlignLeft size={12} /> Description du contenu
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full h-full min-h-[160px] bg-slate-50 border-0 rounded-3xl px-6 py-4 text-sm font-medium focus:ring-2 ring-purple-100 outline-none transition-all placeholder:text-slate-300 resize-none"
                      placeholder="Décrivez les tâches effectuées, le contexte (entreprise, client)..."
                    />
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Matrix Selection */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      <LayoutGrid size={12} /> Matrice des compétences mobilisées (E4 - E5 - E6)
                    </label>
                    <div className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black">
                      {formData.competencyIds?.length || 0} SELECTIONNÉES
                    </div>
                  </div>
                  <ExperienceMatrix 
                    selectedIds={formData.competencyIds || []} 
                    onChange={ids => setFormData({ ...formData, competencyIds: ids })} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-8 py-4 text-sm font-black text-slate-500 hover:text-slate-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle2 size={18} />
              )}
              {experience ? "Enregistrer les modifications" : "Créer l'expérience"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
