/**
 * Client API centralisé
 * Toutes les fonctions qui appellent les endpoints backend
 */

const getBaseUrl = () =>
    typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("ndrc_token");
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
    const token = getToken();
    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    try {
        const res = await fetch(`${getBaseUrl()}${path}`, { ...options, headers });
        const json = await res.json();

        if (!res.ok) {
            return { data: null, error: json.error || "Erreur inconnue" };
        }
        return { data: json as T, error: null };
    } catch {
        return { data: null, error: "Erreur de connexion au serveur" };
    }
}

// =============================================================
// AUTH
// =============================================================

export async function apiTeacherLogin(email: string, password: string) {
    return apiFetch<{ token: string; name: string; role: string }>(
        "/api/auth/teacher/login",
        { method: "POST", body: JSON.stringify({ email, password }) }
    );
}

export async function apiTeacherRegister(name: string, email: string, password: string) {
    return apiFetch<{ token: string; name: string; role: string }>(
        "/api/auth/teacher/register",
        { method: "POST", body: JSON.stringify({ name, email, password }) }
    );
}

export async function apiStudentLogin(identifier: string, password: string) {
    return apiFetch<{ token: string; name: string; role: string; classCode: string; studentId: string }>(
        "/api/auth/student/login",
        { method: "POST", body: JSON.stringify({ identifier, password }) }
    );
}

export async function apiLogout() {
    localStorage.removeItem("ndrc_token");
    localStorage.removeItem("ndrc_user");
    return apiFetch<{ message: string }>("/api/auth/logout", { method: "POST" });
}

export async function apiChangePassword(currentPassword: string, newPassword: string) {
    return apiFetch<{ message: string }>(
        "/api/student/password",
        { method: "PATCH", body: JSON.stringify({ currentPassword, newPassword }) }
    );
}

// =============================================================
// ÉTUDIANTS (formateur)
// =============================================================

export interface StudentWithProgress {
    id: string;
    firstName: string;
    lastName: string;
    identifier: string;
    classCode: string;
    className: string;
    wpUrl?: string | null;
    prestaUrl?: string | null;
    acquiredCount: number;
    lastActive: string | null;
    competencies: Array<{
        competencyId: string;
        acquired: boolean;
        status: number;
        proof: string | null;
        updatedAt: string;
        teacherStatus: number | null;
        teacherFeedback: string | null;
        teacherGradedAt: string | null;
    }>;
    comments: Array<{
        id: string;
        text: string;
        authorName: string;
        date: string;
    }>;
}

export async function apiGetStudents() {
    return apiFetch<StudentWithProgress[]>("/api/students");
}

export async function apiUpdateStudent(id: string, data: { wpUrl?: string; prestaUrl?: string }) {
    return apiFetch<{ message: string; student: StudentWithProgress }>(
        `/api/students/${id}`,
        { method: "PATCH", body: JSON.stringify(data) }
    );
}

export async function apiImportStudents(
    students: Array<{
        firstName: string;
        lastName: string;
        classCode: string;
        password: string;
        wpUrl?: string;
        prestaUrl?: string;
    }>
) {
    return apiFetch<{
        message: string;
        stats: { created: number; updated: number };
        createdStudents: Array<{ firstName: string; lastName: string; identifier: string }>;
    }>(
        "/api/students",
        { method: "POST", body: JSON.stringify({ students }) }
    );
}

export async function apiGetStudent(studentId: string) {
    return apiFetch<StudentWithProgress>(`/api/students/${studentId}`);
}

// =============================================================
// NOTATION FORMATEUR
// =============================================================

export interface ProfessionalExperience {
  id: string;
  title: string;
  type: string;
  description: string;
  startDate: string;
  endDate: string | null;
  studentId: string;
  competencyIds: string[];
  status: "DRAFT" | "SUBMITTED" | "VALIDATED";
  feedback?: string;
  createdAt: string;
  student?: { firstName: string; lastName: string };
}

export async function apiGradeCompetency(
    studentId: string,
    competencyId: string,
    teacherStatus: number,
    teacherFeedback?: string
) {
    return apiFetch<{
        competencyId: string;
        teacherStatus: number;
        teacherFeedback: string | null;
        teacherGradedAt: string | null;
    }>("/api/progress/grade", {
        method: "PATCH",
        body: JSON.stringify({ studentId, competencyId, teacherStatus, teacherFeedback }),
    });
}

// =============================================================
// PROGRESSION (étudiant)
// =============================================================

export interface ProgressRecord {
    competencyId: string;
    acquired: boolean;
    status: number;
    proof: string | null;
    updatedAt: string;
    teacherStatus: number | null;
    teacherFeedback: string | null;
    teacherGradedAt: string | null;
}

export async function apiGetProgress() {
    return apiFetch<ProgressRecord[]>("/api/progress");
}

export interface StudentDashboardData {
    id: string;
    firstName: string;
    lastName: string;
    classCode: string;
    wpUrl?: string | null;
    prestaUrl?: string | null;
    progress: {
        total: number;
        wordpress: number;
        prestashop: number;
        acquiredCount: number;
        totalCount: number;
    };
    recentActivity: Array<{
        id: string;
        label: string;
        platform: string;
        date: string;
        teacherStatus: number | null;
        teacherFeedback: string | null;
    }>;
    comments: Array<{
        id: string;
        text: string;
        author: string;
        date: string;
    }>;
}

export async function apiStudentDashboard() {
    return apiFetch<StudentDashboardData>("/api/student/dashboard");
}

export async function apiSaveProgress(competencyId: string, status: number, proof?: string) {
    // Legacy support for acquired: consider >= 3 (Competent) as acquired
    const acquired = status >= 3;
    return apiFetch<ProgressRecord>(
        "/api/progress",
        { method: "POST", body: JSON.stringify({ competencyId, acquired, status, proof }) }
    );
}

// =============================================================
// COMMENTAIRES (formateur)
// =============================================================

export async function apiAddComment(studentId: string, text: string) {
    return apiFetch<{ id: string; text: string; authorName: string; date: string }>(
        "/api/comments",
        { method: "POST", body: JSON.stringify({ studentId, text }) }
    );
}

export async function apiDeleteComment(commentId: string) {
    return apiFetch<{ deleted: boolean }>(
        `/api/comments/${commentId}`,
        { method: "DELETE" }
    );
}

export interface EvaluationData {
    id: string;
    studentId: string;
    evaluatorId: string;
    date: string;
    type: string;
    situation: string;
    globalComment: string | null;
    scores: Array<{
        criterionId: string;
        criterionDescription?: string;
        score: number;
        comment: string | null;
    }>;
}

export async function apiGetStudentEvaluations(studentId: string) {
    return apiFetch<EvaluationData[]>(`/api/students/${studentId}/evaluations`);
}

// =============================================================
// ADMIN
// =============================================================

export async function apiAdminLogin(email: string, password: string) {
    return apiFetch<{ token: string; name: string; role: string }>(
        "/api/auth/admin/login",
        { method: "POST", body: JSON.stringify({ email, password }) }
    );
}

export interface TeacherAdmin {
    id: string;
    email: string;
    name: string;
    status: string;
    createdAt: string;
    _count: { students: number; classes: number };
}

export interface AdminStats {
    teachers: number;
    pendingTeachers: number;
    students: number;
    classes: number;
    experiences: number;
    entries: number;
}

export async function apiGetAdminStats() {
    return apiFetch<AdminStats>("/api/admin/stats");
}

export async function apiGetTeachers() {
    return apiFetch<TeacherAdmin[]>("/api/admin/teachers");
}

export async function apiManageTeacher(teacherId: string, action: "approve" | "reject" | "delete" | "reset_password") {
    return apiFetch<{ message: string; tempPassword?: string }>(
        "/api/admin/teachers",
        { method: "PATCH", body: JSON.stringify({ teacherId, action }) }
    );
}

// =============================================================
// MISSIONS
// =============================================================

export interface MissionData {
    id: string;
    title: string;
    content: string;
    platform: string;
    level: number;
    competencyIds: string[];
    createdBy: string;
    createdByRole: string;
    createdAt: string;
    _count?: { assignments: number };
}

export interface MissionAssignmentData {
    id: string;
    missionId: string;
    title: string;
    content: string;
    platform: string;
    level: number;
    competencyIds: string[];
    status: string;
    assignedAt: string;
    completedAt: string | null;
    teacherName: string;
}

// Sauvegarder une mission (prof ou étudiant)
export async function apiSaveMission(data: {
    title: string; content: string; platform: string;
    level: number; competencyIds: string[];
}) {
    return apiFetch<MissionData>("/api/missions", {
        method: "POST", body: JSON.stringify(data),
    });
}

// Lister les missions du formateur
export async function apiGetMissions(platform?: string) {
    const query = platform ? `?platform=${platform}` : "";
    return apiFetch<MissionData[]>(`/api/missions${query}`);
}

// Supprimer une mission
export async function apiDeleteMission(id: string) {
    return apiFetch<{ deleted: boolean }>(`/api/missions/${id}`, { method: "DELETE" });
}

// Assigner une mission
export async function apiAssignMission(missionId: string, target: { studentIds?: string[]; classId?: string }) {
    return apiFetch<{ assigned: number }>("/api/missions/assign", {
        method: "POST", body: JSON.stringify({ missionId, ...target }),
    });
}

// Missions assignées à l'étudiant
export async function apiGetMyMissions() {
    return apiFetch<MissionAssignmentData[]>("/api/student/missions");
}

// Mettre à jour le statut d'une mission assignée
export async function apiUpdateMissionStatus(assignmentId: string, status: string) {
    return apiFetch<MissionAssignmentData>(`/api/student/missions/${assignmentId}`, {
        method: "PATCH", body: JSON.stringify({ status }),
    });
}

// =============================================================
// EXPERIENCES (Passeport Pro)
// =============================================================

export async function apiGetExperiences(params: { studentId?: string; classId?: string }) {
    const query = new URLSearchParams();
    if (params.studentId) query.append("studentId", params.studentId);
    if (params.classId) query.append("classId", params.classId);
    return apiFetch<ProfessionalExperience[]>(`/api/experiences?${query.toString()}`);
}

export async function apiCreateExperience(data: Partial<ProfessionalExperience>) {
    return apiFetch<ProfessionalExperience>("/api/experiences", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function apiUpdateExperience(id: string, data: Partial<ProfessionalExperience>) {
    return apiFetch<ProfessionalExperience>(`/api/experiences/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export async function apiDeleteExperience(id: string) {
    return apiFetch<{ success: boolean }>(`/api/experiences/${id}`, {
        method: "DELETE",
    });
}

// =============================================================
// JOURNAL
// =============================================================

export interface JournalEntry {
    id: string;
    content: string;
    date: string;
    isValidated: boolean;
    teacherComment?: string | null;
    experienceId?: string | null;
    assignmentId?: string | null;
    experience?: { title: string };
    assignment?: { title: string };
}

export async function apiGetJournal(params: { experienceId?: string; assignmentId?: string; studentId?: string }) {
    const query = new URLSearchParams();
    if (params.experienceId) query.append("experienceId", params.experienceId);
    if (params.assignmentId) query.append("assignmentId", params.assignmentId);
    if (params.studentId) query.append("studentId", params.studentId);
    return apiFetch<JournalEntry[]>(`/api/journal?${query.toString()}`);
}

/**
 * Valide numériquement une évaluation (E4/E6)
 */
export async function apiValidateEvaluation(studentId: string, type: string, isValidated: boolean = true) {
    return apiFetch<{ success: boolean }>("/api/teacher/evaluations/validate", {
        method: "POST",
        body: JSON.stringify({ studentId, type, isValidated }),
    });
}
