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

  // 2. Create Fake Artists (Dynamically based on folders)
  for (let i = 1; i < folders.length; i++) {
    const folder = folders[i];
    const theme = folder.replace(/^a\d{2}-/, ''); // 'car', 'cyberpunk', etc.
    const username = `artist_${theme.replace(/-/g, '_')}`;
    const displayName = theme
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') + ' Studio';
    const clerkId = `fake_artist_${i + 1}`;
    
    const userId = `seed_user_${username}`;
    const createdArtist = await prisma.user.upsert({
      where: { clerkId: clerkId },
      update: {
        isArtist: true,
      },
      create: {
        id: userId,
        clerkId: clerkId,
        email: `${username}@test.com`,
        username: username,
        displayName: displayName,
        isArtist: true,
        avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${username}`,
      }
    });
    userMap.set(username, createdArtist.id);
    artistFolderMap.set(folder, createdArtist.id);
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
