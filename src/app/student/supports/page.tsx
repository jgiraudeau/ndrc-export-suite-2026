"use client";

import { useEffect, useState } from "react";
import { BookOpen, Download, FileText, RefreshCw, X, FileDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { PDFService } from "@/lib/pdf-service";
import { DOCXService } from "@/lib/docx-service";
import { DOCUMENT_TYPE_LABELS, DocumentType } from "@/lib/ai/prompts";

interface Support {
    id: string;
    title: string;
    documentType: string;
    theme: string | null;
    createdAt: string;
}

interface SupportFull extends Support { content: string; }

export default function StudentSupports() {
    const [supports, setSupports] = useState<Support[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<SupportFull | null>(null);
    const [loadingDoc, setLoadingDoc] = useState(false);

    useEffect(() => {
        fetch("/api/student/supports")
            .then((r) => r.json())
            .then((d) => setSupports(d.documents ?? []))
            .finally(() => setLoading(false));
    }, []);

    const openDoc = async (id: string) => {
        setLoadingDoc(true);
        try {
            const res = await fetch(`/api/student/supports/${id}`);
            const data = await res.json();
            setSelected(data.document);
        } finally {
            setLoadingDoc(false);
        }
    };

    const grouped = supports.reduce<Record<string, Support[]>>((acc, doc) => {
        const key = doc.theme || "Sans thème";
        (acc[key] ??= []).push(doc);
        return acc;
    }, {});

    return (
        <>
        <div className="p-6 max-w-4xl mx-auto space-y-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                            <BookOpen size={18} />
                        </div>
                        <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Supports de cours</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mes <span className="text-indigo-600">Documents</span></h1>
                    <p className="text-slate-400 mt-1 font-medium text-sm">Documents partagés par votre formateur pour votre classe.</p>
                </div>

                {loading && (
                    <div className="flex justify-center py-20">
                        <RefreshCw className="animate-spin text-indigo-400" size={32} />
                    </div>
                )}

                {!loading && supports.length === 0 && (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
                        <FileText size={40} className="text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold">Aucun document partagé pour le moment.</p>
                    </div>
                )}

                {!loading && Object.entries(grouped).map(([theme, docs]) => (
                    <div key={theme} className="space-y-3">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">{theme}</h2>
                        <div className="grid gap-3">
                            {docs.map((doc) => (
                                <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{doc.title}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                            {DOCUMENT_TYPE_LABELS[doc.documentType as DocumentType] ?? doc.documentType}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => openDoc(doc.id)}
                                        disabled={loadingDoc}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-black text-xs rounded-xl hover:bg-indigo-100 transition-all"
                                    >
                                        <Download size={14} />
                                        Ouvrir
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
        </div>

            {/* Modal lecture + téléchargement */}
            {selected && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="font-black text-slate-800">{selected.title}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    {DOCUMENT_TYPE_LABELS[selected.documentType as DocumentType] ?? selected.documentType}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => PDFService.generateAISupport({ title: selected.title, filename: selected.title }, selected.content, "")}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-black text-xs rounded-xl hover:bg-slate-200 transition-all"
                                >
                                    <Download size={14} /> PDF
                                </button>
                                <button
                                    onClick={() => DOCXService.generateAISupport({ title: selected.title, filename: selected.title }, selected.content, "")}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-black text-xs rounded-xl hover:bg-indigo-700 transition-all"
                                >
                                    <FileDown size={14} /> WORD
                                </button>
                                <button onClick={() => setSelected(null)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-y-auto p-8 prose prose-slate max-w-none text-slate-700 leading-relaxed font-medium">
                            <ReactMarkdown>{selected.content}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
