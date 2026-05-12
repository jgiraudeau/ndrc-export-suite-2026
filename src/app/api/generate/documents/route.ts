import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, extractToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const payload = await verifyToken(token);
  if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Accès réservé aux formateurs' }, { status: 403 });
  }

  const documents = await prisma.savedDocument.findMany({
    where: { teacherId: payload.sub },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      documentType: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const payload = await verifyToken(token);
  if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Accès réservé aux formateurs' }, { status: 403 });
  }

  const { title, content, documentType } = await req.json();
  if (!title || !content || !documentType) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
  }

  const doc = await prisma.savedDocument.create({
    data: { title, content, documentType, teacherId: payload.sub },
  });

  return NextResponse.json({ id: doc.id });
}

export async function DELETE(req: NextRequest) {
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const payload = await verifyToken(token);
  if (!payload || (payload.role !== 'TEACHER' && payload.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Accès réservé aux formateurs' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID requis' }, { status: 400 });
  }

  // Vérifier que le document appartient bien à ce formateur
  const doc = await prisma.savedDocument.findFirst({
    where: { id, teacherId: payload.sub },
  });
  if (!doc) {
    return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
  }

  await prisma.savedDocument.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
