import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel, TextRun, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import { DIGITAL_COMPETENCIES } from "@/data/digital-competencies";
import { MarkdownParser } from "./markdown-parser";

type StudentCompetencyProgress = {
    competencyId: string;
    acquired: boolean;
};

type StudentDocxData = {
    firstName: string;
    lastName: string;
    classCode?: string;
    name?: string;
    competencies?: StudentCompetencyProgress[];
};

type JournalLog = {
    date: string;
    content: string;
    isValidated: boolean;
};

type EvaluationReferential = {
    code: string;
    children: Array<{ description: string }>;
};

type SupportMetadata = {
    title: string;
    filename?: string;
};

export const DOCXService = {

    generateJournal: async (student: StudentDocxData, logs: JournalLog[]) => {
         const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ text: "JOURNAL DE BORD NDRC", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
                    new Paragraph({ text: `${student.firstName} ${student.lastName} - ${student.classCode}`, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "DATE", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ACTION / RÉALISATION", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "STATUT", bold: true })] })] }),
                                ]
                            }),
                            ...logs.map((l) => new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph(new Date(l.date).toLocaleDateString("fr-FR"))] }),
                                    new TableCell({ children: [new Paragraph(l.content)] }),
                                    new TableCell({ children: [new Paragraph(l.isValidated ? "VALIDÉ" : "EN ATTENTE")] }),
                                ]
                            }))
                        ]
                    })
                ]
            }]
         });
         const blob = await Packer.toBlob(doc);
         saveAs(blob, `JOURNAL_NDRC_${student.lastName.toUpperCase()}.docx`);
    },

    generateEvaluationGrid: async (
        student: StudentDocxData,
        _evaluation: unknown,
        type: "E4" | "E6",
        referential: EvaluationReferential[],
        grades: Record<string, number>
    ) => {
        const title = type === "E4" 
            ? "ANNEXE V – 4 : GRILLE D'AIDE À L'ÉVALUATION E4" 
            : "ANNEXE VII – 2 : GRILLE D'AIDE À L'ÉVALUATION E6";
        
        const subtitle = type === "E4"
            ? "RELATION CLIENT et NÉGOCIATION VENTE - Coefficient 5"
            : "RELATION CLIENT ET ANIMATION DE RÉSEAUX - Coefficient 3";

        const doc = new Document({
            sections: [{
                properties: {
                    page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } }
                },
                children: [
                    new Paragraph({
                        text: "BTS NÉGOCIATION ET DIGITALISATION DE LA RELATION CLIENT (NDRC)",
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100 },
                    }),
                    new Paragraph({
                        text: title,
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100 },
                    }),
                    new Paragraph({
                        text: subtitle,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                    }),

                    // Candidate Info
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "NOM DU CANDIDAT :", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph(student.name?.toUpperCase() || student.lastName?.toUpperCase() || "")] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "SESSION :", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph("2025/2026")] }),
                                ]
                            })
                        ]
                    }),

                    new Paragraph({ text: "", spacing: { before: 400 } }),

                    // Evaluation Table
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            // Header Row
                            new TableRow({
                                children: [
                                    new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "COMPÉTENCES ET CRITÈRES D'ÉVALUATION", bold: true })] })], shading: { fill: "F1F5F9" } }),
                                    new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "TI", bold: true })], alignment: AlignmentType.CENTER })], shading: { fill: "F1F5F9" } }),
                                    new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "I", bold: true })], alignment: AlignmentType.CENTER })], shading: { fill: "F1F5F9" } }),
                                    new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "S", bold: true })], alignment: AlignmentType.CENTER })], shading: { fill: "F1F5F9" } }),
                                    new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "TS", bold: true })], alignment: AlignmentType.CENTER })], shading: { fill: "F1F5F9" } }),
                                ]
                            }),
                            // Competency Lines
                            ...referential.flatMap((comp) => 
                                comp.children.map((child, idx: number) => {
                                    const gradeValue = grades[`${comp.code}_${idx}`];
                                    return new TableRow({
                                        children: [
                                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: comp.code, bold: true }), new TextRun({ text: ` - ${child.description}`, size: 20 })] })] }),
                                            new TableCell({ children: [new Paragraph({ text: gradeValue === 1 ? "X" : "", alignment: AlignmentType.CENTER })] }),
                                            new TableCell({ children: [new Paragraph({ text: gradeValue === 2 ? "X" : "", alignment: AlignmentType.CENTER })] }),
                                            new TableCell({ children: [new Paragraph({ text: gradeValue === 3 ? "X" : "", alignment: AlignmentType.CENTER })] }),
                                            new TableCell({ children: [new Paragraph({ text: gradeValue === 4 ? "X" : "", alignment: AlignmentType.CENTER })] }),
                                        ]
                                    });
                                })
                            )
                        ]
                    }),

                    new Paragraph({ text: "", spacing: { before: 800 } }),

                    // Official Stamp Area
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Visa de l'évaluateur :", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Cachet de l'établissement :", bold: true })] })] }),
                                ]
                            })
                        ]
                    })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `GRILLE_${type}_${student.name?.replace(/\s+/g, '_') || "CANDIDAT"}.docx`);
    },

    /**
     * Génère un support pédagogique général (Dossier Prof, Étudiant, Planning, etc.)
     * Convertit les tableaux Markdown en tableaux natifs Word.
     */
    generateAISupport: async (metadata: SupportMetadata, content: string, track: string) => {
        const { title, filename } = metadata;
        
        const tableData = MarkdownParser.extractTable(content);
        const textOnly = MarkdownParser.removeTables(content);

        const children: Array<Paragraph | Table> = [
            new Paragraph({
                text: "SUPPORT PÉDAGOGIQUE NDRC",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                text: `${title.toUpperCase()} - ${track}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
            }),
        ];

        // Rendu du texte (nettoyé des tableaux)
        textOnly.split("\n").forEach((line: string) => {
            const trimmed = line.trim();
            if (trimmed.startsWith("#")) {
                const level = (trimmed.match(/^#+/) || ["#"])[0].length;
                children.push(new Paragraph({
                    text: trimmed.replace(/#/g, "").trim(),
                    heading: level === 1 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 }
                }));
            } else if (trimmed) {
                children.push(new Paragraph({
                    children: [new TextRun(trimmed)],
                    spacing: { after: 120 }
                }));
            }
        });

        // Rendu du tableau Markdown (SI PRÉSENT)
        if (tableData) {
            children.push(new Paragraph({ text: "", spacing: { before: 200 } }));
            children.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    // Entête
                    new TableRow({
                        children: tableData.head[0].map(cell => new TableCell({
                            children: [new Paragraph({ 
                                children: [new TextRun({ text: cell, bold: true, color: "FFFFFF" })],
                                alignment: AlignmentType.CENTER
                            })],
                            shading: { fill: "4F46E5" },
                            verticalAlign: AlignmentType.CENTER
                        }))
                    }),
                    // Données
                    ...tableData.body.map(row => new TableRow({
                        children: row.map(cell => new TableCell({
                            children: [new Paragraph({
                                children: [new TextRun({ text: cell, size: 20 })]
                            })],
                            verticalAlign: AlignmentType.CENTER
                        }))
                    }))
                ]
            }));
        }

        children.push(new Paragraph({ text: "", spacing: { before: 400 } }));
        
        // Bloc signature
        children.push(new Table({
            width: { size: 50, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ 
                            children: [new Paragraph({ children: [new TextRun({ text: "VISA FORMATEUR / CACHET :", bold: true, size: 18 })] })],
                            shading: { fill: "F8FAFC" },
                            borders: { bottom: { style: BorderStyle.SINGLE, size: 1 } }
                        }),
                        new TableCell({ children: [new Paragraph({ text: "                " })] }),
                    ]
                })
            ]
        }));

        const doc = new Document({
            sections: [{
                properties: {
                    // Si c'est un planning, on pourrait forcer le paysage ici, 
                    // mais pour l'instant on reste en portrait par défaut pour Word sauf demande explicite.
                },
                children: children
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${filename || "Support_NDRC"}.docx`);
    },

    /**
     * Professional Passport - Transversal synthesis (E4, E5B, E6)
     */
    generateProPassport: async (student: StudentDocxData, _skills: unknown[]) => {
        void _skills;
        const studentCompetencies = student.competencies ?? [];
        const hasAcquiredSkill = (skillId: string) =>
            studentCompetencies.some((p) => p.competencyId === skillId && p.acquired);

        const doc = new Document({
            sections: [{
                properties: {
                    page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } }
                },
                children: [
                    new Paragraph({
                        text: "PASSEPORT PROFESSIONNEL NDRC 2026",
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 300 },
                    }),
                    new Paragraph({
                        text: "SYNTHÈSE TRANSVERSALE DES COMPÉTENCES ET CERTIFICATIONS",
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 600 },
                    }),

                    // Identity Block
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "CANDIDAT :", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph(`${student.name || `${student.firstName} ${student.lastName}`}`)] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "PROFIL :", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph("BTS Négociation et Digitalisation de la Relation Client")] }),
                                ]
                            })
                        ]
                    }),

                    new Paragraph({ text: "", spacing: { before: 400 } }),

                    // Section E4/E6
                    new Paragraph({
                        text: "I. COMPÉTENCES COMMERCIALES (E4 - E6)",
                        heading: HeadingLevel.HEADING_2,
                        spacing: { after: 200, before: 400 },
                    }),
                    new Paragraph("Données issues de la Grille d'Aide à l'Évaluation Session 2025/2026."),
                    
                    // Section Digitize E5B
                    new Paragraph({
                        text: "II. COMPÉTENCES DIGITALES ET TECHNIQUES (E5B)",
                        heading: HeadingLevel.HEADING_2,
                        spacing: { after: 200, before: 400 },
                    }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Plateforme WordPress", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph("Validation de l'application digitale validée")] }),
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Plateforme PrestaShop", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph("Gestion commerce connecté certifiée")] }),
                                ]
                            })
                        ]
                    }),

                    // DIGITAL SYNTHESIS (E5B)
                    new Paragraph({ children: [new TextRun({ text: "VOLET DIGITAL (E5B - WordPress & PrestaShop)", bold: true, size: 28, color: "1e1e2e" })], spacing: { before: 800, after: 400 } }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, shading: { fill: "f8fafc" }, children: [new Paragraph({ children: [new TextRun({ text: "Compétence Digitale / CMS", bold: true })] })] }),
                                    new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: "f8fafc" }, children: [new Paragraph({ children: [new TextRun({ text: "État de Validation", bold: true }), new TextRun({ text: " (IA certified)", italics: true, size: 16 })] })] }),
                                ]
                            }),
                            ...DIGITAL_COMPETENCIES.map(skill => (
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${skill.platform} : `, bold: true }), new TextRun({ text: skill.label })] })] }),
                                        new TableCell({ 
                                            shading: { fill: hasAcquiredSkill(skill.id) ? "ecfdf5" : "ffffff" },
                                            children: [new Paragraph({ 
                                                alignment: AlignmentType.CENTER,
                                                children: [new TextRun({ 
                                                    text: hasAcquiredSkill(skill.id) ? "✅ ACQUIS" : "⭕ EN COURS",
                                                    bold: true,
                                                    color: hasAcquiredSkill(skill.id) ? "059669" : "94a3b8"
                                                })] 
                                            })] 
                                        }),
                                    ]
                                })
                            ))
                        ]
                    }),

                    new Paragraph({ text: "", spacing: { before: 800 } }),

                    // Signature Area
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Cachet de l'Établissement", bold: true, italics: true })] })] }),
                                    new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Visa du Formateur Référent", bold: true, italics: true })] })] }),
                                ]
                            })
                        ]
                    })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `PASSEPORT_PRO_NDRC_${student.lastName || "CANDIDAT"}.docx`);
    }
};
