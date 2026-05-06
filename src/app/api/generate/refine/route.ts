import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from '@/lib/ai/gemini';
import { requireAuth } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/rate-limit';
import { checkAiQuota, logAiUsage } from '@/lib/ai-usage';

const RefineSchema = z.object({
  currentContent: z.string().min(10, 'Le contenu à affiner est requis'),
  instruction: z.string().min(5, "L'instruction est requise"),
  track: z.string().default('NDRC'),
});

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, 'ai:generate-refine', 30, 60 * 60 * 1000);
  if (rateLimit) return rateLimit;

  const auth = await requireAuth(req, ['TEACHER', 'ADMIN']);
  if ('status' in auth) return auth;

  try {
    const body = await req.json();
    const { currentContent, instruction, track } = RefineSchema.parse(body);
    const quota = await checkAiQuota(req, auth.payload, 'teacher.refine_document');
    if (quota) return quota;

    const systemPrompt = `Tu es un Éditeur Pédagogique Senior expert du BTS ${track}.
Ta mission est d'améliorer ou modifier le document pédagogique fourni en suivant STRICTEMENT les instructions.

RÈGLES D'OR :
1. CONSERVE la structure Markdown existante sauf si l'instruction demande de la changer.
2. RESPECTE les référentiels officiels du BTS ${track}.
3. NE SOIS PAS BAVARD : Renvoie uniquement le document modifié complet.

Instruction : "${instruction}"`;

    const userMessage = `Voici le contenu actuel à modifier :\n\n${currentContent}`;

    const content = await generateText(systemPrompt, userMessage);

    await logAiUsage({
      actor: auth.payload,
      feature: 'teacher.refine_document',
      model: 'gemini-2.5-flash-lite',
      status: 'success',
      promptChars: systemPrompt.length + userMessage.length,
      responseChars: content.length,
      metadata: { track },
      request: req,
    });

    return NextResponse.json({ content, documentType: 'refined' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Erreur affinage IA:', error);
    await logAiUsage({
      actor: auth.payload,
      feature: 'teacher.refine_document',
      model: 'gemini-2.5-flash-lite',
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Erreur affinage IA',
      request: req,
    });
    return NextResponse.json(
      { error: 'Erreur lors de l\'affinage. Réessayez.' },
      { status: 500 }
    );
  }
}
