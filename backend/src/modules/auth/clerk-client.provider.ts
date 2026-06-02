/**
 * Clerk Client Provider
 * T蘯｡o vﾃ inject Clerk client vﾃo application
 * Reference: https://clerk.com/docs/references/backend/overview
 */

import { createClerkClient } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';

export const CLERK_CLIENT = 'CLERK_CLIENT';

export const ClerkClientProvider = {
  provide: CLERK_CLIENT,
  useFactory: (configService: ConfigService) => {
    return createClerkClient({
      publishableKey: configService.get('CLERK_PUBLISHABLE_KEY'),
      secretKey: configService.get('CLERK_SECRET_KEY'),
    });
  },
  inject: [ConfigService],
};
