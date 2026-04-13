"use client";

import { useState, useEffect } from "react";
import { 
    ArrowLeft, 
    Users, 
    Calendar, 
    CheckCircle2, 
    ChevronRight, 
    MessageSquare,
    CheckSquare,
    Clock,
    Link as LinkIcon,
    Loader2,
    Send
} from "lucide-react";
import { TeacherLayout } from "@/components/layout/TeacherLayout";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface JournalEntry {
    id: string;
    date: string;
    content: string;
    links: string[];
    teacherComment: string | null;
    isValidated: boolean;
}

interface StudentAssignment {
    id: string;
    status: string;
    assignedAt: string;
    student: {
        id: string;
        firstName: string;
        lastName: string;
        class: { name: string };
    };
    journal: JournalEntry[];
}

interface Mission {
    id: string;
    title: string;
    platform: string;
    level: number;
    assignments: StudentAssignment[];
}

export default function TeacherMissionDetailPage() {
    const { id } = useParams();
    const [mission, setMission] = useState<Mission | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);
    const [feedback, setFeedback] = useState<{ [key: string]: string }>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function fetchMission() {
            try {
                const token = localStorage.getItem("ndrc_token");
                const res = await fetch(`/api/teacher/missions/${id}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setMission(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch mission details:", err);
            } finally {
                setLoading(false);
            }
        }

        void fetchMission();
    }, [id]);

    async function updateJournalEntry(entryId: string, isValidated: boolean) {
        setIsSaving(true);
        try {
            const token = localStorage.getItem("ndrc_token");
            const comment = feedback[entryId] || "";
            
            const res = await fetch("/api/journal", {
                method: "PATCH",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ id: entryId, teacherComment: comment, isValidated })
            });

            if (res.ok) {
                // Mettre à jour localement
                setMission(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        assignments: prev.assignments.map(a => ({
                            ...a,
                            journal: a.journal.map(j => j.id === entryId ? { ...j, teacherComment: comment, isValidated } : j)
                        }))
                    };
                });
            }
        } catch (err) {
            console.error("Failed to update journal entry:", err);
        } finally {
            setIsSaving(false);
        }
    }

    if (loading) {
        return (
            <TeacherLayout>
                <div className="flex items-center justify-center p-20">
                    <Loader2 className="animate-spin text-purple-600" size={40} />
                </div>
            </TeacherLayout>
        );
    }

    if (!mission) {
        return (
            <TeacherLayout>
                <div className="p-20 text-center">Mission non trouvée</div>
            </TeacherLayout>
        );
    }

    return (
        <TeacherLayout>
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <Link href="/teacher/missions" className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-600 font-bold text-sm transition-colors">
                    <ArrowLeft size={16} /> Retour aux missions
                </Link>

                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-wider rounded-lg">
                                {mission.platform}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">Niveau {mission.level}</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">{mission.title}</h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Students List */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Users size={20} className="text-purple-500" /> Profils Étudiants
                        </h2>
                        <div className="space-y-2">
                            {mission.assignments.map((assignment) => (
                                <button 
                                    key={assignment.id}
                                    onClick={() => setSelectedAssignment(assignment)}
                                    className={cn(
                                        "w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group",
                                        selectedAssignment?.id === assignment.id 
                                            ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-100" 
                                            : "bg-white border-slate-100 hover:border-purple-200"
                                    )}
                                >
                                    <div>
                                        <p className={cn("font-bold text-sm", selectedAssignment?.id === assignment.id ? "text-white" : "text-slate-800")}>
                                            {assignment.student.firstName} {assignment.student.lastName}
                                        </p>
                                        <p className={cn("text-xs", selectedAssignment?.id === assignment.id ? "text-purple-100" : "text-slate-400")}>
                                            {assignment.student.class.name}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-[10px] font-black px-2 py-1 rounded-md",
                                            selectedAssignment?.id === assignment.id 
                                                ? "bg-white/20 text-white" 
                                                : "bg-slate-50 text-slate-500"
                                        )}>
                                            {assignment.journal.length}
                                        </span>
                                        <ChevronRight size={16} className={cn(selectedAssignment?.id === assignment.id ? "text-white" : "text-slate-300")} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Journal Detail */}
                    <div className="lg:col-span-2 space-y-4">
                        {selectedAssignment ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <MessageSquare size={20} className="text-purple-500" /> Journal de board
                                    </h2>
                                    <span className="text-xs font-bold text-slate-400">
                                        Inscrit le {new Date(selectedAssignment.assignedAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="space-y-6">
                                    {selectedAssignment.journal.length > 0 ? (
                                        selectedAssignment.journal.map((log) => (
                                            <div key={log.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:bg-slate-50/50">
                                                <div className="p-6 space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <Calendar size={14} />
                                                            <span className="text-xs font-bold uppercase tracking-widest">
                                                                {new Date(log.date).toLocaleDateString("fr-FR", { weekday: 'short', day: 'numeric', month: 'long' })}
                                                            </span>
                                                        </div>
                                                        <div className={cn(
                                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                                                            log.isValidated ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                                                        )}>
                                                            {log.isValidated ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                            {log.isValidated ? "Validé" : "En attente"}
                                                        </div>
                                                    </div>

                                                    <p className="text-sm font-medium text-slate-700 leading-relaxed italic border-l-4 border-slate-200 pl-4">
                                                        &ldquo;{log.content}&rdquo;
                                                    </p>

                                                    {log.links && log.links.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 pt-2">
                                                            {log.links.map((link, idx) => (
                                                                <a 
                                                                    key={idx}
                                                                    href={link.startsWith('http') ? link : `https://${link}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-purple-100 hover:text-purple-600 rounded-lg text-xs font-bold text-slate-600 transition-all"
                                                                >
                                                                    <LinkIcon size={12} /> Voir la preuve
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Feedback Section */}
                                                    <div className="mt-6 pt-6 border-t border-slate-50 space-y-4">
                                                        <div className="flex items-center gap-2">
                                                            <MessageSquare size={16} className="text-purple-600" />
                                                            <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Feedback Formateur</span>
                                                        </div>
                                                        <textarea 
                                                            defaultValue={log.teacherComment || ""}
                                                            onChange={(e) => setFeedback({ ...feedback, [log.id]: e.target.value })}
                                                            placeholder="Laissez un commentaire ou une piste d'amélioration..."
                                                            className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-sm font-medium outline-none focus:border-purple-200 focus:bg-slate-50 transition-all min-h-[80px]"
                                                        />
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => updateJournalEntry(log.id, true)}
                                                                disabled={isSaving}
                                                                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                                                            >
                                                                <CheckSquare size={16} /> Valider l&apos;action
                                                            </button>
                                                            <button 
                                                                onClick={() => updateJournalEntry(log.id, false)}
                                                                disabled={isSaving}
                                                                className="px-4 py-3 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                                                title="Envoyer feedback sans valider"
                                                            >
                                                                <Send size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                            <p className="text-slate-400 font-bold text-sm">Cet étudiant n&apos;a pas encore saisi d&apos;actions.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="h-[600px] flex items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <div className="text-center italic text-slate-400">
                                    <Users size={32} className="mx-auto mb-4 opacity-20" />
                                    Sélectionnez un étudiant pour voir son journal.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </TeacherLayout>
    );
}
