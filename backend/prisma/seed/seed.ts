import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FAKER_SEED } from './seed-config';
import { seedUsers } from './seeders/users.seeder';
import { seedTags } from './seeders/tags.seeder';
import { seedArtworks } from './seeders/artworks.seeder';
import { seedTiers } from './seeders/tiers.seeder';
import { seedInteractions } from './seeders/interactions.seeder';
import { seedAdmin } from './seeders/admin.seeder';

async function main() {
  console.log('🌱 Starting deterministic seed...');
  console.log(`   Faker Seed: ${FAKER_SEED}`);

  faker.seed(FAKER_SEED);
  const prisma = new PrismaClient();

  try {
    // Dynamically read folder names
    const imagesBaseDir = path.join(__dirname, '../seed-data/images');
    let folders: string[] = [];
    try {
      const allFiles = await fs.readdir(imagesBaseDir);
      folders = allFiles.filter(f => f.match(/^a\d{2}-/)).sort();
    } catch (e) {
      console.warn('⚠️ Could not read images directory.');
    }

    if (folders.length === 0) {
      console.log('⚠️ No artwork folders found in prisma/seed-data/images/');
      return;
    }

    console.log(`   Found folders: ${folders.join(', ')}`);

    console.log('1. Seeding Users...');
    const { userMap, artistFolderMap } = await seedUsers(prisma, folders);

    console.log('2. Seeding Tags...');
    const tagMap = await seedTags(prisma, folders);

    console.log('3. Seeding Artworks and uploading to MinIO...');
    const { artworks, artworkFolderMap } = await seedArtworks(prisma, artistFolderMap, tagMap, folders);

    if (artworks.length > 0) {
      console.log('4. Seeding Artist Tiers...');
      await seedTiers(prisma, artistFolderMap, artworks, folders);

      console.log('5. Seeding Interactions (Views, Likes, Comments)...');
      await seedInteractions(prisma, userMap, artworks, artworkFolderMap, folders);

      console.log('6. Seeding Admin Data (Reports, Announcements)...');
      await seedAdmin(prisma, userMap, artworks);
    } else {
      console.log('⚠️ No artworks were seeded. Make sure to put images in prisma/seed-data/images/');
    }

    console.log('✅ Seed completed! Data is 100% deterministic.');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
