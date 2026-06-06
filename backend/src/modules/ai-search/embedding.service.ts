/**
 * Embedding Service
 * Generates vector embeddings via Google Gemini API
 * Supports both text and image (multimodal) embeddings
 * Reference: https://ai.google.dev/gemini-api/docs/embeddings
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fork, ChildProcess } from 'child_process';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class EmbeddingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmbeddingService.name);
  
  private worker: ChildProcess | null = null;
  private pendingRequests = new Map<string, { resolve: (result: number[]) => void, reject: (error: Error) => void }>();
  private isWorkerReady = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('⏳ Đang khởi tạo Child Process cho Local AI Models...');
    
    const workerPath = path.join(__dirname, 'ai-worker.js');
    this.worker = fork(workerPath, [], {
      // Cho phép truyền arguments nếu cần, hoặc cấu hình bộ nhớ
    });

    this.worker.on('message', (message: any) => {
      if (message.type === 'ready') {
        this.isWorkerReady = true;
        this.logger.log('✅ AI Worker Process đã sẵn sàng hoạt động!');
        return;
      }

      if (message.type === 'error' && !message.id) {
        this.logger.error(`❌ Lỗi từ AI Worker: ${message.error}`);
        return;
      }

      if (message.id) {
        const req = this.pendingRequests.get(message.id);
        if (req) {
          if (message.error) {
            req.reject(new Error(message.error));
          } else {
            req.resolve(message.result);
          }
          this.pendingRequests.delete(message.id);
        }
      }
    });

    this.worker.on('error', (err) => {
      this.logger.error('❌ AI Worker gặp lỗi:', err);
      this.isWorkerReady = false;
    });

    this.worker.on('exit', (code) => {
      this.logger.warn(`⚠️ AI Worker đã thoát với mã: ${code}`);
      this.isWorkerReady = false;
      // Reject all pending requests
      for (const [id, req] of this.pendingRequests.entries()) {
        req.reject(new Error('AI Worker process exited'));
      }
      this.pendingRequests.clear();
    });

    // Xử lý Zombie Process: Bắt các tín hiệu exit của Process Mẹ
    process.on('exit', () => this.killWorker());
    process.on('SIGINT', () => {
      this.killWorker();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      this.killWorker();
      process.exit(0);
    });
  }

  onModuleDestroy() {
    this.killWorker();
  }

  private killWorker() {
    if (this.worker) {
      this.logger.log('🛑 Đang tiêu diệt AI Worker Process để tránh Zombie Process...');
      this.worker.kill('SIGKILL');
      this.worker = null;
      this.isWorkerReady = false;
    }
  }

  private async sendRequestToWorker(type: string, payload: any): Promise<number[]> {
    if (!this.worker || !this.isWorkerReady) {
      throw new Error('AI Worker not initialized or not ready.');
    }

    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      this.pendingRequests.set(id, { resolve, reject });
      this.worker!.send({ id, type, payload });
    });
  }

  /**
   * Generate embedding from text query
   * @returns 512-dimensional vector (Float32Array converted to number[])
   */
  async getTextEmbedding(text: string): Promise<number[]> {
    return this.sendRequestToWorker('text', text);
  }

  /**
   * Generate embedding from image URL
   * @returns 512-dimensional vector
   */
  async getImageEmbedding(url: string): Promise<number[]> {
    return this.sendRequestToWorker('image_url', url);
  }

  isAvailable(): boolean {
    return this.isWorkerReady;
  }
}
