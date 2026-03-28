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
    console.log("--- Reset Password Professeur ---");
    const email = "jacques.giraudeau@gmail.com";
    
    try {
        const passwordHash = await bcrypt.hash("password123", 10);
        const updated = await prisma.teacher.update({
            where: { email },
            data: { passwordHash }
        });
        console.log(`Mot de passe réinitialisé pour : ${email}`);
        console.log("Nouveau mot de passe : password123");
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
