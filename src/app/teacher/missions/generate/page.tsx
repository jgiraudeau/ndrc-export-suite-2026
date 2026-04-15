"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Target,
  Save,
  CheckCircle2,
  BookOpen,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { TeacherLayout } from "@/components/layout/TeacherLayout";
import { ALL_COMPETENCIES } from "@/data/competencies";
import { cn } from "@/lib/utils";

type Platform = "WORDPRESS" | "PRESTASHOP";
type Level = 1 | 2 | 3 | 4;

interface GeneratedMission {
  text: string;
  competencyIds: string[];
}

export default function TeacherMissionGeneratePage() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("WORDPRESS");
  const [selectedLevel, setSelectedLevel] = useState<Level>(2);
  const [selectedCategory, setSelectedCategory] = useState<string>("Toutes");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedContext, setSelectedContext] = useState("");
  const [customTitle, setCustomTitle] = useState("");

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [generatedMission, setGeneratedMission] = useState<GeneratedMission | null>(null);
  const [savedMissionId, setSavedMissionId] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const platformCompetencies = useMemo(
    () => ALL_COMPETENCIES.filter((c) => c.platform === selectedPlatform),
    [selectedPlatform]
  );
  const categories = useMemo(
    () => ["Toutes", ...Array.from(new Set(platformCompetencies.map((c) => c.category)))],
    [platformCompetencies]
  );

  const displayCompetencies = useMemo(
    () =>
      platformCompetencies.filter(
        (c) => selectedCategory === "Toutes" || c.category === selectedCategory
      ),
    [platformCompetencies, selectedCategory]
  );

  const resetSelectionForPlatform = (nextPlatform: Platform) => {
    setSelectedPlatform(nextPlatform);
    setSelectedIds([]);
    setSelectedCategory("Toutes");
    setGeneratedMission(null);
    setSavedMissionId(null);
    setJustSaved(false);
    setErrorMsg("");
  };

  const toggleCompetency = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleGenerate = async () => {
    if (selectedIds.length === 0) {
      setErrorMsg("Sélectionne au moins une compétence.");
      return;
    }

    setGenerating(true);
    setErrorMsg("");
    setGeneratedMission(null);
    setSavedMissionId(null);
    setJustSaved(false);

    try {
      const token = localStorage.getItem("ndrc_token");
      const res = await fetch("/api/missions/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          competencyIds: selectedIds,
          context: selectedContext,
          level: selectedLevel,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de génération");

      const missionText = data?.mission || data?.data?.mission;
      if (!missionText || typeof missionText !== "string") {
        throw new Error("Réponse IA invalide");
      }

      setGeneratedMission({
        text: missionText,
        competencyIds: [...selectedIds],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de la génération.";
      setErrorMsg(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveMission = async () => {
    if (!generatedMission) return;

    setSaving(true);
    setErrorMsg("");

    try {
      const token = localStorage.getItem("ndrc_token");
      const fallbackTitle = `Épreuve E5B ${selectedPlatform} Niv.${selectedLevel} — ${new Date().toLocaleDateString(
        "fr-FR"
      )}`;
      const title = customTitle.trim() || fallbackTitle;

      const res = await fetch("/api/missions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title,
          content: generatedMission.text,
          platform: selectedPlatform,
          level: selectedLevel,
          competencyIds: generatedMission.competencyIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'enregistrement");

      const missionId = data?.id || data?.data?.id || null;
      setSavedMissionId(missionId);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'enregistrement.";
      setErrorMsg(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <TeacherLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <Link
              href="/teacher/missions"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-purple-600 font-bold text-sm transition-colors"
            >
              <ArrowLeft size={16} /> Retour aux épreuves E5B
            </Link>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Générer une <span className="text-purple-600">Épreuve E5B</span>
            </h1>
            <p className="text-slate-500 font-medium">
              Crée un sujet à partir des compétences sélectionnées, puis enregistre-le dans la bibliothèque des missions.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-100 text-purple-700 rounded-full">
            <Sparkles size={14} />
            <span className="text-[10px] font-black uppercase tracking-wider">Génération IA</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          <section className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">1. Plateforme</label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => resetSelectionForPlatform("WORDPRESS")}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors",
                    selectedPlatform === "WORDPRESS" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
                  )}
                >
                  WordPress
                </button>
                <button
                  onClick={() => resetSelectionForPlatform("PRESTASHOP")}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors",
                    selectedPlatform === "PRESTASHOP" ? "bg-white text-pink-600 shadow-sm" : "text-slate-500"
                  )}
                >
                  PrestaShop
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">2. Niveau</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 1, label: "Découverte" },
                  { value: 2, label: "Construction" },
                  { value: 3, label: "Gestion" },
                  { value: 4, label: "Expertise" },
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setSelectedLevel(level.value as Level)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      selectedLevel === level.value
                        ? "bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="font-bold text-sm text-slate-800">Niveau {level.value}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">{level.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-slate-700">3. Compétences</label>
                <span className="text-xs font-bold text-slate-400 p-1 bg-slate-100 rounded-md">
                  {selectedIds.length} sélectionnées
                </span>
              </div>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-700 mb-3"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {displayCompetencies.map((competency) => {
                  const isSelected = selectedIds.includes(competency.id);
                  return (
                    <div
                      key={competency.id}
                      onClick={() => toggleCompetency(competency.id)}
                      className={cn(
                        "p-3 rounded-xl border cursor-pointer transition-all flex gap-3 select-none",
                        isSelected
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                          : "bg-white border-slate-200 hover:border-indigo-300 text-slate-700"
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border",
                          isSelected ? "bg-white border-white text-indigo-600" : "border-slate-300"
                        )}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                      </div>
                      <span className="text-xs font-medium leading-relaxed">{competency.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  4. Contexte d&apos;entreprise <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={selectedContext}
                  onChange={(e) => setSelectedContext(e.target.value)}
                  placeholder="Ex: Boutique de sneakers, Agence web..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  5. Titre de l&apos;épreuve <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Ex: E5B WordPress - SEO Local Niveau 3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            {errorMsg && <p className="text-sm text-red-500 font-bold p-3 bg-red-50 rounded-xl">{errorMsg}</p>}

            <button
              onClick={handleGenerate}
              disabled={generating || selectedIds.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Préparation de la mission...
                </>
              ) : (
                <>
                  <Target size={18} /> Générer le sujet <Sparkles size={14} />
                </>
              )}
            </button>
          </section>

          <section className="space-y-4">
            {!generatedMission && (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-14 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <BookOpen size={28} />
                </div>
                <h3 className="text-lg font-black text-slate-700">Aperçu du sujet E5B</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Sélectionne les compétences, puis clique sur &quot;Générer le sujet&quot;.
                </p>
              </div>
            )}

            {generatedMission && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} />
                    <span className="text-xs font-black uppercase tracking-wider">Sujet généré</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                    {generatedMission.competencyIds.length} compétences
                  </span>
                </div>

                <div className="p-6 prose prose-sm max-w-none">
                  <ReactMarkdown>{generatedMission.text}</ReactMarkdown>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-2">
                  <button
                    onClick={handleSaveMission}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Enregistrer l&apos;épreuve
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={generating ? "animate-spin" : ""} />
                    Régénérer
                  </button>
                </div>

                {(justSaved || savedMissionId) && (
                  <div className="px-6 py-4 border-t border-emerald-100 bg-emerald-50 flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 text-emerald-700 text-sm font-bold">
                      <CheckCircle2 size={16} /> Épreuve enregistrée.
                    </div>
                    {savedMissionId && (
                      <Link
                        href={`/teacher/missions/${savedMissionId}`}
                        className="inline-flex items-center gap-1 text-sm font-bold text-emerald-800 hover:text-emerald-900"
                      >
                        Ouvrir le détail <ChevronRight size={14} />
                      </Link>
                    )}
                    <Link
                      href="/teacher/missions"
                      className="inline-flex items-center gap-1 text-sm font-bold text-emerald-800 hover:text-emerald-900"
                    >
                      Retour aux épreuves <ChevronRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </TeacherLayout>
  );
}
