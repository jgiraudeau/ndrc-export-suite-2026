import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel, TextRun, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import { TRANSVERSAL_REFERENTIAL } from "@/data/transversal-referential";

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

    generateAISupport: async (metadata: any, content: string, track: string) => {
        const { title, filename } = metadata;
        const doc = new Document({
            sections: [{
                children: [
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
                    ...content.split("\n").map((line: string) => {
                        const trimmed = line.trim();
                        if (trimmed.startsWith("#")) {
                            return new Paragraph({
                                text: trimmed.replace(/#/g, "").trim(),
                                heading: HeadingLevel.HEADING_2,
                                spacing: { before: 200, after: 100 }
                            });
                        }
                        return new Paragraph({
                            children: [new TextRun(trimmed || " ")]
                        });
                    }),
                    new Paragraph({ text: "", spacing: { before: 400 } }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "VISA FORMATEUR :", bold: true })] })] }),
                                    new TableCell({ children: [new Paragraph({ text: "                                        " })] }),
                                ]
                            })
                        ]
                    })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${filename || "Support_NDRC"}.docx`);
    }
};
