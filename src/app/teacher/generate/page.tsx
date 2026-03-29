"use client";

import { useState } from "react";
import { 
  Sparkles, 
  FileText, 
  Send, 
  Download, 
  RefreshCw, 
  Wand2, 
  Target, 
  MessageSquare, 
  X,
  History,
  Clock,
  Layers,
  GraduationCap,
  FileDown,
  Layout,
  Table as TableIcon,
  HelpCircle
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";
import { TeacherLayout } from "@/components/layout/TeacherLayout";
import { DOCUMENT_TYPE_LABELS, DocumentType } from "@/lib/ai/prompts";
import { PDFService } from "@/lib/pdf-service";
import { DOCXService } from "@/lib/docx-service";

export default function TeacherGenerate() {
    const [docType, setDocType] = useState<DocumentType>("dossier_prof");
    const [topic, setTopic] = useState("");
    const [track, setTrack] = useState("NDRC");
    const [durationHours, setDurationHours] = useState(4);
    const [targetBlock, setTargetBlock] = useState("");
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState<string | null>(null);
    const [generatedContent, setGeneratedContent] = useState("");
    const [generatedFilename, setGeneratedFilename] = useState("");
    const [refinement, setRefinement] = useState("");

    const generateDocument = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/generate/course", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    documentType: docType, 
                    topic, 
                    track,
                    durationHours,
                    targetBlock
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            
            setGeneratedContent(data.content);
            setGeneratedFilename(data.filename || "");
        } catch (error) {
            console.error("Generation failed", error);
            alert("Erreur lors de la génération. Vérifiez votre connexion.");
        } finally {
            setLoading(false);
        }
    };

    const refineDocument = async () => {
        if (!refinement) return;
        setLoading(true);
        try {
            const res = await fetch("/api/generate/refine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    currentContent: generatedContent, 
                    instruction: refinement,
                    track 
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            
            setGeneratedContent(data.content);
            setRefinement("");
        } catch (error) {
            console.error("Refinement failed", error);
            alert("Erreur lors de l'affinage.");
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = () => {
        PDFService.generateAISupport(
            { title: topic, filename: generatedFilename },
            generatedContent,
            track,
            { orientation: docType === "planning_annuel" ? "landscape" : "portrait" }
        );
    };

    const downloadDOCX = async () => {
        DOCXService.generateAISupport(
            { title: topic, filename: generatedFilename },
            generatedContent,
            track
        );
    };

    const exportQuiz = async (format: "gift" | "wooclap" | "google") => {
        setExporting(format);
        try {
            const res = await fetch("/api/export/quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: generatedContent, format })
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `quiz_${format}_${topic.replace(/\s+/g, "_")}.${format === "wooclap" ? "xlsx" : format === "google" ? "csv" : "txt"}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                throw new Error("Export failed");
            }
        } catch (error) {
            alert("Erreur lors de l'exportation du quiz.");
        } finally {
            setExporting(null);
        }
    };

    return (
        <TeacherLayout>
            <div className="p-8 max-w-7xl mx-auto space-y-10">
                <div className="flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <div className="bg-purple-600 p-1.5 rounded-lg text-white">
                                <Wand2 size={20} />
                             </div>
                             <span className="text-xs font-black text-purple-600 uppercase tracking-widest">Assistant Créateur Pro</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Générateur <span className="text-purple-600">Pédagogique</span></h1>
                        <p className="text-slate-500 mt-2 font-medium italic">BTS NDRC — Créez vos supports de cours, quiz et sujets d&apos;examen au format officiel.</p>
                    </div>
                    <div className="hidden lg:flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 mb-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Moteur Gemini 2.0 Flash</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Exports : PDF, WORD, GIFT, WOOCLAP</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    {/* Colonne de gauche : Paramètres */}
                    <div className="xl:col-span-4 space-y-8">
                        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-100 space-y-8">
                            <h2 className="font-black text-slate-800 flex items-center gap-3 text-xl">
                                <History size={22} className="text-purple-600" />
                                Configuration
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                        <FileText size={14} /> Type de document
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setDocType(type)}
                                                className={`flex items-center px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${
                                                    docType === type 
                                                    ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-100" 
                                                    : "bg-slate-50 border-slate-100 text-slate-600 hover:border-purple-200 hover:bg-white"
                                                }`}
                                            >
                                                {DOCUMENT_TYPE_LABELS[type]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <div>
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                            <Target size={14} /> Thématique / Sujet principal
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ex: La négociation commerciale B2B..."
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-purple-50 focus:border-purple-500 transition-all placeholder:text-slate-300"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                                <GraduationCap size={14} /> Cursus
                                            </label>
                                            <select
                                                value={track}
                                                onChange={(e) => setTrack(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-purple-500 transition-all"
                                            >
                                                <option value="NDRC">BTS NDRC</option>
                                                <option value="MCO">BTS MCO</option>
                                                <option value="CJN">BTS CJN</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                                <Clock size={14} /> Durée (H)
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={20}
                                                value={durationHours || ""}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    setDurationHours(isNaN(val) ? 0 : val);
                                                }}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-purple-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                            <Layers size={14} /> Bloc de compétences (Optionnel)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Bloc 1, E4..."
                                            value={targetBlock}
                                            onChange={(e) => setTargetBlock(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={generateDocument}
                                    disabled={loading || !topic}
                                    className="w-full bg-purple-600 text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-purple-200 hover:bg-purple-700 hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {loading ? <RefreshCw className="animate-spin" size={24} /> : <Sparkles size={24} />}
                                    {loading ? "Génération en cours..." : "Générer le support"}
                                </button>
                            </div>
                        </div>

                        {/* Banner Coaching */}
                        <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-4 border border-slate-800">
                             <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full border border-purple-800/50">
                                <Target size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Conseil Pro</span>
                             </div>
                             <p className="text-sm font-medium text-slate-300 leading-relaxed">
                                Les sujets <span className="text-white font-bold italic">E4 et E5B</span> sont générés au format officiel. Utilisez les boutons d&apos;exportation spécialisés pour Moodle ou Wooclap.
                             </p>
                        </div>
                    </div>

                    {/* Colonne de droite : Aperçu / Affinage */}
                    <div className="xl:col-span-8 space-y-8">
                        {loading && !generatedContent && (
                            <div className="bg-white border border-slate-100 rounded-[40px] p-24 flex flex-col items-center justify-center text-center shadow-xl">
                                <div className="relative w-24 h-24 mb-8">
                                    <div className="absolute inset-0 bg-purple-100 rounded-full animate-ping opacity-25" />
                                    <div className="relative w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 animate-pulse">
                                        <Sparkles size={48} />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-black text-slate-900">L&apos;IA prépare votre support...</h3>
                                <p className="text-slate-500 mt-4 max-w-sm font-bold text-lg leading-snug">Nous structurons les compétences et rédigeons le contenu pédagogique.</p>
                                <div className="mt-10 flex gap-2">
                                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}

                        {!loading && !generatedContent && (
                            <div className="bg-slate-50 border-4 border-dashed border-slate-200 rounded-[40px] p-32 flex flex-col items-center justify-center text-center opacity-70">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
                                    <FileText size={40} />
                                </div>
                                <p className="text-slate-400 font-black text-xl italic">Prêt à créer votre prochain cours ?</p>
                                <p className="text-slate-300 font-bold mt-2">Utilisez les paramètres à gauche pour commencer.</p>
                            </div>
                        )}

                        {generatedContent && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
                                    <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm shadow-green-200" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Aperçu du document généré</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {docType === "quiz" && (
                                                <div className="flex gap-2 mr-4 border-r pr-4 border-slate-200">
                                                    <button 
                                                        onClick={() => exportQuiz("gift")} 
                                                        disabled={!!exporting}
                                                        className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 font-black text-[10px] border border-orange-100 rounded-xl hover:bg-orange-100 transition-all shadow-sm"
                                                    >
                                                        {exporting === "gift" ? <RefreshCw className="animate-spin" size={12} /> : <HelpCircle size={12} />}
                                                        GIFT (MOODLE)
                                                    </button>
                                                    <button 
                                                        onClick={() => exportQuiz("wooclap")} 
                                                        disabled={!!exporting}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-black text-[10px] border border-blue-100 rounded-xl hover:bg-blue-100 transition-all shadow-sm"
                                                    >
                                                        {exporting === "wooclap" ? <RefreshCw className="animate-spin" size={12} /> : <TableIcon size={12} />}
                                                        WOOCLAP (EXCEL)
                                                    </button>
                                                </div>
                                            )}
                                            
                                            <button 
                                                onClick={downloadPDF} 
                                                className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 font-black text-xs border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-purple-300 hover:text-purple-600 transition-all shadow-sm"
                                                title="Télécharger en PDF"
                                            >
                                                <Download size={16} />
                                                PDF
                                            </button>
                                            <button 
                                                onClick={downloadDOCX} 
                                                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-black text-xs rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                                                title="Télécharger en Word"
                                            >
                                                <FileDown size={16} />
                                                WORD (.DOCX)
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if(confirm("Effacer ce contenu ?")) setGeneratedContent("");
                                                }} 
                                                className="p-2.5 text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="p-12 prose prose-slate max-w-none font-medium text-slate-700 leading-relaxed max-h-[800px] overflow-y-auto custom-scrollbar bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] [background-size:20px_20px]">
                                        <ReactMarkdown>{generatedContent}</ReactMarkdown>
                                    </div>
                                </div>
                                {/* Outil d'Affinage par Chat */}
                                <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl shadow-purple-900/20 space-y-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-purple-600/20 transition-all duration-1000" />
                                    
                                    <div className="flex items-center gap-3 text-sm font-black text-white uppercase tracking-widest relative z-10">
                                        <div className="bg-purple-600 p-2 rounded-xl">
                                            <MessageSquare size={18} />
                                        </div>
                                        Affinage par IA
                                    </div>
                                    
                                    <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-2xl relative z-10">
                                        Demandez n&apos;importe quoi : <span className="text-purple-400 font-black italic">&quot;Ajoute un tableau comparatif&quot;</span>, <span className="text-purple-400 font-black italic">&quot;Simplifie le langage&quot;</span>, ou <span className="text-purple-400 font-black italic">&quot;Précise le barème de l&apos;activité 2&quot;</span>.
                                    </p>

                                    <div className="flex gap-3 relative z-10">
                                        <input
                                            type="text"
                                            placeholder="Tapez votre instruction ici..."
                                            className="flex-1 bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-bold placeholder:text-slate-600"
                                            value={refinement}
                                            onChange={(e) => setRefinement(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && refineDocument()}
                                        />
                                        <button
                                            onClick={refineDocument}
                                            disabled={loading || !refinement}
                                            className="bg-white text-slate-900 px-8 rounded-2xl font-black text-xs hover:bg-purple-500 hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-900 transition-all active:scale-90 flex items-center justify-center gap-2"
                                        >
                                            {loading ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
                                            APPLIQUER
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </TeacherLayout>
    );
}
