/**
 * useCollections hook
 * Handle user collections and saving artworks
 */

import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';
import useSWR from 'swr';
import { authFetcher, deleteFetcher, postFetcher } from '@/libs/fetcher';

export type Collection = {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  isDefault: boolean;
  artworkCount: number;
  createdAt: string;
};

type CollectionsResponse = {
  data: Collection[];
};

export function useCollections() {
  const { getToken, isSignedIn } = useAuth();

  const { data, error, mutate } = useSWR<CollectionsResponse>(
    isSignedIn ? '/collections' : null,
    async (url: string) => {
      const token = await getToken();
      return authFetcher(url, token);
    },
  );

  const createCollection = useCallback(
    async (name: string, isPrivate = true) => {
      if (!isSignedIn) {
        return;
      }

      const token = await getToken();
      const response = await postFetcher('/collections', token, {
        name,
        isPrivate,
      });

      mutate();
      return response.data as Collection;
    },
    [getToken, isSignedIn, mutate],
  );

  const deleteCollection = useCallback(
    async (collectionId: string) => {
      if (!isSignedIn) {
        return;
      }

      const token = await getToken();
      await deleteFetcher(`/collections/${collectionId}`, token);
      mutate();
    },
    [getToken, isSignedIn, mutate],
  );

  return {
    collections: data?.data ?? [],
    isLoading: !error && !data && isSignedIn,
    error,
    createCollection,
    deleteCollection,
    mutate,
  };
}

/**
 * Hook to manage which collections contain an artwork
 */
export function useArtworkCollections(artworkId: string) {
  const { getToken, isSignedIn } = useAuth();
  const { collections, mutate: mutateCollections } = useCollections();

  const toggleCollection = useCallback(
    async (collectionId: string, isCurrentlyInCollection: boolean) => {
      if (!isSignedIn) {
        return;
      }

      const token = await getToken();

      if (isCurrentlyInCollection) {
        await deleteFetcher(
          `/collections/${collectionId}/artworks/${artworkId}`,
          token,
        );
      } else {
        await postFetcher(`/collections/${collectionId}/artworks`, token, {
          artworkId,
        });
      }

      mutateCollections();
    },
    [artworkId, getToken, isSignedIn, mutateCollections],
  );

  const addToCollection = useCallback(
    async (collectionId: string) => {
      if (!isSignedIn) {
        return;
      }

      const token = await getToken();
      await postFetcher(`/collections/${collectionId}/artworks`, token, {
        artworkId,
      });
      mutateCollections();
    },
    [artworkId, getToken, isSignedIn, mutateCollections],
  );

  return {
    collections,
    toggleCollection,
    addToCollection,
    isSignedIn,
  };
}
