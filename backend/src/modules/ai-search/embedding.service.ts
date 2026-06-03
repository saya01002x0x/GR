/**
 * Embedding Service
 * Generates vector embeddings via Google Gemini API
 * Supports both text and image (multimodal) embeddings
 * Reference: https://ai.google.dev/gemini-api/docs/embeddings
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private genai: GoogleGenAI;
  private readonly MODEL = 'gemini-embedding-001';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('⚠️ GEMINI_API_KEY not set. AI Search will be disabled.');
      return;
    }
    this.genai = new GoogleGenAI({ apiKey });
    this.logger.log('✅ Gemini AI initialized for embeddings');
  }

  /**
   * Generate embedding from text query
   * @returns 768-dimensional vector
   */
  async getTextEmbedding(text: string): Promise<number[]> {
    if (!this.genai) {
      throw new Error('Gemini AI not initialized. Set GEMINI_API_KEY.');
    }

    const response = await this.genai.models.embedContent({
      model: this.MODEL,
      contents: text,
      config: {
        taskType: 'SEMANTIC_SIMILARITY',
      },
    });

    return response.embeddings?.[0]?.values || [];
  }

  /**
   * Generate embedding from image (base64)
   * Uses Gemini's multimodal embedding capability
   * @returns 768-dimensional vector
   */
  async getImageEmbedding(base64Image: string): Promise<number[]> {
    if (!this.genai) {
      throw new Error('Gemini AI not initialized. Set GEMINI_API_KEY.');
    }

    // Strip data URL prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const response = await this.genai.models.embedContent({
      model: this.MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Data,
            },
          },
        ],
      },
    });

    return response.embeddings?.[0]?.values || [];
  }

  /**
   * Check if Gemini AI is available
   */
  isAvailable(): boolean {
    return !!this.genai;
  }
}
