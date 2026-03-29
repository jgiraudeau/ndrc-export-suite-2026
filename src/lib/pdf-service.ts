import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { type ProfessionalExperience } from "./api-client";
import { TRANSVERSAL_REFERENTIAL } from "@/data/transversal-referential";
import { MarkdownParser } from "./markdown-parser";


// Extend jsPDF type for autotable
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

// Helper to get competency label from ID
const getCompetencyLabel = (id: string) => {
  for (const block of TRANSVERSAL_REFERENTIAL) {
    const item = block.items.find(i => i.id === id);
    if (item) return item.label;
  }
  return id;
};

// Helper to draw common branding elements
const drawBranding = (doc: jsPDF, title: string, subtitle: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, pageWidth, 45, "F");
    
    // Logo placeholder / Accent
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.rect(15, 10, 5, 25, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), 25, 25);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(subtitle.toUpperCase(), 25, 32);
};

const drawFooter = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`Doc. Généré le ${new Date().toLocaleDateString("fr-FR")} • Page ${i} / ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
        doc.text("NDRC EXPORT SUITE — DOCUMENT OFFICIEL", 20, pageHeight - 10);
        
        // QR Code or Logo placeholder bottom right
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.1);
        doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);
    }
};

/**
 * Service pour la génération de documents PDF officiels de haute qualité
 */
export const PDFService = {
  
  /**
   * Génère le Passeport de Professionnalisation
   */
  generateProPassport: (student: any, experiences: ProfessionalExperience[]) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    drawBranding(doc, "Passeport Pro", "BTS NDRC - Négociation et Digitalisation de la Relation Client");
    
    let y = 60;
    
    // Student Info Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(20, y, pageWidth - 40, 25, 4, 4, "FD");
    
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.text("CANDIDAT :", 30, y + 10);
    doc.setTextColor(15, 23, 42);
    doc.text(`${student.firstName.toUpperCase()} ${student.lastName.toUpperCase()}`, 60, y + 10);
    
    doc.setTextColor(71, 85, 105);
    doc.text("CLASSE :", 30, y + 18);
    doc.setTextColor(15, 23, 42);
    doc.text(student.classCode || "N/A", 60, y + 18);
    
    y += 40;

    // Table of Contents / Summary
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text("EXPÉRIENCES EN ENTREPRISE", 20, y);
    
    y += 10;
    const validatedExps = experiences.filter(exp => exp.status === "VALIDATED");

    if (validatedExps.length === 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(148, 163, 184);
      doc.text("Aucun projet validé à ce jour.", 20, y + 10);
    } else {
      validatedExps.forEach((exp, index) => {
        autoTable(doc, {
          startY: y + 5,
          head: [[{ content: `PROJET ${index + 1} : ${exp.title.toUpperCase()}`, colSpan: 2, styles: { fillColor: [15, 23, 42], fontStyle: 'bold' } }]],
          body: [
            ['PÉRIODE', `Du ${new Date(exp.startDate).toLocaleDateString("fr-FR")} au ${new Date(exp.endDate || exp.startDate).toLocaleDateString("fr-FR")}`],
            ['MISSIONS', exp.description || "-"],
            ['COMPÉTENCES VISÉES', exp.competencyIds.map(id => `• ${getCompetencyLabel(id)}`).join("\n")]
          ],
          theme: 'grid',
          headStyles: { fontSize: 10, cellPadding: 4 },
          bodyStyles: { fontSize: 9, cellPadding: 5, textColor: [30, 41, 59] },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 45, fillColor: [248, 250, 252] },
            1: { cellWidth: 'auto' }
          },
          margin: { left: 20, right: 20 },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      });
    }

    drawFooter(doc);
    doc.save(`PASSEPORT_NDRC_${student.lastName.toUpperCase()}.pdf`);
  },

  /**
   * Génère le Journal de Bord complet
   */
  generateJournal: (student: any, logs: any[]) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    drawBranding(doc, "Journal de Bord", "Fil d'actualité des actions et compétences");

    let y = 60;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("HISTORIQUE DES ACTIONS", 20, y);
    
    y += 10;

    if (logs.length === 0) {
      doc.text("Aucun log dans le journal.", 20, y + 10);
    } else {
      autoTable(doc, {
        startY: y + 5,
        head: [['DATE', 'ACTION / RÉALISATION', 'STATUT']],
        body: logs.map(l => [
          new Date(l.date).toLocaleDateString("fr-FR"),
          l.content,
          l.isValidated ? "VALIDÉ" : "EN ATTENTE"
        ]),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], fontStyle: 'bold' },
        bodyStyles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }
        },
        margin: { left: 20, right: 20 }
      });
    }

    drawFooter(doc);
    doc.save(`JOURNAL_NDRC_${student.lastName.toUpperCase()}.pdf`);
  },

  /**
   * Génère un support pédagogique général (Dossier Prof, Étudiant, Planning, etc.)
   * Gère les tableaux Markdown et le mode paysage.
   */
  generateAISupport: (metadata: any, content: string, track: string, options?: { orientation?: "portrait" | "landscape" }) => {
      const doc = new jsPDF({ 
          orientation: options?.orientation || "portrait",
          unit: "mm",
          format: "a4"
      }) as jsPDFWithAutoTable;
      
      const { title, filename } = metadata;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Branding
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.rect(0, 0, pageWidth, 40, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("NDRC EXPORT SUITE", 20, 18);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(`SUPPORT PÉDAGOGIQUE | ${track.toUpperCase()} | ${new Date().toLocaleDateString("fr-FR")}`, 20, 26);
      doc.text(title.toUpperCase(), 20, 32);

      // Séparation du contenu : Texte vs Tableaux
      const tableData = MarkdownParser.extractTable(content);
      const textOnly = MarkdownParser.removeTables(content);

      // Rendu du Texte
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      
      const splitText = doc.splitTextToSize(textOnly, pageWidth - 40);
      let y = 55;
      
      splitText.forEach((line: string) => {
          if (y > pageHeight - 30) {
              doc.addPage();
              y = 20;
          }
          
          if (line.startsWith("#")) {
              const level = line.match(/^#+/)?.[0].length || 1;
              doc.setFont("helvetica", "bold");
              doc.setFontSize(level === 1 ? 16 : level === 2 ? 14 : 12);
              doc.setTextColor(79, 70, 229); // Indigo 600 for headings
              doc.text(line.replace(/#/g, "").trim(), 20, y);
              y += (level === 1 ? 12 : 10);
              doc.setFontSize(11);
              doc.setFont("helvetica", "normal");
              doc.setTextColor(30, 41, 59);
          } else {
              doc.text(line, 20, y);
              y += 7;
          }
      });

      // Rendu du Tableau (si présent)
      if (tableData) {
          if (y > pageHeight - 60) {
              doc.addPage();
              y = 20;
          }
          
          autoTable(doc, {
              startY: y + 5,
              head: tableData.head,
              body: tableData.body,
              theme: 'grid',
              headStyles: { 
                  fillColor: [79, 70, 229], 
                  fontStyle: 'bold', 
                  fontSize: options?.orientation === "landscape" ? 9 : 8 
              },
              bodyStyles: { 
                  fontSize: options?.orientation === "landscape" ? 8 : 7,
                  cellPadding: 3 
              },
              margin: { left: 20, right: 20 },
              styles: { overflow: 'linebreak', cellWidth: 'wrap' },
              columnStyles: {
                  0: { cellWidth: options?.orientation === "landscape" ? 25 : 20 },
                  1: { cellWidth: 'auto' }
              }
          });
          
          y = (doc as any).lastAutoTable.finalY + 15;
      }

      // Visa Formateur
      if (y > pageHeight - 40) { doc.addPage(); y = 20; }
      doc.setDrawColor(203, 213, 225);
      doc.line(20, y + 10, 80, y + 10);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("VISA FORMATEUR / CACHET ET DATE", 20, y + 15);

      drawFooter(doc);
      doc.save(`${filename || "Support_NDRC"}.pdf`);
  },


  /**
   * Génère une grille d'évaluation (E4 ou E6)
   */
  generateEvaluationGrid: (student: any, evaluation: any, type: "E4" | "E6") => {
    const doc = new jsPDF({ orientation: "landscape" }) as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    drawBranding(doc, `Grille Évaluation ${type}`, "Documents certificatifs — BTS NDRC");

    let y = 60;

    // Student identity (Landscape)
    autoTable(doc, {
      startY: y,
      body: [
        ['NOM :', student.lastName.toUpperCase(), 'PRÉNOM :', student.firstName.toUpperCase()],
        ['SESSION :', evaluation.sessionName || "2026", 'CENTRE :', evaluation.centerName || "CAMPUS NDRC"]
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 100 }, 2: { cellWidth: 40 } },
      margin: { left: 20 }
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    if (evaluation.scores && evaluation.scores.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['COMPÉTENCE ÉVALUÉE', 'APPRÉCIATION DU FORMATEUR', 'NOTE']],
          body: evaluation.scores.map((s: any) => [
            s.criterionDescription || s.criterionId,
            s.comment || "-",
            `${s.score} / 4`
          ]),
          theme: 'grid',
          headStyles: { fillColor: [15, 23, 42], fontStyle: 'bold' },
          bodyStyles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 150 },
            1: { cellWidth: 80 },
            2: { halign: 'center', fontStyle: 'bold' }
          },
          margin: { left: 20, right: 20 }
        });
        y = (doc as any).lastAutoTable.finalY + 15;
    }

    // Signature Area
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Cachet du Centre et Signature", pageWidth - 80, y);
    doc.rect(pageWidth - 80, y + 5, 60, 25);

    drawFooter(doc);
    doc.save(`GRILLE_${type}_${student.lastName.toUpperCase()}.pdf`);
  }
};
