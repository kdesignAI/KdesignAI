import React, { useState, useRef, useEffect } from 'react';
import { GeneratedItem, MediaType } from '../types';
import { Download, Play, ScanLine, Edit2, RotateCw, Crop, Wand2, Check, X, MessageSquare, Send } from 'lucide-react';

interface MediaCardProps {
  item: GeneratedItem;
  onUpscale?: () => void;
  onEditSave?: (newUrl: string) => void;
  onAIEdit?: (prompt: string) => void;
}

type FilterType = 'none' | 'grayscale' | 'sepia' | 'vivid' | 'warm';
type CropType = 'original' | 'square' | 'landscape' | 'portrait';

export const MediaCard: React.FC<MediaCardProps> = ({ item, onUpscale, onEditSave, onAIEdit }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [resolution, setResolution] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [isAIEditing, setIsAIEditing] = useState(false);
  const [aiEditPrompt, setAiEditPrompt] = useState('');
  const [rotation, setRotation] = useState(0);
  const [filter, setFilter] = useState<FilterType>('none');
  const [crop, setCrop] = useState<CropType>('original');
  const [isSaving, setIsSaving] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent bubbling
    const link = document.createElement('a');
    link.href = item.url;
    
    let ext = 'jpg';
    if (item.type === MediaType.VIDEO) ext = 'mp4';
    // Logos are JPEGs in this implementation
    
    link.download = `solaris-${item.type.toLowerCase()}-${item.timestamp}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleVideo = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!imgRef.current || !onEditSave) return;
    
    setIsSaving(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = imgRef.current;

      if (!ctx) throw new Error('Could not get canvas context');

      // 1. Calculate dimensions based on crop
      let sw = img.naturalWidth;
      let sh = img.naturalHeight;
      let sx = 0;
      let sy = 0;

      if (crop === 'square') {
        const side = Math.min(sw, sh);
        sx = (sw - side) / 2;
        sy = (sh - side) / 2;
        sw = sh = side;
      } else if (crop === 'landscape') {
        // Target 16:9
        const targetHeight = sw * (9/16);
        if (targetHeight <= sh) {
          sy = (sh - targetHeight) / 2;
          sh = targetHeight;
        } else {
           const targetWidth = sh * (16/9);
           sx = (sw - targetWidth) / 2;
           sw = targetWidth;
        }
      } else if (crop === 'portrait') {
         // Target 9:16
         const targetWidth = sh * (9/16);
         if (targetWidth <= sw) {
           sx = (sw - targetWidth) / 2;
           sw = targetWidth;
         } else {
            const targetHeight = sw * (16/9);
            sy = (sh - targetHeight) / 2;
            sh = targetHeight;
         }
      }

      // 2. Handle Rotation for Canvas Size
      // If rotated 90 or 270, width/height flip
      if (rotation % 180 !== 0) {
        canvas.width = sh;
        canvas.height = sw;
      } else {
        canvas.width = sw;
        canvas.height = sh;
      }

      // 3. Draw
      // Apply Filter
      let filterStr = 'none';
      if (filter === 'grayscale') filterStr = 'grayscale(100%)';
      if (filter === 'sepia') filterStr = 'sepia(100%)';
      if (filter === 'vivid') filterStr = 'saturate(150%) contrast(110%)';
      if (filter === 'warm') filterStr = 'sepia(30%) saturate(130%)';
      ctx.filter = filterStr;

      // Apply Rotation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Draw Image (centered)
      if (rotation % 180 !== 0) {
         ctx.drawImage(img, sx, sy, sw, sh, -sh/2, -sw/2, sh, sw);
      } else {
         ctx.drawImage(img, sx, sy, sw, sh, -sw/2, -sh/2, sw, sh);
      }

      const newUrl = canvas.toDataURL('image/jpeg', 0.95);
      onEditSave(newUrl);
      setIsEditing(false);
      // Reset state
      setRotation(0);
      setFilter('none');
      setCrop('original');
    } catch (e) {
      console.error("Failed to save edit", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitAIEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiEditPrompt.trim() || !onAIEdit) return;
    onAIEdit(aiEditPrompt.trim());
    setIsAIEditing(false);
    setAiEditPrompt('');
  };

  // CSS transform for preview
  const getPreviewStyle = () => {
    let filterVal = 'none';
    if (filter === 'grayscale') filterVal = 'grayscale(100%)';
    if (filter === 'sepia') filterVal = 'sepia(100%)';
    if (filter === 'vivid') filterVal = 'saturate(150%) contrast(110%)';
    if (filter === 'warm') filterVal = 'sepia(30%) saturate(130%)';

    return {
      transform: `rotate(${rotation}deg)`,
      filter: filterVal,
      transition: 'all 0.3s ease'
    };
  };

  const cycleCrop = () => {
    const options: CropType[] = ['original', 'square', 'landscape', 'portrait'];
    const idx = options.indexOf(crop);
    setCrop(options[(idx + 1) % options.length]);
  };

  const cycleFilter = () => {
    const options: FilterType[] = ['none', 'grayscale', 'sepia', 'vivid', 'warm'];
    const idx = options.indexOf(filter);
    setFilter(options[(idx + 1) % options.length]);
  };

  // If editing, different view
  if (isEditing && (item.type === MediaType.IMAGE || item.type === MediaType.LOGO)) {
    return (
       <div className="rounded-2xl overflow-hidden bg-slate-900 shadow-xl border border-slate-700 relative flex flex-col aspect-[4/3] md:aspect-[16/9]">
          {/* Editor Area */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black/50 p-4">
             <img 
               ref={imgRef}
               src={item.url} 
               className="max-w-full max-h-full object-contain shadow-2xl ring-1 ring-white/10"
               style={getPreviewStyle()}
               alt="Editing preview"
             />
             {/* Crop Overlay Indicator (Visual only - simplistic) */}
             {crop !== 'original' && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                   <div className={`border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] ${
                      crop === 'square' ? 'aspect-square w-full h-auto max-h-full' : 
                      crop === 'landscape' ? 'aspect-video w-full h-auto' : 
                      'aspect-[9/16] h-full w-auto'
                   }`}></div>
                </div>
             )}
          </div>

          {/* Toolbar */}
          <div className="bg-slate-800 p-3 flex items-center justify-between gap-2 border-t border-slate-700">
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 hover:text-white transition-colors"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
                <button 
                  onClick={cycleCrop}
                  className="p-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 hover:text-white transition-colors relative group"
                  title={`Crop: ${crop}`}
                >
                  <Crop className="w-5 h-5" />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap capitalize">{crop}</span>
                </button>
                <button 
                  onClick={cycleFilter}
                  className="p-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 hover:text-white transition-colors relative group"
                  title={`Filter: ${filter}`}
                >
                  <Wand2 className="w-5 h-5" />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap capitalize">{filter}</span>
                </button>
             </div>

             <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setIsEditing(false); setRotation(0); setFilter('none'); setCrop('original'); }}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                  title="Cancel"
                >
                  <X className="w-6 h-6" />
                </button>
                <button 
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                  title="Save Changes"
                >
                  {isSaving ? 'Saving...' : <> <Check className="w-4 h-4" /> Save </>}
                </button>
             </div>
          </div>
       </div>
    );
  }

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-slate-100 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-slate-200">
      <div className={`aspect-[${item.aspectRatio.replace(':', '/')}] w-full relative`}>
        {item.type === MediaType.IMAGE || item.type === MediaType.LOGO ? (
          <img 
            src={item.url} 
            alt={item.prompt} 
            className="w-full h-full object-cover"
            loading="lazy"
            onLoad={(e) => {
              const img = e.currentTarget;
              setResolution(`${img.naturalWidth}x${img.naturalHeight}px`);
            }}
          />
        ) : (
          <div className="w-full h-full relative bg-black group-video">
             <video 
                ref={videoRef}
                src={item.url}
                className="w-full h-full object-cover"
                controls
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={(e) => {
                  const vid = e.currentTarget;
                  setResolution(`${vid.videoWidth}x${vid.videoHeight}px`);
                }}
                onClick={(e) => {
                  // We allow the native controls to work if clicked.
                  // If the video surface is clicked, we toggle.
                }}
             />
             {/* Play Button Overlay (Visible when paused) */}
             {!isPlaying && (
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                   <div className="w-14 h-14 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg transition-transform transform group-hover:scale-110">
                      <Play className="w-6 h-6 text-white fill-white ml-1" />
                   </div>
                </div>
             )}
          </div>
        )}

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 pointer-events-none">
          <div className="flex justify-end gap-2 pointer-events-auto">
             {/* AI Edit Toggle */}
             {(item.type === MediaType.IMAGE || item.type === MediaType.LOGO) && onAIEdit && (
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   setIsAIEditing(!isAIEditing);
                   // Reset canvas edit if open
                   setIsEditing(false);
                 }}
                 className={`px-2 py-1 backdrop-blur text-white text-xs rounded-md hover:bg-brand-blue transition-colors flex items-center gap-1 ${isAIEditing ? 'bg-brand-blue' : 'bg-black/50'}`}
                 title="Magic Edit with Text"
               >
                 <MessageSquare className="w-3 h-3" /> AI Edit
               </button>
             )}

             {/* Canvas Edit Toggle */}
             {(item.type === MediaType.IMAGE || item.type === MediaType.LOGO) && onEditSave && (
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   setIsEditing(true);
                   setIsAIEditing(false);
                 }}
                 className="px-2 py-1 bg-black/50 backdrop-blur text-white text-xs rounded-md hover:bg-black/70 transition-colors flex items-center gap-1"
               >
                 <Edit2 className="w-3 h-3" /> Edit
               </button>
             )}
             <span className="px-2 py-1 bg-black/50 backdrop-blur text-white text-xs rounded-md uppercase tracking-wider">
                {item.type}
             </span>
          </div>
          
          <div className="space-y-2">
             {/* AI Edit Input Form - Appears when toggled */}
             {isAIEditing && (
               <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-2 rounded-lg shadow-xl animate-in slide-in-from-bottom-2 mb-2">
                 <form onSubmit={handleSubmitAIEdit} className="flex gap-2">
                   <input 
                     type="text"
                     value={aiEditPrompt}
                     onChange={(e) => setAiEditPrompt(e.target.value)}
                     placeholder="e.g., Add sunglasses..."
                     className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-brand-blue outline-none text-slate-900 placeholder:text-slate-400"
                     autoFocus
                     onClick={(e) => e.stopPropagation()}
                   />
                   <button 
                     type="submit"
                     disabled={!aiEditPrompt.trim()}
                     className="p-2 bg-brand-blue text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                     title="Generate Edit"
                   >
                     <Send className="w-3 h-3" />
                   </button>
                 </form>
               </div>
             )}

             {/* Text remains pointer-events-none to allow clicking through to video controls behind it if needed */}
             {!isAIEditing && (
                <p className="text-white text-sm line-clamp-2 drop-shadow-md font-medium">
                  {item.prompt}
                </p>
             )}

             {!isAIEditing && resolution && (
               <p className="text-white/70 text-[10px] font-mono tracking-wide uppercase drop-shadow-md">
                 {resolution}
               </p>
             )}

             <div className="flex items-center gap-2 pointer-events-auto">
               <button 
                 onClick={handleDownload}
                 className="p-2 bg-white text-slate-900 rounded-full hover:bg-brand-yellow transition-colors shadow-lg"
                 title="Download"
               >
                 <Download className="w-4 h-4" />
               </button>

               {onUpscale && (
                 <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpscale();
                    }}
                    className="p-2 bg-white text-slate-900 rounded-full hover:bg-brand-blue hover:text-white transition-colors shadow-lg"
                    title="Upscale to 4K"
                 >
                    <ScanLine className="w-4 h-4" />
                 </button>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};