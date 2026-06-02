import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { E } from '../endpoints';

/**
 * Tier preview data for the Membership tab
 * Shows tier cards with blurred artwork previews
 */
export type TierPreviewArtwork = {
  id: string;
  blurredUrl: string | null;
  aspectRatio: number;
};

export type TierPreview = {
  tier: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    benefits: string[];
    memberCount: number;
  };
  isSubscribed: boolean;
  totalArtworks: number;
  previewArtworks: TierPreviewArtwork[];
};

type TierPreviewsResponse = {
  message: string;
  data: TierPreview[];
};

export function useArtistTierPreviews(identifier: string) {
  const { getToken, isLoaded } = useAuth();
  apiClient.setTokenGetter(getToken);

  const { data, isLoading, error } = useQuery({
    queryKey: ['artist-tier-previews', identifier],
    queryFn: () =>
      apiClient.get<TierPreviewsResponse>(
        E.users.artistTierPreviews(identifier),
      ),
    enabled: isLoaded && !!identifier,
  });

  return {
    tierPreviews: data?.data ?? [],
    isLoading,
    error,
  };
}
