import React, { useState, useRef } from 'react';
import { GeneratedItem, MediaType } from '../types';
import { Download, Play, ScanLine, Edit2, RotateCw, Crop, Wand2, Check, X, MessageSquare, Send } from 'lucide-react';
import { Box, Card, CardMedia, IconButton, Typography, Tooltip, Chip, TextField, Button, Fade } from '@mui/material';

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
       <Card sx={{ borderRadius: 4, overflow: 'hidden', bgcolor: 'grey.900', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)', border: 1, borderColor: 'grey.800', position: 'relative', display: 'flex', flexDirection: 'column', aspectRatio: { xs: '4/3', md: '16/9' } }}>
          {/* Editor Area */}
          <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.8)', p: 2, backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 70%)' }}>
             <img 
               ref={imgRef}
               src={item.url} 
               alt="Editing preview"
               style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', borderRadius: '8px', ...getPreviewStyle() }}
             />
             {/* Crop Overlay Indicator (Visual only - simplistic) */}
             {crop !== 'original' && (
                <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Box sx={{ 
                      border: '2px solid rgba(255,255,255,0.8)', 
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
                      aspectRatio: crop === 'square' ? '1/1' : crop === 'landscape' ? '16/9' : '9/16',
                      width: crop === 'square' || crop === 'landscape' ? '100%' : 'auto',
                      height: crop === 'portrait' ? '100%' : 'auto',
                      maxHeight: '100%',
                      transition: 'all 0.3s ease'
                   }} />
                </Box>
             )}
          </Box>

          {/* Toolbar */}
          <Box sx={{ bgcolor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, borderTop: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Rotate 90°">
                  <IconButton onClick={() => setRotation((r) => (r + 90) % 360)} sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'grey.300', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }, borderRadius: 2, transition: 'all 0.2s' }} size="small">
                    <RotateCw size={18} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={`Crop: ${crop}`}>
                  <IconButton onClick={cycleCrop} sx={{ bgcolor: crop !== 'original' ? 'primary.main' : 'rgba(255,255,255,0.1)', color: crop !== 'original' ? 'white' : 'grey.300', '&:hover': { bgcolor: crop !== 'original' ? 'primary.dark' : 'rgba(255,255,255,0.2)', color: 'white' }, borderRadius: 2, transition: 'all 0.2s' }} size="small">
                    <Crop size={18} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={`Filter: ${filter}`}>
                  <IconButton onClick={cycleFilter} sx={{ bgcolor: filter !== 'none' ? 'primary.main' : 'rgba(255,255,255,0.1)', color: filter !== 'none' ? 'white' : 'grey.300', '&:hover': { bgcolor: filter !== 'none' ? 'primary.dark' : 'rgba(255,255,255,0.2)', color: 'white' }, borderRadius: 2, transition: 'all 0.2s' }} size="small">
                    <Wand2 size={18} />
                  </IconButton>
                </Tooltip>
             </Box>

             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Tooltip title="Cancel">
                  <IconButton onClick={() => { setIsEditing(false); setRotation(0); setFilter('none'); setCrop('original'); }} sx={{ color: 'grey.400', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }, transition: 'all 0.2s' }} size="small">
                    <X size={20} />
                  </IconButton>
                </Tooltip>
                <Button 
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={isSaving ? undefined : <Check size={16} />}
                  sx={{ borderRadius: 2, fontWeight: 600, px: 2, py: 0.75, textTransform: 'none' }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
             </Box>
          </Box>
       </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        position: 'relative', 
        borderRadius: 4, 
        overflow: 'hidden', 
        bgcolor: 'white', 
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', 
        border: 1, 
        borderColor: 'divider',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          transform: 'translateY(-4px)',
          '& .overlay': { opacity: 1 }
        }
      }}
    >
      <Box sx={{ aspectRatio: item.aspectRatio.replace(':', '/'), width: '100%', position: 'relative', bgcolor: 'grey.50' }}>
        {item.type === MediaType.IMAGE || item.type === MediaType.LOGO ? (
          <img 
            src={item.url} 
            alt={item.prompt} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
            onLoad={(e) => {
              const img = e.currentTarget;
              setResolution(`${img.naturalWidth}x${img.naturalHeight}px`);
            }}
          />
        ) : (
          <Box sx={{ width: '100%', height: '100%', position: 'relative', bgcolor: 'black' }}>
             <video 
                ref={videoRef}
                src={item.url}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                controls
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={(e) => {
                  const vid = e.currentTarget;
                  setResolution(`${vid.videoWidth}x${vid.videoHeight}px`);
                }}
             />
             {/* Play Button Overlay (Visible when paused) */}
             {!isPlaying && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                   <Box sx={{ width: 64, height: 64, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)', transition: 'transform 0.3s', '.MuiCard-root:hover &': { transform: 'scale(1.1)' } }}>
                      <Play size={28} color="white" fill="white" style={{ marginLeft: 4 }} />
                   </Box>
                </Box>
             )}
          </Box>
        )}

        {/* Overlay Actions */}
        <Box className="overlay" sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.2) 50%, transparent 100%)', opacity: 0, transition: 'opacity 0.3s ease-in-out', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2, pointerEvents: 'none' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pointerEvents: 'auto' }}>
             {/* AI Edit Toggle */}
             {(item.type === MediaType.IMAGE || item.type === MediaType.LOGO) && onAIEdit && (
               <Tooltip title="Magic Edit with Text">
                 <Button
                   onClick={(e) => {
                     e.stopPropagation();
                     setIsAIEditing(!isAIEditing);
                     setIsEditing(false);
                   }}
                   size="small"
                   sx={{ minWidth: 0, px: 1.5, py: 0.5, bgcolor: isAIEditing ? 'primary.main' : 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(8px)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'primary.main', borderColor: 'primary.main' }, textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s' }}
                   startIcon={<MessageSquare size={14} />}
                 >
                   AI Edit
                 </Button>
               </Tooltip>
             )}

             {/* Canvas Edit Toggle */}
             {(item.type === MediaType.IMAGE || item.type === MediaType.LOGO) && onEditSave && (
               <Button
                 onClick={(e) => {
                   e.stopPropagation();
                   setIsEditing(true);
                   setIsAIEditing(false);
                 }}
                 size="small"
                 sx={{ minWidth: 0, px: 1.5, py: 0.5, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(8px)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s' }}
                 startIcon={<Edit2 size={14} />}
               >
                 Edit
               </Button>
             )}
             <Chip label={item.type} size="small" sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white', backdropFilter: 'blur(8px)', borderRadius: 2, textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em', height: 26, border: '1px solid rgba(255,255,255,0.1)' }} />
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
             {/* AI Edit Input Form - Appears when toggled */}
             {isAIEditing && (
               <Fade in={isAIEditing}>
                 <Box sx={{ pointerEvents: 'auto', bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', p: 1.5, borderRadius: 3, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', mb: 1, border: '1px solid rgba(255,255,255,0.5)' }}>
                   <Box component="form" onSubmit={handleSubmitAIEdit} sx={{ display: 'flex', gap: 1 }}>
                     <TextField 
                       size="small"
                       value={aiEditPrompt}
                       onChange={(e) => setAiEditPrompt(e.target.value)}
                       placeholder="e.g., Add sunglasses..."
                       fullWidth
                       autoFocus
                       onClick={(e) => e.stopPropagation()}
                       sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', fontSize: '0.875rem', borderRadius: 2 } }}
                     />
                     <IconButton 
                       type="submit"
                       disabled={!aiEditPrompt.trim()}
                       color="primary"
                       sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 2, '&:hover': { bgcolor: 'primary.dark' }, '&.Mui-disabled': { bgcolor: 'grey.300', color: 'grey.500' }, width: 40, height: 40 }}
                       size="small"
                     >
                       <Send size={18} />
                     </IconButton>
                   </Box>
                 </Box>
               </Fade>
             )}

             {/* Text remains pointer-events-none to allow clicking through to video controls behind it if needed */}
             {!isAIEditing && (
                <Typography variant="body2" color="white" fontWeight="500" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 2px 4px rgba(0,0,0,0.8)', lineHeight: 1.4 }}>
                  {item.prompt}
                </Typography>
             )}

             {!isAIEditing && resolution && (
               <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace', letterSpacing: '0.05em', textTransform: 'uppercase', textShadow: '0 1px 2px rgba(0,0,0,0.8)', fontWeight: 600 }}>
                 {resolution}
               </Typography>
             )}

             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pointerEvents: 'auto' }}>
               <Tooltip title="Download">
                 <IconButton 
                   onClick={handleDownload}
                   sx={{ bgcolor: 'white', color: 'grey.900', '&:hover': { bgcolor: '#FFD166', transform: 'translateY(-2px)' }, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', transition: 'all 0.2s', width: 36, height: 36 }}
                   size="small"
                 >
                   <Download size={18} />
                 </IconButton>
               </Tooltip>

               {onUpscale && (
                 <Tooltip title="Upscale to 4K">
                   <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpscale();
                      }}
                      sx={{ bgcolor: 'white', color: 'grey.900', '&:hover': { bgcolor: 'primary.main', color: 'white', transform: 'translateY(-2px)' }, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', transition: 'all 0.2s', width: 36, height: 36 }}
                      size="small"
                   >
                      <ScanLine size={18} />
                   </IconButton>
                 </Tooltip>
               )}
             </Box>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};