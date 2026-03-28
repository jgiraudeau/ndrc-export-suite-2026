import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai/gemini";
import { QUIZ_EXPORT_PROMPTS } from "@/lib/ai/prompts";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
    try {
        const { content, format } = await req.json();

        if (!content || !format) {
            return NextResponse.json({ error: "Missing content or format" }, { status: 400 });
        }

        const prompt = (QUIZ_EXPORT_PROMPTS as any)[format];
        if (!prompt) {
            return NextResponse.json({ error: "Invalid format" }, { status: 400 });
        }

        const transformed = await generateText(prompt, content);

        if (format === "wooclap") {
            try {
                // Parse AI JSON response
                // Gemini sometimes wraps code in ```json ... ```
                const jsonStr = transformed.replace(/```json|```/g, "").trim();
                const data = JSON.parse(jsonStr);
                
                // Create Wooclap Excel format
                const wsData = [
                    ["Question", "Type", "Proposition 1", "Proposition 2", "Proposition 3", "Proposition 4", "Correcte(s)"]
                ];

                data.questions.forEach((q: any) => {
                    const row = [
                        q.title,
                        "QCM",
                        ...(q.answers.slice(0, 4)),
                        ...Array(Math.max(0, 4 - q.answers.length)).fill(""),
                        (q.correct || [0]).map((i: number) => i + 1).join(",")
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
        const contentType = format === "google" ? "text/csv" : "text/plain";
        const extension = format === "google" ? "csv" : "txt";

        return new NextResponse(transformed, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `attachment; filename="quiz_export.${extension}"`,
            },
        });

    } catch (error: any) {
        console.error("Quiz export error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
