"use client";

import { useEffect, useState } from "react";
import { TeacherLayout } from "@/components/layout/TeacherLayout";
import { 
  Users, 
  Sparkles, 
  Target, 
  GraduationCap, 
  TrendingUp, 
  AlertCircle,
  ArrowRight,
  Clock,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function TeacherDashboard() {
  const [teacherName, setTeacherName] = useState("Formateur");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0,
    classes: 0,
    avgProgress: 0,
    pendingEvals: 0,
    activities: [] as any[]
  });

  useEffect(() => {
    const userStr = localStorage.getItem("ndrc_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setTeacherName(user.firstName || "Formateur");
    }

    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const token = localStorage.getItem("ndrc_token");
      const res = await fetch("/api/teacher/dashboard", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TeacherLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-10">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Bonjour, <span className="text-purple-600">{teacherName}</span> 👋
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Voici un aperçu de l'avancement de vos classes NDRC.
            </p>
          </div>
          <Link 
            href="/teacher/generate"
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles size={20} />
            Créer un nouveau cours
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Étudiants", value: stats.students, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Classes", value: stats.classes, icon: Target, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Progression Moy.", value: `${stats.avgProgress}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
            { label: "À Évaluer", value: stats.pendingEvals, icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", stat.bg)}>
                <stat.icon className={stat.color} size={28} />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black text-slate-800">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Clock size={20} className="text-purple-500" />
                Activités Récentes
              </h2>
              <button className="text-sm font-bold text-purple-600 hover:underline">Voir tout</button>
            </div>
            
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[100px]">
              {loading ? (
                <div className="p-10 flex items-center justify-center">
                  <Clock className="animate-spin text-slate-300" size={32} />
                </div>
              ) : stats.activities.length > 0 ? (
                stats.activities.map((item, i) => (
                  <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        {item.type === "assignment" ? <Target size={18} /> : <BookOpen size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 text-sm">{item.title}</p>
                        <p className="text-slate-400 text-xs font-medium">
                          {new Date(item.date).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg">
                      {item.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-slate-400 text-sm font-medium">
                  Aucune activité récente.
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Accès Rapides</h2>
            <div className="space-y-4">
              {[
                { label: "Suivi Épreuve E4", href: "/teacher/evaluations/e4", icon: GraduationCap, bg: "hover:bg-blue-50" },
                { label: "Suivi Épreuve E6", href: "/teacher/evaluations/e6", icon: GraduationCap, bg: "hover:bg-purple-50" },
                { label: "Compétences E5 B", href: "/teacher/missions", icon: Target, bg: "hover:bg-orange-50" },
              ].map((link, i) => (
                <Link 
                  key={i} 
                  href={link.href}
                  className={cn("group flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all", link.bg)}
                >
                  <div className="flex items-center gap-3">
                    <link.icon size={20} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
                    <span className="font-bold text-slate-700 text-sm">{link.label}</span>
                  </div>
                  <ArrowRight size={18} className="text-slate-300 group-hover:text-purple-600 translate-x-0 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
