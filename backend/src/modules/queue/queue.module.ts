import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE_NAME } from './queue.constants';
import { ArtworkProcessor } from './processors/artwork.processor';
import { StorageModule } from '../storage/storage/storage.module';
import { PrismaModule } from '../../database/prisma.module';


@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                connection: {
                    host: configService.get('REDIS_HOST') || 'localhost',
                    port: Number(configService.get('REDIS_PORT')) || 6379,
                    password: configService.get('REDIS_PASSWORD'),
                },
            }),
            inject: [ConfigService],
        }),
        BullModule.registerQueue({
            name: QUEUE_NAME,
        }),
        StorageModule,
        PrismaModule,
    ],
    providers: [ArtworkProcessor],
    exports: [BullModule],
})
export class QueueModule { }
