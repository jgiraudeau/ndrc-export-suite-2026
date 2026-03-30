"use client";

import { useEffect, useState } from "react";
import {
  Library,
  FileText,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  Search,
  X,
  ArrowLeft,
  FileDown,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { TeacherLayout } from "@/components/layout/TeacherLayout";
import { DOCUMENT_TYPE_LABELS, DocumentType } from "@/lib/ai/prompts";
import { PDFService } from "@/lib/pdf-service";
import { DOCXService } from "@/lib/docx-service";

interface SavedDoc {
  id: string;
  title: string;
  documentType: string;
  createdAt: string;
}

interface SavedDocFull extends SavedDoc {
  content: string;
}

export default function LibraryPage() {
  const [documents, setDocuments] = useState<SavedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SavedDocFull | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate/documents");
      const data = await res.json();
      setDocuments(data.documents ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const openDocument = async (id: string) => {
    setLoadingDoc(true);
    try {
      const res = await fetch(`/api/generate/documents/${id}`);
      const data = await res.json();
      setSelected(data.document);
    } finally {
      setLoadingDoc(false);
    }
  };

  const deleteDocument = async (id: string) => {
    if (!confirm("Supprimer ce document définitivement ?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/generate/documents?id=${id}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (selected?.id === id) setSelected(null);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.documentType.toLowerCase().includes(search.toLowerCase())
  );

  const getTypeLabel = (type: string) =>
    DOCUMENT_TYPE_LABELS[type as DocumentType] ?? type;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <TeacherLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                <Library size={20} />
              </div>
              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                Bibliothèque
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Mes <span className="text-indigo-600">Documents</span>
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              {documents.length} document{documents.length !== 1 ? "s" : ""} sauvegardé{documents.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Liste des documents */}
          <div className="xl:col-span-4 space-y-4">
            {/* Recherche */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Liste */}
            <div className="space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <RefreshCw className="animate-spin mr-2" size={18} />
                  <span className="font-bold text-sm">Chargement...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center">
                  <FileText size={40} className="mb-3 opacity-30" />
                  <p className="font-black">Aucun document</p>
                  <p className="text-xs font-bold mt-1">
                    {search
                      ? "Aucun résultat pour cette recherche."
                      : "Générez vos premiers supports depuis le Générateur IA."}
                  </p>
                </div>
              ) : (
                filtered.map((doc) => (
                  <div
                    key={doc.id}
                    className={`group bg-white border rounded-2xl p-4 cursor-pointer transition-all ${
                      selected?.id === doc.id
                        ? "border-indigo-400 shadow-lg shadow-indigo-50 ring-2 ring-indigo-100"
                        : "border-slate-200 hover:border-indigo-200 hover:shadow-md"
                    }`}
                    onClick={() => openDocument(doc.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 text-sm truncate">
                          {doc.title}
                        </p>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mt-1">
                          {getTypeLabel(doc.documentType)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">
                          {formatDate(doc.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDocument(doc.id);
                        }}
                        disabled={deletingId === doc.id}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Supprimer"
                      >
                        {deletingId === doc.id ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Aperçu du document sélectionné */}
          <div className="xl:col-span-8">
            {loadingDoc ? (
              <div className="bg-white border border-slate-200 rounded-[40px] p-32 flex flex-col items-center justify-center text-center shadow-xl">
                <RefreshCw className="animate-spin text-indigo-400 mb-4" size={32} />
                <p className="font-black text-slate-500">Chargement du document...</p>
              </div>
            ) : selected ? (
              <div className="bg-white border border-slate-200 rounded-[40px] shadow-2xl shadow-slate-100 overflow-hidden">
                {/* Toolbar */}
                <div className="px-8 py-5 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
                  <div>
                    <p className="font-black text-slate-800 text-sm">{selected.title}</p>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mt-0.5">
                      {getTypeLabel(selected.documentType)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        PDFService.generateAISupport(
                          { title: selected.title, filename: selected.title },
                          selected.content,
                          "NDRC"
                        )
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-black text-xs border border-slate-200 rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
                    >
                      <Download size={14} />
                      PDF
                    </button>
                    <button
                      onClick={() =>
                        DOCXService.generateAISupport(
                          { title: selected.title, filename: selected.title },
                          selected.content,
                          "NDRC"
                        )
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-black text-xs rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      <FileDown size={14} />
                      WORD
                    </button>
                    <button
                      onClick={() => setSelected(null)}
                      className="p-2 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-10 prose prose-slate max-w-none font-medium text-slate-700 leading-relaxed max-h-[calc(100vh-280px)] overflow-y-auto">
                  <ReactMarkdown>{selected.content}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border-4 border-dashed border-slate-200 rounded-[40px] p-32 flex flex-col items-center justify-center text-center opacity-60">
                <Eye size={48} className="text-slate-300 mb-4" />
                <p className="text-slate-400 font-black text-xl">
                  Sélectionnez un document
                </p>
                <p className="text-slate-300 font-bold mt-2 text-sm">
                  Cliquez sur un document à gauche pour le visualiser ici.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
