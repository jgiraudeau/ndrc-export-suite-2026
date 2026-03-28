import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from '@/lib/ai/gemini';

const RefineSchema = z.object({
  currentContent: z.string().min(10, 'Le contenu à affiner est requis'),
  instruction: z.string().min(5, "L'instruction est requise"),
  track: z.string().default('NDRC'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { currentContent, instruction, track } = RefineSchema.parse(body);

    const systemPrompt = `Tu es un Éditeur Pédagogique Senior expert du BTS ${track}.
Ta mission est d'améliorer ou modifier le document pédagogique fourni en suivant STRICTEMENT les instructions.

RÈGLES D'OR :
1. CONSERVE la structure Markdown existante sauf si l'instruction demande de la changer.
2. RESPECTE les référentiels officiels du BTS ${track}.
3. NE SOIS PAS BAVARD : Renvoie uniquement le document modifié complet.

Instruction : "${instruction}"`;

    const userMessage = `Voici le contenu actuel à modifier :\n\n${currentContent}`;

    const content = await generateText(systemPrompt, userMessage);

    return NextResponse.json({ content, documentType: 'refined' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Erreur affinage IA:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'affinage. Réessayez.' },
      { status: 500 }
    );
  }
}
