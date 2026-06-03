import { PrismaClient } from '@prisma/client';
import { EXTRA_TAGS_MAP } from '../seed-config';

export async function seedTags(prisma: PrismaClient, folders: string[]) {
  const tagMap = new Map<string, string>();
  const tagsToCreate = new Set<string>();

  // Extract base theme from folder names (e.g. 'a01-anime' -> 'anime')
  for (const folder of folders) {
    const theme = folder.replace(/^a\d{2}-/, '');
    tagsToCreate.add(theme); // The base theme is always a tag
    
    // Add extra tags related to this theme
    const extraTags = EXTRA_TAGS_MAP[theme] || [];
    for (const tag of extraTags) {
      tagsToCreate.add(tag);
    }
  }

  // Create unique tags in DB
  for (const tagName of Array.from(tagsToCreate)) {
    const tag = await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: {
        name: tagName,
        count: 0,
      }
    });
    tagMap.set(tagName, tag.id);
  }

  return tagMap;
}
