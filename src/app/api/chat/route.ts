import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from '@/lib/ai/gemini';
import { prisma } from '@/lib/prisma';
import { verifyToken, extractToken } from '@/lib/jwt';

const SYSTEM_TUTOR = `Tu es un tuteur pédagogique expert du BTS NDRC (Négociation et Digitalisation de la Relation Client).
Tu aides les étudiants à comprendre leur cours, préparer leurs examens (E4, E5, E6) et maîtriser les outils numériques (WordPress, PrestaShop, CRM).

RÈGLES :
- Sois toujours bienveillant, encourageant et pédagogue.
- Donne des exemples concrets tirés du monde commercial et du BTS NDRC.
- Ne fournis jamais directement les réponses aux exercices, mais guide l'étudiant.
- Utilise des emojis parcimonieusement pour rendre la réponse plus lisible.
- Si des documents de cours sont fournis dans le contexte, appuie-toi dessus en priorité.`;

const ChatSchema = z.object({
  message: z.string().min(1, 'Le message est requis'),
  sessionId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "STUDENT") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const { message, sessionId: providedSessionId } = ChatSchema.parse(body);

    const studentId = payload.sub;

    // 1. Gérer la session
    let session;
    if (providedSessionId) {
      session = await prisma.chatSession.findUnique({
        where: { id: providedSessionId, studentId }
      });
    }

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          title: message.substring(0, 40) + "...",
          studentId
        }
      });
    }

    // 2. Récupérer l'historique de la session
    const chatHistory = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
      take: 20
    });

    // 3. Récupérer le contexte formateur (RAG)
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { teacherId: true }
    });

    let contextDocs = "";
    if (student?.teacherId) {
      const docs = await prisma.savedDocument.findMany({
        where: { teacherId: student.teacherId },
        orderBy: { createdAt: 'desc' },
        take: 3
      });
      
      if (docs.length > 0) {
        contextDocs = "\n\nCONTEXTE PÉDAGOGIQUE (Cours de ton formateur) :\n" + 
          docs.map(d => `--- ${d.title} ---\n${d.content}`).join("\n\n");
      }
    }

    // 4. Préparer le message pour Gemini
    const historyText = chatHistory
      .map(m => `${m.role === 'user' ? 'Étudiant' : 'Tuteur'} : ${m.content}`)
      .join('\n\n');

    const promptWithContext = `${SYSTEM_TUTOR}${contextDocs}\n\nHistorique :\n${historyText}\n\nÉtudiant : ${message}`;

    // 5. Appeler Gemini
    const content = await generateText(SYSTEM_TUTOR + contextDocs, message);

    // 6. Sauvegarder les messages
    await prisma.chatMessage.createMany({
      data: [
        { sessionId: session.id, role: 'user', content: message },
        { sessionId: session.id, role: 'model', content }
      ]
    });

    return NextResponse.json({ content, sessionId: session.id, role: 'model' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Erreur chatbot:', error);
    return NextResponse.json({ error: 'Erreur du tuteur IA.' }, { status: 500 });
  }
}
