import type { ApiResponse, Collection } from '@gr/shared';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { apiClient } from '../client';
import { E } from '../endpoints';

type CollectionsResponse = ApiResponse<Collection[]>;

export function useCollections() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['collections', 'list'],
    queryFn: () => apiClient.get<CollectionsResponse>(E.collections.list()),
    enabled: !!isSignedIn,
  });

  const createMutation = useMutation({
    mutationFn: ({ name, isPrivate }: { name: string; isPrivate?: boolean }) =>
      apiClient.post<ApiResponse<Collection>>(E.collections.create(), {
        name,
        isPrivate: isPrivate ?? true,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (collectionId: string) =>
      apiClient.delete<ApiResponse<void>>(E.collections.delete(collectionId)),
  });

  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['collections'] });
  }, [queryClient]);

  useEffect(() => {
    if (createMutation.isSuccess || deleteMutation.isSuccess) {
      invalidate();
    }
  }, [createMutation.isSuccess, deleteMutation.isSuccess, invalidate]);

  return {
    collections: data?.data ?? [],
    isLoading,
    error,
    createCollection: createMutation.mutateAsync,
    deleteCollection: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useArtworkCollections(artworkId: string) {
  const { getToken, isSignedIn } = useAuth();
  const { collections, isLoading } = useCollections();

  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: ({
      collectionId,
      isCurrentlyInCollection,
    }: {
      collectionId: string;
      isCurrentlyInCollection: boolean;
    }) => {
      if (isCurrentlyInCollection) {
        return apiClient.delete<ApiResponse<void>>(
          E.collections.removeArtwork(collectionId, artworkId),
        );
      }
      return apiClient.post<ApiResponse<void>>(
        E.collections.addArtwork(collectionId),
        { artworkId },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  const addMutation = useMutation({
    mutationFn: (collectionId: string) =>
      apiClient.post<ApiResponse<void>>(E.collections.addArtwork(collectionId), {
        artworkId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  return {
    collections,
    isLoading,
    toggleCollection: toggleMutation.mutateAsync,
    addToCollection: addMutation.mutateAsync,
    isSignedIn: !!isSignedIn,
    isToggling: toggleMutation.isPending,
    isAdding: addMutation.isPending,
  };
}
