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

  discover: {
    hero: () => '/artworks/discover/hero',
    featured: () => '/artworks/discover/featured',
    ranking: (timeframe: 'daily' | 'weekly' | 'monthly' | 'rookie' = 'daily') =>
      `/artworks/ranking?timeframe=${timeframe}`,
    risingStars: () => '/artworks/rising-stars',
    popularTags: () => '/artworks/popular-tags',
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
    artistDetail: (identifier: string) => `/users/artists/${identifier}`,
    artistArtworks: (identifier: string, limit: number, offset: number, filter?: string) =>
      `/users/artists/${identifier}/artworks?limit=${limit}&offset=${offset}${filter ? `&filter=${filter}` : ''}`,
    artistTierPreviews: (identifier: string) =>
      `/users/artists/${identifier}/tier-previews`,
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
      list: (search?: string, role?: string, page = 1, limit = 20) => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
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
    discoverSettings: () => '/admin/discover-settings',
    payouts: {
      list: (status?: string) => {
        const params = new URLSearchParams();
        if (status) {
          params.set('status', status);
        }
        return `/admin/payouts${params.toString() ? `?${params.toString()}` : ''}`;
      },
      approve: (id: string) => `/admin/payouts/${id}/approve`,
      reject: (id: string) => `/admin/payouts/${id}/reject`,
      markPaid: (id: string) => `/admin/payouts/${id}/mark-paid`,
    },
  },

  payments: {
    plans: () => '/payments/plans',
    plan: (id: string) => `/payments/plans/${id}`,
    createPlan: () => '/payments/plans',
    subscription: {
      me: () => '/payments/subscription/me',
      checkout: () => '/payments/subscription/checkout',
      cancel: () => '/payments/subscription/cancel',
      portal: () => '/payments/subscription/portal',
    },
    checkout: {
      sync: () => '/payments/checkout/sync',
    },
    history: () => '/payments/history/me',
    tiers: {
      me: () => '/payments/tiers/me',
      create: () => '/payments/tiers/me',
      update: (id: string) => `/payments/tiers/me/${id}`,
      delete: (id: string) => `/payments/tiers/me/${id}`,
      subscribers: () => '/payments/tiers/me/subscribers',
      subscribed: () => '/payments/tiers/subscribed',
      subscribe: (tierId: string) => `/payments/tiers/${tierId}/subscribe`,
      unsubscribe: (tierId: string) => `/payments/tiers/${tierId}/subscribe`,
    },
    payouts: {
      request: () => '/payments/payouts/me',
      me: () => '/payments/payouts/me',
      revenue: () => '/payments/revenue/me',
    },
  },

  search: {
    artworks: (params: URLSearchParams) => `/search/artworks?${params.toString()}`,
  },

  aiSearch: {
    text: (query: string) => `/ai-search/text?q=${encodeURIComponent(query)}`,
    sketch: () => '/ai-search/sketch',
  },
};
