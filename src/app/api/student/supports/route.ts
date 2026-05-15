import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-helpers';

const TEACHER_ONLY_TYPES = ['dossier_prof'];

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ['STUDENT']);
  if ('status' in auth) return auth;

  const student = await prisma.student.findUnique({
    where: { id: auth.payload.sub },
    select: { classId: true },
  });

  if (!student) return NextResponse.json({ error: 'Élève introuvable' }, { status: 404 });

  const documents = await prisma.savedDocument.findMany({
    where: {
      classId: student.classId,
      sharedWithStudents: true,
      documentType: { notIn: TEACHER_ONLY_TYPES },
    },
    orderBy: [{ theme: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      documentType: true,
      theme: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ documents });
}
