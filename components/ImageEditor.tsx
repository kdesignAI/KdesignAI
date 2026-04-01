import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Sliders, Image as ImageIcon, Sparkles, RefreshCw, Zap, Scissors } from 'lucide-react';
import { upscaleImage, removeBackground } from '../services/gemini';

interface FilterSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
}

const defaultFilters: FilterSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sharpness: 0,
};

const proFilters: FilterSettings = {
  brightness: 105,
  contrast: 115,
  saturation: 110,
  sharpness: 20, // custom sharpness implementation
};

export default function ImageEditor() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [filters, setFilters] = useState<FilterSettings>(defaultFilters);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setImageSrc(event.target?.result as string);
        setDimensions({ width: img.width, height: img.height });
        // Auto apply pro filters on upload
        setFilters(proFilters);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const applyFiltersToCanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, img: HTMLImageElement, targetWidth: number, targetHeight: number) => {
    // Set canvas dimensions
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Apply CSS filters for brightness, contrast, saturation
    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Apply sharpness if needed (basic convolution matrix)
    if (filters.sharpness > 0) {
      applySharpen(ctx, canvas.width, canvas.height, filters.sharpness / 100);
    }
  };

  const applySharpen = (ctx: CanvasRenderingContext2D, w: number, h: number, mix: number) => {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const w4 = w * 4;
    const ylimit = h - 1;
    const xlimit = w - 1;
    
    const weights = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];
    
    const opaque = 1;
    const side = Math.round(Math.sqrt(weights.length));
    const halfSide = Math.floor(side / 2);
    const alphaFac = opaque ? 1 : 0;
    
    const output = ctx.createImageData(w, h);
    const dst = output.data;
    
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const sy = y;
        const sx = x;
        const dstOff = (y * w + x) * 4;
        let r = 0, g = 0, b = 0, a = 0;
        
        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scy = sy + cy - halfSide;
            const scx = sx + cx - halfSide;
            
            if (scy >= 0 && scy < h && scx >= 0 && scx < w) {
              const srcOff = (scy * w + scx) * 4;
              const wt = weights[cy * side + cx];
              r += data[srcOff] * wt;
              g += data[srcOff + 1] * wt;
              b += data[srcOff + 2] * wt;
              a += data[srcOff + 3] * wt;
            }
          }
        }
        
        // Blend with original based on mix (0 to 1)
        dst[dstOff] = data[dstOff] + (r - data[dstOff]) * mix;
        dst[dstOff + 1] = data[dstOff + 1] + (g - data[dstOff + 1]) * mix;
        dst[dstOff + 2] = data[dstOff + 2] + (b - data[dstOff + 2]) * mix;
        dst[dstOff + 3] = data[dstOff + 3] + alphaFac * (a - data[dstOff + 3]);
      }
    }
    
    ctx.putImageData(output, 0, 0);
  };

  useEffect(() => {
    if (originalImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // For preview, we can scale it down to fit the screen
      const maxWidth = 800;
      let { width, height } = dimensions;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      applyFiltersToCanvas(canvas, ctx, originalImage, width, height);
    }
  }, [originalImage, filters, dimensions]);

  const handleUpscale = async () => {
    if (!originalImage) return;
    setIsUpscaling(true);
    try {
      // Convert original image to base64
      const canvas = document.createElement('canvas');
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");
      ctx.drawImage(originalImage, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.95);

      // Call upscaleImage
      const upscaledBase64 = await upscaleImage(base64, "Enhance resolution and detail, make it professional.");

      // Load the new image
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setDimensions({ width: img.width, height: img.height });
        setIsUpscaling(false);
      };
      img.src = upscaledBase64;
    } catch (error) {
      console.error("Upscaling failed:", error);
      alert("আপস্কেল করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
      setIsUpscaling(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!originalImage) return;
    setIsRemovingBg(true);
    try {
      // Convert original image to base64
      const canvas = document.createElement('canvas');
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");
      ctx.drawImage(originalImage, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.95);

      // Call removeBackground
      const noBgBase64 = await removeBackground(base64);

      // Load the new image
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setDimensions({ width: img.width, height: img.height });
        setIsRemovingBg(false);
      };
      img.src = noBgBase64;
    } catch (error) {
      console.error("Background removal failed:", error);
      alert("ব্যাকগ্রাউন্ড রিমুভ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
      setIsRemovingBg(false);
    }
  };

  const handleDownload = () => {
    if (!originalImage) return;
    setIsProcessing(true);

    setTimeout(() => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      // Calculate dimensions for at least 1600px max side, or keep original if larger
      let { width, height } = dimensions;
      const currentMax = Math.max(width, height);
      const targetMax = Math.max(1600, currentMax);
      
      if (width > height) {
        height = Math.round((height * targetMax) / width);
        width = targetMax;
      } else {
        width = Math.round((width * targetMax) / height);
        height = targetMax;
      }

      applyFiltersToCanvas(canvas, ctx, originalImage, width, height);

      // Download
      const link = document.createElement('a');
      link.download = 'professional_enhanced_1600px.jpg';
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
      
      setIsProcessing(false);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Sparkles className="text-brand-yellow" />
            প্রফেশনাল ফটো এনহ্যান্সার
          </h1>
          <p className="text-slate-400">
            আপনার ছবির ডিপিআই ১৬০০ পিক্সেল করুন এবং প্রফেশনাল কালার কন্ট্রাস্ট ও শ্যাডো যুক্ত করুন।
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Preview */}
          <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-xl flex flex-col">
            <div className="flex-1 relative flex items-center justify-center min-h-[400px] bg-slate-900/50 rounded-xl overflow-hidden border border-slate-700/50">
              {!imageSrc ? (
                <div className="text-center p-8">
                  <ImageIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">কোনো ছবি নির্বাচন করা হয়নি</p>
                  <label className="inline-flex items-center justify-center px-6 py-3 bg-brand-blue hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors gap-2 font-medium">
                    <Upload size={20} />
                    ছবি আপলোড করুন
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
              ) : (
                <canvas 
                  ref={canvasRef} 
                  className="max-w-full max-h-[600px] object-contain shadow-2xl"
                />
              )}
            </div>
          </div>

          {/* Right Column: Controls */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl h-fit">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-700">
              <Sliders className="text-brand-blue" />
              <h2 className="text-xl font-semibold">এডজাস্টমেন্ট</h2>
            </div>

            <div className="space-y-6">
              {/* Pro Auto Button */}
              <button 
                onClick={() => setFilters(proFilters)}
                className="w-full py-3 px-4 bg-gradient-to-r from-brand-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
              >
                <Sparkles size={18} />
                ১০০% প্রফেশনাল টাচ
              </button>

              <button 
                onClick={() => setFilters(defaultFilters)}
                className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw size={16} />
                রিসেট করুন
              </button>

              <button 
                onClick={handleUpscale}
                disabled={!imageSrc || isUpscaling || isRemovingBg}
                className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg ${
                  !imageSrc || isUpscaling || isRemovingBg
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/20'
                }`}
              >
                {isUpscaling ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  <Zap size={18} />
                )}
                {isUpscaling ? 'এআই আপস্কেল হচ্ছে...' : 'এআই আপস্কেল (AI Upscale)'}
              </button>

              <button 
                onClick={handleRemoveBackground}
                disabled={!imageSrc || isUpscaling || isRemovingBg}
                className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg ${
                  !imageSrc || isUpscaling || isRemovingBg
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/20'
                }`}
              >
                {isRemovingBg ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  <Scissors size={18} />
                )}
                {isRemovingBg ? 'ব্যাকগ্রাউন্ড রিমুভ হচ্ছে...' : 'ব্যাকগ্রাউন্ড রিমুভ (Remove BG)'}
              </button>

              <div className="space-y-4 pt-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm text-slate-300">কন্ট্রাস্ট (Contrast)</label>
                    <span className="text-sm text-brand-yellow">{filters.contrast}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" max="150" 
                    value={filters.contrast}
                    onChange={(e) => setFilters({...filters, contrast: Number(e.target.value)})}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-yellow"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm text-slate-300">ব্রাইটনেস (Brightness)</label>
                    <span className="text-sm text-brand-yellow">{filters.brightness}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" max="150" 
                    value={filters.brightness}
                    onChange={(e) => setFilters({...filters, brightness: Number(e.target.value)})}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-yellow"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm text-slate-300">স্যাচুরেশন (Saturation)</label>
                    <span className="text-sm text-brand-yellow">{filters.saturation}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="200" 
                    value={filters.saturation}
                    onChange={(e) => setFilters({...filters, saturation: Number(e.target.value)})}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-yellow"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm text-slate-300">শার্পনেস (Sharpness)</label>
                    <span className="text-sm text-brand-yellow">{filters.sharpness}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={filters.sharpness}
                    onChange={(e) => setFilters({...filters, sharpness: Number(e.target.value)})}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-yellow"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-700">
                <button 
                  onClick={handleDownload}
                  disabled={!imageSrc || isProcessing}
                  className={`w-full py-4 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    !imageSrc 
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                      : 'bg-brand-red hover:bg-red-600 text-white shadow-lg shadow-red-900/20'
                  }`}
                >
                  {isProcessing ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <Download size={20} />
                  )}
                  {isProcessing ? 'প্রসেসিং হচ্ছে...' : 'হাই-রেজোলিউশন ডাউনলোড করুন'}
                </button>
                <p className="text-xs text-center text-slate-500 mt-3">
                  ডাউনলোড করা ছবিটির সবচেয়ে বড় দিকটি অন্তত ১৬০০ পিক্সেল হবে।
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
