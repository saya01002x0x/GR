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
  getPlans() {
    return this.payments.getPlans();
  }

  @Get('plans/:planId')
  @ApiOperation({ summary: 'Get plan by ID' })
  getPlan(@Param('planId') planId: string) {
    return this.payments.getPlanById(planId);
  }

  @Post('plans')
  @UseGuards(ClerkGuard)
  @ApiOperation({ summary: 'Create a new plan (admin)' })
  createPlan(
    @CurrentUser() user: User,
    @Body() body: { name: string; description?: string; price: number; currency?: string; features?: string[] },
  ) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return { message: 'Forbidden', data: null };
    }
    return this.payments.createPlan(body);
  }

  @Patch('plans/:planId')
  @ApiOperation({ summary: 'Update a plan (admin)' })
  updatePlan(
    @CurrentUser() user: User,
    @Param('planId') planId: string,
    @Body() body: { name?: string; description?: string; price?: number; features?: string[]; isActive?: boolean },
  ) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return { message: 'Forbidden', data: null };
    }
    return this.payments.updatePlan(planId, body);
  }

  // ==================== MY SUBSCRIPTION ====================

  @Get('subscription/me')
  @ApiOperation({ summary: 'Get my current subscription' })
  getMySubscription(@CurrentUser() user: User) {
    return this.payments.getMySubscription(user.id);
  }

  @Post('subscription/checkout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create checkout session for subscription' })
  createSubscriptionCheckout(
    @CurrentUser() user: User,
    @Body() body: { planId: string },
  ) {
    return this.payments.createCheckoutSession(user.id, body.planId);
  }

  @Post('subscription/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel my subscription' })
  cancelMySubscription(@CurrentUser() user: User) {
    return this.payments.cancelMySubscription(user.id);
  }

  @Post('subscription/portal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Stripe customer portal session' })
  createSubscriptionPortal(@CurrentUser() user: User) {
    return this.payments.createCustomerPortal(user.id);
  }

  // ==================== MY PAYMENTS ====================

  @Get('history/me')
  @ApiOperation({ summary: 'Get my payment history' })
  getMyPayments(@CurrentUser() user: User) {
    return this.payments.getMyPayments(user.id);
  }

  // ==================== ARTIST TIERS ====================

  @Get('tiers/me')
  @ApiOperation({ summary: 'Get my (artist) tiers' })
  getMyTiers(@CurrentUser() user: User) {
    return this.payments.getMyTiers(user.id);
  }

  @Post('tiers/me')
  @ApiOperation({ summary: 'Create a new tier' })
  createTier(
    @CurrentUser() user: User,
    @Body() body: { name: string; description?: string; price: number; currency?: string; benefits?: string[]; maxMembers?: number },
  ) {
    if (!user.isArtist) {
      return { message: 'Only artists can create tiers', data: null };
    }
    return this.payments.createTier(user.id, body);
  }

  @Patch('tiers/me/:tierId')
  @ApiOperation({ summary: 'Update my tier' })
  updateTier(
    @CurrentUser() user: User,
    @Param('tierId') tierId: string,
    @Body() body: { name?: string; description?: string; price?: number; benefits?: string[]; maxMembers?: number; isActive?: boolean },
  ) {
    if (!user.isArtist) {
      return { message: 'Only artists can update tiers', data: null };
    }
    return this.payments.updateTier(tierId, user.id, body);
  }

  @Delete('tiers/me/:tierId')
  @ApiOperation({ summary: 'Delete (deactivate) my tier' })
  deleteTier(@CurrentUser() user: User, @Param('tierId') tierId: string) {
    if (!user.isArtist) {
      return { message: 'Only artists can delete tiers', data: null };
    }
    return this.payments.deleteTier(tierId, user.id);
  }

  @Get('tiers/me/subscribers')
  @ApiOperation({ summary: 'Get my tier subscribers' })
  getArtistSubscribers(@CurrentUser() user: User) {
    if (!user.isArtist) {
      return { message: 'Only artists can view subscribers', data: null };
    }
    return this.payments.getArtistTierSubscribers(user.id);
  }

  @Get('tiers/subscribed')
  @ApiOperation({ summary: 'Get tiers I am subscribed to' })
  getMySubscribedTiers(@CurrentUser() user: User) {
    return this.payments.getMyTierSubscriptions(user.id);
  }

  @Get('tiers/artist/:artistId')
  @ApiOperation({ summary: 'Get active public tiers for an artist' })
  getArtistPublicTiers(@Param('artistId') artistId: string) {
    return this.payments.getPublicArtistTiers(artistId);
  }

  @Post('tiers/:tierId/subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe to a tier' })
  subscribeToTier(
    @CurrentUser() user: User,
    @Param('tierId') tierId: string,
  ) {
    return this.payments.createTierCheckout(user.id, tierId);
  }

  @Delete('tiers/:tierId/subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe from a tier' })
  unsubscribeFromTier(@CurrentUser() user: User, @Param('tierId') tierId: string) {
    return this.payments.cancelMyTierSubscription(user.id, tierId);
  }

  // ==================== PAYOUTS ====================

  @Post('payouts/me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a payout' })
  requestPayout(
    @CurrentUser() user: User,
    @Body() body: { amount: number; note?: string },
  ) {
    if (!user.isArtist) {
      return { message: 'Only artists can request payouts', data: null };
    }
    return this.payments.requestPayout(user.id, body.amount, body.note);
  }

  @Get('payouts/me')
  @ApiOperation({ summary: 'Get my payout history' })
  getMyPayouts(@CurrentUser() user: User) {
    if (!user.isArtist) {
      return { message: 'Only artists can view payouts', data: null };
    }
    return this.payments.getMyPayouts(user.id);
  }

  @Get('revenue/me')
  @ApiOperation({ summary: 'Get my revenue stats' })
  getMyRevenue(@CurrentUser() user: User) {
    if (!user.isArtist) {
      return { message: 'Only artists can view revenue', data: null };
    }
    return this.payments.getArtistRevenue(user.id);
  }
}