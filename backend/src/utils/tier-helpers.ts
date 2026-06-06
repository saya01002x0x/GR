import { PrismaClient } from '@prisma/client';

/**
 * Gets all accessible tier IDs for a user, including inherited tiers (via parentTierId).
 * @param prisma The Prisma client instance
 * @param viewerId The ID of the user viewing the content
 * @param artistId Optional. If provided, filters subscriptions to a specific artist to optimize.
 * @returns Array of tier IDs that the user can access
 */
export async function getExpandedAccessibleTierIds(
  prisma: PrismaClient,
  viewerId: string,
  artistId?: string,
): Promise<string[]> {
  const subscriptions = await prisma.tierSubscription.findMany({
    where: {
      subscriberId: viewerId,
      status: 'ACTIVE',
      ...(artistId ? { artistId } : {}),
    },
    select: { tierId: true },
  });

  const accessibleSet = new Set<string>();
  let currentTierIds = subscriptions.map((s) => s.tierId);

  while (currentTierIds.length > 0) {
    const newTierIds: string[] = [];
    const tiers = await prisma.artistTier.findMany({
      where: { id: { in: currentTierIds } },
      select: { id: true, parentTierId: true },
    });

    for (const tier of tiers) {
      accessibleSet.add(tier.id);
      if (tier.parentTierId && !accessibleSet.has(tier.parentTierId)) {
        newTierIds.push(tier.parentTierId);
      }
    }
    currentTierIds = newTierIds;
  }

  return Array.from(accessibleSet);
}
