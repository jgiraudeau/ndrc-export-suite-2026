import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, ['TEACHER', 'ADMIN']);
  if ('status' in auth) return auth;

  const classes = await prisma.class.findMany({
    where: { teacherId: auth.payload.sub },
    orderBy: { name: 'asc' },
    select: { id: true, code: true, name: true },
  });

  return NextResponse.json({ classes });
}
