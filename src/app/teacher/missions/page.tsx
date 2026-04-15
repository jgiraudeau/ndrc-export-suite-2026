"use client";

import { useState, useEffect } from "react";
import { Search, Filter, BookOpen, Clock, Users, ChevronRight, PlusCircle, Sparkles, Loader2 } from "lucide-react";
import { TeacherLayout } from "@/components/layout/TeacherLayout";
import Link from "next/link";
import { apiGetMissions } from "@/lib/api-client";

interface Mission {
    id: string;
    title: string;
    platform: string;
    level: number;
    competencyIds: string[];
    createdAt: string;
    _count?: { assignments: number };
}

export default function TeacherMissionsPage() {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchMissions();
    }, []);

    async function fetchMissions() {
        try {
            const { data, error } = await apiGetMissions();
            if (error || !data) {
                console.error("Failed to fetch missions:", error);
                setMissions([]);
                return;
            }
            setMissions(data);
        } catch (err) {
            console.error("Failed to fetch missions:", err);
            setMissions([]);
        } finally {
            setLoading(false);
        }
    }

    const filteredMissions = missions.filter(m => 
        m.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <TeacherLayout>
            <div className="p-8 max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                            Épreuve <span className="text-purple-600">E5B</span>
                        </h1>
                        <p className="text-slate-500 font-medium">Gérez les activités pédagogiques et suivez l&apos;implication des étudiants.</p>
                    </div>
                    
                    <Link
                        href="/teacher/missions/generate"
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-wider text-xs shadow-xl shadow-purple-200 hover:bg-purple-700 transition-all hover:-translate-y-1"
                    >
                        <PlusCircle size={18} /> Nouvelle Épreuve
                    </Link>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-800">{missions.length}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Épreuves actives</div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                            <Users size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-800">
                                {missions.reduce((acc, m) => acc + (m._count?.assignments ?? 0), 0)}
                            </div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Participations étudiants</div>
                        </div>
                    </div>
                    <Link
                        href="/teacher/missions/generate"
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 group cursor-pointer hover:border-purple-200 transition-colors"
                    >
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-800">IA</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Générer par IA</div>
                        </div>
                    </Link>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-50 p-2 rounded-2xl">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-purple-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Rechercher une épreuve..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs flex items-center gap-2 hover:bg-slate-50">
                            <Filter size={16} /> Filtres
                        </button>
                    </div>
                </div>

                {/* Missions Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-purple-600" size={40} />
                    </div>
                ) : filteredMissions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMissions.map((mission) => (
                            <div key={mission.id} className="bg-white group rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 transition-all overflow-hidden flex flex-col">
                                <div className="p-6 space-y-4 flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                            mission.platform === 'WORDPRESS' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                                        }`}>
                                            {mission.platform}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 capitalize">
                                            Niveau {mission.level}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 leading-tight group-hover:text-purple-600 transition-colors">
                                        {mission.title}
                                    </h3>
                                    <div className="flex items-center gap-4 pt-2">
                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                                            <Users size={14} /> {mission._count?.assignments ?? 0} étudiants
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                                            <Clock size={14} /> {new Date(mission.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <Link href={`/teacher/missions/${mission.id}`} className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between hover:bg-purple-50 transition-colors">
                                    <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                                        {mission.competencyIds.length} Compétences
                                    </span>
                                    <div className="p-2 text-slate-400 group-hover:text-purple-600 rounded-xl transition-all">
                                        <ChevronRight size={20} />
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <BookOpen size={30} />
                        </div>
                        <h4 className="text-lg font-black text-slate-800">Aucune épreuve trouvée</h4>
                        <p className="text-slate-500 text-sm font-medium mt-1">Commencez par créer votre première mission pédagogique.</p>
                        <Link
                            href="/teacher/missions/generate"
                            className="mt-6 inline-flex px-6 py-3 bg-white border border-slate-200 rounded-2xl font-black text-xs text-purple-600 hover:bg-purple-50 transition-all shadow-sm"
                        >
                            Créer ma première épreuve
                        </Link>
                    </div>
                )}
            </div>
        </TeacherLayout>
    );
}
