"use client";

import Link from "next/link";
import { GraduationCap, Users, ArrowRight, School } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-600/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-4xl relative z-10">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100">
              <School size={32} />
            </div>
            <span className="font-black text-3xl tracking-tight text-slate-900 uppercase">BTS NDRC</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Bienvenue sur votre plateforme</h1>
          <p className="text-slate-400 font-medium text-lg">Choisissez votre espace pour commencer</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 px-4">
          {/* Teacher Portral */}
          <Link 
            href="/teacher/login" 
            className="group bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 bg-purple-50 rounded-3xl flex items-center justify-center text-purple-600 mb-8 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500 shadow-inner group-hover:rotate-6">
              <Users size={44} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-3 uppercase tracking-tight">Espace Formateur</h2>
            <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8">
              Gérez vos classes, suivez les missions E5 et validez les compétences transversales de vos étudiants.
            </p>
            <div className="mt-auto flex items-center gap-2 text-purple-600 font-black text-xs uppercase tracking-widest bg-purple-50 px-6 py-3 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-all">
              Accéder <ArrowRight size={16} />
            </div>
          </Link>

          {/* Student Portal */}
          <Link 
            href="/student/login" 
            className="group bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner group-hover:-rotate-6">
              <GraduationCap size={44} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-3 uppercase tracking-tight">Espace Étudiant</h2>
            <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8">
              Validez vos compétences WordPress et PrestaShop, complétez votre Passeport Pro et préparez vos examens.
            </p>
            <div className="mt-auto flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest bg-blue-50 px-6 py-3 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
              Accéder <ArrowRight size={16} />
            </div>
          </Link>
        </div>

        <footer className="mt-16 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
          © 2024 BTS NDRC • Excellence & Digitalisation
        </footer>
      </div>
    </main>
  );
}
