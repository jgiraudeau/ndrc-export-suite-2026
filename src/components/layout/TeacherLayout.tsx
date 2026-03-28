"use client";

import { Sidebar } from "./Sidebar";

export function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50/50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
