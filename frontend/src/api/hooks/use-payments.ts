import type { ArtistTier, Payout, Plan, RevenueStats, Subscription, TierSubscription } from '@gr/shared';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { E } from '../endpoints';

type PlansResponse = { message: string; data: Plan[] };
type SubscriptionResponse = { message: string; data: Subscription | null };
type TiersResponse = { message: string; data: ArtistTier[] };
type PayoutsResponse = { message: string; data: Payout[] };
type RevenueResponse = { message: string; data: RevenueStats };
type CheckoutResponse = { message: string; data: { checkoutUrl: string; sessionId: string } };
type PortalResponse = { message: string; data: { url: string } };

export function usePlans() {
  const { getToken } = useAuth();
  apiClient.setTokenGetter(getToken);

  return useQuery({
    queryKey: ['payments', 'plans'],
    queryFn: () => apiClient.get<PlansResponse>(E.payments.plans()),
  });
}

export function useMySubscription() {
  const { getToken, isSignedIn } = useAuth();
  apiClient.setTokenGetter(getToken);

  return useQuery({
    queryKey: ['payments', 'subscription', 'me'],
    queryFn: () => apiClient.get<SubscriptionResponse>(E.payments.subscription.me()),
    enabled: !!isSignedIn,
  });
}

export function useCreateSubscriptionCheckout() {
  const { getToken } = useAuth();
  apiClient.setTokenGetter(getToken);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId }: { planId: string }) =>
      apiClient.post<CheckoutResponse>(E.payments.subscription.checkout(), { planId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'subscription'] });
    },
  });
}

export function useSyncCheckoutSession() {
  const { getToken } = useAuth();
  apiClient.setTokenGetter(getToken);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId }: { sessionId: string }) =>
      apiClient.post<{ message: string; data: Subscription | TierSubscription | null }>(
        E.payments.checkout.sync(),
        { sessionId },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['artist-tier-previews'] });
      queryClient.invalidateQueries({ queryKey: ['artist-artworks'] });
    },
  });
}

export function useSubscriptionPortal() {
  const { getToken } = useAuth();
  apiClient.setTokenGetter(getToken);

  return useMutation({
    mutationFn: () => apiClient.post<PortalResponse>(E.payments.subscription.portal()),
  });
}

export function useCancelSubscription() {
  const { getToken } = useAuth();
  apiClient.setTokenGetter(getToken);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post<{ message: string }>(E.payments.subscription.cancel()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'subscription'] });
    },
  });
}

export function useMyPayments() {
  const { getToken, isSignedIn } = useAuth();
  apiClient.setTokenGetter(getToken);

  return useQuery({
    queryKey: ['payments', 'history'],
    queryFn: () => apiClient.get<{ message: string; data: unknown[] }>(E.payments.history()),
    enabled: !!isSignedIn,
  });
}

// Artist Tiers
export function useMyTiers() {
  const { getToken, isSignedIn } = useAuth();
  apiClient.setTokenGetter(getToken);

  return useQuery({
    queryKey: ['payments', 'tiers', 'me'],
    queryFn: () => apiClient.get<TiersResponse>(E.payments.tiers.me()),
    enabled: !!isSignedIn,
  });
}

export function useCreateTier() {
  const { getToken } = useAuth();
  apiClient.setTokenGetter(getToken);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description?: string; price: number; currency?: string; benefits?: string[]; maxMembers?: number }) =>
      apiClient.post<{ message: string; data: ArtistTier }>(E.payments.tiers.create(), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'tiers'] });
    },
  });
}

export function useUpdateTier() {
  const { getToken } = useAuth();
  apiClient.setTokenGetter(getToken);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tierId, data }: { tierId: string; data: Partial<ArtistTier> }) =>
      apiClient.patch<{ message: string; data: ArtistTier }>(E.payments.tiers.update(tierId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'tiers'] });
    },
  });
}

export function useDeleteTier() {
  const { getToken } = useAuth();
  apiClient.setTokenGetter(getToken);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tierId: string) =>
      apiClient.delete<{ message: string }>(E.payments.tiers.delete(tierId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'tiers'] });
    },
  });
}

export function useTierSubscribers() {
  const { getToken, isSignedIn } = useAuth();
  apiClient.setTokenGetter(getToken);

  return useQuery({
    queryKey: ['payments', 'tiers', 'subscribers'],
    queryFn: () => apiClient.get<{ message: string; data: TierSubscription[] }>(E.payments.tiers.subscribers()),
    enabled: !!isSignedIn,
  });
}

export function useSubscribedTiers() {
  const { getToken, isSignedIn } = useAuth();
  apiClient.setTokenGetter(getToken);

  return useQuery({
    queryKey: ['payments', 'tiers', 'subscribed'],
    queryFn: () => apiClient.get<{ message: string; data: TierSubscription[] }>(E.payments.tiers.subscribed()),
    enabled: !!isSignedIn,
  });
}

export function useSubscribeToTier() {
  const { getToken } = useAuth();
  apiClient.setTokenGetter(getToken);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tierId }: { tierId: string }) =>
      apiClient.post<CheckoutResponse>(E.payments.tiers.subscribe(tierId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'tiers'] });
    },
  });
}

export function useUnsubscribeFromTier() {
  const { getToken } = useAuth();
  apiClient.setTokenGetter(getToken);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tierId: string) =>
      apiClient.delete<{ message: string }>(E.payments.tiers.unsubscribe(tierId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'tiers'] });
    },
  });
}

// Payouts
export function useMyPayouts() {
  const { getToken, isSignedIn } = useAuth();
  apiClient.setTokenGetter(getToken);

  return useQuery({
    queryKey: ['payments', 'payouts'],
    queryFn: () => apiClient.get<PayoutsResponse>(E.payments.payouts.me()),
    enabled: !!isSignedIn,
  });
}

export function useRequestPayout() {
  const { getToken } = useAuth();
  apiClient.setTokenGetter(getToken);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ amount, note }: { amount: number; note?: string }) =>
      apiClient.post<{ message: string; data: Payout }>(E.payments.payouts.request(), { amount, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'payouts'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'revenue'] });
    },
  });
}

export function useMyRevenue() {
  const { getToken, isSignedIn } = useAuth();
  apiClient.setTokenGetter(getToken);

  return useQuery({
    queryKey: ['payments', 'revenue'],
    queryFn: () => apiClient.get<RevenueResponse>(E.payments.payouts.revenue()),
    enabled: !!isSignedIn,
  });
}

// Admin Payouts
export function useAllPayouts(status?: string) {
  const { getToken } = useAuth();
  apiClient.setTokenGetter(getToken);

  return useQuery({
    queryKey: ['admin', 'payouts', status],
    queryFn: () => apiClient.get<PayoutsResponse>(E.admin.payouts.list(status)),
  });
}

export function useApprovePayout() {
  const { getToken } = useAuth();
  apiClient.setTokenGetter(getToken);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payoutId: string) =>
      apiClient.patch<{ message: string }>(E.admin.payouts.approve(payoutId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] });
    },
  });
}

export function useRejectPayout() {
  const { getToken } = useAuth();
  apiClient.setTokenGetter(getToken);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payoutId, reason }: { payoutId: string; reason: string }) =>
      apiClient.patch<{ message: string }>(E.admin.payouts.reject(payoutId), { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] });
    },
  });
}

export function useMarkPayoutPaid() {
  const { getToken } = useAuth();
  apiClient.setTokenGetter(getToken);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payoutId: string) =>
      apiClient.patch<{ message: string }>(E.admin.payouts.markPaid(payoutId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] });
    },
  });
}
