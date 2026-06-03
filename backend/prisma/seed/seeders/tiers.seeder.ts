import { PrismaClient } from '@prisma/client';

export async function seedTiers(prisma: PrismaClient, artistFolderMap: Map<string, string>, artworks: any[], folders: string[]) {
  // Use the first 5 folders as "prolific" artists to give them Silver/Gold tiers
  const PROLIFIC_FOLDERS = folders.slice(0, 5);
  
  for (const folder of PROLIFIC_FOLDERS) {
    const artistId = artistFolderMap.get(folder);
    if (!artistId) continue;

    // Create Silver Tier
    const silverTier = await prisma.artistTier.create({
      data: {
        artistId,
        name: 'Silver Supporter',
        description: 'Cảm ơn bạn đã ủng hộ! Mở khóa các bức tranh độc quyền.',
        price: 50000,
        currency: 'VND',
        benefits: ['Xem ảnh chất lượng cao', 'Tải ảnh gốc không watermark'],
        isActive: true,
      }
    });

    // Link tier-gated artworks to this tier
    const artistGatedArtworks = artworks.filter(a => a.authorId === artistId && a.visibility === 'TIER_GATED');
    
    // Assign half of the gated artworks to Silver tier
    for (let i = 0; i < artistGatedArtworks.length / 2; i++) {
      const artwork = artistGatedArtworks[i];
      await prisma.artwork.update({
        where: { id: artwork.id },
        data: { requiredTierId: silverTier.id }
      });
      await prisma.tierContent.create({
        data: {
          tierId: silverTier.id,
          artworkId: artwork.id,
          description: 'Nội dung độc quyền cho Silver Supporter'
        }
      });
    }

    // Create Gold Tier
    const goldTier = await prisma.artistTier.create({
      data: {
        artistId,
        name: 'Gold Supporter',
        description: 'Ủng hộ lớn! Xem trước tất cả tranh mới nhất.',
        price: 100000,
        currency: 'VND',
        benefits: ['Tất cả quyền lợi Silver', 'Xem sớm tác phẩm 1 tuần', 'Yêu cầu vẽ theo ý thích'],
        isActive: true,
      }
    });

    // Assign the other half to Gold tier
    for (let i = Math.floor(artistGatedArtworks.length / 2); i < artistGatedArtworks.length; i++) {
      const artwork = artistGatedArtworks[i];
      await prisma.artwork.update({
        where: { id: artwork.id },
        data: { requiredTierId: goldTier.id }
      });
      await prisma.tierContent.create({
        data: {
          tierId: goldTier.id,
          artworkId: artwork.id,
          description: 'Nội dung độc quyền cho Gold Supporter'
        }
      });
    }
  }
}
