import { NextRequest } from 'next/server';
import { z } from 'zod';
import { generateTextStream } from '@/lib/ai/gemini';
import { ensureGlobalFileSearchStore } from '@/lib/ai/file-search';
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
  sessionId: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  // Auth
  const token = extractToken(req);
  if (!token) {
    return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401 });
  }
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'STUDENT') {
    return new Response(JSON.stringify({ error: 'Accès refusé' }), { status: 403 });
  }

  const studentId = payload.sub;

  let body: z.infer<typeof ChatSchema>;
  try {
    body = ChatSchema.parse(await req.json());
  } catch {
    return new Response(JSON.stringify({ error: 'Données invalides' }), { status: 400 });
  }
  const { message, sessionId: providedSessionId } = body;

  // 1. Session
  let session;
  if (providedSessionId) {
    session = await prisma.chatSession.findUnique({
      where: { id: providedSessionId, studentId },
    });
  }
  if (!session) {
    session = await prisma.chatSession.create({
      data: { title: message.substring(0, 50), studentId },
    });
  }

  // 2. Historique (20 derniers messages)
  const chatHistory = await prisma.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: 'asc' },
    take: 20,
  });

  // 3. RAG global (piloté par l'admin)
  let ragStoreName: string | null = null;
  try {
    ragStoreName = await ensureGlobalFileSearchStore();
  } catch (err) {
    console.error('[chat][file-search] Unable to resolve global store:', err);
  }

  // 4. Construire l'historique au format Gemini
  const geminiHistory = chatHistory.map((m) => ({
    role: m.role as 'user' | 'model',
    parts: [{ text: m.content }],
  }));
  // Ajouter le message courant
  geminiHistory.push({ role: 'user', parts: [{ text: message }] });

  const systemPrompt = SYSTEM_TUTOR;

  // 5. Sauvegarder le message utilisateur
  await prisma.chatMessage.create({
    data: { sessionId: session.id, role: 'user', content: message },
  });

  // 6. Streamer la réponse
  const stream = new ReadableStream({
    async start(controller) {
      // Envoyer le sessionId en premier chunk (format JSON sur une ligne)
      controller.enqueue(
        encoder.encode(
          'data: ' + JSON.stringify({ sessionId: session!.id }) + '\n\n'
        )
      );

      let fullContent = '';
      try {
        for await (const chunk of generateTextStream(systemPrompt, geminiHistory, {
          fileSearchStoreNames: ragStoreName ? [ragStoreName] : undefined,
        })) {
          fullContent += chunk;
          controller.enqueue(
            encoder.encode('data: ' + JSON.stringify({ chunk }) + '\n\n')
          );
        }

        // Sauvegarder la réponse complète
        await prisma.chatMessage.create({
          data: { sessionId: session!.id, role: 'model', content: fullContent },
        });

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        console.error('Streaming error:', err);
        controller.enqueue(
          encoder.encode(
            'data: ' + JSON.stringify({ error: 'Erreur IA' }) + '\n\n'
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
