import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL || "";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("--- Recherche Étudiant : Sophie Martin ---");
    try {
        const student = await prisma.student.findFirst({
            where: {
                OR: [
                    { firstName: { contains: "Sophie", mode: "insensitive" }, lastName: { contains: "Martin", mode: "insensitive" } },
                    { identifier: { contains: "sophie.martin", mode: "insensitive" } }
                ]
            }
        });

        if (student) {
            console.log("Étudiant trouvé :");
            console.log(`- Nom : ${student.firstName} ${student.lastName}`);
            console.log(`- Identifiant : ${student.identifier}`);
        } else {
            console.log("Sophia Martin non trouvée dans la base de données.");
        }
    } catch (err) {
        console.error("Erreur Prisma :", err);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
