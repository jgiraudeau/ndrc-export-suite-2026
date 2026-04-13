import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai/gemini";
import { QUIZ_EXPORT_PROMPTS } from "@/lib/ai/prompts";
import * as XLSX from "xlsx";

type QuizFormat = keyof typeof QUIZ_EXPORT_PROMPTS;

type WooclapQuestion = {
    title: string;
    answers: string[];
    correct?: number[];
};

type WooclapPayload = {
    questions: WooclapQuestion[];
};

function isWooclapPayload(value: unknown): value is WooclapPayload {
    if (typeof value !== "object" || value === null) return false;
    if (!("questions" in value)) return false;
    if (!Array.isArray((value as { questions: unknown }).questions)) return false;

    return (value as { questions: unknown[] }).questions.every((q) => {
        if (typeof q !== "object" || q === null) return false;
        const candidate = q as { title?: unknown; answers?: unknown; correct?: unknown };
        return (
            typeof candidate.title === "string" &&
            Array.isArray(candidate.answers) &&
            candidate.answers.every((a) => typeof a === "string") &&
            (candidate.correct === undefined ||
                (Array.isArray(candidate.correct) &&
                    candidate.correct.every((i) => typeof i === "number")))
        );
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as { content?: unknown; format?: unknown };
        const content = typeof body.content === "string" ? body.content : "";
        const format = typeof body.format === "string" ? body.format : "";

        if (!content || !format) {
            return NextResponse.json({ error: "Missing content or format" }, { status: 400 });
        }

        if (!(format in QUIZ_EXPORT_PROMPTS)) {
            return NextResponse.json({ error: "Invalid format" }, { status: 400 });
        }
        const formatKey = format as QuizFormat;
        const prompt = QUIZ_EXPORT_PROMPTS[formatKey];
        if (!prompt) {
            return NextResponse.json({ error: "Invalid format" }, { status: 400 });
        }

        const transformed = await generateText(prompt, content);

        if (formatKey === "wooclap") {
            try {
                // Parse AI JSON response
                // Gemini sometimes wraps code in ```json ... ```
                const jsonStr = transformed.replace(/```json|```/g, "").trim();
                const parsed = JSON.parse(jsonStr) as unknown;
                if (!isWooclapPayload(parsed)) {
                    throw new Error("Invalid Wooclap payload structure");
                }
                
                // Create Wooclap Excel format
                const wsData: Array<Array<string | number>> = [
                    ["Question", "Type", "Proposition 1", "Proposition 2", "Proposition 3", "Proposition 4", "Correcte(s)"]
                ];

                parsed.questions.forEach((q) => {
                    const answers = q.answers.slice(0, 4);
                    const paddedAnswers = [
                        ...answers,
                        ...Array(Math.max(0, 4 - answers.length)).fill(""),
                    ];
                    const row = [
                        q.title,
                        "QCM",
                        ...paddedAnswers,
                        (q.correct || [0]).map((i) => i + 1).join(",")
                    ];
                    wsData.push(row);
                });

                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.aoa_to_sheet(wsData);
                XLSX.utils.book_append_sheet(wb, ws, "Quiz");
                
                const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

                return new NextResponse(buffer, {
                    headers: {
                        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        "Content-Disposition": 'attachment; filename="quiz_wooclap.xlsx"',
                    },
                });
            } catch (e) {
                console.error("Wooclap generation error", e);
                return NextResponse.json({ error: "Failed to parse Wooclap JSON from AI", detail: transformed }, { status: 500 });
            }
        }

        // For GIFT and Google (CSV), return plain text
        const contentType = formatKey === "google" ? "text/csv" : "text/plain";
        const extension = formatKey === "google" ? "csv" : "txt";

        return new NextResponse(transformed, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `attachment; filename="quiz_export.${extension}"`,
            },
        });

    } catch (error: unknown) {
        console.error("Quiz export error:", error);
        const message = error instanceof Error ? error.message : "Quiz export failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
