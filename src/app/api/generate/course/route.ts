import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildSystemPrompt, DOCUMENT_TYPE_LABELS, DocumentType } from '@/lib/ai/prompts';
import { generateText } from '@/lib/ai/gemini';
import {
  ensureGlobalFileSearchStore,
} from '@/lib/ai/file-search';
import { prisma } from '@/lib/prisma';
import { verifyToken, extractToken, type JWTPayload } from '@/lib/jwt';
import { checkRateLimit } from '@/lib/rate-limit';
import { checkAiQuota, logAiUsage } from '@/lib/ai-usage';

const GenerateSchema = z.object({
  topic: z.string().min(3, 'Le sujet est requis'),
  documentType: z.enum([
    'dossier_prof', 'dossier_etudiant', 'fiche_deroulement',
    'evaluation', 'quiz', 'planning_annuel',
    'jeu_de_role', 'jeu_de_role_evenement',
    'sujet_e5b_wp', 'sujet_e5b_presta',
  ] as const),
  track: z.string().default('NDRC'),
  durationHours: z.number().min(1).max(20).optional(),
  targetBlock: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, 'ai:generate-course', 30, 60 * 60 * 1000);
  if (rateLimit) return rateLimit;

  let actor: JWTPayload | null = null;
  let promptChars = 0;
  let responseChars = 0;

  try {
    // 1. Vérification de l'authentification
    const token = extractToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Accès réservé aux formateurs' }, { status: 403 });
    }
    actor = payload;
    const teacherId = payload.sub;

    // 2. Validation des données
    const body = await req.json();
    const { topic, documentType, track, durationHours, targetBlock } =
      GenerateSchema.parse(body);

    // 3. Préparation du prompt
    const systemPrompt = buildSystemPrompt(documentType as DocumentType, track);

    let userMessage = `Génère le document demandé sur le thème suivant :\n\n**Thème** : ${topic}`;
    if (durationHours) userMessage += `\n**Durée souhaitée** : ${durationHours} heures`;
    if (targetBlock) userMessage += `\n**Bloc ciblé** : ${targetBlock}`;
    userMessage += `\n\nUtilise le référentiel BTS ${track}.`;
    
    // Ajout de la consigne d'extraction de nom de fichier (comme dans profvirtuel)
    userMessage += `\n\nIMPORTANT : La première ligne de ta réponse doit être un commentaire HTML caché contenant un nom de fichier court et simplifié (max 30 chars, pas d'espace, pas d'accents, use des underscores). Format : \`<!-- FILENAME: Nom_Fichier -->\`.`;
    promptChars = systemPrompt.length + userMessage.length;

    const quota = await checkAiQuota(req, payload, 'teacher.generate_course');
    if (quota) return quota;

    // 4. Préparer le store RAG global (piloté par l'admin)
    let ragStoreName: string | null = null;
    try {
      ragStoreName = await ensureGlobalFileSearchStore();
    } catch (err) {
      console.error('[generate/course][file-search] Unable to resolve global RAG store:', err);
    }

    // 5. Appel Gemini (avec RAG si disponible)
    const rawContent = await generateText(systemPrompt, userMessage, {
      fileSearchStoreNames: ragStoreName ? [ragStoreName] : undefined,
    });
    responseChars = rawContent.length;

    // 6. Extraction du nom de fichier et nettoyage
    let content = rawContent;
    let filename = `${topic.slice(0, 20).replace(/\s+/g, '_')}_${documentType}`;
    
    const filenameMatch = rawContent.match(/<!--\s*FILENAME:\s*(.*?)\s*-->/);
    if (filenameMatch) {
      filename = filenameMatch[1].trim();
      content = rawContent.replace(filenameMatch[0], '').trim();
    }

    // 7. Sauvegarde en base de données
    const savedDoc = await prisma.savedDocument.create({
      data: {
        title: topic,
        content: content,
        documentType: documentType,
        teacherId: teacherId,
      }
    });

    await logAiUsage({
      actor: payload,
      feature: 'teacher.generate_course',
      model: 'gemini-2.5-flash-lite',
      status: 'success',
      promptChars,
      responseChars,
      metadata: { documentType, track, rag: Boolean(ragStoreName), savedDocumentId: savedDoc.id },
      request: req,
    });

    return NextResponse.json({
      id: savedDoc.id,
      content,
      documentType,
      label: DOCUMENT_TYPE_LABELS[documentType as DocumentType],
      filename,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Erreur génération IA:', error);
    if (actor) {
      await logAiUsage({
        actor,
        feature: 'teacher.generate_course',
        model: 'gemini-2.5-flash-lite',
        status: 'error',
        promptChars,
        responseChars,
        errorMessage: error instanceof Error ? error.message : 'Erreur génération IA',
        request: req,
      });
    }
    return NextResponse.json(
      { error: 'Erreur lors de la génération. Réessayez.' },
      { status: 500 }
    );
  }
}
