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
- Si des documents de cours sont fournis dans le contexte, appuie-toi dessus en priorité.
- Ne mélange jamais les épreuves E5A et E5B.
- Pour E5B, considère qu'il s'agit d'une épreuve pratique sur CMS (WordPress/PrestaShop), sauf si une source de contexte dit explicitement le contraire.
- Si le contexte est insuffisant ou contradictoire, dis-le clairement au lieu d'inventer.`;

const BASE_RAG_METADATA_FILTER = 'source_type="knowledge_folder"';
const E5B_RAG_METADATA_FILTER = `${BASE_RAG_METADATA_FILTER} AND (
  source_path="NDRC/E5B_Pratique/annexe-circulaire-fonctionnalite-e5b-2026-cms.pdf" OR
  source_path="NDRC/E5B_Pratique/WordPress/wordpress.docx" OR
  source_path="NDRC/E5B_Pratique/PrestaShop/prestashop.docx" OR
  source_path="NDRC/bloc2/sujets E5B/wordpress.docx" OR
  source_path="NDRC/bloc2/sujets E5B/prestashop.docx"
)`;
const E5B_SAFE_FALLBACK_RESPONSE = `Pour l'épreuve E5B du BTS NDRC, il s'agit d'une épreuve ponctuelle pratique (pas une épreuve orale).
Elle porte sur la relation client à distance et la digitalisation, avec des manipulations sur WordPress et PrestaShop.

Si tu veux, je peux te détailler ensuite le format, la durée et le type de tâches attendues.`;

function normalizeForIntentDetection(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function shouldUseE5BFocusedFilter(message: string): boolean {
  const normalizedMessage = normalizeForIntentDetection(message);
  const mentionsE5B = /\be5b\b/.test(normalizedMessage);
  const mentionsCmsExamContext =
    normalizedMessage.includes("epreuve") &&
    (normalizedMessage.includes("wordpress") ||
      normalizedMessage.includes("prestashop") ||
      normalizedMessage.includes("presta"));

  return mentionsE5B || mentionsCmsExamContext;
}

function resolveChatRagMetadataFilter(message: string): string {
  if (shouldUseE5BFocusedFilter(message)) {
    return E5B_RAG_METADATA_FILTER;
  }
  return BASE_RAG_METADATA_FILTER;
}

function isLikelyIncorrectE5BAnswer(answer: string): boolean {
  const normalizedAnswer = normalizeForIntentDetection(answer);
  const mentionsOralOrInterview =
    normalizedAnswer.includes("epreuve orale") ||
    normalizedAnswer.includes("est une epreuve orale") ||
    normalizedAnswer.includes("entretien avec le jury") ||
    normalizedAnswer.includes("entretien oral");

  const mentionsPracticalCms =
    (normalizedAnswer.includes("pratique") &&
      (normalizedAnswer.includes("wordpress") || normalizedAnswer.includes("prestashop"))) ||
    normalizedAnswer.includes("epreuve ponctuelle pratique");

  return mentionsOralOrInterview && !mentionsPracticalCms;
}

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
  const isE5BFocusedQuestion = shouldUseE5BFocusedFilter(message);
  const ragMetadataFilter = resolveChatRagMetadataFilter(message);

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
        if (isE5BFocusedQuestion && !ragStoreName) {
          fullContent = E5B_SAFE_FALLBACK_RESPONSE;
          controller.enqueue(
            encoder.encode('data: ' + JSON.stringify({ chunk: fullContent }) + '\n\n')
          );
        } else if (isE5BFocusedQuestion) {
          // Pour E5B, on agrège d'abord la réponse puis on applique un garde-fou anti confusion oral/pratique.
          for await (const chunk of generateTextStream(systemPrompt, geminiHistory, {
            fileSearchStoreNames: [ragStoreName!],
            metadataFilter: ragMetadataFilter,
            fileSearchTopK: 8,
            temperature: 0.2,
          })) {
            fullContent += chunk;
          }

          if (isLikelyIncorrectE5BAnswer(fullContent)) {
            fullContent = E5B_SAFE_FALLBACK_RESPONSE;
          }

          controller.enqueue(
            encoder.encode('data: ' + JSON.stringify({ chunk: fullContent }) + '\n\n')
          );
        } else {
          for await (const chunk of generateTextStream(systemPrompt, geminiHistory, {
            fileSearchStoreNames: ragStoreName ? [ragStoreName] : undefined,
            metadataFilter: ragStoreName ? ragMetadataFilter : undefined,
            fileSearchTopK: ragStoreName ? 8 : undefined,
            temperature: 0.2,
          })) {
            fullContent += chunk;
            controller.enqueue(
              encoder.encode('data: ' + JSON.stringify({ chunk }) + '\n\n')
            );
          }
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
