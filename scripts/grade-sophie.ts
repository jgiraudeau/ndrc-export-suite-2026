import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const sophie = await prisma.student.findFirst({
    where: { firstName: "Sophie", lastName: "Martin" }
  });

  if (!sophie) {
    console.error("Sophie not found");
    return;
  }

  console.log(`Grading Sophie (ID: ${sophie.id})...`);

  // We need to grade all competencies for E4 and E6 to enable the button
  // E4 has about 20 competencies, E6 has about 15 in the JSON referentials
  // For the sake of activation, we just need to ensure the entries exist in Progress with teacherStatus
  
  // Actually, the ReferentialGrid checks currentGrades from initialGrades
  // InitialGrades are fetched from student.competencies which come from progress
  
  // Let's create progress entries for a few key ones or just all if we can match the keys
  // The keys in ReferentialGrid are like 'E4.1_0'
  
  const codes = [];
  // E4: 5 blocks, each with multiple children
  for(let i=1; i<=5; i++) for(let j=0; j<10; j++) codes.push(`E4.${i}_${j}`);
  for(let i=1; i<=5; i++) for(let j=0; j<10; j++) codes.push(`E6.${i}_${j}`);

  for (const code of codes) {
    await prisma.progress.upsert({
      where: {
        studentId_competencyId: {
          studentId: sophie.id,
          competencyId: code
        }
      },
      update: {
        teacherStatus: 3,
        teacherFeedback: "Validé lors du test de certification."
      },
      create: {
        studentId: sophie.id,
        competencyId: code,
        teacherStatus: 3,
        teacherFeedback: "Validé lors du test de certification.",
        acquired: true,
        status: 1
      }
    });
  }

  console.log("Sophie is now fully graded! The certification button should be active.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
