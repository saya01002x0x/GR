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

  admin: {
    dashboard: {
      stats: () => '/admin/dashboard/stats',
    },
    announcements: {
      list: () => '/admin/announcements',
      create: () => '/admin/announcements',
      toggle: (id: string) => `/admin/announcements/${id}`,
      delete: (id: string) => `/admin/announcements/${id}`,
    },
    users: {
      list: (search?: string, role?: string) => {
        const params = new URLSearchParams();
        if (search) {
          params.set('search', search);
        }
        if (role) {
          params.set('role', role);
        }
        return `/admin/users${params.toString() ? `?${params.toString()}` : ''}`;
      },
      ban: (userId: string) => `/admin/users/${userId}/ban`,
      unban: (userId: string) => `/admin/users/${userId}/unban`,
      patrol: (userId: string) => `/admin/users/${userId}/patrol`,
      role: (userId: string) => `/admin/users/${userId}/role`,
    },
    staff: {
      list: () => '/admin/staff',
    },
    ranking: {
      weights: () => '/admin/ranking/weights',
    },
    artworks: {
      flagged: () => '/admin/artworks/flagged',
      reports: (artworkId: string) => `/admin/artworks/${artworkId}/reports`,
      approve: (id: string) => `/admin/artworks/${id}/approve`,
      reject: (id: string) => `/admin/artworks/${id}/reject`,
    },
    reports: {
      resolved: (page = 1, limit = 20) => `/admin/reports/resolved?page=${page}&limit=${limit}`,
      myHistory: (page = 1, limit = 20) => `/admin/reports/my-history?page=${page}&limit=${limit}`,
    },
    auditLogs: {
      list: (action?: string) => {
        const params = new URLSearchParams();
        if (action) {
          params.set('action', action);
        }
        return `/admin/audit-logs${params.toString() ? `?${params.toString()}` : ''}`;
      },
    },
    analytics: {
      overview: () => '/admin/analytics/overview',
      growth: (days = 30) => `/admin/analytics/growth?days=${days}`,
      trendingTags: () => '/admin/analytics/tags/trending',
    },
  },

  search: {
    artworks: (params: URLSearchParams) => `/search/artworks?${params.toString()}`,
  },
};
