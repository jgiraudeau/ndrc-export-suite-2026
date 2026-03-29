"use client";

import { useEffect, useState } from "react";
import { TeacherLayout } from "@/components/layout/TeacherLayout";
import { 
  MessageSquare, 
  Users, 
  BarChart, 
  Search, 
  ArrowUpRight, 
  Sparkles, 
  Info,
  Clock,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChatStat {
  id: string;
  content: string;
  date: string;
  student: string;
}

export default function SuiviIAPage() {
  const [data, setData] = useState<{
    stats: { studentsCount: number; activeSessions: number; totalMessages: number };
    latestQuestions: ChatStat[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/teacher/stats/chat");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TeacherLayout>
      <div className="p-10 space-y-10 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-100 font-black px-4 py-1.5 rounded-full uppercase tracking-tighter shadow-sm">
               <Sparkles size={14} className="mr-2" /> Pilotage Pédagogique IA
            </Badge>
            <h1 className="text-5xl font-black text-slate-800 tracking-tight leading-none">
              Suivi du <span className="text-purple-600">Tuteur IA</span>
            </h1>
            <p className="text-lg text-slate-400 font-bold max-w-xl">
              Analysez les interactions de vos étudiants avec l'intelligence artificielle pour identifier les points de blocage.
            </p>
          </div>
          
          <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black">
              LIVE
            </div>
            <div className="pr-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Statut du Service</p>
              <p className="text-sm font-black text-slate-800">Opérationnel (Gemini 3)</p>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: "Étudiants Actifs", value: data?.stats.studentsCount || 0, icon: Users, color: "blue", trend: "+12%" },
            { label: "Sessions Créées", value: data?.stats.activeSessions || 0, icon: MessageSquare, color: "purple", trend: "+5" },
            { label: "Messages Échangés", value: data?.stats.totalMessages || 0, icon: BarChart, color: "indigo", trend: "+42" },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden group hover:scale-[1.02] transition-transform">
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                   <div className={cn(
                     "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors",
                     stat.color === "blue" ? "bg-blue-600 text-white shadow-blue-100" :
                     stat.color === "purple" ? "bg-purple-600 text-white shadow-purple-100" :
                     "bg-indigo-600 text-white shadow-indigo-100"
                   )}>
                     <stat.icon size={26} />
                   </div>
                   <Badge className="bg-emerald-50 text-emerald-600 border-transparent font-black px-3 py-1 rounded-lg">
                      {stat.trend} <TrendingUp size={12} className="ml-1" />
                   </Badge>
                </div>
                <div>
                  <h3 className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-1">{stat.label}</h3>
                  <p className="text-5xl font-black text-slate-800 tracking-tighter">
                    {loading ? <Skeleton className="h-10 w-24 inline-block" /> : stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Latest Questions */}
          <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-[40px] overflow-hidden">
            <CardHeader className="p-10 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">Dernières interrogations</CardTitle>
                  <CardDescription className="font-bold text-slate-400 mt-1">Les 10 questions les plus récentes posées par vos étudiants.</CardDescription>
                </div>
                <Search size={22} className="text-slate-300" />
              </div>
            </CardHeader>
            <CardContent className="p-10 pt-0">
               <div className="space-y-4">
                 {loading ? (
                   Array.from({ length: 5 }).map((_, i) => (
                     <div key={i} className="flex gap-4 items-center p-4">
                        <Skeleton className="w-12 h-12 rounded-xl" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                     </div>
                   ))
                 ) : data?.latestQuestions.length ? (
                   data.latestQuestions.map((q) => (
                     <div 
                      key={q.id} 
                      className="group p-6 bg-slate-50/50 hover:bg-white border-2 border-transparent hover:border-purple-100 rounded-[24px] transition-all duration-300 flex flex-col md:flex-row md:items-center gap-4 relative overflow-hidden"
                     >
                       <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                          <MessageSquare size={20} />
                       </div>
                       <div className="flex-1">
                          <p className="text-slate-700 font-bold text-sm leading-relaxed mb-2">
                             "{q.content.substring(0, 100)}{q.content.length > 100 ? "..." : ""}"
                          </p>
                          <div className="flex items-center gap-3">
                             <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
                                {q.student}
                             </Badge>
                             <div className="flex items-center text-[10px] text-slate-400 font-bold gap-1">
                                <Clock size={12} /> {new Date(q.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </div>
                          </div>
                       </div>
                       <button className="hidden md:flex opacity-0 group-hover:opacity-100 w-10 h-10 bg-purple-600 text-white rounded-full items-center justify-center shadow-lg shadow-purple-200 transition-all hover:bg-purple-700">
                          <ArrowUpRight size={18} />
                       </button>
                     </div>
                   ))
                 ) : (
                   <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[40px]">
                      <Info className="mx-auto text-slate-200 mb-4" size={48} />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Aucune donnée pour le moment</p>
                   </div>
                 )}
               </div>
            </CardContent>
          </Card>

          {/* Analysis Sidebar */}
          <div className="space-y-8">
             <Card className="border-none bg-purple-600 text-white shadow-xl shadow-purple-100 rounded-[40px] overflow-hidden relative group">
                <CardHeader className="p-8 pb-0">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                     <TrendingUp size={24} />
                  </div>
                  <CardTitle className="text-xl font-black tracking-tight">Analyse Pédagogique</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                   <p className="text-purple-100 font-medium text-sm leading-relaxed mb-6">
                      L'IA détecte une demande accrue sur <strong>les épreuves E4</strong> cette semaine (60% des échanges).
                   </p>
                   <div className="space-y-4">
                      {[
                        { label: "Épreuve E4", pct: "60%", color: "white" },
                        { label: "WordPress", pct: "25%", color: "purple-300" },
                        { label: "Épreuve E5B", pct: "15%", color: "purple-400" },
                      ].map((item, i) => (
                        <div key={i} className="space-y-1">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                              <span>{item.label}</span>
                              <span>{item.pct}</span>
                           </div>
                           <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: item.pct }} />
                           </div>
                        </div>
                      ))}
                   </div>
                </CardContent>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
             </Card>

             <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[40px] p-8 space-y-6">
                <h4 className="text-slate-800 font-black text-lg tracking-tight">Conseils du Tuteur</h4>
                <div className="space-y-4">
                   <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3">
                      <div className="shrink-0 w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                         <Info size={16} />
                      </div>
                      <p className="text-emerald-800 text-xs font-bold leading-relaxed">
                         Vos étudiants posent beaucoup de questions sur les critères d'évaluation. Pensez à republier le référentiel E4.
                      </p>
                   </div>
                   <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3">
                      <div className="shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                         <Sparkles size={16} />
                      </div>
                      <p className="text-indigo-800 text-xs font-bold leading-relaxed">
                         L'IA aide 80% des étudiants à débloquer leurs problèmes techniques WordPress en autonomie.
                      </p>
                   </div>
                </div>
             </Card>
          </div>

        </div>

      </div>
    </TeacherLayout>
  );
}
