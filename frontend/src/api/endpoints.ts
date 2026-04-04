export const E = {
  artworks: {
    list: (limit = 25, offset = 0) => `/artworks?limit=${limit}&offset=${offset}`,
    byId: (id: string) => `/artworks/${id}`,
    related: (id: string, limit = 6) => `/artworks/${id}/related?limit=${limit}`,
    popular: (limit?: number) =>
      `/artworks/popular${limit ? `?limit=${limit}` : ''}`,
    likeStatus: (id: string) => `/artworks/${id}/like-status`,
    like: (id: string) => `/artworks/${id}/like`,
    byUser: () => '/artworks/user/me',
  },

  collections: {
    list: () => '/collections',
    create: () => '/collections',
    delete: (id: string) => `/collections/${id}`,
    addArtwork: (collectionId: string) =>
      `/collections/${collectionId}/artworks`,
    removeArtwork: (collectionId: string, artworkId: string) =>
      `/collections/${collectionId}/artworks/${artworkId}`,
  },

  comments: {
    list: (artworkId: string, parentId: string | null, limit: number, offset: number) =>
      `/artworks/${artworkId}/comments?parentId=${parentId}&limit=${limit}&offset=${offset}`,
    create: (artworkId: string) => `/artworks/${artworkId}/comments`,
    delete: (id: string) => `/comments/${id}`,
  },

  users: {
    me: () => '/users/me',
    artists: () => '/users/artists',
  },

  notifications: {
    list: (limit = 30) => `/notifications?limit=${limit}`,
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: () => '/notifications/read-all',
    delete: (id: string) => `/notifications/${id}`,
  },

  announcements: {
    active: () => '/announcements/active',
  },

  reports: {
    create: () => '/reports',
  },

  search: {
    artworks: (params: URLSearchParams) => `/search/artworks?${params.toString()}`,
  },
};
