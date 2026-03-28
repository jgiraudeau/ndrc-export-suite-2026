import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL || "";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
    console.log("--- Seeding Sophie Martin ---");
    
    try {
        // 1. Trouver le professeur
        const teacher = await prisma.teacher.findFirst({
            where: { email: "jacques.giraudeau@gmail.com" }
        });

        if (!teacher) {
            console.error("Professeur Jacques non trouvé. Utilisez Jacques.giraudeau@gmail.com");
            return;
        }

        // 2. Créer une classe si elle n'existe pas
        let testClass = await prisma.class.findFirst({
            where: { code: "NDRC1", teacherId: teacher.id }
        });

        if (!testClass) {
            testClass = await prisma.class.create({
                data: {
                    code: "NDRC1",
                    name: "BTS NDRC 1ère Année",
                    teacherId: teacher.id
                }
            });
            console.log("Classe créée : NDRC1");
        }

        // 3. Créer Sophie Martin
        const passwordHash = await bcrypt.hash("password123", 10);
        const sophie = await prisma.student.upsert({
            where: { identifier: "sophie.martin" },
            update: { passwordHash },
            create: {
                firstName: "Sophie",
                lastName: "Martin",
                identifier: "sophie.martin",
                passwordHash: passwordHash,
                teacherId: teacher.id,
                classId: testClass.id
            }
        });

        console.log("Étudiante Sophie Martin configurée !");
        console.log("- Identifiant : sophie.martin");
        console.log("- Mot de passe : password123");
        console.log("- Classe : NDRC1");

    } catch (err) {
        console.error("Erreur Prisma :", err);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
