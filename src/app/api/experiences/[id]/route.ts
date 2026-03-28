import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();
    
    // Whitelist fields that can be updated
    const { title, type, description, startDate, endDate, competencyIds, status, feedback } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (competencyIds !== undefined) updateData.competencyIds = competencyIds;
    if (status !== undefined) updateData.status = status;
    if (feedback !== undefined) updateData.feedback = feedback;

    const experience = await prisma.professionalExperience.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(experience);
  } catch (error) {
    console.error("PATCH experience error:", error);
    return NextResponse.json({ error: "Failed to update experience" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    await prisma.professionalExperience.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE experience error:", error);
    return NextResponse.json({ error: "Failed to delete experience" }, { status: 500 });
  }
}
