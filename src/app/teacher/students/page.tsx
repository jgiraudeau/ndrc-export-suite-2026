"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TeacherLayout } from "@/components/layout/TeacherLayout";
import { 
    Upload, 
    Download, 
    RefreshCw, 
    Search, 
    ChevronDown, 
    ChevronUp, 
    CheckCircle2, 
    XCircle, 
    Globe, 
    Save, 
    MessageSquarePlus, 
    Trash2, 
    Send,
    FileSpreadsheet
} from "lucide-react";
import {
    apiGetStudents, apiImportStudents, apiAddComment, apiDeleteComment, apiUpdateStudent,
    type StudentWithProgress
} from "@/lib/api-client";
import { ALL_COMPETENCIES, E4_COMPETENCIES, E6_COMPETENCIES, WORDPRESS_COMPETENCIES, PRESTASHOP_COMPETENCIES } from "@/data/competencies";

const TOTAL_COMPETENCIES = ALL_COMPETENCIES.length;
const TOTAL_E4 = E4_COMPETENCIES.length;
const TOTAL_E6 = E6_COMPETENCIES.length;
const TOTAL_DIGITAL = WORDPRESS_COMPETENCIES.length + PRESTASHOP_COMPETENCIES.length;

type ImportStudentRow = {
    firstName: string;
    lastName: string;
    classCode: string;
    password: string;
    wpUrl?: string;
    prestaUrl?: string;
};

type ImportField = keyof ImportStudentRow;
type StudentCompetency = StudentWithProgress["competencies"][number];
type StudentWithComputedProgress = StudentWithProgress & {
    progress: number;
    e4Progress: number;
    e6Progress: number;
    digitalProgress: number;
};

const IMPORT_HEADER_ALIASES: Record<ImportField, string[]> = {
    firstName: ["prenom", "prénom", "firstname", "first_name", "first name"],
    lastName: ["nom", "lastname", "last_name", "last name"],
    classCode: ["codeclasse", "classe", "classcode", "class_code", "class", "groupe"],
    password: ["motdepasse", "mot_de_passe", "password", "pin", "code"],
    wpUrl: ["wordpress", "wordpressurl", "wpurl", "urlwordpress", "url_wp", "sitewordpress"],
    prestaUrl: ["prestashop", "prestashopurl", "prestaurl", "urlprestashop", "url_presta", "siteprestashop"],
};

function ProgressBar({ value, color = "bg-purple-500" }: { value: number; color?: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
            </div>
            <span className="text-sm font-bold text-slate-700 w-9 text-right">{value}%</span>
        </div>
    );
}

function normalizeHeader(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

function getHeaderIndexMap(cells: string[]): Partial<Record<ImportField, number>> {
    const map: Partial<Record<ImportField, number>> = {};
    cells.forEach((cell, index) => {
        const normalized = normalizeHeader(cell);
        (Object.keys(IMPORT_HEADER_ALIASES) as ImportField[]).forEach((field) => {
            if (map[field] !== undefined) return;
            const aliases = IMPORT_HEADER_ALIASES[field].map(normalizeHeader);
            if (aliases.includes(normalized)) {
                map[field] = index;
            }
        });
    });
    return map;
}

function readField(cells: string[], index: number): string {
    if (index < 0 || index >= cells.length) return "";
    return String(cells[index] || "").trim();
}

function readOptionalField(cells: string[], index: number | undefined): string | undefined {
    if (index === undefined || index < 0 || index >= cells.length) return undefined;
    return String(cells[index] || "").trim();
}

function parseTabularRows(rows: string[][]): ImportStudentRow[] {
    if (rows.length === 0) return [];

    const firstRow = rows[0].map((cell) => String(cell || "").trim());
    const headerMap = getHeaderIndexMap(firstRow);
    const hasHeader =
        headerMap.lastName !== undefined ||
        headerMap.firstName !== undefined ||
        headerMap.classCode !== undefined;

    const startIndex = hasHeader ? 1 : 0;
    const parsed: ImportStudentRow[] = [];

    for (let i = startIndex; i < rows.length; i++) {
        const cells = rows[i].map((cell) => String(cell || "").trim());
        if (cells.every((cell) => cell.length === 0)) continue;

        const lastName = hasHeader
            ? readField(cells, headerMap.lastName ?? 0)
            : readField(cells, 0);
        const firstName = hasHeader
            ? readField(cells, headerMap.firstName ?? 1)
            : readField(cells, 1);
        const classCode = (hasHeader
            ? readField(cells, headerMap.classCode ?? 2)
            : readField(cells, 2)
        ).toUpperCase();

        const passwordRaw = hasHeader
            ? readOptionalField(cells, headerMap.password)
            : readOptionalField(cells, 3);
        const password = passwordRaw && passwordRaw.length > 0
            ? passwordRaw
            : Math.random().toString(36).slice(-6);

        if (!lastName || !firstName || !classCode) continue;

        const wpUrl = hasHeader
            ? readOptionalField(cells, headerMap.wpUrl)
            : readOptionalField(cells, 4);
        const prestaUrl = hasHeader
            ? readOptionalField(cells, headerMap.prestaUrl)
            : readOptionalField(cells, 5);

        const row: ImportStudentRow = { firstName, lastName, classCode, password };
        if (wpUrl !== undefined) row.wpUrl = wpUrl;
        if (prestaUrl !== undefined) row.prestaUrl = prestaUrl;

        parsed.push(row);
    }

    return parsed;
}

function parseCSV(text: string): ImportStudentRow[] {
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length === 0) return [];

    const sep = (lines[0] || "").includes(";") ? ";" : ",";
    const rows = lines.map((line) => line.split(sep).map((cell) => cell.trim()));
    return parseTabularRows(rows);
}

async function parseExcel(file: File): Promise<ImportStudentRow[]> {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];

    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
        header: 1,
        defval: "",
    });
    const rows = rawRows.map((row) => row.map((cell) => String(cell ?? "").trim()));
    return parseTabularRows(rows);
}

export default function TeacherDashboard() {
    const [students, setStudents] = useState<StudentWithProgress[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [dragging, setDragging] = useState(false);
    const [importStatus, setImportStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [wpInputs, setWpInputs] = useState<Record<string, string>>({});
    const [prestaInputs, setPrestaInputs] = useState<Record<string, string>>({});

    const router = useRouter();

    const handleUpdateUrls = async (studentId: string) => {
        const wpUrl = wpInputs[studentId] !== undefined ? wpInputs[studentId] : students.find(s => s.id === studentId)?.wpUrl;
        const prestaUrl = prestaInputs[studentId] !== undefined ? prestaInputs[studentId] : students.find(s => s.id === studentId)?.prestaUrl;

        const { error } = await apiUpdateStudent(studentId, { wpUrl: wpUrl || "", prestaUrl: prestaUrl || "" });
        if (!error) {
            setStudents(prev => prev.map(s => s.id === studentId ? { ...s, wpUrl: wpUrl || "", prestaUrl: prestaUrl || "" } : s));
            alert("Liens enregistrés avec succès !");
        } else {
            alert(error);
        }
    };

    const fetchStudents = useCallback(async () => {
        const { data, error } = await apiGetStudents();
        
        if (!error && data) {
            setStudents(data);
        } else if (error) {
            setImportStatus({ type: "error", message: error });
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("ndrc_token");
        if (!token) { router.push("/teacher/login"); return; }
        
        let cancelled = false;
        const loadInitialStudents = async () => {
            const { data, error } = await apiGetStudents();
            if (cancelled) return;

            if (!error && data) {
                setStudents(data);
            } else if (error) {
                setImportStatus({ type: "error", message: error });
            }
        };

        void loadInitialStudents();
        return () => { cancelled = true; };
    }, [router]);

    const downloadCsvTemplate = () => {
        const content = [
            "Nom;Prénom;CodeClasse;MotDePasse;WordPressURL;PrestaShopURL",
            "Dupont;Thomas;NDRC1;monmdp1;https://wp-thomas.exemple.fr;https://ps-thomas.exemple.fr/admin-dev",
            "Martin;Sophie;NDRC2;monmdp2;https://wp-sophie.exemple.fr;https://ps-sophie.exemple.fr/admin-dev",
        ].join("\n");
        const blob = new Blob(['\uFEFF' + content], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "modele_import_etudiants.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const processFile = async (file: File) => {
        const lowerName = file.name.toLowerCase();
        const isCsv = lowerName.endsWith(".csv");
        const isExcel = lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls");

        if (!isCsv && !isExcel) {
            setImportStatus({ type: "error", message: "Fichier invalide. Déposez un .csv, .xlsx ou .xls" });
            return;
        }

        let parsed: ImportStudentRow[] = [];
        if (isCsv) {
            const text = await file.text();
            parsed = parseCSV(text);
        } else {
            parsed = await parseExcel(file);
        }

        if (parsed.length === 0) {
            setImportStatus({ type: "error", message: "Aucun étudiant trouvé dans le fichier." });
            return;
        }
        const { data, error } = await apiImportStudents(parsed);
        if (error || !data) {
            setImportStatus({ type: "error", message: error || "Erreur lors de l'import." });
            return;
        }
        const identifiersList = data.createdStudents?.map(s => `${s.firstName} ${s.lastName} → ${s.identifier}`).join(", ") || "";
        setImportStatus({
            type: "success",
            message: `${data.stats.created} créé(s), ${data.stats.updated} mis à jour.${identifiersList ? ` Identifiants : ${identifiersList}` : ""}`
        });
        fetchStudents();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        e.target.value = "";
    };

    const sendComment = async (studentId: string) => {
        const text = commentInputs[studentId]?.trim();
        if (!text) return;
        const { data, error } = await apiAddComment(studentId, text);
        if (error || !data) return;
        setCommentInputs(prev => ({ ...prev, [studentId]: "" }));
        // Mettre à jour localement
        setStudents(prev => prev.map(s =>
            s.id === studentId
                ? { ...s, comments: [...s.comments, data] }
                : s
        ));
    };

    const deleteComment = async (studentId: string, commentId: string) => {
        await apiDeleteComment(commentId);
        setStudents(prev => prev.map(s =>
            s.id === studentId
                ? { ...s, comments: s.comments.filter(c => c.id !== commentId) }
                : s
        ));
    };

    // Dérive les classes depuis les étudiants
    const classes = Array.from(new Set(students.map(s => s.classCode))).sort();

    const filteredStudents: StudentWithComputedProgress[] = students
        .filter(s => (selectedClassId ? s.classCode === selectedClassId : true))
        .filter(s =>
            s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.lastName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map(s => {
            const e4Acquired = s.competencies.filter((c: StudentCompetency) => E4_COMPETENCIES.some(e => e.id === c.competencyId) && c.acquired).length;
            const e6Acquired = s.competencies.filter((c: StudentCompetency) => E6_COMPETENCIES.some(e => e.id === c.competencyId) && c.acquired).length;
            const digitalAcquired = s.competencies.filter((c: StudentCompetency) => (WORDPRESS_COMPETENCIES.some(w => w.id === c.competencyId) || PRESTASHOP_COMPETENCIES.some(p => p.id === c.competencyId)) && c.acquired).length;

            return {
                ...s,
                progress: TOTAL_COMPETENCIES > 0 ? Math.round((s.acquiredCount / TOTAL_COMPETENCIES) * 100) : 0,
                e4Progress: TOTAL_E4 > 0 ? Math.round((e4Acquired / TOTAL_E4) * 100) : 0,
                e6Progress: TOTAL_E6 > 0 ? Math.round((e6Acquired / TOTAL_E6) * 100) : 0,
                digitalProgress: TOTAL_DIGITAL > 0 ? Math.round((digitalAcquired / TOTAL_DIGITAL) * 100) : 0,
            };
        });

    return (
        <TeacherLayout>
            <div className="p-6 max-w-5xl mx-auto space-y-8">
                {/* Section d'import et stats */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Mes Étudiants</h1>
                        <p className="text-slate-500 text-sm">Gérez vos classes et suivez les compétences digitales.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchStudents} className="p-2.5 text-slate-400 hover:text-purple-600 transition-colors bg-white border border-slate-200 rounded-xl" title="Actualiser">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                {/* Import listing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <label htmlFor="csv-input">
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer
                                    ${dragging ? "border-purple-500 bg-purple-50" : "border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/30"}`}
                                style={{ minHeight: "180px" }}
                            >
                                <Upload size={36} className={dragging ? "text-purple-500" : "text-slate-300"} />
                                <div>
                                    <p className="font-bold text-slate-700">{dragging ? "Déposez ici !" : "Glissez votre listing CSV/Excel"}</p>
                                    <p className="text-slate-400 text-sm mt-1">ou <span className="text-purple-600 font-semibold underline">cliquez pour parcourir</span> (.csv, .xlsx)</p>
                                </div>
                            </div>
                        </label>
                        <input id="csv-input" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileInput} className="hidden" />
                        {importStatus && (
                            <div className={`mt-3 px-4 py-3 rounded-xl flex items-center gap-3 font-medium text-sm ${importStatus.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                {importStatus.type === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                                {importStatus.message}
                                <button onClick={() => setImportStatus(null)} className="ml-auto opacity-60 hover:opacity-100">✕</button>
                            </div>
                        )}
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-slate-700 mb-1 flex items-center gap-2">
                                <FileSpreadsheet size={18} className="text-purple-500" /> Modèle d&apos;import
                            </h3>
                            <p className="text-slate-400 text-xs mb-4">Format attendu</p>
                            <div className="bg-slate-50 rounded-lg p-3 font-mono text-xs text-slate-600 border border-slate-100 leading-relaxed">
                                Nom;Prénom;CodeClasse;MotDePasse;WordPressURL;PrestaShopURL<br />
                                Dupont;Pierre;NDRC1;monmdp1;https://wp.ex.fr;https://ps.ex.fr/admin<br />
                                Martin;Alice;NDRC2;monmdp2;https://wp2.ex.fr;https://ps2.ex.fr/admin
                            </div>
                        </div>
                        <button onClick={downloadCsvTemplate} className="mt-4 w-full bg-purple-600 text-white px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors">
                            <Download size={16} /> Télécharger le modèle CSV
                        </button>
                    </div>
                </div>

                {/* Stats & Filtres */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex gap-2 overflow-x-auto pb-1 w-full md:w-auto">
                        <button onClick={() => setSelectedClassId(null)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${!selectedClassId ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
                            Toutes
                        </button>
                        {classes.map(code => (
                            <button key={code} onClick={() => setSelectedClassId(code)} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedClassId === code ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
                                {code}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500 text-sm transition-colors" />
                    </div>
                </div>

                {/* Liste */}
                {filteredStudents.length > 0 ? (
                    <div className="space-y-3">
                        {filteredStudents.map(student => {
                            const isExpanded = expandedStudentId === student.id;
                            const pColor = student.progress >= 70 ? "bg-green-500" : student.progress >= 30 ? "bg-blue-500" : "bg-slate-300";

                            return (
                                <div key={student.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in-up">
                                    <div className="flex items-center gap-4 p-4">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 font-black flex items-center justify-center text-sm flex-shrink-0 cursor-pointer" onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}>
                                            {student.firstName[0]}{student.lastName[0]}
                                        </div>
                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}>
                                            <div className="font-bold text-slate-800 truncate">
                                                {student.firstName} <span className="uppercase">{student.lastName}</span>
                                                <span className="ml-2 inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-md">{student.classCode}</span>
                                            </div>
                                            <div className="mt-1.5"><ProgressBar value={student.progress} color={pColor} /></div>
                                        </div>
                                        <div className="flex-shrink-0 text-right hidden sm:block">
                                            <a href={`/teacher/student/${student.id}`} className="text-xs text-purple-600 hover:text-purple-800 font-bold hover:underline">{student.acquiredCount}/{TOTAL_COMPETENCIES} compétences</a>
                                            {student.comments.length > 0 && <div className="text-xs text-purple-500 font-bold mt-0.5">💬 {student.comments.length}</div>}
                                        </div>
                                        <div className="text-slate-400 flex-shrink-0 cursor-pointer" onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}>{isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
                                    </div>

                                    {isExpanded && (
                                        <div className="border-t border-slate-100 bg-slate-50/50">
                                            <div className="p-5 border-b border-slate-100">
                                                <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-3">
                                                    <Globe size={15} className="text-purple-500" />
                                                    Liens des sites étudiants
                                                </h4>
                                                <div className="flex flex-col md:flex-row gap-3">
                                                    <div className="flex-1">
                                                        <label className="block text-xs text-slate-500 font-medium mb-1">WordPress</label>
                                                        <input
                                                            type="text"
                                                            placeholder="https://wp.etudiant.com"
                                                            value={wpInputs[student.id] !== undefined ? wpInputs[student.id] : (student.wpUrl || "")}
                                                            onChange={e => setWpInputs(prev => ({ ...prev, [student.id]: e.target.value }))}
                                                            className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-400 bg-white"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-xs text-slate-500 font-medium mb-1">PrestaShop</label>
                                                        <input
                                                            type="text"
                                                            placeholder="https://presta.etudiant.com"
                                                            value={prestaInputs[student.id] !== undefined ? prestaInputs[student.id] : (student.prestaUrl || "")}
                                                            onChange={e => setPrestaInputs(prev => ({ ...prev, [student.id]: e.target.value }))}
                                                            className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-400 bg-white"
                                                        />
                                                    </div>
                                                    <div className="flex items-end">
                                                        <button onClick={() => handleUpdateUrls(student.id)} className="bg-purple-100 text-purple-700 px-4 py-2 rounded-xl text-sm justify-center font-bold hover:bg-purple-200 transition-colors w-full md:w-auto flex items-center gap-2">
                                                            <Save size={16} /> Enregistrer
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Bloc E4 (Vente)</p>
                                                        <ProgressBar value={student.e4Progress} color="bg-blue-500" />
                                                    </div>
                                                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Bloc E6 (Réseaux)</p>
                                                        <ProgressBar value={student.e6Progress} color="bg-indigo-500" />
                                                    </div>
                                                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Bloc E5B (Digital)</p>
                                                        <ProgressBar value={student.digitalProgress} color="bg-sky-500" />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Commentaires */}
                                            <div className="p-5">
                                                <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-3">
                                                    <MessageSquarePlus size={15} className="text-purple-500" />
                                                    Commentaires formateur
                                                </h4>
                                                <div className="space-y-2 max-h-36 overflow-y-auto pr-1 mb-3 text-sm">
                                                    {student.comments.length > 0 ? student.comments.map((c) => (
                                                        <div key={c.id} className="flex items-start gap-2 bg-white rounded-xl p-3 border border-slate-100">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs text-slate-700 font-medium">{c.text}</p>
                                                            </div>
                                                            <button onClick={() => deleteComment(student.id, c.id)} className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    )) : (
                                                        <p className="text-slate-400 text-xs italic">Aucun commentaire.</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Ajouter un commentaire..."
                                                        value={commentInputs[student.id] || ""}
                                                        onChange={e => setCommentInputs(prev => ({ ...prev, [student.id]: e.target.value }))}
                                                        onKeyDown={e => e.key === "Enter" && sendComment(student.id)}
                                                        className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-400 bg-white"
                                                    />
                                                    <button onClick={() => sendComment(student.id)} disabled={!commentInputs[student.id]?.trim()} className="bg-purple-600 text-white px-3 py-2 rounded-xl hover:bg-purple-700 disabled:opacity-30 transition-colors">
                                                        <Send size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 text-slate-400 text-sm">
                        {students.length === 0 ? "Aucun étudiant — glissez un fichier CSV pour commencer." : "Aucun résultat."}
                    </div>
                )}
            </div>
        </TeacherLayout>
    );
}
