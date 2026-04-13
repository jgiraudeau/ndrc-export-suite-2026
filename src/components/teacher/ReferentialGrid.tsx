"use client";

import { useState, useMemo } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  Save, 
  Loader2,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { apiGradeCompetency, apiValidateEvaluation, apiFetch } from "@/lib/api-client";
import { ShieldCheck, Sparkle } from "lucide-react";

interface CompetencyChild {
  description: string;
  criteria: string[];
}

interface Competency {
  code: string;
  description: string;
  block: string;
  children: CompetencyChild[];
}

interface ReferentialGridProps {
  studentId: string;
  referential: Competency[];
  title?: string;
  type?: "E4" | "E6";
  initialGrades?: Record<string, number>;
  readOnly?: boolean;
  isValidated?: boolean;
  validatedAt?: string | null;
}

type AiSuggestion = {
  code: string;
  grade: number;
  feedback: string;
};

type AiEvaluateResponse = {
  suggestions?: AiSuggestion[];
};

export function ReferentialGrid({ studentId, referential, title, type, initialGrades = {}, readOnly = false, isValidated: initialIsValidated = false, validatedAt: initialValidatedAt = null }: ReferentialGridProps) {
  const [expandedCodes, setExpandedCodes] = useState<Record<string, boolean>>({});
  const [currentGrades, setCurrentGrades] = useState<Record<string, number>>(initialGrades);
  const [dirtyCodes, setDirtyCodes] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(initialIsValidated);
  const [validatedAt, setValidatedAt] = useState<string | null>(initialValidatedAt);
  const [isValidating, setIsValidating] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState<string | null>(null);

  const handleAiDiagnosis = async (code: string) => {
    setAiSuggesting(code);
    try {
        const res = await apiFetch<AiEvaluateResponse>("/api/ai/evaluate", {
            method: "POST",
            body: JSON.stringify({ studentId, type, competencyCode: code })
        });
        if (res.data && res.data.suggestions) {
            const suggestion = res.data.suggestions.find((s) => s.code.startsWith(code) || code.startsWith(s.code));
            if (suggestion) {
                // Apply suggestion (just highlight or fill if empty)
                alert(`Suggestion IA (${code}): ${suggestion.grade}/4 - ${suggestion.feedback}`);
            }
        }
    } catch (err) {
        console.error("AI Analysis failed", err);
    } finally {
        setAiSuggesting(null);
    }
  };

  const toggleExpand = (code: string) => {
    setExpandedCodes(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const GRADE_LEVELS = [
    { value: 1, label: "Très insuffisant", color: "bg-red-50 text-red-700 border-red-100 hover:bg-red-100" },
    { value: 2, label: "Insuffisant", color: "bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100" },
    { value: 3, label: "Satisfaisant", color: "bg-green-50 text-green-700 border-green-100 hover:bg-green-100" },
    { value: 4, label: "Très satisfaisant", color: "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100" },
  ];

  const handleGradeLocal = (competencyCode: string, childIdx: number, grade: number) => {
    if (readOnly) return;
    const key = `${competencyCode}_${childIdx}`;
    setCurrentGrades(prev => ({ ...prev, [key]: grade }));
    setDirtyCodes(prev => new Set(prev).add(competencyCode));
  };

  const handleSaveCompetency = async (competencyCode: string) => {
    setSavingId(competencyCode);
    
    // In a real scenario, we might want to save all children of this competency
    // or the grid might have a different mapping. 
    // Here we assume each grade level is a sub-progress or we save a composite state.
    // For BTS NDRC NDRC, we usually save the full grid.
    
    // Mocking a sequential save for all modified children in this block
    const competency = referential.find(c => c.code === competencyCode);
    if (!competency) return;

    try {
      for (let i = 0; i < competency.children.length; i++) {
        const key = `${competencyCode}_${i}`;
        const grade = currentGrades[key];
        if (grade) {
          await apiGradeCompetency(studentId, key, grade, `Évaluation ${type}`);
        }
      }
      setDirtyCodes(prev => {
        const next = new Set(prev);
        next.delete(competencyCode);
        return next;
      });
    } catch (err) {
      console.error("Failed to save grades", err);
    } finally {
      setSavingId(null);
    }
  };

  const isAllGraded = useMemo(() => {
    return referential.every(comp => 
      comp.children.every((_, idx) => !!currentGrades[`${comp.code}_${idx}`])
    );
  }, [referential, currentGrades]);

  const handleToggleValidation = async () => {
    if (!type || isReadOnly) return;
    setIsValidating(true);
    try {
      const nextState = !isValidated;
      const res = await apiValidateEvaluation(studentId, type, nextState);
      if (res && !res.error) {
        setIsValidated(nextState);
        setValidatedAt(nextState ? new Date().toISOString() : null);
      }
    } catch (err) {
      console.error("Failed to validate evaluation", err);
    } finally {
      setIsValidating(false);
    }
  };

  const isReadOnly = readOnly || isValidated;

  return (
    <div className="space-y-6">
      {title && (
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h2>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
                <AlertCircle size={14} /> Référentiel Officiel {type}
            </div>
        </div>
      )}

      {referential.map((comp) => {
        const isExpanded = expandedCodes[comp.code];
        const isDirty = dirtyCodes.has(comp.code);
        const isSaving = savingId === comp.code;

        return (
          <div key={comp.code} className={cn(
            "bg-white rounded-[32px] border transition-all duration-300 overflow-hidden",
            isExpanded ? "border-purple-200 shadow-xl shadow-purple-50/50" : "border-slate-200 shadow-sm hover:border-slate-300"
          )}>
            <button 
              onClick={() => toggleExpand(comp.code)}
              className="w-full p-6 md:p-8 flex items-center justify-between hover:bg-slate-50/50 transition-colors text-left group"
            >
              <div className="flex items-center gap-6">
                <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-all",
                    isExpanded ? "bg-purple-600 text-white shadow-lg shadow-purple-200" : "bg-slate-100 text-slate-500 group-hover:bg-purple-100 group-hover:text-purple-600"
                )}>
                  {comp.code.split('.')[1] || comp.code}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-purple-700 transition-colors">{comp.description}</h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{comp.block} — {comp.children.length} ÉLÉMENTS DE COMPÉTENCE</p>
                </div>
              </div>
                <div className="flex items-center gap-4">
                {!readOnly && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleAiDiagnosis(comp.code); }}
                        disabled={aiSuggesting === comp.code}
                        className="p-2 hover:bg-amber-100 rounded-xl text-amber-600 transition-all flex items-center gap-2 group/ai"
                    >
                        {aiSuggesting === comp.code ? <Loader2 size={16} className="animate-spin" /> : <Sparkle size={16} className="group-hover/ai:animate-spin" />}
                        <span className="hidden md:inline text-[10px] font-black uppercase tracking-tighter">Aide IA</span>
                    </button>
                )}
                {isDirty && !isExpanded && (
                    <span className="flex h-3 w-3 rounded-full bg-orange-500 animate-pulse" />
                )}
                {isExpanded ? <ChevronUp className="text-slate-300" /> : <ChevronDown className="text-slate-300" />}
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-slate-100 overflow-hidden bg-slate-50/30"
                >
                  <div className="p-8 space-y-10">
                    {comp.children.map((child, idx) => {
                      const currentGrade = currentGrades[`${comp.code}_${idx}`];
                      return (
                        <div key={idx} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                          <div className="lg:col-span-5 space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-1.5 w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                              <h4 className="font-bold text-slate-700 leading-snug">{child.description}</h4>
                            </div>
                            <div className="pl-5 space-y-2">
                              {child.criteria.map((crit, cIdx) => (
                                <div key={cIdx} className="flex gap-2 text-xs text-slate-400 font-medium italic">
                                  <div className="w-1.5 h-1.5 rounded-full border border-slate-300 mt-1.5" />
                                  <span>{crit}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="lg:col-span-7 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {GRADE_LEVELS.map((level) => {
                                const isActive = currentGrade === level.value;
                                return (
                                    <button
                                      key={level.value}
                                      onClick={() => handleGradeLocal(comp.code, idx, level.value)}
                                      disabled={readOnly}
                                      className={cn(
                                        "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all h-20 text-center",
                                        isActive 
                                          ? "ring-2 ring-purple-100 border-purple-300 " + level.color
                                          : "bg-slate-50/50 border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600",
                                        readOnly && !isActive && "opacity-30 grayscale cursor-not-allowed",
                                        readOnly && isActive && "cursor-default"
                                      )}
                                    >
                                    <span className="text-[10px] font-black uppercase tracking-tight leading-none">{level.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {isDirty && !readOnly && (
                      <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button 
                            onClick={() => handleSaveCompetency(comp.code)}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                          Valider ce bloc
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* ── Certification Zone ───────────────────────────────── */}
      {!readOnly && type && (
        <div className={cn(
            "mt-12 p-10 rounded-[40px] border-2 transition-all duration-500",
            isValidated 
                ? "bg-emerald-50 border-emerald-100 shadow-xl shadow-emerald-50" 
                : "bg-white border-dashed border-slate-200"
        )}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className={cn(
                        "w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-700",
                        isValidated ? "bg-emerald-600 text-white shadow-2xl shadow-emerald-200 rotate-12" : "bg-slate-100 text-slate-300"
                    )}>
                        <ShieldCheck size={40} />
                    </div>
                    <div>
                        <h3 className={cn(
                            "text-2xl font-black tracking-tight mb-1",
                            isValidated ? "text-emerald-900" : "text-slate-800"
                        )}>
                            Certification Numériqu{isValidated ? "e effectuée" : "e du dossier"}
                        </h3>
                        <p className="text-slate-400 font-bold text-sm max-w-md">
                            {isValidated 
                                ? `Ce dossier a été certifié conforme par le formateur ${validatedAt ? 'le ' + new Date(validatedAt).toLocaleDateString() : ''}.`
                                : "Une fois toutes les compétences évaluées, vous pourrez certifier numériquement ce dossier pour l'export officiel."}
                        </p>
                    </div>
                </div>

                <div className="shrink-0">
                    <button
                        onClick={handleToggleValidation}
                        disabled={isValidating || (!isValidated && !isAllGraded)}
                        className={cn(
                            "group relative overflow-hidden px-10 py-5 rounded-[24px] font-black tracking-tight transition-all active:scale-95 disabled:opacity-50 disabled:grayscale",
                            isValidated 
                                ? "bg-white text-emerald-600 border-2 border-emerald-100 hover:bg-emerald-50" 
                                : "bg-slate-900 text-white shadow-2xl shadow-slate-200 hover:scale-105"
                        )}
                    >
                        {isValidating ? (
                            <Loader2 className="animate-spin mx-auto" size={24} />
                        ) : isValidated ? (
                            "Annuler la certification"
                        ) : (
                            <span className="flex items-center gap-3">
                                {isAllGraded ? <Sparkles size={20} className="text-amber-400" /> : <AlertCircle size={20} />}
                                {isAllGraded ? "Certifier ce dossier" : "Dossier incomplet"}
                            </span>
                        )}
                    </button>
                    {!isValidated && !isAllGraded && (
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center mt-3">
                            Toutes les notes sont requises
                        </p>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
