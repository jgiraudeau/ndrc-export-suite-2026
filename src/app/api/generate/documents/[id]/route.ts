import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, extractToken } from '@/lib/jwt';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const payload = await verifyToken(token);
  if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Accès réservé aux formateurs' }, { status: 403 });
  }

  const { id } = await params;
  const doc = await prisma.savedDocument.findFirst({
    where: { id, teacherId: payload.sub },
  });

  if (!doc) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
  }

  return NextResponse.json({ document: doc });
}
