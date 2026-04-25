export type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAST_DUE';
export type PaymentProvider = 'PAYPAL' | 'STRIPE';
export type PaymentType = 'SUBSCRIPTION' | 'TIER_SUBSCRIPTION' | 'PAYOUT';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PayoutStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';

export type Subscription = {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  provider: PaymentProvider;
  providerSubId: string | null;
  createdAt: string;
  updatedAt: string;
  plan?: Plan;
};

export type ArtistTier = {
  id: string;
  artistId: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  benefits: string[];
  maxMembers: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
};

export type TierSubscription = {
  id: string;
  tierId: string;
  subscriberId: string;
  artistId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  provider: PaymentProvider;
  providerSubId: string | null;
  createdAt: string;
  updatedAt: string;
  tier?: ArtistTier;
  subscriber?: { id: string; username: string; displayName: string | null; avatar: string | null };
};

export type Payment = {
  id: string;
  userId: string;
  provider: PaymentProvider;
  providerTransactionId: string | null;
  amount: number;
  currency: string;
  type: PaymentType;
  status: PaymentStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type Invoice = {
  id: string;
  paymentId: string;
  items: unknown[];
  total: number;
  status: 'PAID' | 'UNPAID' | 'VOID';
  pdfUrl: string | null;
  createdAt: string;
};

export type Payout = {
  id: string;
  artistId: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: PayoutStatus;
  note: string | null;
  requestedAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  paidAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  artist?: { id: string; username: string; displayName: string | null; avatar: string | null };
  approver?: { id: string; username: string; displayName: string | null } | null;
};

export type TierContent = {
  id: string;
  tierId: string;
  artworkId: string;
  description: string | null;
  createdAt: string;
};

export type CheckoutResult = {
  checkoutUrl: string;
  sessionId: string;
  provider: PaymentProvider;
};

export type RevenueStats = {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayouts: number;
  totalPayouts: number;
  subscriberCount: number;
};
