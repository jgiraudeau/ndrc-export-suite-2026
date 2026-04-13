"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, CheckCircle, XCircle, Trash2, Users, BookOpen, LogOut, Clock, BarChart3, Key, FileText, ClipboardList, Database, ExternalLink } from "lucide-react";
import { apiGetTeachers, apiManageTeacher, apiGetAdminStats, type TeacherAdmin, type AdminStats } from "@/lib/api-client";

type StatusFilter = "all" | "pending" | "active" | "rejected";

export default function AdminDashboardPage() {
    const router = useRouter();
    const whmManagerUrl =
        process.env.NEXT_PUBLIC_WHM_MANAGER_URL || "https://whm-manager.vercel.app";
    const [teachers, setTeachers] = useState<TeacherAdmin[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [filter, setFilter] = useState<StatusFilter>("all");
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [tempPassword, setTempPassword] = useState<{id: string, code: string} | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const [teachersRes, statsRes] = await Promise.all([
            apiGetTeachers(),
            apiGetAdminStats()
        ]);

        if (teachersRes.error || statsRes.error) {
            router.push("/admin/login");
            return;
        }

        if (teachersRes.data) setTeachers(teachersRes.data);
        if (statsRes.data) setStats(statsRes.data);
        setIsLoading(false);
    }, [router]);

    useEffect(() => {
        const userStr = localStorage.getItem("ndrc_user");
        if (!userStr) {
            router.push("/admin/login");
            return;
        }
        const user = JSON.parse(userStr);
        if (!user.role || user.role !== "ADMIN") {
            router.push("/admin/login");
            return;
        }
        queueMicrotask(() => {
            void loadData();
        });
    }, [router, loadData]);

    const handleAction = async (teacherId: string, action: "approve" | "reject" | "delete" | "reset_password") => {
        setActionLoading(teacherId);
        const { data, error } = await apiManageTeacher(teacherId, action);
        setActionLoading(null);
        setConfirmDelete(null);

        if (!error && data) {
            if (action === "reset_password" && data.tempPassword) {
                setTempPassword({ id: teacherId, code: data.tempPassword });
            } else {
                loadData();
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("ndrc_token");
        localStorage.removeItem("ndrc_user");
        router.push("/admin/login");
    };

    const filtered = teachers.filter((t) =>
        filter === "all" ? true : t.status === filter
    );

    const statusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-full bg-amber-100 text-amber-700">En attente</span>;
            case "active":
                return <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-full bg-green-100 text-green-700">Actif</span>;
            case "rejected":
                return <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-full bg-red-100 text-red-700">Refusé</span>;
            default:
                return <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-full bg-slate-100 text-slate-500">{status}</span>;
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-slate-400 text-sm font-bold uppercase tracking-widest">Initialisation Console...</div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Header */}
            <header className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-30 shadow-xl border-b border-slate-800">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20 rotate-3">
                            <Shield size={22} fill="currentColor" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight leading-none">ADMIN PANEL</h1>
                            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1">NDRC Export Suite 2026</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                        <LogOut size={16} /> DÉCONNEXION
                    </button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto p-6">
                
                {/* Platform KPIs */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 size={16} /> Indicateurs Plateforme
                    </h2>
                    <div className="flex items-center gap-2">
                        <a
                            href={whmManagerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[11px] font-black uppercase tracking-wider hover:bg-slate-100"
                        >
                            <ExternalLink size={14} />
                            WHM Manager
                        </a>
                        <Link
                            href="/admin/rag"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[11px] font-black uppercase tracking-wider hover:bg-slate-100"
                        >
                            <Database size={14} />
                            Base RAG
                        </Link>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                <Users size={18} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Étudiants</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900">{stats?.students || 0}</div>
                        <p className="text-xs text-slate-500 mt-1">Inscrits sur la plateforme</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                                <BookOpen size={18} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Classes</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900">{stats?.classes || 0}</div>
                        <p className="text-xs text-slate-500 mt-1">Groupes pédagogiques</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                                <FileText size={18} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Passeports</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900">{stats?.experiences || 0}</div>
                        <p className="text-xs text-slate-500 mt-1">Expériences validées</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                                <ClipboardList size={18} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Journal</span>
                        </div>
                        <div className="text-3xl font-black text-slate-900">{stats?.entries || 0}</div>
                        <p className="text-xs text-slate-500 mt-1">Entrées de bord totales</p>
                    </div>
                </div>

                {/* Teacher Management Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <Shield size={16} /> Gestion des Formateurs
                        </h2>
                        <p className="text-xs text-slate-500 italic">Validation des nouveaux accès et support technique.</p>
                    </div>
                    
                    {/* Status Filters */}
                    <div className="flex bg-slate-200 p-1 rounded-xl">
                        {(["all", "pending", "active", "rejected"] as StatusFilter[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${
                                    filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                {f === "all" ? "Tous" : f === "pending" ? "En attente" : f === "active" ? "Actifs" : "Refusés"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Teachers List */}
                {filtered.length === 0 ? (
                    <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 py-20 text-center">
                        <Users size={48} className="mx-auto mb-4 text-slate-200" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Aucun formateur trouvé</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filtered.map((teacher) => (
                            <div
                                key={teacher.id}
                                className="bg-white group rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-300"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                                                <Users size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 leading-none mb-1">{teacher.name}</h3>
                                                <p className="text-xs text-slate-400 font-medium">{teacher.email}</p>
                                            </div>
                                            <div className="ml-2">{statusBadge(teacher.status)}</div>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-wider">
                                            <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                                <Clock size={12} className="text-slate-300" />
                                                Inscrit le {new Date(teacher.createdAt).toLocaleDateString("fr-FR")}
                                            </span>
                                            <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                                <Users size={12} className="text-slate-300" />
                                                {teacher._count.students} étudiants
                                            </span>
                                            <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                                <BookOpen size={12} className="text-slate-300" />
                                                {teacher._count.classes} classes
                                            </span>
                                        </div>

                                        {/* Password Display */}
                                        {tempPassword?.id === teacher.id && (
                                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center gap-2">
                                                    <Key size={14} className="text-amber-600" />
                                                    <span className="text-xs font-bold text-amber-900 uppercase">Mot de passe temporaire :</span>
                                                    <code className="bg-white px-2 py-0.5 rounded border border-amber-200 text-sm font-black text-amber-700">{tempPassword.code}</code>
                                                </div>
                                                <button onClick={() => setTempPassword(null)} className="text-[10px] font-bold text-amber-600 hover:underline">FERMER</button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Advanced Actions */}
                                    <div className="flex flex-wrap items-center gap-2 shrink-0 lg:border-l lg:pl-6 border-slate-100">
                                        {teacher.status !== "active" && (
                                            <button
                                                onClick={() => handleAction(teacher.id, "approve")}
                                                disabled={actionLoading === teacher.id}
                                                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                                            >
                                                <CheckCircle size={14} /> Valider
                                            </button>
                                        )}
                                        {teacher.status === "active" && (
                                            <button
                                                onClick={() => handleAction(teacher.id, "reset_password")}
                                                disabled={actionLoading === teacher.id}
                                                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all disabled:opacity-50"
                                            >
                                                <Key size={14} /> Reset Password
                                            </button>
                                        )}
                                        {teacher.status === "active" && (
                                            <button
                                                onClick={() => handleAction(teacher.id, "reject")}
                                                disabled={actionLoading === teacher.id}
                                                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white transition-all disabled:opacity-50"
                                            >
                                                <XCircle size={14} /> Suspendre
                                            </button>
                                        )}
                                        
                                        <div className="w-px h-8 bg-slate-100 mx-2 hidden lg:block" />

                                        {confirmDelete === teacher.id ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleAction(teacher.id, "delete")}
                                                    disabled={actionLoading === teacher.id}
                                                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl bg-red-600 text-white shadow-lg shadow-red-200"
                                                >
                                                    Confirmer
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDelete(null)}
                                                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
                                                >
                                                    Annuler
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmDelete(teacher.id)}
                                                disabled={actionLoading === teacher.id}
                                                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100 disabled:opacity-50"
                                            >
                                                <Trash2 size={14} /> Supprimer
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
