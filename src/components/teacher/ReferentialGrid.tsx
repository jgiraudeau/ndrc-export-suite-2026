"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Mic,
  MicOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  apiGetEvaluationDraft,
  apiGradeCompetency,
  apiSaveEvaluationDraft,
  apiValidateEvaluation,
  type EvaluationKind,
} from "@/lib/api-client";

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

export function ReferentialGrid({ studentId, referential, title, type, initialGrades = {}, readOnly = false, isValidated: initialIsValidated = false, validatedAt: initialValidatedAt = null }: ReferentialGridProps) {
  const [expandedCodes, setExpandedCodes] = useState<Record<string, boolean>>({});
  const [currentGrades, setCurrentGrades] = useState<Record<string, number>>(initialGrades);
  const [currentComments, setCurrentComments] = useState<Record<string, string>>({});
  const [globalComment, setGlobalComment] = useState("");
  const [globalCommentDirty, setGlobalCommentDirty] = useState(false);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [dirtyCodes, setDirtyCodes] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [evaluationKind, setEvaluationKind] = useState<EvaluationKind>("FORMATIVE");
  const [draftGradesByKind, setDraftGradesByKind] = useState<Record<"PREPARATOIRE" | "CCF", Record<string, number>>>({
    PREPARATOIRE: {},
    CCF: {},
  });
  const [draftCommentsByKind, setDraftCommentsByKind] = useState<Record<"PREPARATOIRE" | "CCF", Record<string, string>>>({
    PREPARATOIRE: {},
    CCF: {},
  });
  const [draftGlobalCommentsByKind, setDraftGlobalCommentsByKind] = useState<Record<"PREPARATOIRE" | "CCF", string>>({
    PREPARATOIRE: "",
    CCF: "",
  });
  const [draftLoadedByKind, setDraftLoadedByKind] = useState<Record<"PREPARATOIRE" | "CCF", boolean>>({
    PREPARATOIRE: false,
    CCF: false,
  });
  const formativeLoadedRef = useRef(false);
  const [validationByKind, setValidationByKind] = useState<Record<EvaluationKind, { isValidated: boolean; validatedAt: string | null }>>({
    FORMATIVE: { isValidated: false, validatedAt: null },
    PREPARATOIRE: { isValidated: false, validatedAt: null },
    CCF: { isValidated: initialIsValidated, validatedAt: initialValidatedAt },
  });
  const [loadingKindData, setLoadingKindData] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [listeningKey, setListeningKey] = useState<string | null>(null);
  const [transcribingKey, setTranscribingKey] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null); // Note: reused for MediaRecorder in some places or kept for legacy cleanup
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const isValidated = validationByKind[evaluationKind].isValidated;
  const validatedAt = validationByKind[evaluationKind].validatedAt;

  const toggleExpand = (code: string) => {
    setExpandedCodes((prev: Record<string, boolean>) => ({ ...prev, [code]: !prev[code] }));
  };

  const GRADE_LEVELS = [
    { value: 1, label: "Très insuffisant", color: "bg-red-50 text-red-700 border-red-100 hover:bg-red-100" },
    { value: 2, label: "Insuffisant", color: "bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100" },
    { value: 3, label: "Satisfaisant", color: "bg-green-50 text-green-700 border-green-100 hover:bg-green-100" },
    { value: 4, label: "Très satisfaisant", color: "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100" },
  ];

  // Chargement FORMATIVE une seule fois au montage (ne touche pas les notes déjà en mémoire)
  useEffect(() => {
    if (!type || formativeLoadedRef.current) return;
    formativeLoadedRef.current = true;
    let cancelled = false;
    apiGetEvaluationDraft(studentId, type, "FORMATIVE").then(({ data }) => {
      if (cancelled || !data) return;
      if (data.grades && Object.keys(data.grades).length > 0) {
        setCurrentGrades(data.grades);
      }
      if (data.comments && Object.keys(data.comments).length > 0) {
        setCurrentComments(data.comments);
      }
      if (data.globalComment) setGlobalComment(data.globalComment);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, type]);

  // Chargement PREPARATOIRE / CCF quand l'onglet change
  useEffect(() => {
    if (evaluationKind === "FORMATIVE" || !type) return;
    if (draftLoadedByKind[evaluationKind]) {
      setCurrentGrades(draftGradesByKind[evaluationKind] || {});
      setCurrentComments(draftCommentsByKind[evaluationKind] || {});
      setGlobalComment(draftGlobalCommentsByKind[evaluationKind] || "");
      return;
    }
    let cancelled = false;
    setLoadingKindData(true);
    apiGetEvaluationDraft(studentId, type, evaluationKind).then(({ data }) => {
      if (cancelled) return;
      setLoadingKindData(false);
      if (!data) return;
      setCurrentGrades(data.grades || {});
      setCurrentComments(data.comments || {});
      setGlobalComment(data.globalComment || "");
      setDraftGradesByKind((prev: Record<"PREPARATOIRE"|"CCF", Record<string,number>>) => ({ ...prev, [evaluationKind]: data.grades || {} }));
      setDraftCommentsByKind((prev: Record<"PREPARATOIRE"|"CCF", Record<string,string>>) => ({ ...prev, [evaluationKind]: data.comments || {} }));
      setDraftGlobalCommentsByKind((prev: Record<"PREPARATOIRE"|"CCF", string>) => ({ ...prev, [evaluationKind]: data.globalComment || "" }));
      setDraftLoadedByKind((prev: Record<"PREPARATOIRE"|"CCF", boolean>) => ({ ...prev, [evaluationKind]: true }));
      setValidationByKind((prev: Record<EvaluationKind, { isValidated: boolean; validatedAt: string | null }>) => ({ ...prev, [evaluationKind]: { isValidated: data.isValidated, validatedAt: data.validatedAt } }));
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluationKind, studentId, type]);

  // Ref pour accéder aux dernières notes sans closure stale dans le debounce
  const currentGradesRef = useRef(currentGrades);
  useEffect(() => { currentGradesRef.current = currentGrades; }, [currentGrades]);
  const currentCommentsRef = useRef(currentComments);
  useEffect(() => { currentCommentsRef.current = currentComments; }, [currentComments]);
  const globalCommentRef = useRef(globalComment);
  useEffect(() => { globalCommentRef.current = globalComment; }, [globalComment]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerAutoSave = useCallback((competencyCode: string) => {
    if (!type) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSavingId(competencyCode);
      setSaveError(null);
      const grades = currentGradesRef.current;
      const gradesToPersist: Record<string, number> = {};
      for (const [k, v] of Object.entries(grades)) {
        if (typeof v === "number" && v >= 1 && v <= 4) gradesToPersist[k] = v;
      }
      const kindToSave = evaluationKind;
      if (kindToSave === "FORMATIVE") {
        const competency = referential.find(c => c.code === competencyCode);
        if (competency) {
          for (let i = 0; i < competency.children.length; i++) {
            const k = `${competencyCode}_${i}`;
            if (grades[k]) apiGradeCompetency(studentId, k, grades[k], currentCommentsRef.current[k] || `Évaluation ${type}`).catch(() => {});
          }
        }
      }
      const { error } = await apiSaveEvaluationDraft(studentId, type, kindToSave, gradesToPersist, currentCommentsRef.current, globalCommentRef.current, {});
      setSavingId(null);
      if (error) { setSaveError("Erreur sauvegarde : " + error); return; }
      setDirtyCodes((prev: Set<string>) => { const next = new Set(prev); next.delete(competencyCode); return next; });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }, 600);
  }, [type, evaluationKind, studentId, referential]);

  const handleGradeLocal = (competencyCode: string, childIdx: number, grade: number) => {
    if (isReadOnly) return;
    const key = `${competencyCode}_${childIdx}`;
    setCurrentGrades((prev: Record<string, number>) => ({ ...prev, [key]: grade }));
    setDirtyCodes((prev: Set<string>) => new Set(prev).add(competencyCode));
    triggerAutoSave(competencyCode);
  };

  const handleCommentChange = (key: string, value: string) => {
    if (isReadOnly) return;
    setCurrentComments((prev: Record<string, string>) => ({ ...prev, [key]: value }));
    const competencyCode = key.replace(/_\d+$/, "");
    setDirtyCodes((prev: Set<string>) => new Set(prev).add(competencyCode));
    triggerAutoSave(competencyCode);
  };

  const startRecording = useCallback(async (key: string) => {
    // Si on clique sur le bouton alors qu'on enregistre déjà cet élément, on arrête
    if (listeningKey === key) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setListeningKey(null);
      return;
    }

    // Arrêter toute session en cours
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Tenter de trouver un format supporté par le navigateur
      const types = ["audio/webm", "audio/mp4", "audio/ogg", "audio/wav"];
      const supportedType = types.find(t => MediaRecorder.isTypeSupported(t));
      
      const recorder = new MediaRecorder(stream, {
        mimeType: supportedType
      });
      
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach(track => track.stop()); // Libérer le micro

        if (audioBlob.size < 1000) {
            setListeningKey(null);
            return; // Trop court
        }

        setTranscribingKey(key);
        setListeningKey(null);

        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "comment.webm");

          const response = await fetch("/api/ai/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Erreur serveur (${response.status})`);
          }

          const data = await response.json();

          if (data.text) {
            const cleanText = data.text.trim();
            setCurrentComments((prev) => {
              const current = prev[key] || "";
              const updated = current + (current ? " " : "") + cleanText;
              return { ...prev, [key]: updated };
            });
            const competencyCode = key.replace(/_\d+$/, "");
            if (key === "GLOBAL") {
                setGlobalCommentDirty(true);
            } else {
                setDirtyCodes((prev: Set<string>) => new Set(prev).add(competencyCode));
                triggerAutoSave(competencyCode);
            }
          } else {
            console.warn("Transcription vide reçue de l'IA");
            setSaveError("L'IA n'a détecté aucune parole. Parlez plus fort ou plus près du micro.");
          }
        } catch (err: any) {
          console.error("Transcription error detail:", err);
          setSaveError("Détail erreur : " + (err.message || "Échec inconnu"));
        } finally {
          setTranscribingKey(null);
        }
      };

      recorder.start();
      setListeningKey(key);
      setSaveError(null);
    } catch (err: any) {
      console.error("Microphone error", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setSaveError("Accès micro refusé. Veuillez autoriser le micro dans votre navigateur.");
      } else {
        setSaveError("Impossible d'accéder au microphone.");
      }
      setListeningKey(null);
    }
  }, [listeningKey, triggerAutoSave]);

  const handleSaveGlobalComment = async () => {
    if (!type || isReadOnly) return;
    setIsSavingGlobal(true);
    const gradesToPersist: Record<string, number> = {};
    for (const [key, grade] of Object.entries(currentGrades)) {
      if (typeof grade === "number" && grade >= 1 && grade <= 4) gradesToPersist[key] = grade;
    }
    await apiSaveEvaluationDraft(studentId, type, evaluationKind, gradesToPersist, currentComments, globalComment, {});
    setGlobalCommentDirty(false);
    setIsSavingGlobal(false);
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
      const res = await apiValidateEvaluation(studentId, type, nextState, evaluationKind);
      if (res && !res.error) {
        setValidationByKind((prev: Record<EvaluationKind, { isValidated: boolean; validatedAt: string | null }>) => ({
          ...prev,
          [evaluationKind]: {
            isValidated: nextState,
            validatedAt: nextState ? new Date().toISOString() : null,
          },
        }));
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
      {saveError && (
        <div className="flex flex-col gap-2 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm shadow-lg animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between">
            <span className="font-black flex items-center gap-2">
              <AlertCircle size={20} />
              Erreur de Transcription IA
            </span>
            <button onClick={() => setSaveError(null)} className="text-red-400 hover:text-red-600 font-black text-xl leading-none">×</button>
          </div>
          <p className="font-bold opacity-90 pl-7">
            {saveError}
          </p>
          <p className="text-[10px] uppercase tracking-widest pl-7 mt-1 opacity-50 font-black">
            Veuillez signaler ce message précis pour que je puisse corriger.
          </p>
        </div>
      )}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl px-5 py-3 text-sm font-bold">
          ✓ Sauvegardé — visible par l&apos;étudiant
        </div>
      )}
      {title && (
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h2>
            <a
              href="/docs/referentiel_e6.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-[10px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-200 transition-colors"
            >
              <AlertCircle size={14} /> Référentiel Officiel {type}
            </a>
        </div>
      )}

      {!readOnly && type && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">
              Type d&apos;évaluation
            </h3>
            {loadingKindData && (
              <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
                <Loader2 size={14} className="animate-spin" />
                Chargement...
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { value: "FORMATIVE", label: "Formative", note: "Visible étudiant" },
              { value: "PREPARATOIRE", label: "Préparatoire", note: "Examen blanc" },
              { value: "CCF", label: "Certificative (CCF)", note: "Confidentiel étudiant" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  setEvaluationKind(item.value as EvaluationKind);
                  setDirtyCodes(new Set());
                }}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  evaluationKind === item.value
                    ? "bg-purple-50 border-purple-200 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <p
                  className={cn(
                    "text-sm font-black",
                    evaluationKind === item.value ? "text-purple-700" : "text-slate-700"
                  )}
                >
                  {item.label}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                  {item.note}
                </p>
              </button>
            ))}
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
            <div className="relative">
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
                <div className="flex items-center gap-3 pr-1">
                  {isExpanded ? <ChevronUp className="text-slate-300" /> : <ChevronDown className="text-slate-300" />}
                </div>
              </button>
              {isSaving && (
                <div className="absolute right-16 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-purple-600 text-xs font-black">
                  <Loader2 className="animate-spin" size={13} /> Sauvegarde…
                </div>
              )}
            </div>

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

                          <div className="lg:col-span-7 space-y-3">
                            <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {GRADE_LEVELS.map((level) => {
                                  const isActive = currentGrade === level.value;
                                  return (
                                    <button
                                      key={level.value}
                                      onClick={() => handleGradeLocal(comp.code, idx, level.value)}
                                      disabled={isReadOnly}
                                      className={cn(
                                        "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all h-20 text-center",
                                        isActive
                                          ? "ring-2 ring-purple-100 border-purple-300 " + level.color
                                          : "bg-slate-50/50 border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600",
                                        isReadOnly && !isActive && "opacity-30 grayscale cursor-not-allowed",
                                        isReadOnly && isActive && "cursor-default"
                                      )}
                                    >
                                      <span className="text-[10px] font-black uppercase tracking-tight leading-none">{level.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            {/* Commentaire + vocal par critère */}
                            {(() => {
                              const key = `${comp.code}_${idx}`;
                              const isListening = listeningKey === key;
                              return (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-purple-500">
                                      💬 Commentaire — {child.description}
                                    </label>
                                    {!isReadOnly && (
                                      <button
                                        type="button"
                                        onClick={() => startRecording(key)}
                                        title={isListening ? "Arrêter la dictée" : "Dicter un commentaire"}
                                        className={cn(
                                          "flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-black transition-all",
                                          isListening
                                            ? "bg-red-100 text-red-600 animate-pulse"
                                            : "bg-purple-50 text-purple-500 hover:bg-purple-100"
                                        )}
                                      >
                                        {isListening ? (
                                          <><MicOff size={12} /> Stop</>
                                        ) : transcribingKey === key ? (
                                          <><Loader2 size={12} className="animate-spin" /> Transcription IA...</>
                                        ) : (
                                          <><Mic size={12} /> Dicter (IA)</>
                                        )}
                                      </button>
                                    )}
                                  </div>

                                  <textarea
                                    value={currentComments[key] || ""}
                                    onChange={(e) => handleCommentChange(key, e.target.value)}
                                    disabled={isReadOnly}
                                    placeholder={`Votre retour sur « ${child.description} » — axes d'amélioration, points forts…`}
                                    rows={2}
                                    className={cn(
                                      "w-full text-sm rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-50 resize-none transition-colors",
                                      isListening && "border-red-300 ring-2 ring-red-50",
                                      isReadOnly && "opacity-60 cursor-not-allowed bg-slate-50"
                                    )}
                                  />
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}

                    {isDirty && (
                      <div className="flex justify-end pt-4 border-t border-slate-100">
                        <span className="flex items-center gap-2 text-orange-500 text-xs font-black">
                          <Loader2 className="animate-spin" size={14} /> Sauvegarde automatique en cours…
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* ── Commentaire global de l'évaluation ──────────────── */}
      {!readOnly && (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Sparkles size={18} className="text-purple-500" />
              Commentaire général — ensemble du référentiel
            </h3>
            <div className="flex items-center gap-3">
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => startRecording("GLOBAL")}
                  title={listeningKey === "GLOBAL" ? "Arrêter la dictée" : "Dicter un commentaire global"}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all",
                    listeningKey === "GLOBAL"
                      ? "bg-red-100 text-red-600 animate-pulse"
                      : "bg-purple-50 text-purple-500 hover:bg-purple-100 border border-purple-100"
                  )}
                >
                  {listeningKey === "GLOBAL" ? (
                    <><MicOff size={14} /> Stop</>
                  ) : transcribingKey === "GLOBAL" ? (
                    <><Loader2 size={14} className="animate-spin" /> Transcription...</>
                  ) : (
                    <><Mic size={14} /> Dicter (IA)</>
                  )}
                </button>
              )}
              {globalCommentDirty && (
                <button
                  onClick={handleSaveGlobalComment}
                  disabled={isSavingGlobal}
                  className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2 rounded-xl font-black text-xs shadow hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isSavingGlobal ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                  Enregistrer
                </button>
              )}
            </div>
          </div>
          <textarea
            value={globalComment}
            onChange={(e) => { setGlobalComment(e.target.value); setGlobalCommentDirty(true); }}
            placeholder="Observations générales sur l'ensemble de l'évaluation, points forts, axes d'amélioration…"
            rows={4}
            className="w-full text-sm rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-50 resize-none transition-colors"
          />
        </div>
      )}

      {/* ── Certification Zone ───────────────────────────────── */}
      {!readOnly && type && evaluationKind === "CCF" && (
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
