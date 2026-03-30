/**
 * Redis Module
 * Global module providing shared ioredis client
 * Reused by BullMQ, ViewService, MeilisearchSyncService
 * Reference: https://github.com/redis/ioredis
 */

import { Global, Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

const logger = new Logger('RedisModule');

@Global()
@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            useFactory: (configService: ConfigService) => {
                const redis = new Redis({
                    host: configService.get<string>('REDIS_HOST', 'localhost'),
                    port: Number(configService.get('REDIS_PORT', 6379)),
                    password: configService.get<string>('REDIS_PASSWORD') || undefined,
                    maxRetriesPerRequest: null, // Required for BullMQ compatibility
                    retryStrategy: (times: number) => {
                        // Exponential backoff: 50ms, 100ms, 200ms... max 30s
                        const delay = Math.min(times * 50, 30000);
                        logger.warn(`Redis reconnecting... attempt ${times}, waiting ${delay}ms`);
                        return delay;
                    },
                    reconnectOnError: (err) => {
                        // Only reconnect on specific errors
                        const targetError = 'READONLY';
                        if (err.message.includes(targetError)) {
                            return true;
                        }
                        return false;
                    },
                    lazyConnect: false,
                    enableReadyCheck: true,
                });

                redis.on('connect', () => {
                    logger.log('✅ Connected to Redis');
                });

                redis.on('ready', () => {
                    logger.log('✅ Redis is ready');
                });

                redis.on('error', (err) => {
                    logger.error(`Redis error: ${err.message}`);
                });

                redis.on('close', () => {
                    logger.warn('Redis connection closed');
                });

                return redis;
            },
            inject: [ConfigService],
        },
    ],
    exports: [REDIS_CLIENT],
})
export class RedisModule {}
