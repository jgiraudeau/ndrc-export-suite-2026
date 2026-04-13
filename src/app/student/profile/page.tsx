"use client";

import { useState, useEffect } from "react";
import { 
    ArrowLeft, 
    Trophy, 
    Award, 
    Clock, 
    Briefcase, 
    Calendar, 
    Download,
    CheckCircle2,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { StudentDashboardData } from "@/lib/api-client";

export default function StudentProfilePage() {
    const [data, setData] = useState<StudentDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            const token = localStorage.getItem("ndrc_token");
            // Reuse dashboard API for now to get stats, but we might want a specific profile API
            const res = await fetch("/api/student/dashboard", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const json = await res.json() as { success: boolean; data?: StudentDashboardData };
            if (json.success) {
                setData(json.data ?? null);
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <Loader2 className="animate-spin text-purple-600" size={32} />
        </div>
    );

    if (!data) return null;

    return (
        <main className="min-h-screen bg-slate-50 pb-20">
            {/* Header / Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 h-48 relative">
                <div className="max-w-4xl mx-auto px-4 h-full flex items-end pb-8">
                    <Link href="/student" className="absolute top-6 left-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md">
                        <ArrowLeft size={20} />
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-16">
                <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
                    {/* Identity Section */}
                    <div className="p-8 md:p-12 border-b border-slate-50 relative">
                        <div className="absolute top-12 right-12 hidden md:block">
                            <button className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-wider text-xs shadow-xl shadow-purple-200 hover:bg-purple-700 transition-all hover:-translate-y-1">
                                <Download size={16} /> Exporter mon CV
                            </button>
                        </div>
                        
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                            <div className="w-32 h-32 rounded-[32px] bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-purple-200 relative">
                                {data.firstName[0]}{data.lastName[0]}
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-lg border-2 border-slate-50">
                                    <CheckCircle2 size={20} />
                                </div>
                            </div>
                            
                            <div className="text-center md:text-left">
                                <h1 className="text-4xl font-black text-slate-800 tracking-tight">{data.firstName} <span className="text-purple-600">{data.lastName}</span></h1>
                                <p className="text-slate-400 font-bold text-lg mt-1 italic">Futur Manager NDRC • {data.classCode}</p>
                                
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                                    <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-100">
                                        <Trophy size={16} className="text-amber-500" />
                                        <span className="text-xs font-black text-slate-700 uppercase">{data.progress.acquiredCount} Compétences</span>
                                    </div>
                                    <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-100">
                                        <Clock size={16} className="text-blue-500" />
                                        <span className="text-xs font-black text-slate-700 uppercase">124 Heures Mission</span>
                                    </div>
                                    <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-100">
                                        <Award size={16} className="text-emerald-500" />
                                        <span className="text-xs font-black text-slate-700 uppercase">Expertise CMS</span>
                                    </div>
                                </div>
                                
                                <div className="mt-8 p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-sm border border-purple-100">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none mb-1">Résumé de la semaine</p>
                                        <p className="text-sm font-bold text-slate-700 leading-snug">
                                            +3 compétences validées cette semaine. Continue sur cette lancée ! 🚀
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-50">
                        {/* Skills Breakdown */}
                        <div className="p-8 md:p-12 bg-white space-y-8">
                            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                <div className="w-2 h-8 bg-purple-600 rounded-full" /> Focus Compétences
                            </h2>

                            <div className="space-y-6">
                                <SkillProgress label="Digitalisation Relation Client" value={data.progress.wordpress} color="bg-blue-500" />
                                <SkillProgress label="Management de l'Activité" value={data.progress.prestashop} color="bg-pink-500" />
                                <SkillProgress label="Relation Client & Vente" value={85} color="bg-purple-500" />
                                <SkillProgress label="Veille Digitale" value={70} color="bg-indigo-500" />
                            </div>
                        </div>

                        {/* Recent Achievements */}
                        <div className="p-8 md:p-12 bg-white space-y-8">
                            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                <div className="w-2 h-8 bg-indigo-600 rounded-full" /> Projets Marquants
                            </h2>

                            <div className="space-y-6">
                                {data.recentActivity.slice(0,3).map((activity) => (
                                    <div key={activity.id} className="group flex gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors flex-shrink-0">
                                            <Briefcase size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1">{activity.label}</h4>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={12} className="text-slate-300" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {new Date(activity.date).toLocaleDateString("fr-FR", { month: 'long', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6">
                                <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100 relative overflow-hidden">
                                    <Trophy size={48} className="absolute -bottom-4 -right-4 text-indigo-200/50" />
                                    <p className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-2">Statut Certification</p>
                                    <p className="text-sm font-bold text-indigo-700 leading-relaxed">
                                        Éligible aux épreuves certifiantes E4 et E6. Dossier complet à 92%.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-slate-400">
                    <p className="text-xs font-bold uppercase tracking-widest">Généré par NDRC Export Suite • {new Date().getFullYear()}</p>
                </div>
            </div>
        </main>
    );
}

function SkillProgress({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{label}</span>
                <span className="text-sm font-black text-slate-800">{value}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}
