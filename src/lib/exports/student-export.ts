import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BadgeType, BadgeInfo, calculateBadge } from "./badges";

/**
 * Service de génération des dossiers d'examen NDRC
 */
export class PDFExportService {
    
    /**
     * Dossier E4 / E6 (Certification Officielle)
     */
    static async generateOfficialEvaluation(data: {
        studentName: string,
        evaluationType: "E4" | "E6",
        teacherName: string,
        date: string,
        grades: { code: string, label: string, scoreLabel: string }[],
        isValidated: boolean,
        validatedAt?: string | null
    }) {
        const doc = new jsPDF();
        const primaryColor = [79, 70, 229]; // Indigo
        
        // Header
        doc.setFontSize(22);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`Épreuve ${data.evaluationType}`, 105, 20, { align: "center" });
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("BTS Négociation et Digitalisation de la Relation Client", 105, 28, { align: "center" });
        
        // Student Info
        doc.setDrawColor(200);
        doc.line(20, 35, 190, 35);
        
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Étudiant : ${data.studentName}`, 20, 45);
        doc.text(`Date : ${new Date(data.date).toLocaleDateString()}`, 140, 45);
        
        autoTable(doc, {
            startY: 55,
            head: [['Compétence', 'Élément', 'Évaluation']],
            body: data.grades.map(g => [g.code, g.label, g.scoreLabel]),
            headStyles: { fillColor: primaryColor as any, textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [249, 250, 251] },
        });

        // Validation Metadata
        const finalY = (doc as any).lastAutoTable.cursor.y + 20;
        
        if (data.isValidated) {
            doc.setDrawColor(16, 185, 129); // Emerald
            doc.setFillColor(240, 253, 244);
            doc.roundedRect(20, finalY, 170, 30, 3, 3, "FD");
            
            doc.setFontSize(10);
            doc.setTextColor(5, 150, 105);
            doc.text("CERTIFICATION NUMÉRIQUE", 105, finalY + 10, { align: "center" });
            
            doc.setTextColor(0);
            doc.text(`Document certifié conforme par : ${data.teacherName}`, 30, finalY + 18);
            doc.text(`Date de validation : ${data.validatedAt ? new Date(data.validatedAt).toLocaleDateString() : 'Non spécifiée'}`, 30, finalY + 24);
            
            // Artificial "Stamp" look
            doc.setDrawColor(5, 150, 105);
            doc.setLineWidth(1);
            doc.circle(170, finalY + 15, 8, "S");
            doc.setFontSize(6);
            doc.text("VALIDÉ", 170, finalY + 16, { align: "center" });
        } else {
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text("En attente de certification par le formateur.", 105, finalY + 10, { align: "center" });
        }

        doc.save(`NDRC_${data.evaluationType}_${data.studentName.replace(' ', '_')}.pdf`);
    }

    /**
     * Dossier E5B ou Passeport avec Badge
     */
    static async generateBadgeExport(data: {
        title: string,
        studentName: string,
        badge: BadgeInfo,
        items: { title: string, description: string, status: string }[]
    }) {
        const doc = new jsPDF();
        
        // Brand logic
        const colors = {
            PLATINE: [148, 163, 184], // Slate 400
            OR: [217, 119, 6],      // Amber
            ARGENT: [100, 116, 139], // Gray 500
            DEFAULT: [79, 70, 229]
        };
        
        const badgeColor = data.badge.type ? (colors as any)[data.badge.type] : colors.DEFAULT;

        // Cover Page
        doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
        doc.rect(0, 0, 210, 50, "F");
        
        doc.setFontSize(26);
        doc.setTextColor(255);
        doc.text(data.title.toUpperCase(), 105, 32, { align: "center" });
        
        // Badge Section
        if (data.badge.type) {
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(75, 60, 60, 30, 5, 5, "F");
            doc.setFontSize(14);
            doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
            doc.text(data.badge.label, 105, 75, { align: "center" });
            doc.setFontSize(8);
            doc.text("NIVEAU D'EXCELLENCE", 105, 82, { align: "center" });
        }

        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text(data.studentName, 105, 110, { align: "center" });
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("Tableau récapitulatif des acquis professionnels", 105, 118, { align: "center" });

        // List
        autoTable(doc, {
            startY: 130,
            head: [['Action / Mission', 'Description', 'Statut']],
            body: data.items.map(i => [i.title, i.description, i.status]),
            headStyles: { fillColor: badgeColor as any },
        });

        doc.save(`NDRC_${data.title.replace(' ', '_')}_${data.studentName.replace(' ', '_')}.pdf`);
    }
}
