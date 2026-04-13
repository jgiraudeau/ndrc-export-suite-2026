import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as {
      title?: unknown;
      type?: unknown;
      description?: unknown;
      startDate?: unknown;
      endDate?: unknown;
      competencyIds?: unknown;
      status?: unknown;
      feedback?: unknown;
    };
    
    // Whitelist fields that can be updated
    const { title, type, description, startDate, endDate, competencyIds, status, feedback } = body;

    const updateData: Prisma.ProfessionalExperienceUpdateInput = {};
    if (typeof title === "string") updateData.title = title.trim();
    if (typeof type === "string") updateData.type = type.trim();
    if (typeof description === "string") updateData.description = description;
    if (startDate !== undefined) {
      const parsedStartDate = new Date(String(startDate));
      if (!Number.isNaN(parsedStartDate.getTime())) {
        updateData.startDate = parsedStartDate;
      }
    }
    if (endDate !== undefined) {
      if (endDate === null || endDate === "") {
        updateData.endDate = null;
      } else {
        const parsedEndDate = new Date(String(endDate));
        if (!Number.isNaN(parsedEndDate.getTime())) {
          updateData.endDate = parsedEndDate;
        }
      }
    }
    if (Array.isArray(competencyIds) && competencyIds.every((id) => typeof id === "string")) {
      updateData.competencyIds = competencyIds;
    }
    if (typeof status === "string") updateData.status = status;
    if (feedback === null || typeof feedback === "string") updateData.feedback = feedback;

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.professionalExperience.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE experience error:", error);
    return NextResponse.json({ error: "Failed to delete experience" }, { status: 500 });
  }
}
