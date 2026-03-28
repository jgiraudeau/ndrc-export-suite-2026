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
    console.log("--- Diagnostic Professeur ---");
    console.log("Connexion à :", connectionString.split("@")[1]);
    
    try {
        const teachers = await prisma.teacher.findMany();
        console.log("Nombre de professeurs trouvés :", teachers.length);

        if (teachers.length === 0) {
            console.log("Aucun professeur trouvé. Création d'un compte par défaut...");
            const passwordHash = await bcrypt.hash("password123", 10);
            const newTeacher = await prisma.teacher.create({
                data: {
                    name: "Professeur Test",
                    email: "prof@test.com",
                    passwordHash: passwordHash,
                    status: "approved"
                }
            });
            console.log("Compte créé : prof@test.com / password123");
        } else {
            teachers.forEach(t => {
                console.log(`- ${t.name} (${t.email}) [Statut: ${t.status}]`);
            });
        }
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
