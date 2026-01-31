/**
 * Storage Module
 * Handle file storage operations with MinIO
 * Reference: https://docs.nestjs.com/modules
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from '../storage.service';

@Module({
    imports: [ConfigModule],
    providers: [StorageService],
    exports: [StorageService],
})
export class StorageModule { }
