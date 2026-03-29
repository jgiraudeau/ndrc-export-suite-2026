export type BadgeType = "PLATINE" | "OR" | "ARGENT" | null;

export interface BadgeInfo {
    type: BadgeType;
    label: string;
    color: string;
    description: string;
}

export function calculateBadge(acquiredCount: number, totalCompetencies: number): BadgeInfo {
    const percentage = totalCompetencies > 0 ? (acquiredCount / totalCompetencies) * 100 : 0;
    
    if (percentage >= 100) {
        return {
            type: "PLATINE",
            label: "Badge Platine",
            color: "text-slate-400 bg-slate-50 border-slate-200", // Metallic look
            description: "Maîtrise totale des compétences du référentiel."
        };
    }
    
    if (percentage >= 75) {
        return {
            type: "OR",
            label: "Badge Or",
            color: "text-amber-600 bg-amber-50 border-amber-200",
            description: "Excellente progression dans l'acquisition des compétences."
        };
    }
    
    if (percentage >= 50) {
        return {
            type: "ARGENT",
            label: "Badge Argent",
            color: "text-gray-500 bg-gray-50 border-gray-200",
            description: "Démonstration solide des compétences fondamentales."
        };
    }
    
    return {
        type: null,
        label: "En apprentissage",
        color: "text-slate-400 bg-slate-50 border-slate-100",
        description: "Continuez vos efforts pour débloquer votre premier badge !"
    };
}
