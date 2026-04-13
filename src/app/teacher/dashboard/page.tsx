"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  ClipboardCheck, 
  BarChart3, 
  Search,
  Bell,
  HelpCircle,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TeacherSidebar } from "@/components/teacher/TeacherSidebar";

type DashboardStudent = {
  id: string;
  initials: string;
  name: string;
  class: string;
  completion: number;
};

type DashboardActivity = {
  id: string;
  type: string;
  title: string;
  date: string | Date;
  status: string;
};

type DashboardStats = {
  students: number;
  classes: number;
  avgProgress: number;
  pendingEvals: number;
  activities: DashboardActivity[];
};

export default function TeacherDashboard() {
  const [students, setStudents] = useState<DashboardStudent[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("ndrc_token");
        if (!token) {
          router.push("/teacher/login");
          return;
        }

        const [stdRes, statsRes] = await Promise.all([
          fetch("/api/teacher/students", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/teacher/dashboard", { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const stdData = (await stdRes.json()) as {
          success?: boolean;
          students?: DashboardStudent[];
        };
        const statsData = (await statsRes.json()) as {
          success?: boolean;
          data?: DashboardStats;
        };

        if (stdData.success && Array.isArray(stdData.students)) {
          setStudents(stdData.students);
        }
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-manrope">
      {/* Sidebar */}
      <TeacherSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 shrink-0">
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400" 
              placeholder="Rechercher un étudiant, une classe..."
            />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                <Calendar size={14} />
                <span>Session 2026</span>
            </div>
            <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Suivi des Étudiants</h2>
              <p className="text-slate-500 font-medium">Gérez et validez les compétences des candidats NDRC.</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Taux Moyen d&apos;Acquisition</div>
               <div className="flex items-baseline gap-2">
                 <span className="text-3xl font-black text-indigo-600 tracking-tighter">{stats?.avgProgress || 0}%</span>
                 <span className="text-xs font-bold text-slate-300">Global</span>
               </div>
            </div>
            <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Évaluations en attente</div>
               <div className="flex items-baseline gap-2">
                 <span className="text-3xl font-black text-amber-500 tracking-tighter">{stats?.pendingEvals || 0}</span>
                 <span className="text-xs font-bold text-slate-300">À traiter</span>
               </div>
            </div>
            <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Étudiants Actifs</div>
               <div className="flex items-baseline gap-2">
                 <span className="text-3xl font-black text-slate-800 tracking-tighter">{stats?.students || 0}</span>
                 <span className="text-xs font-bold text-slate-300">Inscrits</span>
               </div>
            </div>
            <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
              <button 
                className="w-full h-full flex flex-col items-center justify-center gap-2 bg-indigo-600 text-white rounded-[20px] shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                onClick={() => router.push("/teacher/suivi-ia")}
              >
                  <BarChart3 size={24} />
                  <span className="text-sm font-black">Analyse IA</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidat</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Classe</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acquisition</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [1,2,3].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-8 py-4 h-16 bg-slate-50/50"></td>
                    </tr>
                  ))
                ) : students.length > 0 ? (
                  students.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">
                            {student.initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{student.name}</div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Candidat Session 2026</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-bold text-slate-600 text-sm">
                        {student.class}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3 flex-1 max-w-[200px]">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${student.completion}%` }}></div>
                          </div>
                          <span className="text-sm font-black text-indigo-600">{student.completion}%</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Link 
                          href={`/teacher/student/${student.id}`}
                          className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:scale-105 transition-all shadow-xl shadow-slate-200"
                        >
                          Dossier de Compétences <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                       <div className="inline-flex w-16 h-16 rounded-3xl bg-slate-100 text-slate-300 items-center justify-center mb-4">
                         <Users size={32} />
                       </div>
                       <div className="font-bold text-slate-400">Aucun étudiant assigné pour le moment.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Activity Feed */}
          <div className="mt-10 grid grid-cols-3 gap-8">
             <div className="col-span-2 bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                <h3 className="text-xl font-black text-slate-800 mb-6">Activités Récentes</h3>
                <div className="space-y-6">
                  {stats?.activities?.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs",
                        activity.type === "assignment" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {activity.type === "assignment" ? <ClipboardCheck size={18} /> : <CheckCircle2 size={18} />}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-800 text-sm">{activity.title}</div>
                        <div className="text-xs text-slate-400 font-medium">{new Date(activity.date).toLocaleDateString("fr-FR")}</div>
                      </div>
                      <div className="px-3 py-1 bg-slate-50 rounded-lg text-slate-400 font-black text-[10px] uppercase tracking-widest">
                        {activity.status}
                      </div>
                    </div>
                  ))}
                  {(!stats?.activities || stats.activities.length === 0) && (
                    <div className="flex items-center gap-3 text-slate-300 font-bold p-10 justify-center">
                       <Clock size={20} /> Pas d&apos;activités récentes pour le moment.
                    </div>
                  )}
                </div>
             </div>

             <div className="bg-indigo-600 rounded-[32px] p-8 shadow-xl shadow-indigo-100 text-white flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                  <HelpCircle size={24} />
                </div>
                <h3 className="text-xl font-black mb-2 leading-tight">Besoin d&apos;aide avec l&apos;IA ?</h3>
                <p className="text-indigo-100 text-sm font-medium mb-8 leading-relaxed">
                  Consultez notre guide expert sur l&apos;évaluation assistée par GPT-4 pour améliorer vos retours pédagogiques.
                </p>
                <button className="mt-auto w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all">
                  Voir le Guide NDRC 2026
                </button>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
