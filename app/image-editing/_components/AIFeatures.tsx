"use client";

import React from 'react';
import { BrainCircuit, Loader2, Sparkles, Zap, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useBackgroundRemoval } from '../_hooks/useBackgroundRemoval';
import { FabricImage } from 'fabric';

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

  const selectedObject = editor.fabricJs.current?.getActiveObject();
  const isImage = selectedObject?.type === 'image';
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
            // Replace image source
            const imgElement = new Image();
            imgElement.crossOrigin = "anonymous";
            imgElement.onload = () => {
                (selectedObject as FabricImage).setElement(imgElement);
                editor.fabricJs.current?.requestRenderAll();
                editor.saveHistory();
                toast.success("Background removed successfully!");
            };
            imgElement.src = result;
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
