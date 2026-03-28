import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from '@/lib/ai/gemini';

const SYSTEM_TUTOR = `Tu es un tuteur pédagogique expert du BTS NDRC (Négociation et Digitalisation de la Relation Client).
Tu aides les étudiants à comprendre leur cours, préparer leurs examens (E4, E5, E6) et maîtriser les outils numériques (WordPress, PrestaShop, CRM).

RÈGLES :
- Sois toujours bienveillant, encourageant et pédagogue.
- Donne des exemples concrets tirés du monde commercial et du BTS NDRC.
- Ne fournis jamais directement les réponses aux exercices, mais guide l'étudiant.
- Utilise des emojis parcimonieusement pour rendre la réponse plus lisible.`;

const ChatSchema = z.object({
  message: z.string().min(1, 'Le message est requis'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history } = ChatSchema.parse(body);

    // Build conversation context
    const historyText = history
      .slice(-10) // Keep last 10 messages for context
      .map(m => `${m.role === 'user' ? 'Étudiant' : 'Tuteur'} : ${m.content}`)
      .join('\n\n');

    const userMessage = historyText
      ? `Contexte de la conversation :\n${historyText}\n\nÉtudiant : ${message}`
      : message;

    const content = await generateText(SYSTEM_TUTOR, userMessage);

    return NextResponse.json({ content, role: 'model' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Erreur chatbot:', error);
    return NextResponse.json({ error: 'Erreur du tuteur IA.' }, { status: 500 });
  }
}
