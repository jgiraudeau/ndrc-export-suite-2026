import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(req: Request) {
  try {
    const { studentId, type } = await req.json();

    // 1. Fetch Student Data & Progress
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        experiences: { where: { status: "VALIDATED" } },
        progress: true
      }
    });

    if (!student) return NextResponse.json({ error: "Étudiant introuvable" }, { status: 404 });

    // 2. Prepare Context (Journal & Missions)
    const context = student.experiences.map(e => `- MISSION: ${e.title}\n  Description: ${e.description}`).join("\n\n");

    // 3. AI Prompt (Using the RAG Knowledge base context we've analyzed)
    const prompt = `
      Tu es un assistant expert du BTS NDRC (Négociation et Digitalisation de la Relation Client).
      Ta mission est d'aider le professeur à diagnostiquer le niveau d'un étudiant pour l'épreuve ${type} sur la session 2025/2026.

      Dossier de l'élève:
      ${context}

      CONSIGNES:
      1. Analyse ses missions par rapport au référentiel officiel du Bloc ${type === 'E4' ? '1' : '3'}.
      2. Pour chaque bloc, propose un niveau (1: Très Insuffisant, 2: Insuffisant, 3: Satisfaisant, 4: Très Satisfaisant).
      3. Justifie brièvement ton choix avec un commentaire pédagogique.

      RÉPONDRE UNIQUEMENT EN JSON avec cette structure:
      {
        "suggestions": [
          { "code": "E4.1", "grade": 3, "feedback": "Très bonne démonstration de prospection digitale sur la mission X." }
        ],
        "globalAnalysis": "Synthèse globale de son dossier..."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON safely
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleanJson);

    return NextResponse.json(data);

  } catch (err) {
    console.error("AI Evaluation Error:", err);
    return NextResponse.json({ error: "L'IA n'a pas pu traiter la demande." }, { status: 500 });
  }
}
