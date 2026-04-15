"use client";

import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BarChart3,
  Settings,
  GraduationCap,
  LogOut,
  Sparkles,
  Library,
  Globe,
  Briefcase,
  Bot,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function TeacherSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const whmManagerUrl =
    process.env.NEXT_PUBLIC_WHM_MANAGER_URL || "https://whm-manager-production.up.railway.app";

  const handleLogout = () => {
    localStorage.removeItem("ndrc_token");
    router.push("/teacher/login");
  };

  const menuItems = [
    { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/teacher/students", label: "Mes Étudiants", icon: Users },
    { href: "/teacher/evaluations/e4", label: "Grilles E4", icon: ClipboardCheck },
    { href: "/teacher/evaluations/e6", label: "Grilles E6", icon: BarChart3 },
    { href: "/teacher/missions", label: "Missions E5B", icon: Globe },
    { href: "/teacher/portfolio", label: "Passeport Pro", icon: Briefcase },
    { href: "/teacher/suivi-ia", label: "Suivi IA", icon: Bot },
    { href: "/teacher/generate", label: "Générateur IA", icon: Sparkles },
    { href: "/teacher/library", label: "Mes Documents", icon: Library },
    { href: "/teacher/settings", label: "Paramètres", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col p-6 space-y-8 h-screen shrink-0 overflow-y-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <GraduationCap size={22} />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-800 leading-none">BTS NDRC</h1>
          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">Espace Formateur</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all",
                isActive 
                  ? "bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-50" 
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <a
        href={whmManagerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors font-bold text-sm"
      >
        <ExternalLink size={18} />
        <span>WHM Manager</span>
      </a>

      <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-bold text-sm mt-auto"
      >
        <LogOut size={18} />
        <span>Déconnexion</span>
      </button>
    </aside>
  );
}
