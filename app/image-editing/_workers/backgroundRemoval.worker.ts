import { env, AutoModel, AutoProcessor, RawImage } from '@huggingface/transformers';

// Configuration
env.allowLocalModels = false;
env.useBrowserCache = true;
if (env.backends?.onnx?.wasm) {
    env.backends.onnx.wasm.proxy = false;
}

let model: any = null;
let processor: any = null;

async function loadModel(modelId: string) {
    if (model && processor) return;
    
    try {
        console.log('Worker: Loading model...', modelId);
        self.postMessage({ status: 'loading', message: 'Loading AI model...' });
        
        const device = self.navigator && (self.navigator as any).gpu ? 'webgpu' : 'wasm';
        console.log('Worker: Using device:', device);

        model ??= await AutoModel.from_pretrained(modelId, {
            device: device,
        });
        processor ??= await AutoProcessor.from_pretrained(modelId);
        
        console.log('Worker: Model loaded successfully');
        self.postMessage({ status: 'ready', message: 'Model ready' });
    } catch (error) {
        console.error('Worker: Load failed', error);
        self.postMessage({ status: 'error', message: 'Failed to load model: ' + String(error) });
    }
}

self.onmessage = async (event) => {
    const { action, payload } = event.data;

    if (action === 'load') {
        await loadModel(payload.modelId || 'Xenova/modnet');
    } else if (action === 'removeBackground') {
        if (!model || !processor) {
            self.postMessage({ status: 'error', message: 'Model not loaded' });
            return;
        }

        try {
            self.postMessage({ status: 'processing', message: 'Removing background...' });
            
            // 1. Load image
            const img = await RawImage.fromURL(payload.image);
            
            // 2. Pre-process image
            const { pixel_values } = await processor(img);

            // 3. Predict alpha matte
            const { output } = await model({ input: pixel_values });

            // 4. Post-process to get mask data
            // We use the exact logic from the provided code
            const maskImage = await RawImage.fromTensor(output[0].mul(255).to("uint8")).resize(
                img.width,
                img.height,
            );
            
            const maskData = maskImage.data;
            
            self.postMessage({ 
                status: 'complete', 
                payload: {
                    mask: { data: maskData }, 
                    width: img.width,
                    height: img.height
                } 
            });
        } catch (error) {
            console.error('Worker: Inference error', error);
            self.postMessage({ status: 'error', message: 'Background removal failed: ' + String(error) });
        }
    }
};
