import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '@/api/client';
import { E } from '@/api/endpoints';

type DashboardStats = {
  pendingReports: number;
  flaggedContent: number;
  bannedToday: number;
  totalUsers: number;
  totalArtworks: number;
};

type AdminAnnouncement = {
  id: string;
  title: string;
  content: string;
  type: string;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  author: { id: string; username: string; displayName: string | null };
};

type AdminUser = {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatar: string | null;
  role: string;
  isBanned: boolean;
  isArtist: boolean;
  createdAt: string;
  _count: { artworks: number };
};

type AdminUsersResponse = {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
};

type PatrolData = {
  user: {
    id: string;
    username: string;
    email: string;
    displayName: string | null;
    avatar: string | null;
    role: string;
    isBanned: boolean;
    bannedAt: string | null;
    isArtist: boolean;
    createdAt: string;
    _count: { artworks: number; comments: number; likes: number };
  };
  reports: {
    id: string;
    reason: string;
    status: string;
    createdAt: string;
    artwork: { id: string; title: string } | null;
  }[];
};

type StaffMember = {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatar: string | null;
  role: string;
  createdAt: string;
};

type RankingWeights = {
  likeWeight: number;
  viewWeight: number;
  commentWeight: number;
  bookmarkWeight: number;
  timeDecayFactor: number;
};

type PendingReport = {
  id: string;
  reason: string;
  description: string | null;
  createdAt: string;
};

type ModerationImage = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  status?: string;
  errorMetadata?: Record<string, unknown> | null;
  order?: number;
  phash?: string | null;
};

type FlaggedArtwork = {
  id: string;
  title: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    warningCount: number;
    isBanned: boolean;
  };
  images: ModerationImage[];
  _count: { reports: number };
  reports: PendingReport[];
};

type DetailedReport = PendingReport & {
  reporter: { username: string; displayName: string | null };
};

type DetailedArtwork = Omit<FlaggedArtwork, 'author' | 'reports'> & {
  author: FlaggedArtwork['author'] & {
    createdAt: string;
    warnings: { id: string; reason: string; expiresAt: string; createdAt: string }[];
  };
  reports: DetailedReport[];
  duplicateMatches: {
    sourceImage: ModerationImage;
    originalImage: (ModerationImage & {
      artwork: {
        id: string;
        title: string;
        author: { username: string; displayName: string | null };
      };
    }) | null;
    distance: number | null;
    source: 'SYSTEM' | 'REPORT';
  }[];
};

type ResolvedReport = {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  artwork: {
    id: string;
    title: string;
    status: string;
    images: { thumbnailUrl: string | null; url: string }[];
    author: { id: string; username: string; displayName: string | null };
  } | null;
  reporter: { id: string; username: string; displayName: string | null };
  resolvedBy?: { id: string; username: string; displayName: string | null } | null;
};

type AuditLogEntry = {
  id: string;
  action: string;
  details: unknown;
  targetId: string | null;
  targetType: string | null;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    role: string;
  };
};

type Overview = {
  totalUsers: number;
  totalArtworks: number;
  totalViews: number;
  totalLikes: number;
};

type GrowthItem = { date: string; users: number; artworks: number };
type TagItem = { name: string; count: number };

export function useAdminDashboard() {
  const { getToken } = useAuth();
  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);
  return useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => apiClient.get<DashboardStats>(E.admin.dashboard.stats()),
  });
}

export function useAdminAnnouncements() {
  const { getToken } = useAuth();
  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: () => apiClient.get<{ announcements: AdminAnnouncement[] }>(E.admin.announcements.list()),
  });

  const createMutation = useMutation({
    mutationFn: (body: { title: string; content: string; type: string }) =>
      apiClient.post(E.admin.announcements.create(), body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch(E.admin.announcements.toggle(id), { isActive: !isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(E.admin.announcements.delete(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] }),
  });

  return {
    announcements: data?.announcements ?? [],
    isLoading,
    createAnnouncement: createMutation.mutateAsync,
    toggleAnnouncement: toggleMutation.mutateAsync,
    deleteAnnouncement: deleteMutation.mutateAsync,
  };
}

export function useAdminUsers(search?: string, role?: string, page = 1, limit = 20) {
  const { getToken } = useAuth();
  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', search, role, page, limit],
    queryFn: () => apiClient.get<AdminUsersResponse>(E.admin.users.list(search, role, page, limit)),
  });

  const banMutation = useMutation({
    mutationFn: ({ userId, isBanned }: { userId: string; isBanned: boolean }) =>
      apiClient.patch(isBanned ? E.admin.users.unban(userId) : E.admin.users.ban(userId), {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  return {
    users: data?.users ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    isLoading,
    banUser: banMutation.mutateAsync,
  };
}

export function useAdminUserPatrol(userId: string) {
  const { getToken } = useAuth();
  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);
  return useQuery({
    queryKey: ['admin', 'users', userId, 'patrol'],
    queryFn: () => apiClient.get<PatrolData>(E.admin.users.patrol(userId)),
    enabled: !!userId,
  });
}

export function useAdminStaff() {
  const { getToken } = useAuth();
  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'staff'],
    queryFn: () => apiClient.get<StaffMember[]>(E.admin.staff.list()),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiClient.patch(E.admin.users.role(userId), { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] }),
  });

  const demoteMutation = useMutation({
    mutationFn: (userId: string) =>
      apiClient.patch(E.admin.users.role(userId), { role: 'USER' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] }),
  });

  return {
    staff: data ?? [],
    isLoading,
    changeRole: roleMutation.mutateAsync,
    demoteUser: demoteMutation.mutateAsync,
  };
}

export function useAdminRanking() {
  const { getToken } = useAuth();
  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'ranking', 'weights'],
    queryFn: () => apiClient.get<RankingWeights>(E.admin.ranking.weights()),
  });

  const saveMutation = useMutation({
    mutationFn: (weights: RankingWeights) =>
      apiClient.put(E.admin.ranking.weights(), weights),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'ranking', 'weights'] }),
  });

  return {
    weights: data ?? null,
    isLoading,
    saveWeights: saveMutation.mutateAsync,
  };
}

export function useAdminFlaggedArtworks() {
  const { getToken } = useAuth();
  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'artworks', 'flagged'],
    queryFn: () => apiClient.get<{ artworks: FlaggedArtwork[] }>(E.admin.artworks.flagged()),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      apiClient.patch(E.admin.artworks[action](id), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'artworks', 'flagged'] });
    },
  });

  return {
    artworks: data?.artworks ?? [],
    isLoading,
    takeAction: actionMutation.mutateAsync,
  };
}

export function useAdminArtworkReports(artworkId: string | null) {
  const { getToken } = useAuth();
  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);
  return useQuery({
    queryKey: ['admin', 'artworks', artworkId, 'reports'],
    queryFn: () => apiClient.get<DetailedArtwork>(E.admin.artworks.reports(artworkId!)),
    enabled: !!artworkId,
  });
}

export function useAdminResolvedReports(page = 1) {
  const { getToken } = useAuth();
  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);
  return useQuery({
    queryKey: ['admin', 'reports', 'resolved', page],
    queryFn: () => apiClient.get<{ reports: ResolvedReport[]; total: number }>(E.admin.reports.resolved(page)),
  });
}

export function useAdminMyHistory(page = 1) {
  const { getToken } = useAuth();
  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);
  return useQuery({
    queryKey: ['admin', 'reports', 'my-history', page],
    queryFn: () => apiClient.get<{ reports: ResolvedReport[]; total: number }>(E.admin.reports.myHistory(page)),
  });
}

export function useAdminAuditLogs(action?: string) {
  const { getToken } = useAuth();
  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);
  return useQuery({
    queryKey: ['admin', 'audit-logs', action],
    queryFn: () => apiClient.get<{ logs: AuditLogEntry[] }>(E.admin.auditLogs.list(action)),
  });
}

export function useAdminAnalytics() {
  const { getToken } = useAuth();
  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);

  const overviewQuery = useQuery({
    queryKey: ['admin', 'analytics', 'overview'],
    queryFn: () => apiClient.get<Overview>(E.admin.analytics.overview()),
  });

  const growthQuery = useQuery({
    queryKey: ['admin', 'analytics', 'growth'],
    queryFn: () => apiClient.get<GrowthItem[]>(E.admin.analytics.growth(30)),
  });

  const tagsQuery = useQuery({
    queryKey: ['admin', 'analytics', 'trending-tags'],
    queryFn: () => apiClient.get<TagItem[]>(E.admin.analytics.trendingTags()),
  });

  return {
    overview: overviewQuery.data ?? null,
    overviewLoading: overviewQuery.isLoading,
    growth: growthQuery.data ?? [],
    growthLoading: growthQuery.isLoading,
    tags: tagsQuery.data ?? [],
    tagsLoading: tagsQuery.isLoading,
    isLoading: overviewQuery.isLoading || growthQuery.isLoading || tagsQuery.isLoading,
  };
}

export function useAdminUserProfile() {
  const { getToken } = useAuth();
  useEffect(() => {
    apiClient.setTokenGetter(getToken);
  }, [getToken]);
  return useQuery({
    queryKey: ['admin', 'users', 'me'],
    queryFn: () => apiClient.get<{ role: string }>(E.users.me()),
  });
}
