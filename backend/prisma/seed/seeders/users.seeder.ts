import { PrismaClient } from '@prisma/client';
import { REAL_USERS, FAKE_ARTISTS, FAKE_USERS, FAKE_MODS } from '../seed-config';

export async function seedUsers(prisma: PrismaClient, folders: string[]) {
  const userMap = new Map<string, string>();
  const artistFolderMap = new Map<string, string>();

  // 1. Create Real Users
  for (const [key, user] of Object.entries(REAL_USERS)) {
    const userId = `seed_user_${user.username}`;
    const createdUser = await prisma.user.upsert({
      where: { clerkId: user.clerkId },
      update: {
        role: user.role,
        isArtist: user.isArtist,
        username: user.username,
        displayName: user.displayName,
      },
      create: {
        id: userId,
        clerkId: user.clerkId,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        isArtist: user.isArtist,
        avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}`,
      }
    });
    userMap.set(user.username, createdUser.id);
    
    // Assign the first folder to the real artist
    if (user.isArtist && folders.length > 0) {
      artistFolderMap.set(folders[0], createdUser.id);
    }
  }

  // 2. Create Fake Artists
  for (let i = 0; i < FAKE_ARTISTS.length; i++) {
    const artist = FAKE_ARTISTS[i];
    const userId = `seed_user_${artist.username}`;
    const createdArtist = await prisma.user.upsert({
      where: { clerkId: artist.clerkId },
      update: {
        isArtist: true,
      },
      create: {
        id: userId,
        clerkId: artist.clerkId,
        email: `${artist.username}@test.com`,
        username: artist.username,
        displayName: artist.displayName,
        isArtist: true,
        avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${artist.username}`,
      }
    });
    userMap.set(artist.username, createdArtist.id);
    
    // Assign remaining folders to fake artists
    if (i + 1 < folders.length) {
      artistFolderMap.set(folders[i + 1], createdArtist.id);
    }
  }

  // 3. Create Fake Users (from config + 20 extra programmatically)
  const allFakeUsers = [...FAKE_USERS];
  for (let i = 1; i <= 20; i++) {
    allFakeUsers.push({
      clerkId: `extra_fake_user_${i}`,
      username: `extra_user_${i}`,
      displayName: `Extra User ${i}`
    });
  }

  for (const user of allFakeUsers) {
    const userId = `seed_user_${user.username}`;
    const createdUser = await prisma.user.upsert({
      where: { clerkId: user.clerkId },
      update: {},
      create: {
        id: userId,
        clerkId: user.clerkId,
        email: `${user.username}@test.com`,
        username: user.username,
        displayName: user.displayName,
        avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}`,
      }
    });
    userMap.set(user.username, createdUser.id);
  }

  // 4. Create Fake Mods
  for (const mod of FAKE_MODS) {
    const userId = `seed_user_${mod.username}`;
    const createdMod = await prisma.user.upsert({
      where: { clerkId: mod.clerkId },
      update: {
        role: mod.role,
      },
      create: {
        id: userId,
        clerkId: mod.clerkId,
        email: `${mod.username}@test.com`,
        username: mod.username,
        displayName: mod.displayName,
        role: mod.role,
        avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${mod.username}`,
      }
    });
    userMap.set(mod.username, createdMod.id);
  }

  // 5. Create Default Collection for all users
  const allUsers = Array.from(userMap.values());
  for (const userId of allUsers) {
    await prisma.collection.upsert({
      where: {
        id: `default_${userId}`,
      },
      update: {},
      create: {
        id: `default_${userId}`, // Fixed ID for idempotency
        userId: userId,
        name: 'Bookmarks',
        isDefault: true,
        isPrivate: true,
      }
    });
  }

  return { userMap, artistFolderMap };
}
