const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
console.log('Available models on prisma:');
console.log(Object.keys(prisma).filter(k => !k.startsWith('_') && k !== '$connect' && k !== '$disconnect' && k !== '$executeRaw' && k !== '$queryRaw' && k !== '$transaction' && k !== '$use'));
process.exit(0);
