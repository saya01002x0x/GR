import { 
  AutoTokenizer, 
  CLIPTextModelWithProjection, 
  AutoProcessor, 
  CLIPVisionModelWithProjection, 
  RawImage, 
  env 
} from '@xenova/transformers';

// Cấu hình không tự động load file onnx phụ, dùng local cache
env.allowLocalModels = true;

let tokenizer: any = null;
let textModel: any = null;
let processor: any = null;
let visionModel: any = null;
let isReady = false;

async function initModels() {
  try {
    tokenizer = await AutoTokenizer.from_pretrained('Xenova/clip-vit-base-patch32');
    textModel = await CLIPTextModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch32');
    
    processor = await AutoProcessor.from_pretrained('Xenova/clip-vit-base-patch32');
    visionModel = await CLIPVisionModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch32');
    
    isReady = true;
    if (process.send) {
      process.send({ type: 'ready' });
    }
  } catch (error: any) {
    if (process.send) {
      process.send({ type: 'error', error: error.message });
    }
    process.exit(1);
  }
}

process.on('message', async (message: any) => {
  const { id, type, payload } = message;
  
  if (!isReady) {
    if (process.send) {
      process.send({ id, error: 'Models not initialized yet' });
    }
    return;
  }

  try {
    let result: number[] = [];
    
    if (type === 'text') {
      const text_inputs = tokenizer([payload], { padding: true, truncation: true });
      const output = await textModel(text_inputs);
      result = Array.from(output.text_embeds.data);
    } 
    else if (type === 'image_url') {
      // payload là URL thumbnail
      const rawImage = await RawImage.fromURL(payload);
      const image_inputs = await processor(rawImage);
      const output = await visionModel(image_inputs);
      result = Array.from(output.image_embeds.data);
    }

    if (process.send) {
      process.send({ id, result });
    }
  } catch (error: any) {
    if (process.send) {
      process.send({ id, error: error.message || 'Unknown error' });
    }
  }
});

// Bắt đầu load models khi worker được khởi tạo
initModels();
