"use client";

import { useState, useEffect, useCallback } from "react";
import { 
    ArrowLeft, 
    Calendar, 
    CheckCircle2, 
    Plus, 
    Search, 
    History, 
    Briefcase, 
    Target,
    Loader2,
    ImageIcon,
    Send,
    ChevronRight,
    PenLine,
    MessageSquare,
    Link as LinkIcon
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface JournalEntry {
    id: string;
    date: string;
    content: string;
    proofs: string[];
    links: string[];
    teacherComment: string | null;
    isValidated: boolean;
}

interface Item {
    id: string;
    title: string;
    type: "MISSION" | "EXPERIENCE";
    status: string;
    date: string;
    icon: LucideIcon;
    journal: JournalEntry[];
    competencyIds: string[];
}

type MissionApiItem = {
    id: string;
    title: string;
    status: string;
    assignedAt: string;
    journal?: JournalEntry[];
    competencyIds?: string[];
};

type ExperienceApiItem = {
    id: string;
    title: string;
    status: string;
    startDate: string;
    journal?: JournalEntry[];
    competencyIds?: string[];
};

export default function StudentJournalPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<Item[]>([]);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [newLog, setNewLog] = useState("");
    const [newLink, setNewLink] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [showLinkInput, setShowLinkInput] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem("ndrc_token");
            if (!token) { router.push("/student/login"); return; }

            const [missionsRes, expRes] = await Promise.all([
                fetch("/api/student/missions", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("/api/experiences", { headers: { Authorization: `Bearer ${token}` } }) // Needs studentId filter, usually handled by API if token present
            ]);

            const missions = await missionsRes.json();
            const experiences = await expRes.json();
            const missionItems: MissionApiItem[] = Array.isArray(missions?.data) ? missions.data : [];
            const experienceItems: ExperienceApiItem[] = Array.isArray(experiences) ? experiences : [];

            const combined: Item[] = [
                ...missionItems.map((m) => ({
                    id: m.id,
                    title: m.title,
                    type: "MISSION" as const,
                    status: m.status,
                    date: m.assignedAt,
                    icon: Target,
                    journal: m.journal || [],
                    competencyIds: m.competencyIds || []
                })),
                ...experienceItems.map((e) => ({
                    id: e.id,
                    title: e.title,
                    type: "EXPERIENCE" as const,
                    status: e.status,
                    date: e.startDate,
                    icon: Briefcase,
                    journal: e.journal || [],
                    competencyIds: e.competencyIds || []
                }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setItems(combined);
        } catch (err) {
            console.error("Failed to fetch journal data:", err);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    async function handlePostLog() {
        if (!selectedItem || !newLog.trim()) return;
        setIsPosting(true);

        try {
            const res = await fetch("/api/journal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: newLog,
                    links: newLink.trim() ? [newLink.trim()] : [],
                    experienceId: selectedItem.type === "EXPERIENCE" ? selectedItem.id : undefined,
                    assignmentId: selectedItem.type === "MISSION" ? selectedItem.id : undefined,
                })
            });

            if (res.ok) {
                const data = await res.json();
                setSelectedItem(prev => prev ? {
                    ...prev,
                    journal: [data.data, ...prev.journal]
                } : null);
                setItems(prev => prev.map(item => 
                    item.id === selectedItem.id 
                        ? { ...item, journal: [data.data, ...item.journal] }
                        : item
                ));
                setNewLog("");
                setNewLink("");
                setShowLinkInput(false);
            }
        } catch (err) {
            console.error("Failed to post log:", err);
        } finally {
            setIsPosting(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-600" size={32} />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 pb-20">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/student" className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
                        <ArrowLeft size={24} />
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 text-purple-600">
                            <PenLine size={16} className="stroke-[3]" />
                        </div>
                        <h1 className="font-extrabold text-slate-800 text-lg tracking-tight">Journal de Bord</h1>
                    </div>
                    <div className="w-8" />
                </div>
            </header>

            <div className="max-w-xl mx-auto p-4 space-y-4">
                {/* Dashboard Stats */}
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-purple-200">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-purple-100 text-xs font-black uppercase tracking-widest mb-1">Activité totale</p>
                            <h2 className="text-3xl font-black">{items.length} Activités</h2>
                        </div>
                        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                            <History size={24} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
                            <p className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Compétences liées</p>
                            <p className="text-xl font-black">{new Set(items.flatMap(i => i.competencyIds)).size}</p>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
                            <p className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Entrées Journal</p>
                            <p className="text-xl font-black">{items.reduce((acc, i) => acc + i.journal.length, 0)}</p>
                        </div>
                    </div>
                </div>

                {/* Search & Actions */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input type="text" placeholder="Rechercher un projet..." className="w-full bg-white pl-12 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-purple-500/20 outline-none" />
                    </div>
                    <Link href="/student/portfolio" className="p-3 bg-white border border-slate-200 rounded-2xl text-purple-600 hover:bg-purple-50 transition-colors shadow-sm">
                        <Plus size={24} />
                    </Link>
                </div>

                {/* Timeline / Items */}
                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className={cn(
                            "bg-white rounded-3xl border transition-all overflow-hidden",
                            selectedItem?.id === item.id ? "border-purple-500 ring-2 ring-purple-100" : "border-slate-100 shadow-sm"
                        )}>
                            <div 
                                className="p-5 flex items-start gap-4 cursor-pointer hover:bg-slate-50/50"
                                onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                            >
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm",
                                    item.type === "EXPERIENCE" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                )}>
                                    <item.icon size={22} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {item.type === "EXPERIENCE" ? "Professionnel" : "Pédagogique"}
                                        </span>
                                        <span className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            item.status === "completed" || item.status === "VALIDATED" ? "bg-emerald-500" : "bg-amber-500"
                                        )} />
                                    </div>
                                    <h3 className="font-black text-slate-800 tracking-tight truncate">{item.title}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                            <Calendar size={12} /> {new Date(item.date).toLocaleDateString("fr-FR")}
                                        </span>
                                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                                            {item.journal.length} Logs
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className={cn("text-slate-300 transition-transform", selectedItem?.id === item.id && "rotate-90")} />
                            </div>

                            {selectedItem?.id === item.id && (
                                <div className="bg-slate-50/50 border-t border-slate-100 p-5 space-y-6">
                                    {/* Quick Post Log */}
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                            <PenLine size={14} className="text-purple-600" /> Ajouter une action
                                        </p>
                                        <textarea 
                                            value={newLog}
                                            onChange={(e) => setNewLog(e.target.value)}
                                            placeholder="Qu'as-tu fait aujourd'hui sur ce projet ?"
                                            className="w-full bg-slate-50 rounded-xl p-3 text-sm font-medium border border-transparent focus:border-purple-200 focus:bg-white outline-none transition-all min-h-[80px] resize-none"
                                        />
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => setShowLinkInput(!showLinkInput)}
                                                    className={cn(
                                                        "p-2 rounded-lg transition-all",
                                                        showLinkInput ? "bg-purple-100 text-purple-600" : "text-slate-400 hover:text-purple-600 hover:bg-purple-50"
                                                    )}
                                                >
                                                    <LinkIcon size={20} />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all">
                                                    <ImageIcon size={20} />
                                                </button>
                                            </div>
                                            <button 
                                                onClick={handlePostLog}
                                                disabled={isPosting || !newLog.trim()}
                                                className="w-full mt-4 bg-purple-600 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-100 hover:bg-purple-700 disabled:opacity-50 transition-all active:scale-[0.98]"
                                            >
                                                {isPosting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Publier dans mon journal
                                            </button>
                                        </div>

                                        {showLinkInput && (
                                            <div className="mt-4 animate-in slide-in-from-top-2">
                                                <input 
                                                    type="url" 
                                                    placeholder="Lien vers la preuve (OneDrive, Drive, portfolio...)"
                                                    value={newLink}
                                                    onChange={(e) => setNewLink(e.target.value)}
                                                    className="w-full bg-slate-50 border border-purple-100 rounded-xl p-3 text-sm font-medium outline-none focus:bg-white transition-all"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Journal Feed */}
                                    <div className="space-y-4">
                                        {selectedItem.journal.length === 0 ? (
                                            <div className="text-center py-8">
                                                <p className="text-slate-400 text-sm font-bold">Ton journal est vide pour ce projet.</p>
                                            </div>
                                        ) : (
                                            selectedItem.journal.map((log) => (
                                                <div key={log.id} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-200">
                                                    <div className="absolute left-[-4px] top-1.5 w-2.5 h-2.5 rounded-full bg-purple-500 border-4 border-white shadow-sm" />
                                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                {new Date(log.date).toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' })}
                                                            </p>
                                                            {log.links && log.links.length > 0 && (
                                                                <div className="flex gap-2">
                                                                    {log.links.map((link, idx) => (
                                                                        <a 
                                                                            key={idx}
                                                                            href={link.startsWith('http') ? link : `https://${link}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-purple-600 hover:text-purple-700 p-1 bg-purple-50 rounded-md"
                                                                            title="Voir la preuve"
                                                                        >
                                                                            <LinkIcon size={14} />
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                            {log.content}
                                                        </p>

                                                        {/* Feedback Formateur */}
                                                        {(log.teacherComment || log.isValidated) && (
                                                            <div className={cn(
                                                                "mt-4 p-3 rounded-xl border flex flex-col gap-2",
                                                                log.isValidated ? "bg-emerald-50 border-emerald-100" : "bg-purple-50 border-purple-100"
                                                            )}>
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <MessageSquare size={12} className={log.isValidated ? "text-emerald-600" : "text-purple-600"} />
                                                                        <span className={cn("text-[10px] font-black uppercase tracking-widest", log.isValidated ? "text-emerald-700" : "text-purple-700")}>
                                                                            Feedback Formateur
                                                                        </span>
                                                                    </div>
                                                                    {log.isValidated && (
                                                                        <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                                                                            <CheckCircle2 size={10} /> Validé
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {log.teacherComment && (
                                                                    <p className="text-[13px] font-bold text-slate-600 leading-tight">
                                                                        {log.teacherComment}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
