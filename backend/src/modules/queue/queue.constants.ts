export const QUEUE_NAME = 'artwork-processing';

export const JOB_PROCESS_IMAGES = 'process-images';

export const AI_TAGGING_CONCURRENCY = 1;

export interface ProcessArtworkJob {
    artworkId: string;
    userId: string;
    files: {
        key: string;       // MinIO key: raw/artworks/{id}/{uuid}.jpg
        originalName: string;
        mimeType: string;
        order: number;
        caption?: string;
    }[];
}
