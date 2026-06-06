const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await prisma.$executeRawUnsafe(
      "UPDATE artworks SET rating = 'SAFE' WHERE rating IN ('R18', 'R18G')"
    );
    console.log('Updated artworks to SAFE:', result);
  } catch (e) {
    console.log('No R18 data or error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
