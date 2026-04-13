import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useTeacherStore } from './useTeacherStore';

// Mocks pour la démo
export const MOCK_CLASSES = [
    { code: 'NDRC1', name: 'BTS NDRC 1ère Année' },
    { code: 'NDRC2', name: 'BTS NDRC 2ème Année' },
];

export const MOCK_STUDENTS_AUTH = [
    { pin: '0000', name: 'Jacques (Test)', classCode: 'NDRC2' },
    { pin: '0000', name: 'Test Étudiant 1', classCode: 'NDRC1' }, // Ajout pour faciliter le test
    { pin: '1234', name: 'Sophie Martin', classCode: 'NDRC2' },
];

export const MOCK_TEACHERS = [
    { email: 'prof@ndrc.fr', code: 'admin' },
];

interface User {
    name: string;
    role: 'STUDENT' | 'TEACHER';
    classCode?: string; // Seulement pour étudiants
}

type AuthResult = { success: boolean; message?: string };

interface AuthStore {
    user: User | null;
    isAuthenticated: boolean;

    // Actions
    loginStudent: (classCode: string, pin: string) => Promise<AuthResult>;
    loginTeacher: (email: string, code: string) => Promise<AuthResult>;
    logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null as User | null,
            isAuthenticated: false as boolean,

            loginStudent: async (classCode: string, pin: string): Promise<AuthResult> => {
                // 1. Vérifier dans les données importées par le prof (PRIORITÉ)
                const importedStudents = useTeacherStore.getState().students;
                const foundImported = importedStudents.find(
                    s => s.classCode.toUpperCase() === classCode.toUpperCase() && s.pin === pin
                );

                if (foundImported) {
                    set({
                        isAuthenticated: true,
                        user: { name: `${foundImported.firstName} ${foundImported.lastName}`, role: 'STUDENT', classCode: foundImported.classCode }
                    });
                    return { success: true };
                }

                // 2. Fallback sur les Mocks (si pas trouvé dans l'import)
                const validStudentMock = MOCK_STUDENTS_AUTH.find(s => s.pin === pin && s.classCode.toUpperCase() === classCode.toUpperCase());

                if (validStudentMock) {
                    set({
                        isAuthenticated: true,
                        user: { name: validStudentMock.name, role: 'STUDENT', classCode: validStudentMock.classCode }
                    });
                    return { success: true };
                }

                return { success: false, message: "Identifiants incorrects (Classe ou PIN)." };
            },

            loginTeacher: async (email: string, code: string): Promise<AuthResult> => {
                const validTeacher = MOCK_TEACHERS.find(t => t.email === email && t.code === code);
                if (!validTeacher) return { success: false, message: "Identifiants incorrects." };

                set({
                    isAuthenticated: true,
                    user: { name: 'Formateur', role: 'TEACHER' }
                });
                return { success: true };
            },

            logout: () => set({ user: null, isAuthenticated: false }),
        }),
        {
            name: 'ndrc-auth-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
