import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY') || '';
    this.stripe = new Stripe(secretKey);
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
  }

  async createCheckoutSession(params: {
    planId: string;
    planName: string;
    planPrice: number;
    currency: string;
    successUrl: string;
    cancelUrl: string;
    userId: string;
    customerId?: string;
    userEmail: string;
  }) {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: params.customerId,
      customer_email: params.customerId ? undefined : params.userEmail,
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: {
              name: params.planName,
            },
            unit_amount: Math.round(params.planPrice * 100),
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        userId: params.userId,
        planId: params.planId,
        type: 'PLATFORM',
      },
      subscription_data: {
        metadata: {
          userId: params.userId,
          planId: params.planId,
          type: 'PLATFORM',
        },
      },
    });

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  async createTierCheckoutSession(params: {
    tierId: string;
    tierName: string;
    tierPrice: number;
    currency: string;
    successUrl: string;
    cancelUrl: string;
    subscriberId: string;
    artistId: string;
    customerId?: string;
    subscriberEmail: string;
  }) {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: params.customerId,
      customer_email: params.customerId ? undefined : params.subscriberEmail,
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: {
              name: `Artist Tier: ${params.tierName}`,
            },
            unit_amount: Math.round(params.tierPrice * 100),
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        subscriberId: params.subscriberId,
        tierId: params.tierId,
        artistId: params.artistId,
        type: 'ARTIST_TIER',
      },
      subscription_data: {
        metadata: {
          subscriberId: params.subscriberId,
          tierId: params.tierId,
          artistId: params.artistId,
          type: 'ARTIST_TIER',
        },
      },
    });

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }

  async retrieveSubscription(subscriptionId: string) {
    return this.stripe.subscriptions.retrieve(subscriptionId) as Promise<Stripe.Subscription & {
      current_period_end?: number;
      metadata: Record<string, string>;
    }>;
  }

  async retrieveCheckoutSession(sessionId: string) {
    return this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });
  }

  async retrieveInvoice(invoiceId: string) {
    return this.stripe.invoices.retrieve(invoiceId) as Promise<Stripe.Invoice & {
      subscription?: string | { id: string } | null;
      amount_paid?: number | null;
      currency?: string | null;
    }>;
  }

  async cancelSubscription(subscriptionId: string, cancellationReason?: string) {
    void cancellationReason;
    return this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  async constructWebhookEvent(payload: string | Buffer, signature: string) {
    return this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
  }

  getWebhookSecret(): string {
    return this.webhookSecret;
  }

  async createCustomer(params: { email: string; name?: string; userId: string }) {
    return this.stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: { userId: params.userId },
    });
  }

  async createCustomerPortalSession(params: { customerId: string; returnUrl: string }) {
    return this.stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });
  }
}