"use client";

import { useState } from "react";
import { 
  Search, 
  ChevronRight, 
  Users, 
  Target,
  GraduationCap,
  ArrowRight,
  Edit2,
  Check,
  X,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { apiUpdateStudent } from "@/lib/api-client";

interface StudentProgress {
  id: string;
  firstName: string;
  lastName: string;
  classCode: string;
  progress: number; // 0 to 100
  evaluatedCount: number;
  totalCount: number;
  wpUrl?: string; // For E5B
  prestaUrl?: string; // For E5B
}

interface EvaluationTableProps {
  students: StudentProgress[];
  type: "E4" | "E6" | "E5B";
}

export function EvaluationTable({ students, type }: EvaluationTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState<{ id: string; field: "wp" | "ps"; value: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateUrl = async () => {
    if (!editingUrl) return;
    setIsUpdating(true);
    const { error } = await apiUpdateStudent(editingUrl.id, {
      [editingUrl.field === "wp" ? "wpUrl" : "prestaUrl"]: editingUrl.value
    });
    if (!error) {
      window.location.reload(); 
    }
    setIsUpdating(false);
    setEditingUrl(null);
  };

  const classes = Array.from(new Set(students.map(s => s.classCode))).sort();

  const filtered = students
    .filter(s => (selectedClass ? s.classCode === selectedClass : true))
    .filter(s => 
      s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="space-y-8">
      {/* Header Cards (Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Users size={28} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Effectif</p>
            <p className="text-2xl font-black text-slate-800">{filtered.length} étudiants</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
            <Target size={28} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Progression Moy.</p>
            <p className="text-2xl font-black text-slate-800">
                {filtered.length > 0 ? Math.round(filtered.reduce((acc, s) => acc + s.progress, 0) / filtered.length) : 0}%
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <GraduationCap size={28} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Evaluations</p>
            <p className="text-2xl font-black text-slate-800">
                {filtered.reduce((acc, s) => acc + s.evaluatedCount, 0)}/{filtered.reduce((acc, s) => acc + s.totalCount, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 overflow-x-auto pb-1 w-full md:w-auto">
          <button 
            onClick={() => setSelectedClass(null)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
              !selectedClass ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-purple-200"
            )}
          >
            Toutes les classes
          </button>
          {classes.map(c => (
            <button 
              key={c}
              onClick={() => setSelectedClass(c)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                selectedClass === c ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-purple-200"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Rechercher un étudiant..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500 text-sm transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Étudiant</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Classe</th>
                {type === "E5B" && (
                  <>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Backoffices (WP/PS)</th>
                  </>
                )}
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Progression {type}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-black text-xs">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm leading-none">{student.firstName} {student.lastName}</p>
                        <p className="text-slate-400 text-[10px] font-bold mt-1">ID: {student.id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black">
                      {student.classCode}
                    </span>
                  </td>
                  {type === "E5B" && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {editingUrl?.id === student.id && editingUrl?.field === "wp" ? (
                          <div className="flex items-center gap-1 bg-white border border-blue-200 rounded-lg p-1 pr-2">
                            <input 
                              type="text" 
                              value={editingUrl.value} 
                              onChange={(e) => setEditingUrl({ ...editingUrl, value: e.target.value })}
                              className="text-[10px] w-24 outline-none px-1"
                              autoFocus
                            />
                            <button onClick={handleUpdateUrl} disabled={isUpdating} className="text-green-600 hover:text-green-700">
                              {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            </button>
                            <button onClick={() => setEditingUrl(null)} className="text-slate-400 hover:text-slate-600">
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 group/item">
                            {student.wpUrl ? (
                              <a href={student.wpUrl} target="_blank" rel="noopener noreferrer" className="p-1 px-3 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-blue-100 border border-blue-100 transition-all">WP</a>
                            ) : (
                              <span className="p-1 px-3 bg-slate-50 text-slate-300 rounded-lg text-[9px] font-black border border-dashed border-slate-200">WP</span>
                            )}
                            <button 
                              onClick={() => setEditingUrl({ id: student.id, field: "wp", value: student.wpUrl || "" })}
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-all opacity-0 group-hover/item:opacity-100"
                            >
                              <Edit2 size={10} />
                            </button>
                          </div>
                        )}

                        {editingUrl?.id === student.id && editingUrl?.field === "ps" ? (
                          <div className="flex items-center gap-1 bg-white border border-pink-200 rounded-lg p-1 pr-2">
                            <input 
                              type="text" 
                              value={editingUrl.value} 
                              onChange={(e) => setEditingUrl({ ...editingUrl, value: e.target.value })}
                              className="text-[10px] w-24 outline-none px-1"
                              autoFocus
                            />
                            <button onClick={handleUpdateUrl} disabled={isUpdating} className="text-green-600 hover:text-green-700">
                              {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            </button>
                            <button onClick={() => setEditingUrl(null)} className="text-slate-400 hover:text-slate-600">
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 group/item">
                            {student.prestaUrl ? (
                              <a href={student.prestaUrl} target="_blank" rel="noopener noreferrer" className="p-1 px-3 bg-pink-50 text-pink-600 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-pink-100 border border-pink-100 transition-all">PS</a>
                            ) : (
                              <span className="p-1 px-3 bg-slate-50 text-slate-300 rounded-lg text-[9px] font-black border border-dashed border-slate-200">PS</span>
                            )}
                            <button 
                              onClick={() => setEditingUrl({ id: student.id, field: "ps", value: student.prestaUrl || "" })}
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-pink-500 hover:bg-pink-50 transition-all opacity-0 group-hover/item:opacity-100"
                            >
                              <Edit2 size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 min-w-[150px]">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                              "h-full rounded-full transition-all duration-500",
                              student.progress >= 70 ? "bg-green-500" : student.progress >= 30 ? "bg-purple-500" : "bg-slate-300"
                          )}
                          style={{ width: `${student.progress}%` }} 
                        />
                      </div>
                      <span className="text-xs font-black text-slate-700 w-8">{student.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/teacher/student/${student.id}?tab=${type === "E5B" ? "DIGITAL" : type}`}
                      className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 font-bold text-xs transition-colors group"
                    >
                      Évaluer {type === "E5B" ? "DIGITAL" : type}
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-slate-400 text-sm font-medium italic">Aucun étudiant trouvé pour cette recherche.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
