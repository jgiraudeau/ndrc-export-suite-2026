import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL || "";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
    console.log("--- Liste des Étudiants ---");
    try {
        const students = await prisma.student.findMany();
        console.log("Nombre d'étudiants :", students.length);
        students.forEach(s => {
            console.log(`- ${s.firstName} ${s.lastName} (Identifiant: ${s.identifier})`);
        });
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
