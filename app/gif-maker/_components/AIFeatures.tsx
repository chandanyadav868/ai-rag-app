"use client";

import React from 'react';
import { BrainCircuit, Loader2, Sparkles, Zap, Check, SlidersHorizontal, BoxSelect, Crop } from 'lucide-react';
import { toast } from 'sonner';
import { useBackgroundRemoval } from '../../image-editing/_hooks/useBackgroundRemoval';
import { FabricImage } from 'fabric';
import { fitFabricImageToContent } from '@/lib/image-effects';
import { storeElementAsAsset } from '@/lib/persistent-storage';

interface AIFeaturesProps {
  editor: any;
}

export function AIFeatures({ editor }: AIFeaturesProps) {
  const { status, isModelLoaded, removeBackground, loadModel } = useBackgroundRemoval();
  
  React.useEffect(() => {
    if (!isModelLoaded && status !== 'loading') {
      loadModel();
    }
  }, [isModelLoaded, status, loadModel]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [objectPrompt, setObjectPrompt] = React.useState('');

  const [threshold, setThreshold] = React.useState(0.35);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const selectedObject = editor.fabricJs.current?.getActiveObject();
  const isImage = selectedObject?.type === 'image';

  const handleIsolateObject = async () => {
    if (!selectedObject || !isImage) {
        toast.error("Please select an image first.");
        return;
    }
    if (!objectPrompt.trim()) {
        toast.error("Please enter the object you want to isolate.");
        return;
    }

    try {
        setIsProcessing(true);
        const src = (selectedObject as FabricImage).getSrc();
        const result = await removeBackground(src, {
          mode: 'prompt',
          prompt: objectPrompt.trim(),
          threshold: threshold
        });
        
        if (result) {
            const didFit = await fitFabricImageToContent(selectedObject, editor.fabricJs.current, result);
            if (!didFit) {
                const imgElement = new Image();
                imgElement.crossOrigin = "anonymous";
                imgElement.onload = async () => {
                    const imgObj = selectedObject as FabricImage;
                    imgObj.setElement(imgElement);
                    imgObj.set('src', result);
                    (imgObj as any)._cleanCutoutElement = imgElement;
                    (imgObj as any)._cleanCutoutSrc = result;
                    (imgObj as any)._isDirtyAsset = true;
                    try {
                        const newAssetId = await storeElementAsAsset(imgElement, 'image/png');
                        if (newAssetId) {
                            imgObj.set('assetId', newAssetId);
                            (imgObj as any).assetId = newAssetId;
                        }
                    } catch (e) {
                        console.error('Failed to store cutout asset:', e);
                    }
                    imgObj.set("strokeWidth", 0);
                    imgObj.set("stroke", null);
                    editor.fabricJs.current?.requestRenderAll();
                    editor.saveHistory();
                };
                imgElement.src = result;
            } else {
                const imgObj = selectedObject as FabricImage;
                imgObj.set("strokeWidth", 0);
                imgObj.set("stroke", null);
                editor.saveHistory();
            }
            toast.success(`Isolated "${objectPrompt}" and fitted bounding box!`);
        }
    } catch (err) {
        console.error("AI Feature Error:", err);
        toast.error("Failed to isolate object.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleFitBoundingBox = async () => {
    if (!selectedObject || !isImage) {
      toast.error("Please select an image first.");
      return;
    }
    try {
      setIsProcessing(true);
      const didFit = await fitFabricImageToContent(selectedObject, editor.fabricJs.current);
      if (didFit) {
        editor.saveHistory();
        toast.success("Bounding box fitted tightly to visible content!");
      } else {
        toast.info("Bounding box is already tightly fitted to content.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fit bounding box.");
    } finally {
      setIsProcessing(false);
    }
  };

  const isShape = selectedObject?.type === 'rect' || selectedObject?.type === 'triangle' || selectedObject?.type === 'circle' || selectedObject?.type === 'shape';

  const handleRemoveBackground = async () => {
    if (!selectedObject || !isImage) {
        toast.error("Please select an image to remove background.");
        return;
    }

    try {
        setIsProcessing(true);
        const src = (selectedObject as FabricImage).getSrc();
        const result = await removeBackground(src);
        
        if (result) {
            const didFit = await fitFabricImageToContent(selectedObject, editor.fabricJs.current, result);
            if (!didFit) {
                const imgElement = new Image();
                imgElement.crossOrigin = "anonymous";
                imgElement.onload = async () => {
                    const imgObj = selectedObject as FabricImage;
                    imgObj.setElement(imgElement);
                    imgObj.set('src', result);
                    (imgObj as any)._cleanCutoutElement = imgElement;
                    (imgObj as any)._cleanCutoutSrc = result;
                    (imgObj as any)._isDirtyAsset = true;
                    try {
                        const newAssetId = await storeElementAsAsset(imgElement, 'image/png');
                        if (newAssetId) {
                            imgObj.set('assetId', newAssetId);
                            (imgObj as any).assetId = newAssetId;
                        }
                    } catch (e) {
                        console.error('Failed to store cutout asset:', e);
                    }
                    imgObj.set("strokeWidth", 0);
                    imgObj.set("stroke", null);
                    editor.fabricJs.current?.requestRenderAll();
                    editor.saveHistory();
                };
                imgElement.src = result;
            } else {
                const imgObj = selectedObject as FabricImage;
                imgObj.set("strokeWidth", 0);
                imgObj.set("stroke", null);
                editor.saveHistory();
            }
            toast.success("Background removed & bounding box trimmed!");
        }
    } catch (err) {
        console.error("AI Feature Error:", err);
        toast.error("Failed to process image.");
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between p-4 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${isModelLoaded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
            <BrainCircuit size={20} className={status === 'loading' ? 'animate-pulse' : ''} />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-white">AI Engine</div>
            <div className="text-[10px] text-white/40 font-medium">{isModelLoaded ? 'Model Ready' : (status === 'loading' ? 'Loading AI...' : 'Initializing...')}</div>
          </div>
        </div>
        {isModelLoaded && <Check size={16} className="text-emerald-400" />}
        {status === 'loading' && <Loader2 size={16} className="text-cyan-400 animate-spin" />}
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-cyan-400" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Image Intelligence</h3>
        </div>

        <button
          disabled={!isModelLoaded || isProcessing || !isImage}
          onClick={handleRemoveBackground}
          className={`group relative w-full overflow-hidden rounded-3xl p-5 transition-all ${isModelLoaded && isImage ? 'bg-gradient-to-br from-cyan-600 to-blue-700 hover:scale-[1.02] active:scale-95 shadow-xl shadow-cyan-500/20' : 'bg-white/5 cursor-not-allowed opacity-50'}`}
        >
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white/20 p-3 text-white">
                {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
              </div>
              <div className="text-left">
                <div className="text-sm font-black uppercase tracking-wider text-white">Remove Background</div>
                <div className="text-[10px] font-medium text-white/70">One-click transparent cutout</div>
              </div>
            </div>
            <Sparkles size={16} className="text-white/40 group-hover:text-white transition-colors" />
          </div>
          {isProcessing && (
            <div className="absolute inset-0 bg-cyan-500/20 animate-pulse" />
          )}
        </button>

        {/* Selective Object Isolation */}
        <div className={`p-4 rounded-3xl border transition-all ${isImage ? 'bg-violet-950/20 border-violet-500/20' : 'bg-white/5 border-white/5 opacity-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-violet-500/20 text-violet-300">
              <Zap size={14} />
            </span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">Isolate Specific Object</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            Keep only a specific subject (e.g. dog, person, watch) and remove the rest.
          </p>

          {/* Quick Suggestion Chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[
              { label: 'Face & Hair', prompt: 'face and hair' },
              { label: 'Head', prompt: 'head' },
              { label: 'Person', prompt: 'person' },
              { label: 'Clothes', prompt: 'clothes' },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                disabled={!isImage || isProcessing}
                onClick={() => setObjectPrompt(chip.prompt)}
                className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                  objectPrompt.toLowerCase() === chip.prompt.toLowerCase()
                    ? 'bg-violet-600/30 border-violet-500 text-violet-200'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. face and hair, dog, watch..."
              value={objectPrompt}
              onChange={(e) => setObjectPrompt(e.target.value)}
              disabled={!isImage || isProcessing}
              className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleIsolateObject();
              }}
            />
            <button
              onClick={handleIsolateObject}
              disabled={!isImage || isProcessing || !objectPrompt.trim()}
              className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-violet-600/20 shrink-0"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : 'Isolate'}
            </button>
          </div>

          {/* Precision Settings Toggle */}
          <div className="mt-3 pt-2.5 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-[10px] font-semibold text-white/50 hover:text-white/80 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal size={12} />
                Detection Sensitivity
              </span>
              <span className="text-[10px] text-violet-400 font-mono">
                {Math.round((1 - threshold) * 100)}%
              </span>
            </button>

            {showAdvanced && (
              <div className="mt-2.5 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-[9px] text-white/40">
                  <span>Broader (catches beard & edges)</span>
                  <span>Strict Core</span>
                </div>
                <input
                  type="range"
                  min="0.20"
                  max="0.55"
                  step="0.05"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  disabled={!isImage || isProcessing}
                  className="w-full accent-violet-500 h-1 bg-white/10 rounded-lg cursor-pointer"
                />
                <p className="text-[9px] text-white/40 leading-relaxed">
                  💡 Tip: For razor-sharp portrait cutouts, click <strong>Remove Background</strong> first, then isolate <strong>face and hair</strong>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Auto-Fit Bounding Box Tool */}
        <div className={`p-4 rounded-3xl border transition-all ${isImage ? 'bg-cyan-950/20 border-cyan-500/20' : 'bg-white/5 border-white/5 opacity-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                <BoxSelect size={14} />
              </span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">Fit Bounding Box</span>
            </div>
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded-md">
              Auto-Crop
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            Shrink the selection box to tightly hug the visible subject and eliminate empty transparent space.
          </p>
          <button
            type="button"
            disabled={!isImage || isProcessing}
            onClick={handleFitBoundingBox}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 border border-cyan-500/30 text-cyan-200 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-600/10"
          >
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Crop size={14} />}
            Auto-Fit Bounding Box to Content
          </button>
        </div>

        {!isImage && isShape && (
            <div className="p-4 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center">
                <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest leading-relaxed">
                    Background removal is currently available for images only. 
                    <br/>
                    <span className="text-cyan-400/60 text-[8px]">More AI features for shapes coming soon!</span>
                </p>
            </div>
        )}
      </section>

      <div className="p-6 rounded-[32px] bg-white/5 border border-white/10">
        <div className="flex items-start gap-4">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Sparkles size={16} />
            </div>
            <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-white mb-1">AI Smart Crop</h4>
                <p className="text-[10px] text-white/40 leading-relaxed">Our AI analyzes your image to find the best composition automatically.</p>
                <div className="mt-3 text-[9px] font-black uppercase tracking-tighter text-cyan-500/60 bg-cyan-500/5 px-2 py-1 rounded-lg inline-block">Coming Soon</div>
            </div>
        </div>
      </div>
    </div>
  );
}
