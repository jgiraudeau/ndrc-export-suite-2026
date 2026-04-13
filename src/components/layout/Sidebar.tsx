"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, 
  LayoutDashboard, 
  Sparkles, 
  Target, 
  GraduationCap, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  MessageSquare
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Tableau de Bord", href: "/teacher" },
  { icon: Users, label: "Mes Classes", href: "/teacher/students" },
  { icon: GraduationCap, label: "Épreuve E4", href: "/teacher/evaluations/e4" },
  { icon: Target, label: "Épreuve E5B", href: "/teacher/missions" },
  { icon: GraduationCap, label: "Épreuve E6", href: "/teacher/evaluations/e6" },
  { icon: Briefcase, label: "Passeport Pro", href: "/teacher/portfolio" },
  { icon: MessageSquare, label: "Suivi IA", href: "/teacher/suivi-ia" },
  { icon: Sparkles, label: "Générateur IA", href: "/teacher/generate" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("ndrc_token");
    localStorage.removeItem("ndrc_user");
    window.location.href = "/";
  };

  return (
    <aside 
      className={cn(
        "h-screen bg-white border-r border-slate-200 transition-all duration-300 flex flex-col sticky top-0 bg-white z-50",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header / Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg shadow-purple-200">
              N
            </div>
            <span className="font-black text-slate-800 tracking-tight">NDRC <span className="text-purple-600">Skills</span></span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-black text-lg mx-auto shadow-lg shadow-purple-200">
            N
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl font-bold transition-all group",
                isActive 
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-100" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-purple-600"
              )}
            >
              <item.icon size={22} className={cn("min-shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-purple-600")} />
              {!isCollapsed && <span className="text-sm truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Toggle & Logout */}
      <div className="p-4 border-t border-slate-100 space-y-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors font-bold"
        >
          {isCollapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
          {!isCollapsed && <span className="text-sm">Réduire</span>}
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors font-bold"
        >
          <LogOut size={22} className="min-shrink-0" />
          {!isCollapsed && <span className="text-sm">Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
