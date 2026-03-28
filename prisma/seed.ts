import "dotenv/config";
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import fs from "fs"
import path from "path"
import bcrypt from "bcryptjs"

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function resetAndSeed() {
  console.log("🌱 Début du Seeding...")

  // 1. Création de l'Administrateur par défaut
  const adminEmail = "jacques.giraudeau@gmail.com"
  const passwordHash = await bcrypt.hash("chfcarantec2025$", 10)
  
  const admin = await prisma.teacher.upsert({
    where: { email: adminEmail },
    update: { passwordHash, status: "active" },
    create: {
      email: adminEmail,
      name: "Jacques Giraudeau (Admin)",
      passwordHash,
      status: "active",
      consentGivenAt: new Date()
    }
  })
  console.log(`✅ Admin vérifié : ${admin.email}`)

  // 2. Importation des Référentiels E4 et E6
  const blocks = ['e4', 'e6']
  
  for (const block of blocks) {
    const filePath = path.join(__dirname, `referentiel_${block}.json`)
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      
      for (const domain of data) {
        for (let i = 0; i < domain.children.length; i++) {
          const skill = domain.children[i]
          const code = `${domain.code}_${i + 1}`
          
          const competency = await prisma.competency.upsert({
            where: { code },
            update: { description: skill.description, block: block.toUpperCase() },
            create: {
              code,
              description: skill.description,
              block: block.toUpperCase(),
              criteria: {
                create: skill.criteria.map((desc: string) => ({
                  description: desc,
                  weight: 1.0
                }))
              }
            }
          })
          console.log(`✅ Compétence chargée : ${competency.code}`)
        }
      }
    } else {
      console.warn(`⚠️ Fichier introuvable : ${filePath}`)
    }
  }

  console.log("🌱 Seeding terminé avec succès !")
}

resetAndSeed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
