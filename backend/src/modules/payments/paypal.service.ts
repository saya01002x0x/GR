import { Injectable } from '@nestjs/common';

export interface PayPalCheckoutParams {
  planId: string;
  planName: string;
  planPrice: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  userId: string;
  userEmail: string;
}

export interface PayPalSubscriptionParams {
  tierId: string;
  tierName: string;
  tierPrice: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  subscriberId: string;
  subscriberEmail: string;
  artistId: string;
}

@Injectable()
export class PayPalService {
  async createCheckout(params: PayPalCheckoutParams) {
    void params;
    throw new Error('PayPal has been retired from this project. Use Stripe instead.');
  }

  async createTierCheckout(params: PayPalSubscriptionParams) {
    void params;
    throw new Error('PayPal has been retired from this project. Use Stripe instead.');
  }

  async getSubscriptionDetails(subscriptionId: string) {
    void subscriptionId;
    throw new Error('PayPal has been retired from this project. Use Stripe instead.');
  }

  async cancelSubscription(subscriptionId: string, reason?: string) {
    void subscriptionId;
    void reason;
    throw new Error('PayPal has been retired from this project. Use Stripe instead.');
  }

  async verifyWebhook(body: string, headers: Record<string, string>) {
    void body;
    void headers;
    throw new Error('PayPal has been retired from this project. Use Stripe instead.');
  }

  getWebhookId(): string {
    return '';
  }
}