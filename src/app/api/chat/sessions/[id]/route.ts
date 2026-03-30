import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, extractToken } from '@/lib/jwt';

// GET /api/chat/sessions/[id] — Charger les messages d'une session
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { id } = await params;

  // Vérifier que la session appartient à cet étudiant
  const session = await prisma.chatSession.findUnique({
    where: { id, studentId: payload.sub },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: 'Session introuvable' }, { status: 404 });
  }

  return NextResponse.json({ messages: session.messages });
}

// DELETE /api/chat/sessions/[id] — Supprimer une session et ses messages
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = extractToken(req);
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { id } = await params;

  const session = await prisma.chatSession.findUnique({
    where: { id, studentId: payload.sub },
  });

  if (!session) {
    return NextResponse.json({ error: 'Session introuvable' }, { status: 404 });
  }

  await prisma.chatSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
