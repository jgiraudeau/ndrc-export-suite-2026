import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel, TextRun, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import { TRANSVERSAL_REFERENTIAL } from "@/data/transversal-referential";
import { MarkdownParser } from "./markdown-parser";

const getCompetencyLabel = (id: string) => {

    for (const block of TRANSVERSAL_REFERENTIAL) {
        const item = block.items.find(i => i.id === id);
        if (item) return item.label;
    }
    return id;
};

export const DOCXService = {
    generateProPassport: async (student: any, experiences: any[]) => {
        const validatedExps = experiences.filter(exp => exp.status === "VALIDATED");

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: "PASSEPORT DE PROFESSIONNALISATION",
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                        text: "BTS NÉGOCIATION ET DIGITALISATION DE LA RELATION CLIENT (NDRC)",
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                    }),

                    // Student Info Table
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "CANDIDAT :", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph(`${student.firstName.toUpperCase()} ${student.lastName.toUpperCase()}`)] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "CLASSE :", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph(student.classCode || "N/A")] }),
                                ],
                            }),
                        ],
                    }),

                    new Paragraph({ text: "", spacing: { before: 400 } }),

                    ...validatedExps.flatMap((exp, index) => [
                        new Paragraph({
                            children: [new TextRun({ text: `PROJET ${index + 1} : ${exp.title.toUpperCase()}`, bold: true, size: 28, color: "4F46E5" })],
                            spacing: { before: 400, after: 200 },
                        }),
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "PÉRIODE", bold: true })] })] }),
                                        new TableCell({ children: [new Paragraph(`Du ${new Date(exp.startDate).toLocaleDateString("fr-FR")} au ${new Date(exp.endDate || exp.startDate).toLocaleDateString("fr-FR")}`)] }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "MISSIONS", bold: true })] })] }),
                                        new TableCell({ children: [new Paragraph(exp.description || "-")] }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "COMPÉTENCES", bold: true })] })] }),
                                        new TableCell({ children: [new Paragraph(exp.competencyIds.map((id: string) => `• ${getCompetencyLabel(id)}`).join("\n"))] }),
                                    ],
                                }),
                            ],
                        }),
                    ]),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `PASSEPORT_NDRC_${student.lastName.toUpperCase()}.docx`);
    },

    generateJournal: async (student: any, logs: any[]) => {
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
                            ...logs.map((l: any) => new TableRow({
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

    generateEvaluationGrid: async (student: any, evaluation: any, type: string) => {
        // Placeholder for official grid in Word
        alert("L'export Word des grilles officielles est en cours de validation. Utilisez l'export PDF pour le moment.");
    },

    /**
     * Génère un support pédagogique général (Dossier Prof, Étudiant, Planning, etc.)
     * Convertit les tableaux Markdown en tableaux natifs Word.
     */
    generateAISupport: async (metadata: any, content: string, track: string) => {
        const { title, filename } = metadata;
        
        const tableData = MarkdownParser.extractTable(content);
        const textOnly = MarkdownParser.removeTables(content);

        const children: any[] = [
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
    }
};

