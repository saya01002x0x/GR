import {
  Controller,
  Post,
  Headers,
  HttpCode,
  HttpStatus,
  Req,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import Stripe from 'stripe';

@ApiTags('webhooks')
@Controller(['webhook', 'api/webhook'])
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly payments: PaymentsService,
    private readonly stripe: StripeService,
  ) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      if (!signature) {
        throw new BadRequestException('Missing Stripe signature');
      }

      const payload = req.rawBody || Buffer.from('');
      const event = await this.stripe.constructWebhookEvent(payload, signature);

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

          if (subscriptionId) {
            const subscription = await this.stripe.retrieveSubscription(subscriptionId);
            await this.payments.handleStripeSubscriptionUpdate({
              id: subscription.id,
              status: subscription.status,
              cancel_at_period_end: subscription.cancel_at_period_end,
              current_period_end: subscription.current_period_end,
              metadata: subscription.metadata,
            });
          }
          break;
        }

        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice & {
            subscription?: string | { id: string } | null;
            amount_paid?: number | null;
            currency?: string | null;
          };
          if (!invoice.id) {
            break;
          }
          await this.payments.handleStripeInvoicePaid({
            id: invoice.id,
            subscription: typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id,
            amount_paid: invoice.amount_paid,
            currency: invoice.currency,
          });
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription & {
            current_period_end?: number;
          };
          await this.payments.handleStripeSubscriptionUpdate({
            id: subscription.id,
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_end: subscription.current_period_end,
            metadata: subscription.metadata,
          });
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription & {
            current_period_end?: number;
          };
          await this.payments.handleStripeSubscriptionUpdate({
            id: subscription.id,
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_end: subscription.current_period_end,
            metadata: subscription.metadata,
          });
          break;
        }

        default:
          this.logger.log(`Unhandled Stripe event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Stripe webhook error', error);
      throw error;
    }
  }
}
