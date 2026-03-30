"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, CheckCircle2, BookOpen, Save, ExternalLink,
    ChevronDown, ChevronUp, Loader2, Globe, User, Filter, GraduationCap, FileDown, FileCheck, ClipboardList
} from "lucide-react";
import { ALL_COMPETENCIES } from "@/data/competencies";
import { ReferentialGrid } from "@/components/teacher/ReferentialGrid";
import E4_DATA from "../../../../../prisma/referentiel_e4.json";
import E6_DATA from "../../../../../prisma/referentiel_e6.json";
import { apiGetStudent, apiGradeCompetency, apiGetExperiences, apiGetJournal, type StudentWithProgress, type ProfessionalExperience } from "@/lib/api-client";
import { TeacherLayout } from "@/components/layout/TeacherLayout";
import { PDFService } from "@/lib/pdf-service";
import { DOCXService } from "@/lib/docx-service";
import { cn } from "@/lib/utils";

const TOTAL_COMPETENCIES = ALL_COMPETENCIES.length;

const LEVEL_NAMES: Record<number, string> = {
    1: "Découverte",
    2: "Construction",
    3: "Gestion",
    4: "Expertise",
};

type PlatformFilter = "ALL" | "WORDPRESS" | "PRESTASHOP";
type EvalFilter = "ALL" | "TO_EVALUATE" | "VALIDATED" | "REJECTED";

export default function StudentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const studentId = Array.isArray(params?.id) ? params.id[0] : params?.id;

    const [student, setStudent] = useState<StudentWithProgress | null>(null);
    const [experiences, setExperiences] = useState<ProfessionalExperience[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [activeTab, setActiveTab] = useState<"DIGITAL" | "E4" | "E6">("DIGITAL");

    // Surveiller les changements d'onglets via URL
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "E4" || tab === "E6") {
            setActiveTab(tab);
        } else if (tab === "DIGITAL") {
            setActiveTab("DIGITAL");
        }
    }, [searchParams]);

    // Filtres
    const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("ALL");
    const [levelFilter, setLevelFilter] = useState<number | null>(null);
    const [evalFilter, setEvalFilter] = useState<EvalFilter>("ALL");

    // État local de notation : { [competencyId]: { teacherStatus, teacherFeedback } }
    const [gradeInputs, setGradeInputs] = useState<Record<string, { teacherStatus: number; teacherFeedback: string }>>({});
    const [savingId, setSavingId] = useState<string | null>(null);
    const [savedId, setSavedId] = useState<string | null>(null);

    // Sections dépliées/repliées
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    const fetchStudent = useCallback(async () => {
        if (!studentId) return;
        
        const { data, error } = await apiGetStudent(studentId);
        if (error || !data) { 
            setLoading(false);
            return; 
        }

        setStudent(data);

        // Fetch experiences as well
        const { data: exps } = await apiGetExperiences({ studentId: studentId });
        if (exps) setExperiences(exps);

        // Initialiser les inputs depuis les données existantes
        const inputs: Record<string, { teacherStatus: number; teacherFeedback: string }> = {};
        data.competencies.forEach(c => {
            inputs[c.competencyId] = {
                teacherStatus: c.teacherStatus ?? -1,
                teacherFeedback: c.teacherFeedback ?? "",
            };
        });
        setGradeInputs(inputs);
        setLoading(false);
    }, [studentId]);

    useEffect(() => { fetchStudent(); }, [fetchStudent]);

    // Map competencyId -> progress
    const progressMap = useMemo(() => {
        const map: Record<string, NonNullable<typeof student>["competencies"][0]> = {};
        student?.competencies.forEach(c => { map[c.competencyId] = c; });
        return map;
    }, [student]);

    const handleExportPassport = (format: "pdf" | "docx" = "pdf") => {
        if (!student) return;
        const validatedExps = experiences.filter(e => e.status === "VALIDATED");
        if (format === "pdf") {
            PDFService.generateProPassport(student, validatedExps);
        } else {
            DOCXService.generateProPassport(student, validatedExps);
        }
    };

    const handleExportEvaluation = (type: "E4" | "E6", format: "pdf" | "docx" = "pdf") => {
        if (!student) return;
        
        // Map competencies to scores
        const relevantComps = student.competencies.filter(c => c.competencyId.startsWith(`${type}.`));
        const scores = relevantComps.map(c => ({
            criterionId: c.competencyId,
            criterionDescription: getCompetencyLabel(c.competencyId),
            score: c.teacherStatus || 0,
            comment: c.teacherFeedback
        }));

        const evaluation = { 
            scores, 
            sessionName: new Date().getFullYear().toString(),
            centerName: "LYCÉE NDRC"
        };

        if (format === "pdf") {
            PDFService.generateEvaluationGrid(student, evaluation, type);
        } else {
            const referential = type === "E4" ? E4_DATA : E6_DATA;
            const grades: Record<string, number> = {};
            student.competencies.forEach(c => {
                grades[c.competencyId] = c.teacherStatus || 0;
            });
            DOCXService.generateEvaluationGrid(student, evaluation, type, referential, grades);
        }
    };

    function getCompetencyLabel(id: string) {
        // 1. Digital Skills
        const digital = ALL_COMPETENCIES.find(c => c.id === id);
        if (digital) return digital.label;

        // 2. E4/E6 Referentials
        const data = id.startsWith("E4") ? E4_DATA : E6_DATA;
        for (const block of data) {
            for (const child of (block as any).children) {
                if (id === child.id || id.includes(child.id)) return child.description;
            }
        }
        return id;
    }

    // Statistiques
    const stats = useMemo(() => {
        if (!student) return { studentAcquired: 0, teacherEvaluated: 0, teacherValidated: 0 };
        let teacherEvaluated = 0;
        let teacherValidated = 0;
        student.competencies.forEach(c => {
            if (c.teacherStatus != null && c.teacherStatus !== -1) {
                teacherEvaluated++;
                if (c.teacherStatus >= 3) teacherValidated++;
            }
        });
        return {
            studentAcquired: student.acquiredCount,
            teacherEvaluated,
            teacherValidated,
        };
    }, [student]);

    // Filtrer les compétences
    const filteredCompetencies = useMemo(() => {
        return ALL_COMPETENCIES.filter(comp => {
            if (platformFilter !== "ALL" && comp.platform !== platformFilter) return false;
            if (levelFilter !== null && comp.level !== levelFilter) return false;
            if (evalFilter !== "ALL") {
                const progress = progressMap[comp.id];
                const ts = progress?.teacherStatus;
                if (evalFilter === "TO_EVALUATE" && (ts == null || ts === -1)) return true;
                if (evalFilter === "VALIDATED" && ts != null && ts >= 3) return true;
                if (evalFilter === "REJECTED" && ts != null && ts < 3 && ts !== -1) return true;
                return false;
            }
            return true;
        });
    }, [platformFilter, levelFilter, evalFilter, progressMap]);

    // Grouper : plateforme -> niveau -> catégorie -> compétences
    const grouped = useMemo(() => {
        const platforms: string[] = platformFilter === "ALL"
            ? ["WORDPRESS", "PRESTASHOP"]
            : [platformFilter];

        return platforms.map(platform => {
            const platComps = filteredCompetencies.filter(c => c.platform === platform);
            const levels = [1, 2, 3, 4].map(level => {
                const levelComps = platComps.filter(c => c.level === level);
                const categories = [...new Set(levelComps.map(c => c.category))];
                return {
                    level,
                    categories: categories.map(cat => ({
                        name: cat,
                        competencies: levelComps.filter(c => c.category === cat),
                    })),
                };
            }).filter(l => l.categories.length > 0);
            return { platform, levels };
        }).filter(p => p.levels.length > 0);
    }, [filteredCompetencies, platformFilter]);

    const handleGrade = async (competencyId: string) => {
        if (!studentId) return;
        const input = gradeInputs[competencyId];
        if (!input || input.teacherStatus < 0) return;

        setSavingId(competencyId);
        const { data, error } = await apiGradeCompetency(
            studentId, competencyId, input.teacherStatus, input.teacherFeedback
        );
        setSavingId(null);

        if (!error && data) {
            setStudent(prev => {
                if (!prev) return prev;
                const updatedCompetencies = prev.competencies.map(c =>
                    c.competencyId === competencyId
                        ? { ...c, teacherStatus: data.teacherStatus, teacherFeedback: data.teacherFeedback, teacherGradedAt: data.teacherGradedAt }
                        : c
                );
                
                // Si la compétence n'existait pas encore dans la liste de progression
                if (!updatedCompetencies.find(c => c.competencyId === competencyId)) {
                    updatedCompetencies.push({
                        competencyId, 
                        acquired: false, 
                        status: 0, 
                        proof: null,
                        updatedAt: new Date().toISOString(),
                        teacherStatus: data.teacherStatus,
                        teacherFeedback: data.teacherFeedback,
                        teacherGradedAt: data.teacherGradedAt,
                    });
                }

                return { ...prev, competencies: updatedCompetencies };
            });
            setSavedId(competencyId);
            setTimeout(() => setSavedId(null), 2000);
        }
    };

    if (loading) {
        return (
            <TeacherLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <Loader2 size={32} className="animate-spin text-purple-500" />
                </div>
            </TeacherLayout>
        );
    }

    if (!student) {
        return (
            <TeacherLayout>
                <div className="p-20 text-center">
                    <p className="text-slate-500 font-bold">Étudiant introuvable ou erreur de chargement.</p>
                    <Link href="/teacher/students" className="text-purple-600 hover:underline mt-4 inline-block">Retour à la liste</Link>
                </div>
            </TeacherLayout>
        );
    }

    const progress = TOTAL_COMPETENCIES > 0 ? Math.round((student.acquiredCount / TOTAL_COMPETENCIES) * 100) : 0;

    return (
        <TeacherLayout>
            <div className="p-8 max-w-6xl mx-auto space-y-10">
                {/* Header Profile */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-purple-100">
                            {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                                    {student.firstName} <span className="text-purple-600">{student.lastName}</span>
                                </h1>
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-200">
                                    {student.classCode}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wide">
                                    <User size={14} /> ID: {student.identifier}
                                </span>
                                <div className="flex gap-2">
                                    {student.wpUrl && (
                                        <a href={student.wpUrl} target="_blank" rel="noopener noreferrer" className="p-1 px-3 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition-colors">CMS</a>
                                    )}
                                    {student.prestaUrl && (
                                        <a href={student.prestaUrl} target="_blank" rel="noopener noreferrer" className="p-1 px-3 bg-pink-50 text-pink-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-pink-100 transition-colors">BO</a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-slate-100 p-1 rounded-2xl flex flex-col gap-1 shadow-sm">
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => handleExportPassport("pdf")}
                                    title="Passeport PDF"
                                    className="p-3 bg-white text-indigo-600 rounded-xl shadow-sm border border-slate-200 hover:bg-indigo-50 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-wider"
                                >
                                    <ClipboardList size={16} /> PASSEPORT (PDF)
                                </button>
                                <button 
                                    onClick={() => handleExportPassport("docx")}
                                    title="Passeport WORD"
                                    className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg border border-indigo-500 hover:bg-indigo-700 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-wider"
                                >
                                    <FileDown size={16} /> WORD
                                </button>
                                <button 
                                    onClick={async () => {
                                        const { data: logs } = await apiGetJournal({ studentId: student.id });
                                        if (logs) PDFService.generateJournal(student, logs);
                                    }}
                                    className="p-3 bg-slate-800 text-white rounded-xl shadow-lg border border-slate-700 hover:bg-black transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-wider h-full"
                                >
                                    <BookOpen size={16} /> JOURNAL (PDF)
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-1 mt-1">
                                <div className="flex flex-col gap-1">
                                    <button 
                                        onClick={() => handleExportEvaluation("E4", "pdf")}
                                        className="p-2 bg-white text-emerald-600 rounded-lg shadow-sm border border-slate-200 hover:bg-emerald-50 transition-all text-[8px] font-black uppercase tracking-wider text-center"
                                    >
                                        E4 (PDF)
                                    </button>
                                    <button 
                                        onClick={() => handleExportEvaluation("E4", "docx")}
                                        className="p-2 bg-emerald-600 text-white rounded-lg shadow-md border border-emerald-500 hover:bg-emerald-700 transition-all text-[8px] font-black uppercase tracking-wider text-center"
                                    >
                                        E4 (WORD)
                                    </button>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <button 
                                        onClick={() => handleExportEvaluation("E6", "pdf")}
                                        className="p-2 bg-white text-amber-600 rounded-lg shadow-sm border border-slate-200 hover:bg-amber-50 transition-all text-[8px] font-black uppercase tracking-wider text-center"
                                    >
                                        E6 (PDF)
                                    </button>
                                    <button 
                                        onClick={() => handleExportEvaluation("E6", "docx")}
                                        className="p-2 bg-amber-600 text-white rounded-lg shadow-md border border-amber-500 hover:bg-amber-700 transition-all text-[8px] font-black uppercase tracking-wider text-center"
                                    >
                                        E6 (WORD)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Selection */}
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
                    <button
                        onClick={() => {
                            setActiveTab("DIGITAL");
                            router.replace(`/teacher/student/${studentId}?tab=DIGITAL`);
                        }}
                        className={cn("px-8 py-3 text-sm font-black rounded-xl transition-all border-0", activeTab === "DIGITAL" ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                        Compétences Digitales
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("E4");
                            router.replace(`/teacher/student/${studentId}?tab=E4`);
                        }}
                        className={cn("px-8 py-3 text-sm font-black rounded-xl transition-all border-0", activeTab === "E4" ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                        Épreuve E4
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("E6");
                            router.replace(`/teacher/student/${studentId}?tab=E6`);
                        }}
                        className={cn("px-8 py-3 text-sm font-black rounded-xl transition-all border-0", activeTab === "E6" ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                        Épreuve E6
                    </button>
                </div>

                {/* Content based on Tab */}
                {activeTab === "DIGITAL" ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Stats Dashboard for Digital Skills */}
                        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-10">
                            <div className="relative w-32 h-32 flex-shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 * (1 - progress / 100)} strokeLinecap="round" className="text-purple-600 transition-all duration-1000" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black text-slate-800">{progress}%</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Global</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-8 flex-1">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Acquises</p>
                                    <p className="text-2xl font-black text-slate-800">{stats.studentAcquired}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Evaluées</p>
                                    <p className="text-2xl font-black text-purple-600">{stats.teacherEvaluated}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Validées</p>
                                    <p className="text-2xl font-black text-blue-600">{stats.teacherValidated}</p>
                                </div>
                            </div>
                        </div>

                        {/* Traditional competency list */}
                        <div className="space-y-10">
                            {grouped.map(({ platform, levels }) => (
                                <div key={platform} className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-2 h-8 rounded-full", platform === "WORDPRESS" ? "bg-blue-500" : "bg-pink-500")} />
                                        <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                            {platform === "WORDPRESS" ? "Formation WordPress" : "Formation PrestaShop"}
                                        </h2>
                                    </div>

                                    {levels.map(({ level, categories }) => {
                                        const sectionKey = `${platform}-${level}`;
                                        const levelComps = categories.flatMap(c => c.competencies);
                                        const evaluatedCount = levelComps.filter(c => progressMap[c.id]?.teacherStatus != null && progressMap[c.id]?.teacherStatus !== -1).length;

                                        return (
                                            <div key={sectionKey} className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                                                <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn("px-4 py-1.5 rounded-xl text-xs font-black shadow-sm", platform === "WORDPRESS" ? "bg-blue-600 text-white" : "bg-pink-600 text-white")}>
                                                            NIVEAU {level}
                                                        </div>
                                                        <h3 className="font-bold text-slate-700 tracking-tight">{LEVEL_NAMES[level]}</h3>
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{evaluatedCount}/{levelComps.length} ÉVALUÉES</span>
                                                </div>
                                                <div className="p-6 space-y-8">
                                                    {categories.map(({ name: catName, competencies: comps }) => (
                                                        <div key={catName} className="space-y-4">
                                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{catName}</h4>
                                                            <div className="grid grid-cols-1 gap-4">
                                                                {comps.map(comp => {
                                                                    const prog = progressMap[comp.id];
                                                                    const input = gradeInputs[comp.id] || { teacherStatus: -1, teacherFeedback: "" };
                                                                    const isSaving = savingId === comp.id;
                                                                    const isSaved = savedId === comp.id;

                                                                    return (
                                                                        <div key={comp.id} className="group p-5 rounded-2xl border border-slate-100 hover:border-purple-200 hover:bg-slate-50/30 transition-all flex flex-col gap-4">
                                                                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                                                                <div className="flex-1">
                                                                                    <p className="text-sm font-bold text-slate-800 leading-snug">{comp.label}</p>
                                                                                    {prog && prog.proof && (
                                                                                        <div className="mt-2 text-xs font-medium text-purple-600 bg-purple-50 p-2 rounded-xl flex items-center gap-2 w-fit">
                                                                                            <BookOpen size={14} /> 
                                                                                            Preuve : {prog.proof.length > 50 ? prog.proof.substring(0, 50) + "..." : prog.proof}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex-shrink-0 flex items-center gap-3">
                                                                                    <select
                                                                                        value={input.teacherStatus}
                                                                                        onChange={e => setGradeInputs(prev => ({
                                                                                            ...prev,
                                                                                            [comp.id]: { ...prev[comp.id] || { teacherFeedback: "" }, teacherStatus: parseInt(e.target.value) }
                                                                                        }))}
                                                                                        className={cn("text-xs font-black px-4 py-2 rounded-xl border-2 transition-all outline-none", 
                                                                                            input.teacherStatus >= 3 ? "border-green-100 bg-green-50 text-green-700" : 
                                                                                            input.teacherStatus > 0 ? "border-blue-100 bg-blue-50 text-blue-700" : "border-slate-100 bg-slate-50 text-slate-400")}
                                                                                    >
                                                                                        <option value={-1}>NON ÉVALUÉ</option>
                                                                                        <option value={1}>NOVICE</option>
                                                                                        <option value={2}>APPRENTI</option>
                                                                                        <option value={3}>COMPÉTENT</option>
                                                                                        <option value={4}>EXPERT</option>
                                                                                    </select>
                                                                                    <button
                                                                                        onClick={() => handleGrade(comp.id)}
                                                                                        disabled={isSaving || input.teacherStatus < 0}
                                                                                        className={cn("p-2 rounded-xl transition-all shadow-lg active:scale-90",
                                                                                            isSaved ? "bg-green-600 text-white" : "bg-purple-600 text-white hover:bg-purple-700 shadow-purple-100")}
                                                                                    >
                                                                                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : isSaved ? <CheckCircle2 size={18} /> : <Save size={18} />}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                            <div className="w-full">
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Ajouter une annotation pédagogique..."
                                                                                    value={input.teacherFeedback}
                                                                                    onChange={e => setGradeInputs(prev => ({
                                                                                        ...prev,
                                                                                        [comp.id]: { ...prev[comp.id] || { teacherStatus: -1 }, teacherFeedback: e.target.value }
                                                                                    }))}
                                                                                    className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-slate-100 focus:border-purple-300 focus:outline-none bg-slate-50/50"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : activeTab === "E4" ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <ReferentialGrid 
                            studentId={studentId as string} 
                            referential={E4_DATA} 
                            title="Relation Client et Négociation-Vente" 
                            type="E4"
                            initialGrades={Object.fromEntries(
                                student.competencies
                                    .filter(c => c.competencyId.startsWith("E4.") && c.teacherStatus != null)
                                    .map(c => [c.competencyId, c.teacherStatus!])
                            )}
                        />
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <ReferentialGrid 
                            studentId={studentId as string} 
                            referential={E6_DATA} 
                            title="Relation Client et Animation de Réseaux" 
                            type="E6"
                            initialGrades={Object.fromEntries(
                                student.competencies
                                    .filter(c => c.competencyId.startsWith("E6.") && c.teacherStatus != null)
                                    .map(c => [c.competencyId, c.teacherStatus!])
                            )}
                        />
                    </div>
                )}

            </div>
        </TeacherLayout>
    );
}
