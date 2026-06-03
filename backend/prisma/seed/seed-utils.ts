import { faker } from '@faker-js/faker';
import sharp from 'sharp';

export function seededRandomInRange([min, max]: [number, number]): number {
  return faker.number.int({ min, max });
}

export function pickRandomElements<T>(array: T[], count: number): T[] {
  return faker.helpers.arrayElements(array, count);
}

export function pickRandomElement<T>(array: T[]): T {
  return faker.helpers.arrayElement(array);
}

export async function processImageVariants(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata();
  
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const aspectRatio = width && height ? width / height : 1;
  
  let ratioClass = 'square';
  if (aspectRatio > 1.2) ratioClass = 'landscape';
  if (aspectRatio < 0.8) ratioClass = 'portrait';
  
  const preview = await sharp(buffer)
    .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
    
  const thumb = await sharp(buffer)
    .resize({ width: 400, height: 400, fit: 'cover' })
    .jpeg({ quality: 70 })
    .toBuffer();
    
  const blur = await sharp(buffer)
    .resize({ width: 400 })
    .blur(30)
    .jpeg({ quality: 50 })
    .toBuffer();
    
  return {
    metadata: { width, height, aspectRatio, ratioClass },
    buffers: { preview, thumb, blur }
  };
}
