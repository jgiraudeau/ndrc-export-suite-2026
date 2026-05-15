import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-helpers';

const TEACHER_ONLY_TYPES = ['dossier_prof'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, ['STUDENT']);
  if ('status' in auth) return auth;

  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id: auth.payload.sub },
    select: { classId: true },
  });
  if (!student) return NextResponse.json({ error: 'Élève introuvable' }, { status: 404 });

  const doc = await prisma.savedDocument.findFirst({
    where: {
      id,
      classId: student.classId,
      sharedWithStudents: true,
      documentType: { notIn: TEACHER_ONLY_TYPES },
    },
  });

  if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });

  return NextResponse.json({ document: doc });
}
