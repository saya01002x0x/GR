import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StripeService } from './stripe.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  private appUrl: string;
  private commissionRate: number;

  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
    private configService: ConfigService,
  ) {
    this.appUrl = this.configService.get<string>('NEXT_PUBLIC_APP_URL') || 'http://localhost:5146';
    this.commissionRate = 0.1; // 10%
  }

  private toSubscriptionStatus(status?: string): 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAST_DUE' {
    switch (status) {
      case 'active':
      case 'trialing':
        return 'ACTIVE';
      case 'past_due':
      case 'unpaid':
      case 'incomplete':
      case 'incomplete_expired':
        return 'PAST_DUE';
      case 'canceled':
        return 'CANCELED';
      default:
        return 'EXPIRED';
    }
  }

  private toPeriodEnd(periodEnd?: number | null) {
    return periodEnd ? new Date(periodEnd * 1000) : null;
  }

  private async ensureStripeCustomer(user: { id: string; email: string; displayName?: string | null; stripeCustomerId?: string | null }) {
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    const customer = await this.stripe.createCustomer({
      email: user.email,
      name: user.displayName || undefined,
      userId: user.id,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  // ==================== PLANS ====================

  async getPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getPlanById(planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async createPlan(data: {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    features?: string[];
  }) {
    return this.prisma.plan.create({
      data: {
        ...data,
        currency: data.currency || 'VND',
        features: data.features || [],
      },
    });
  }

  async updatePlan(planId: string, data: {
    name?: string;
    description?: string;
    price?: number;
    features?: string[];
    isActive?: boolean;
  }) {
    return this.prisma.plan.update({
      where: { id: planId },
      data,
    });
  }

  // ==================== PLATFORM SUBSCRIPTIONS ====================

  async getMySubscription(userId: string) {
    return this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
  }

  async createCheckoutSession(userId: string, planId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const plan = await this.getPlanById(planId);
    const customerId = await this.ensureStripeCustomer(user);

    const successUrl = `${this.appUrl}/checkout/success`;
    const cancelUrl = `${this.appUrl}/checkout/cancel`;

    return this.stripe.createCheckoutSession({
      planId: plan.id,
      planName: plan.name,
      planPrice: Number(plan.price),
      currency: plan.currency,
      successUrl,
      cancelUrl,
      userId: user.id,
      userEmail: user.email,
      customerId,
    });
  }

  async handleSubscriptionCreated(params: {
    userId: string;
    planId: string;
    providerSubId: string;
    status: 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAST_DUE';
    currentPeriodEnd?: Date | null;
    cancelAtPeriodEnd?: boolean;
  }) {
    const existing = await this.prisma.subscription.findUnique({
      where: { userId: params.userId },
    });

    if (existing) {
      return this.prisma.subscription.update({
        where: { userId: params.userId },
        data: {
          planId: params.planId,
          status: params.status,
          provider: 'STRIPE',
          providerSubId: params.providerSubId,
          currentPeriodEnd: params.currentPeriodEnd,
          cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? false,
        },
      });
    }

    return this.prisma.subscription.create({
      data: {
        userId: params.userId,
        planId: params.planId,
        status: params.status,
        provider: 'STRIPE',
        providerSubId: params.providerSubId,
        currentPeriodEnd: params.currentPeriodEnd,
        cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? false,
      },
    });
  }

  async cancelMySubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    if (subscription.provider === 'STRIPE' && subscription.providerSubId) {
      await this.stripe.cancelSubscription(subscription.providerSubId);
    }

    return this.prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
    });
  }

  async createCustomerPortal(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const customerId = await this.ensureStripeCustomer(user);
    const portal = await this.stripe.createCustomerPortalSession({
      customerId,
      returnUrl: `${this.appUrl}/dashboard/membership`,
    });

    return { url: portal.url };
  }

  // ==================== ARTIST TIERS ====================

  async getMyTiers(artistId: string) {
    return this.prisma.artistTier.findMany({
      where: { artistId, isActive: true },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });
  }

  async createTier(artistId: string, data: {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    benefits?: string[];
    maxMembers?: number;
  }) {
    this.validateTierPrice(data.price);

    return this.prisma.artistTier.create({
      data: {
        ...data,
        currency: data.currency || 'VND',
        benefits: data.benefits || [],
        artistId,
      },
    });
  }

  async updateTier(tierId: string, artistId: string, data: {
    name?: string;
    description?: string;
    price?: number;
    benefits?: string[];
    maxMembers?: number;
    isActive?: boolean;
  }) {
    const tier = await this.prisma.artistTier.findUnique({ where: { id: tierId } });
    if (!tier) throw new NotFoundException('Tier not found');
    if (tier.artistId !== artistId) throw new BadRequestException('Not your tier');
    if (typeof data.price === 'number') {
      this.validateTierPrice(data.price);
    }

    return this.prisma.artistTier.update({
      where: { id: tierId },
      data,
    });
  }

  async deleteTier(tierId: string, artistId: string) {
    const tier = await this.prisma.artistTier.findUnique({ where: { id: tierId } });
    if (!tier) throw new NotFoundException('Tier not found');
    if (tier.artistId !== artistId) throw new BadRequestException('Not your tier');

    return this.prisma.artistTier.update({
      where: { id: tierId },
      data: { isActive: false },
    });
  }

  async getPublicArtistTiers(artistId: string) {
    return this.prisma.artistTier.findMany({
      where: { artistId, isActive: true },
      orderBy: [{ price: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: { select: { subscriptions: true } },
      },
    });
  }

  private validateTierPrice(price: number) {
    if (!Number.isFinite(price) || price <= 0) {
      throw new BadRequestException('Tier price must be greater than 0');
    }

    if (price > 1000) {
      throw new BadRequestException('Tier price cannot exceed 1000');
    }
  }

  async createTierCheckout(
    subscriberId: string,
    tierId: string,
  ) {
    const subscriber = await this.prisma.user.findUnique({ where: { id: subscriberId } });
    if (!subscriber) throw new NotFoundException('User not found');

    const tier = await this.prisma.artistTier.findUnique({
      where: { id: tierId },
      include: { artist: true },
    });
    if (!tier) throw new NotFoundException('Tier not found');
    if (!tier.isActive) throw new BadRequestException('Tier is not active');

    const successUrl = `${this.appUrl}/checkout/success?tier=true`;
    const cancelUrl = `${this.appUrl}/checkout/cancel?tier=true`;
    const customerId = await this.ensureStripeCustomer(subscriber);

    return this.stripe.createTierCheckoutSession({
      tierId: tier.id,
      tierName: tier.name,
      tierPrice: Number(tier.price),
      currency: tier.currency,
      successUrl,
      cancelUrl,
      subscriberId: subscriber.id,
      subscriberEmail: subscriber.email,
      artistId: tier.artistId,
      customerId,
    });
  }

  async handleTierSubscriptionCreated(params: {
    subscriberId: string;
    tierId: string;
    artistId: string;
    providerSubId: string;
    status: 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAST_DUE';
    currentPeriodEnd?: Date | null;
    cancelAtPeriodEnd?: boolean;
  }) {
    const existing = await this.prisma.tierSubscription.findFirst({
      where: { tierId: params.tierId, subscriberId: params.subscriberId, status: 'ACTIVE' },
    });

    if (existing) {
      return this.prisma.tierSubscription.update({
        where: { id: existing.id },
        data: {
          provider: 'STRIPE',
          providerSubId: params.providerSubId,
          status: params.status,
          currentPeriodEnd: params.currentPeriodEnd,
          cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? false,
        },
      });
    }

    return this.prisma.tierSubscription.create({
      data: {
        tierId: params.tierId,
        subscriberId: params.subscriberId,
        artistId: params.artistId,
        provider: 'STRIPE',
        providerSubId: params.providerSubId,
        status: params.status,
        currentPeriodEnd: params.currentPeriodEnd,
        cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? false,
      },
    });
  }

  async cancelMyTierSubscription(subscriberId: string, tierId: string) {
    const subscription = await this.prisma.tierSubscription.findFirst({
      where: { tierId, subscriberId, status: 'ACTIVE' },
    });

    if (!subscription) throw new NotFoundException('No active subscription found');

    if (subscription.provider === 'STRIPE' && subscription.providerSubId) {
      await this.stripe.cancelSubscription(subscription.providerSubId);
    }

    return this.prisma.tierSubscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    });
  }

  async getMyTierSubscriptions(userId: string) {
    return this.prisma.tierSubscription.findMany({
      where: { subscriberId: userId, status: 'ACTIVE' },
      include: { tier: { include: { artist: true } } },
    });
  }

  async getArtistTierSubscribers(artistId: string) {
    return this.prisma.tierSubscription.findMany({
      where: { artistId, status: 'ACTIVE' },
      include: { subscriber: true },
    });
  }

  // ==================== PAYOUTS ====================

  async requestPayout(artistId: string, amount: number, note?: string) {
    const pendingPayouts = await this.prisma.payout.findMany({
      where: { artistId, status: { in: ['PENDING', 'APPROVED'] } },
    });

    const pendingTotal = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0);

    const revenue = await this.prisma.payment.aggregate({
      where: {
        type: 'TIER_SUBSCRIPTION',
        status: 'COMPLETED',
        tierSubscription: { artistId },
      },
      _sum: { amount: true },
    });

    const totalRevenue = Number(revenue._sum.amount || 0);
    const availableAmount = totalRevenue - pendingTotal - totalRevenue * this.commissionRate;

    if (amount > availableAmount) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${availableAmount.toLocaleString('vi-VN')} VND`,
      );
    }

    const fee = amount * 0; // No fee for now
    const netAmount = amount - fee;

    return this.prisma.payout.create({
      data: {
        artistId,
        amount,
        fee,
        netAmount,
        note,
      },
    });
  }

  async getMyPayouts(artistId: string) {
    return this.prisma.payout.findMany({
      where: { artistId },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async getArtistRevenue(artistId: string) {
    const totalRevenue = await this.prisma.payment.aggregate({
      where: {
        type: 'TIER_SUBSCRIPTION',
        status: 'COMPLETED',
        tierSubscription: { artistId },
      },
      _sum: { amount: true },
    });

    const monthlyRevenue = await this.prisma.payment.aggregate({
      where: {
        type: 'TIER_SUBSCRIPTION',
        status: 'COMPLETED',
        tierSubscription: { artistId },
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { amount: true },
    });

    const pendingPayouts = await this.prisma.payout.aggregate({
      where: { artistId, status: { in: ['PENDING', 'APPROVED'] } },
      _sum: { netAmount: true },
    });

    const totalPayouts = await this.prisma.payout.aggregate({
      where: { artistId, status: 'PAID' },
      _sum: { netAmount: true },
    });

    const subscriberCount = await this.prisma.tierSubscription.count({
      where: { artistId, status: 'ACTIVE' },
    });

    return {
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      monthlyRevenue: Number(monthlyRevenue._sum.amount || 0),
      pendingPayouts: Number(pendingPayouts._sum.netAmount || 0),
      totalPayouts: Number(totalPayouts._sum.netAmount || 0),
      subscriberCount,
    };
  }

  async getAllPayouts(status?: string) {
    return this.prisma.payout.findMany({
      where: status ? { status: status as any } : undefined,
      include: { artist: true, approver: true },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async approvePayout(payoutId: string, adminId: string) {
    return this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });
  }

  async rejectPayout(payoutId: string, adminId: string, reason: string) {
    return this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'REJECTED',
        approvedBy: adminId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });
  }

  async markPayoutAsPaid(payoutId: string, adminId: string) {
    return this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'PAID',
        approvedBy: adminId,
        paidAt: new Date(),
      },
    });
  }

  // ==================== PAYMENTS ====================

  async getMyPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async syncPlatformSubscriptionFromStripe(subscription: {
    id: string;
    status?: string;
    cancel_at_period_end?: boolean;
    current_period_end?: number;
    metadata?: Record<string, string>;
  }) {
    const userId = subscription.metadata?.userId;
    const planId = subscription.metadata?.planId;

    if (!userId || !planId) {
      return null;
    }

    return this.handleSubscriptionCreated({
      userId,
      planId,
      providerSubId: subscription.id,
      status: this.toSubscriptionStatus(subscription.status),
      currentPeriodEnd: this.toPeriodEnd(subscription.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    });
  }

  async syncTierSubscriptionFromStripe(subscription: {
    id: string;
    status?: string;
    cancel_at_period_end?: boolean;
    current_period_end?: number;
    metadata?: Record<string, string>;
  }) {
    const subscriberId = subscription.metadata?.subscriberId;
    const tierId = subscription.metadata?.tierId;
    const artistId = subscription.metadata?.artistId;

    if (!subscriberId || !tierId || !artistId) {
      return null;
    }

    return this.handleTierSubscriptionCreated({
      subscriberId,
      tierId,
      artistId,
      providerSubId: subscription.id,
      status: this.toSubscriptionStatus(subscription.status),
      currentPeriodEnd: this.toPeriodEnd(subscription.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    });
  }

  async handleStripeSubscriptionUpdate(subscription: {
    id: string;
    metadata?: Record<string, string>;
    status?: string;
    cancel_at_period_end?: boolean;
    current_period_end?: number;
  }) {
    if (subscription.metadata?.type === 'ARTIST_TIER') {
      return this.syncTierSubscriptionFromStripe(subscription);
    }

    return this.syncPlatformSubscriptionFromStripe(subscription);
  }

  async handleStripeInvoicePaid(invoice: {
    id: string;
    subscription?: string | null;
    amount_paid?: number | null;
    currency?: string | null;
  }) {
    if (!invoice.subscription) {
      return null;
    }

    const [platformSubscription, tierSubscription] = await Promise.all([
      this.prisma.subscription.findFirst({
        where: { providerSubId: invoice.subscription },
      }),
      this.prisma.tierSubscription.findFirst({
        where: { providerSubId: invoice.subscription },
      }),
    ]);

    if (!platformSubscription && !tierSubscription) {
      return null;
    }

    const existingPayment = await this.prisma.payment.findFirst({
      where: { providerTransactionId: invoice.id },
    });

    if (existingPayment) {
      return existingPayment;
    }

    const targetUserId = platformSubscription?.userId || tierSubscription?.subscriberId;
    if (!targetUserId) {
      return null;
    }

    return this.prisma.payment.create({
      data: {
        userId: targetUserId,
        provider: 'STRIPE',
        providerTransactionId: invoice.id,
        amount: Number((invoice.amount_paid || 0) / 100),
        currency: (invoice.currency || 'usd').toUpperCase(),
        type: platformSubscription ? 'SUBSCRIPTION' : 'TIER_SUBSCRIPTION',
        status: 'COMPLETED',
        subscriptionId: platformSubscription?.id,
        tierSubscriptionId: tierSubscription?.id,
      },
    });
  }

  async expireEndedSubscriptions() {
    const now = new Date();

    const [platformResult, tierResult] = await Promise.all([
      this.prisma.subscription.updateMany({
        where: {
          status: { in: ['ACTIVE', 'CANCELED'] },
          currentPeriodEnd: { not: null, lt: now },
          cancelAtPeriodEnd: true,
        },
        data: { status: 'EXPIRED' },
      }),
      this.prisma.tierSubscription.updateMany({
        where: {
          status: { in: ['ACTIVE', 'CANCELED'] },
          currentPeriodEnd: { not: null, lt: now },
          cancelAtPeriodEnd: true,
        },
        data: { status: 'EXPIRED' },
      }),
    ]);

    return { platformExpired: platformResult.count, tierExpired: tierResult.count };
  }

  async createPayment(data: {
    userId: string;
    provider: 'PAYPAL' | 'STRIPE';
    providerTransactionId?: string;
    amount: number;
    currency: string;
    type: 'SUBSCRIPTION' | 'TIER_SUBSCRIPTION' | 'PAYOUT';
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    subscriptionId?: string;
    tierSubscriptionId?: string;
  }) {
    return this.prisma.payment.create({
      data,
    });
  }

  async updatePaymentStatus(
    transactionId: string,
    status: 'COMPLETED' | 'FAILED' | 'REFUNDED',
  ) {
    return this.prisma.payment.updateMany({
      where: { providerTransactionId: transactionId },
      data: { status },
    });
  }
}