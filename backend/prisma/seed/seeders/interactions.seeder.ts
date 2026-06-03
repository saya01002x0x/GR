import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { POPULARITY_TIERS, COMMENT_POOL } from '../seed-config';
import { seededRandomInRange, pickRandomElements, pickRandomElement } from '../seed-utils';

function getArtworkTier(artistFolder: string, folders: string[]) {
  const index = folders.indexOf(artistFolder);
  if (index === 0 || index === 2) return POPULARITY_TIERS.TOP;
  if (index === 1 || index === 3 || index === 4) return POPULARITY_TIERS.MID;
  return POPULARITY_TIERS.LOW;
}

export async function seedInteractions(prisma: PrismaClient, userMap: Map<string, string>, artworks: any[], artworkFolderMap: Map<string, string>, folders: string[]) {
  const allUserIds = Array.from(userMap.values());
  
  // 1. Follows
  // Let's create some deterministic follow relationships
  // All fake users will follow the main artist and a few other top artists
  const mainArtistId = userMap.get('main_artist');
  if (mainArtistId) {
    for (const userId of allUserIds) {
      if (userId === mainArtistId) continue;
      // 80% chance to follow main artist
      if (faker.number.float() < 0.8) {
        await prisma.follow.upsert({
          where: { followerId_followingId: { followerId: userId, followingId: mainArtistId } },
          update: {},
          create: { followerId: userId, followingId: mainArtistId }
        });
      }
    }
  }

  // 2. Views, Likes, Comments
  for (const artwork of artworks) {
    const folder = artworkFolderMap.get(artwork.id);
    if (!folder) continue;

    const tier = getArtworkTier(folder, folders);
    const targetViews = seededRandomInRange(tier.viewRange);
    
    // Select viewers
    const viewers = pickRandomElements(allUserIds, Math.min(targetViews, allUserIds.length));
    let actualViews = 0;
    let actualLikes = 0;
    let actualComments = 0;

    for (const viewerId of viewers) {
      // Create View
      actualViews++;
      await prisma.userInteraction.upsert({
        where: { userId_artworkId_action: { userId: viewerId, artworkId: artwork.id, action: 'VIEW' } },
        update: {},
        create: { userId: viewerId, artworkId: artwork.id, action: 'VIEW', weight: 1 }
      });

      // Create Like
      if (faker.number.float() < tier.likeRatio) {
        actualLikes++;
        await prisma.like.upsert({
          where: { userId_artworkId: { userId: viewerId, artworkId: artwork.id } },
          update: {},
          create: { userId: viewerId, artworkId: artwork.id }
        });
        await prisma.userInteraction.upsert({
          where: { userId_artworkId_action: { userId: viewerId, artworkId: artwork.id, action: 'LIKE' } },
          update: {},
          create: { userId: viewerId, artworkId: artwork.id, action: 'LIKE', weight: 3 }
        });
      }

      // Create Comment
      if (faker.number.float() < tier.commentRatio) {
        actualComments++;
        const commentText = pickRandomElement(COMMENT_POOL);
        await prisma.comment.create({
          data: {
            content: commentText,
            userId: viewerId,
            artworkId: artwork.id,
          }
        });
        await prisma.userInteraction.upsert({
          where: { userId_artworkId_action: { userId: viewerId, artworkId: artwork.id, action: 'COMMENT' } },
          update: {},
          create: { userId: viewerId, artworkId: artwork.id, action: 'COMMENT', weight: 2 }
        });
      }
    }

    // 3. Update Artwork Counters
    // View có thể sinh ảo vì 1 user có thể reload xem nhiều lần (hoặc có guest view).
    // Nhưng Like và Comment thì phải chính xác 100% bằng với số người thực tế.
    await prisma.artwork.update({
      where: { id: artwork.id },
      data: {
        viewCount: targetViews,
        likeCount: actualLikes,
        commentCount: actualComments,
      }
    });
  }

  // 4. Bookmarks
  // Add some bookmarks to default collections
  for (const userId of allUserIds) {
    const bookmarkedArtworks = pickRandomElements(artworks, 5);
    for (const artwork of bookmarkedArtworks) {
      await prisma.bookmark.upsert({
        where: { userId_artworkId_collectionId: { userId, artworkId: artwork.id, collectionId: `default_${userId}` } },
        update: {},
        create: {
          userId,
          artworkId: artwork.id,
          collectionId: `default_${userId}`
        }
      });
    }
  }
}
