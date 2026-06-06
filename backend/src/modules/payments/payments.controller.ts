import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClerkGuard } from '../auth/clerk.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth('clerk-auth')
@UseGuards(ClerkGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  // ==================== PLANS ====================

  @Get('plans')
  @ApiOperation({ summary: 'Get all active plans' })
  @ApiResponse({ status: 200, description: 'List of plans' })
  async getPlans() {
    const data = await this.payments.getPlans();
    return { message: 'OK', data };
  }

  @Get('plans/:planId')
  @ApiOperation({ summary: 'Get plan by ID' })
  async getPlan(@Param('planId') planId: string) {
    const data = await this.payments.getPlanById(planId);
    return { message: 'OK', data };
  }

  @Post('plans')
  @UseGuards(ClerkGuard)
  @ApiOperation({ summary: 'Create a new plan (admin)' })
  async createPlan(
    @CurrentUser() user: User,
    @Body() body: { name: string; description?: string; price: number; currency?: string; features?: string[] },
  ) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return { message: 'Forbidden', data: null };
    }
    const data = await this.payments.createPlan(body);
    return { message: 'Plan created', data };
  }

  @Patch('plans/:planId')
  @ApiOperation({ summary: 'Update a plan (admin)' })
  async updatePlan(
    @CurrentUser() user: User,
    @Param('planId') planId: string,
    @Body() body: { name?: string; description?: string; price?: number; features?: string[]; isActive?: boolean },
  ) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return { message: 'Forbidden', data: null };
    }
    const data = await this.payments.updatePlan(planId, body);
    return { message: 'Plan updated', data };
  }

  // ==================== MY SUBSCRIPTION ====================

  @Get('subscription/me')
  @ApiOperation({ summary: 'Get my current subscription' })
  async getMySubscription(@CurrentUser() user: User) {
    const data = await this.payments.getMySubscription(user.id);
    return { message: 'OK', data };
  }

  @Post('subscription/checkout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create checkout session for subscription' })
  async createSubscriptionCheckout(
    @CurrentUser() user: User,
    @Body() body: { planId: string },
  ) {
    const data = await this.payments.createCheckoutSession(user.id, body.planId);
    return { message: 'OK', data };
  }

  @Post('subscription/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel my subscription' })
  async cancelMySubscription(@CurrentUser() user: User) {
    const data = await this.payments.cancelMySubscription(user.id);
    return { message: 'Subscription canceled', data };
  }

  @Post('subscription/portal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Stripe customer portal session' })
  async createSubscriptionPortal(@CurrentUser() user: User) {
    const data = await this.payments.createCustomerPortal(user.id);
    return { message: 'OK', data };
  }

  @Post('checkout/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync a completed Stripe checkout session' })
  async syncCheckoutSession(
    @CurrentUser() user: User,
    @Body() body: { sessionId: string },
  ) {
    const data = await this.payments.syncCheckoutSessionFromStripe(
      body.sessionId,
      user.id,
    );
    return { message: 'Checkout synced', data };
  }

  // ==================== MY PAYMENTS ====================

  @Get('history/me')
  @ApiOperation({ summary: 'Get my payment history' })
  async getMyPayments(@CurrentUser() user: User) {
    const data = await this.payments.getMyPayments(user.id);
    return { message: 'OK', data };
  }

  // ==================== ARTIST TIERS ====================

  @Get('tiers/me')
  @ApiOperation({ summary: 'Get my (artist) tiers' })
  async getMyTiers(@CurrentUser() user: User) {
    const data = await this.payments.getMyTiers(user.id);
    return { message: 'OK', data };
  }

  @Post('tiers/me')
  @ApiOperation({ summary: 'Create a new tier' })
  async createTier(
    @CurrentUser() user: User,
    @Body() body: { name: string; description?: string; price: number; currency?: string; benefits?: string[]; maxMembers?: number; parentTierId?: string },
  ) {
    if (!user.isArtist) {
      return { message: 'Only artists can create tiers', data: null };
    }
    const data = await this.payments.createTier(user.id, body);
    return { message: 'Tier created', data };
  }

  @Patch('tiers/me/:tierId')
  @ApiOperation({ summary: 'Update my tier' })
  async updateTier(
    @CurrentUser() user: User,
    @Param('tierId') tierId: string,
    @Body() body: { name?: string; description?: string; price?: number; benefits?: string[]; maxMembers?: number; isActive?: boolean; parentTierId?: string },
  ) {
    if (!user.isArtist) {
      return { message: 'Only artists can update tiers', data: null };
    }
    const data = await this.payments.updateTier(tierId, user.id, body);
    return { message: 'Tier updated', data };
  }

  @Delete('tiers/me/:tierId')
  @ApiOperation({ summary: 'Delete (deactivate) my tier' })
  async deleteTier(@CurrentUser() user: User, @Param('tierId') tierId: string) {
    if (!user.isArtist) {
      return { message: 'Only artists can delete tiers', data: null };
    }
    await this.payments.deleteTier(tierId, user.id);
    return { message: 'Tier deleted' };
  }

  @Patch('tiers/me/:tierId/archive')
  @ApiOperation({ summary: 'Archive my tier' })
  async archiveTier(@CurrentUser() user: User, @Param('tierId') tierId: string) {
    if (!user.isArtist) {
      return { message: 'Only artists can archive tiers', data: null };
    }
    const data = await this.payments.archiveTier(tierId, user.id);
    return { message: 'Tier archived', data };
  }

  @Get('tiers/me/subscribers')
  @ApiOperation({ summary: 'Get my tier subscribers' })
  async getArtistSubscribers(@CurrentUser() user: User) {
    if (!user.isArtist) {
      return { message: 'Only artists can view subscribers', data: null };
    }
    const data = await this.payments.getArtistTierSubscribers(user.id);
    return { message: 'OK', data };
  }

  @Get('tiers/subscribed')
  @ApiOperation({ summary: 'Get tiers I am subscribed to' })
  async getMySubscribedTiers(@CurrentUser() user: User) {
    const data = await this.payments.getMyTierSubscriptions(user.id);
    return { message: 'OK', data };
  }

  @Get('tiers/artist/:artistId')
  @ApiOperation({ summary: 'Get active public tiers for an artist' })
  async getArtistPublicTiers(@Param('artistId') artistId: string) {
    const data = await this.payments.getPublicArtistTiers(artistId);
    return { message: 'OK', data };
  }

  @Post('tiers/:tierId/subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe to a tier' })
  async subscribeToTier(
    @CurrentUser() user: User,
    @Param('tierId') tierId: string,
  ) {
    const data = await this.payments.createTierCheckout(user.id, tierId);
    return { message: 'OK', data };
  }

  @Delete('tiers/:tierId/subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe from a tier' })
  async unsubscribeFromTier(@CurrentUser() user: User, @Param('tierId') tierId: string) {
    const data = await this.payments.cancelMyTierSubscription(user.id, tierId);
    return { message: 'Unsubscribed', data };
  }

  // ==================== PAYOUTS ====================

  @Post('payouts/me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a payout' })
  async requestPayout(
    @CurrentUser() user: User,
    @Body() body: { amount: number; note?: string },
  ) {
    if (!user.isArtist) {
      return { message: 'Only artists can request payouts', data: null };
    }
    const data = await this.payments.requestPayout(user.id, body.amount, body.note);
    return { message: 'Payout requested', data };
  }

  @Get('payouts/me')
  @ApiOperation({ summary: 'Get my payout history' })
  async getMyPayouts(@CurrentUser() user: User) {
    if (!user.isArtist) {
      return { message: 'Only artists can view payouts', data: null };
    }
    const data = await this.payments.getMyPayouts(user.id);
    return { message: 'OK', data };
  }

  @Get('revenue/me')
  @ApiOperation({ summary: 'Get my revenue stats' })
  async getMyRevenue(@CurrentUser() user: User) {
    if (!user.isArtist) {
      return { message: 'Only artists can view revenue', data: null };
    }
    const data = await this.payments.getArtistRevenue(user.id);
    return { message: 'OK', data };
  }
}
