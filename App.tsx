import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { MediaCard } from './components/MediaCard';
import { LoadingState } from './components/LoadingState';
import { ErrorMessage } from './components/ErrorMessage';
import { GeneratedItem, MediaType, AspectRatio, AdvancedOptions } from './types';
import { generateImage, generateVideo, upscaleImage, editImageWithPrompt, manipulateImage, generateLogo } from './services/gemini';
import { Sparkles, Film, Image as ImageIcon, Settings2, ChevronDown, ChevronUp, Dices, Lightbulb, ScanLine, Wand2, Upload, X, PenTool, Palette, Ban, Hash, Check } from 'lucide-react';

const DEFAULT_PROMPT = "A woman, exuberantly smiling and wearing sunglasses and a red jacket, leans forward against a vibrant blue sky. Behind her, a red car speeds by on a sunlit street, with a rusted metal fence as a backdrop. The image exudes energy, joy, and a sense of carefree movement.";
const STORAGE_KEY = 'solaris_history';

const STYLE_PRESETS = [
  'None',
  'Photorealistic',
  'Corporate Flat Design',
  'Vector Design',
  'Vector Art',
  'Cinematic',
  'Studio Portrait',
  'Abstract Expressionism',
  'Surrealism',
  'Line Art',
  'Art Deco',
  'Drone Photography',
  'Drone Shot: Aerial View',
  'Drone Shot: Low Angle',
  'Bird\'s Eye View',
  'Worm\'s Eye View',
  'Wide Angle',
  'Isometric 3D',
  'Macro Photography',
  'T-Shirt Mockup',
  'Hoodie Mockup',
  'Tracksuit Display',
  'Sports Jersey/Kit',
  'Denim Jacket Style',
  'Fashion Editorial',
  'Anime',
  'Digital Art',
  'Oil Painting',
  'Cyberpunk',
  'Watercolor',
  '3D Render',
  'Sketch'
];

const LOGO_PRESETS = [
  'Minimalist Line Art',
  'Modern Gradient 3D',
  'Vintage Badge & Emblem',
  'Abstract Geometric',
  'Mascot Character',
  'Typographic Monogram',
  'Futuristic Tech',
  'Organic Hand-drawn',
  'Negative Space',
  'Luxury Minimalist',
  // Expanded Presets
  'Polygonal Low Poly',
  'Neon Cyberpunk',
  'Watercolor Artistic',
  'Graffiti / Street Art',
  'Corporate Flat Design',
  'Pixel Art (8-bit)',
  'Industrial Blueprint',
  'Glassmorphism',
  'Paper Cutout Style',
  'Calligraphic Script',
  'Retro Pop Art',
  'Art Deco Crest',
  'Grunge Stamp',
  'Chalkboard Lettering',
  'Gaming Esport Shield',
  'Isometric Icon',
  'Heraldic Shield',
  'Single Line Monoline',
  'Mosaic Tile',
  'Dotted Halftone'
];

const MANIPULATION_PRESETS = [
  // Professional / Product
  'Product Studio (Clean White)',
  'Luxury Podium (Gold/Marble)',
  'Nature Background (Outdoor)',
  'Professional Headshot',
  
  // 1. Fantasy & Surreal
  'Surrealism',
  'Levitation',
  'Fantasy Manipulation',
  'Giant Objects',
  'Miniature World',
  'Underwater Scene',
  'Cloud/Sky Manipulation',
  
  // 2. Sci-Fi & Futuristic
  'Cyberpunk',
  'Steampunk',
  'Cyborg Effect',
  'Space/Galaxy Art',
  'Post-Apocalyptic',
  'Glitch Art',
  
  // 3. Effects & Technical
  'Double Exposure',
  'Dispersion Effect',
  'Pixel Stretch',
  'Splash Effect',
  'Glowing Effect',
  'Low Poly Art',
  'Duotone',
  
  // 4. Horror & Dark
  'Dark/Horror Manipulation',
  'Headless',
  'Invisible Man',
  'Vampire/Zombie Transformation',
  
  // 5. Creative Composition
  'Text Portrait',
  'Out of Bounds',
  'Animal Hybrids',
  'Sketch vs Real',
  'Perspective Bending',
  'Matte Painting',

  // 6. Clothing & Apparel
  'T-Shirt Mockup',
  'Hoodie Mockup',
  'Tracksuit Display',
  'Sports Jersey/Kit',
  'Denim Jacket Style',
  'Fashion Editorial'
];

const SUGGESTIONS: Record<MediaType, string[]> = {
  [MediaType.IMAGE]: [
    "A futuristic city floating in the clouds, golden hour lighting, highly detailed",
    "A cute robot gardening in a greenhouse, macro photography, soft bokeh",
    "Cyberpunk street food vendor at night, neon lights, rain reflections",
    "Oil painting of a cozy cottage in autumn woods, warm colors"
  ],
  [MediaType.VIDEO]: [
    "Drone shot flying through a canyon at sunset, cinematic lighting",
    "A time-lapse of a flower blooming, detailed textures, soft background",
    "Slow motion water droplets falling into a blue pool, crystal clear",
    "A neon hologram of a cat driving at top speed, retro synthwave style"
  ],
  [MediaType.MANIPULATION]: [
    "Remove background and place on a wooden table",
    "Change the color of the jacket to blue",
    "Add a cinematic lens flare and dramatic lighting",
    "Make it look like a vintage polaroid photo"
  ],
  [MediaType.LOGO]: [
    "A minimalist fox head geometric style",
    "Modern tech startup logo using the letter S",
    "Coffee shop emblem with vintage typography",
    "Abstract phoenix rising from flames gradient colors"
  ]
};

function App() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [mediaType, setMediaType] = useState<MediaType>(MediaType.IMAGE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Advanced Options State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [stylePreset, setStylePreset] = useState('None');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [upscale4K, setUpscale4K] = useState(false);

  // Manipulation State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [manipulationPreset, setManipulationPreset] = useState<string>(MANIPULATION_PRESETS[0]);

  // Logo State
  const [logoPreset, setLogoPreset] = useState<string>(LOGO_PRESETS[0]);
  
  // Initialize history from localStorage
  const [history, setHistory] = useState<GeneratedItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error("Failed to load history:", err);
      return [];
    }
  });

  // Save history to localStorage whenever it changes with Quota Management
  useEffect(() => {
    const saveWithQuotaCheck = (items: GeneratedItem[]) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (err: any) {
        if (
          err.name === 'QuotaExceededError' || 
          err.name === 'NS_ERROR_DOM_QUOTA_REACHED' || // Firefox
          err.message?.toLowerCase().includes('quota')
        ) {
          // Quota exceeded: Drop the oldest item (last in array) and try again
          if (items.length > 0) {
            const reducedItems = items.slice(0, items.length - 1);
            // Recursively try to save smaller list
            saveWithQuotaCheck(reducedItems);
          } else {
             console.error("Cannot save even a single item to localStorage. Item too large?");
          }
        } else {
          console.error("Failed to save history:", err);
        }
      }
    };

    saveWithQuotaCheck(history);
  }, [history]);

  const galleryRef = useRef<HTMLDivElement>(null);

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setPrompt("Enhance this image professionally."); // Default prompt for manipulation
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    // 1. Validate Prompt
    if (!prompt.trim()) {
      setError("Please enter a description for your creation.");
      return;
    }

    // 2. Validate Upload for Manipulation
    if (mediaType === MediaType.MANIPULATION && !uploadedImage) {
      setError("Please upload an image to manipulate.");
      return;
    }

    // 3. Validate Aspect Ratio for Video
    if (mediaType === MediaType.VIDEO) {
      const validVideoRatios: AspectRatio[] = ['16:9', '9:16'];
      if (!validVideoRatios.includes(aspectRatio)) {
        setError("Veo video generation only supports 16:9 (Landscape) and 9:16 (Portrait) aspect ratios. Please select a valid ratio.");
        return;
      }
    }

    setIsGenerating(true);
    
    // Set loading message based on config
    let msg = "Painting pixels... Almost there.";
    if (mediaType === MediaType.VIDEO) {
      msg = "Crafting video frames... This typically takes 30-60 seconds.";
    } else if (mediaType === MediaType.MANIPULATION) {
      msg = `Applying ${manipulationPreset} style... Transforming reality.`;
    } else if (mediaType === MediaType.LOGO) {
      msg = `Designing ${logoPreset} logo... Crafting brand identity.`;
    } else if (upscale4K) {
      msg = "Painting pixels and upscaling to 4K... High quality takes a moment.";
    }
    setLoadingMessage(msg);
    
    setError(null);

    // Scroll to gallery
    setTimeout(() => {
      galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      let url = '';
      const advancedOptions: AdvancedOptions = {
        stylePreset,
        negativePrompt: negativePrompt.trim() || undefined,
        seed,
        upscale4K
      };

      if (mediaType === MediaType.IMAGE) {
        url = await generateImage(prompt, aspectRatio, advancedOptions);
      } else if (mediaType === MediaType.VIDEO) {
        url = await generateVideo(prompt, aspectRatio);
      } else if (mediaType === MediaType.MANIPULATION && uploadedImage) {
        url = await manipulateImage(uploadedImage, prompt, manipulationPreset);
      } else if (mediaType === MediaType.LOGO) {
        url = await generateLogo(prompt, logoPreset);
      }

      const newItem: GeneratedItem = {
        id: crypto.randomUUID(),
        type: mediaType === MediaType.MANIPULATION ? MediaType.IMAGE : (mediaType === MediaType.LOGO ? MediaType.IMAGE : mediaType), 
        url,
        prompt: mediaType === MediaType.MANIPULATION ? `(Manipulated: ${manipulationPreset}) ${prompt}` : (mediaType === MediaType.LOGO ? `(Logo: ${logoPreset}) ${prompt}` : (upscale4K && mediaType === MediaType.IMAGE ? `(4K) ${prompt}` : prompt)),
        timestamp: Date.now(),
        aspectRatio: (mediaType === MediaType.MANIPULATION || mediaType === MediaType.LOGO) ? '1:1' : aspectRatio, 
        advancedOptions: mediaType === MediaType.IMAGE ? advancedOptions : undefined
      };

      setHistory(prev => [newItem, ...prev]);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpscale = async (item: GeneratedItem) => {
    if (item.type !== MediaType.IMAGE) return;

    setIsGenerating(true);
    setLoadingMessage("Upscaling image to 4K... Enhancing details.");
    setError(null);

    // Scroll to gallery
    setTimeout(() => {
      galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const upscaledUrl = await upscaleImage(item.url, item.prompt);
      
      const newItem: GeneratedItem = {
        id: crypto.randomUUID(),
        type: MediaType.IMAGE,
        url: upscaledUrl,
        prompt: `(Upscaled 4K) ${item.prompt}`,
        timestamp: Date.now(),
        aspectRatio: item.aspectRatio, // Maintain original aspect ratio
        advancedOptions: item.advancedOptions
      };

      setHistory(prev => [newItem, ...prev]);
    } catch (err: any) {
      setError("Failed to upscale image: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAIEdit = async (item: GeneratedItem, editPrompt: string) => {
    if (item.type !== MediaType.IMAGE) return;

    setIsGenerating(true);
    setLoadingMessage(`Editing image: "${editPrompt}"...`);
    setError(null);

    // Scroll to gallery
    setTimeout(() => {
      galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const editedUrl = await editImageWithPrompt(item.url, editPrompt);
      
      const newItem: GeneratedItem = {
        id: crypto.randomUUID(),
        type: MediaType.IMAGE,
        url: editedUrl,
        prompt: `(Edited: ${editPrompt}) ${item.prompt}`,
        timestamp: Date.now(),
        aspectRatio: item.aspectRatio, 
        advancedOptions: item.advancedOptions
      };

      setHistory(prev => [newItem, ...prev]);
    } catch (err: any) {
      setError("Failed to edit image: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditSave = (originalItem: GeneratedItem, newUrl: string) => {
    const newItem: GeneratedItem = {
      id: crypto.randomUUID(),
      type: MediaType.IMAGE,
      url: newUrl,
      prompt: `(Canvas Edited) ${originalItem.prompt}`,
      timestamp: Date.now(),
      aspectRatio: originalItem.aspectRatio, // Keep simplified tracking for now
      advancedOptions: originalItem.advancedOptions
    };
    setHistory(prev => [newItem, ...prev]);
  };

  const getPlaceholderText = () => {
    switch(mediaType) {
      case MediaType.MANIPULATION: return "Describe how to manipulate this image (e.g., 'Place on a marble table')...";
      case MediaType.LOGO: return "Describe your logo concept (e.g., 'A minimalist mountain for a hiking brand')...";
      case MediaType.VIDEO: return "Describe the video scene you want to create...";
      default: return "Describe what you want to see...";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col">
        {/* Hero / Input Section */}
        <section className="relative bg-white border-b border-slate-200 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 to-brand-red/5 pointer-events-none"></div>
          
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
                Visualize the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-red">Extraordinary</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Transform your words into vivid images, videos, professional logos, and creative manipulations using Google's Gemini & Veo models.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 md:p-6 transition-all duration-300">
              
              {/* File Upload Area (Only for Manipulation) */}
              {mediaType === MediaType.MANIPULATION && (
                <div className="mb-6 animate-in fade-in zoom-in duration-300">
                  {!uploadedImage ? (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 text-slate-400 mb-2" />
                        <p className="mb-2 text-sm text-slate-500 font-semibold">Click to upload or drag and drop</p>
                        <p className="text-xs text-slate-400">SVG, PNG, JPG or GIF</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                  ) : (
                    <div className="relative w-full h-48 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center group">
                      <img src={uploadedImage} alt="Uploaded" className="h-full w-auto object-contain" />
                      <button 
                        onClick={() => setUploadedImage(null)}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                        title="Remove Image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute inset-0 bg-black/20 pointer-events-none group-hover:bg-black/10 transition-colors" />
                      <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded backdrop-blur">Source Image</span>
                    </div>
                  )}
                </div>
              )}

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    if (error && e.target.value.trim()) setError(null);
                  }}
                  placeholder={getPlaceholderText()}
                  className={`w-full h-32 p-4 text-lg text-slate-800 placeholder:text-slate-400 bg-slate-50 rounded-xl border focus:ring-2 focus:ring-brand-blue resize-none transition-shadow ${error && !prompt.trim() ? 'border-red-300 focus:ring-red-200' : 'border-transparent'}`}
                />
                <div className="absolute bottom-3 right-3 text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                  {prompt.length} chars
                </div>
              </div>

              {/* Prompt Suggestions */}
              <div className="mt-3 flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 select-none">
                  <Lightbulb className="w-3 h-3" />
                  <span>Try:</span>
                </div>
                {SUGGESTIONS[mediaType].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPrompt(suggestion);
                      if (error) setError(null);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-brand-blue/10 hover:text-brand-blue hover:border-brand-blue/20 border border-slate-200 transition-all text-left truncate max-w-[180px] sm:max-w-xs"
                    title={suggestion}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4">
                
                {/* Controls */}
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-center md:justify-start">
                  {/* Mode Toggle */}
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                      onClick={() => {
                        setMediaType(MediaType.IMAGE);
                        setError(null);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        mediaType === MediaType.IMAGE 
                          ? 'bg-white text-brand-blue shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      Image
                    </button>
                    <button
                      onClick={() => {
                        setMediaType(MediaType.VIDEO);
                        setError(null);
                        setShowAdvanced(false);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        mediaType === MediaType.VIDEO
                          ? 'bg-white text-brand-red shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Film className="w-4 h-4" />
                      Video
                    </button>
                    <button
                      onClick={() => {
                        setMediaType(MediaType.MANIPULATION);
                        setError(null);
                        setShowAdvanced(false);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        mediaType === MediaType.MANIPULATION
                          ? 'bg-white text-purple-600 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Wand2 className="w-4 h-4" />
                      Manipulation
                    </button>
                     <button
                      onClick={() => {
                        setMediaType(MediaType.LOGO);
                        setError(null);
                        setShowAdvanced(false);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        mediaType === MediaType.LOGO
                          ? 'bg-white text-orange-500 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <PenTool className="w-4 h-4" />
                      Logo Design
                    </button>
                  </div>

                  {/* Config Selectors */}
                  {mediaType !== MediaType.MANIPULATION && mediaType !== MediaType.LOGO && (
                    <select
                      value={aspectRatio}
                      onChange={(e) => {
                        setAspectRatio(e.target.value as AspectRatio);
                        setError(null);
                      }}
                      className="px-3 py-2 bg-slate-100 border-0 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-brand-blue cursor-pointer hover:bg-slate-200 transition-colors"
                    >
                      <option value="1:1" disabled={mediaType === MediaType.VIDEO}>Square (1:1) {mediaType === MediaType.VIDEO ? '(Image only)' : ''}</option>
                      <option value="16:9">Landscape (16:9)</option>
                      <option value="9:16">Portrait (9:16)</option>
                      <option value="4:3" disabled={mediaType === MediaType.VIDEO}>Standard (4:3) {mediaType === MediaType.VIDEO ? '(Image only)' : ''}</option>
                      <option value="3:4" disabled={mediaType === MediaType.VIDEO}>Vertical (3:4) {mediaType === MediaType.VIDEO ? '(Image only)' : ''}</option>
                    </select>
                  )}
                  
                  {mediaType === MediaType.MANIPULATION && (
                    /* Manipulation Presets */
                    <select
                      value={manipulationPreset}
                      onChange={(e) => setManipulationPreset(e.target.value)}
                      className="px-3 py-2 bg-slate-100 border-0 rounded-lg text-sm font-medium text-purple-700 focus:ring-2 focus:ring-purple-500 cursor-pointer hover:bg-slate-200 transition-colors max-w-[240px]"
                    >
                       {MANIPULATION_PRESETS.map(preset => (
                         <option key={preset} value={preset}>{preset}</option>
                       ))}
                    </select>
                  )}

                   {mediaType === MediaType.LOGO && (
                    /* Logo Presets */
                    <select
                      value={logoPreset}
                      onChange={(e) => setLogoPreset(e.target.value)}
                      className="px-3 py-2 bg-slate-100 border-0 rounded-lg text-sm font-medium text-orange-700 focus:ring-2 focus:ring-orange-500 cursor-pointer hover:bg-slate-200 transition-colors max-w-[240px]"
                    >
                       {LOGO_PRESETS.map(preset => (
                         <option key={preset} value={preset}>{preset}</option>
                       ))}
                    </select>
                  )}
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`w-full md:w-auto px-8 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-white shadow-lg transition-all transform active:scale-95 ${
                    isGenerating
                      ? 'bg-slate-300 cursor-not-allowed shadow-none'
                      : mediaType === MediaType.MANIPULATION
                        ? 'bg-gradient-to-r from-purple-600 to-blue-500 hover:shadow-xl hover:brightness-110 shadow-purple-500/20'
                        : mediaType === MediaType.LOGO
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-xl hover:brightness-110 shadow-orange-500/20'
                          : 'bg-gradient-to-r from-brand-blue to-brand-red hover:shadow-xl hover:brightness-110 shadow-brand-blue/20'
                  }`}
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      Thinking...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      {mediaType === MediaType.MANIPULATION ? 'Manipulate' : mediaType === MediaType.LOGO ? 'Create Logo' : 'Generate'}
                    </span>
                  )}
                </button>
              </div>

              {/* Advanced Options Toggle (Image Mode Only) */}
              {mediaType === MediaType.IMAGE && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-blue transition-colors select-none"
                  >
                    <Settings2 className="w-4 h-4" />
                    <span>Advanced Options</span>
                    {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {/* Advanced Options Panel */}
                  {showAdvanced && (
                    <div className="mt-4 p-5 bg-slate-50/80 rounded-xl border border-slate-200/80 shadow-inner animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Left Column: Creative Control */}
                        <div className="space-y-4">
                           <div className="space-y-1.5">
                              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                <Palette className="w-3.5 h-3.5" /> Style Preset
                              </label>
                              <div className="relative">
                                <select
                                  value={stylePreset}
                                  onChange={(e) => setStylePreset(e.target.value)}
                                  className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-shadow appearance-none"
                                >
                                  {STYLE_PRESETS.map(style => (
                                    <option key={style} value={style}>{style}</option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                              </div>
                           </div>

                           <div className="space-y-1.5">
                              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                <Ban className="w-3.5 h-3.5" /> Negative Prompt
                              </label>
                              <input
                                type="text"
                                value={negativePrompt}
                                onChange={(e) => setNegativePrompt(e.target.value)}
                                placeholder="What to exclude (e.g. blurry, distortion)"
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-brand-blue focus:border-transparent placeholder:text-slate-400 transition-shadow"
                              />
                           </div>
                        </div>

                        {/* Right Column: Technical Settings */}
                        <div className="space-y-4">
                           <div className="space-y-1.5">
                              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                <Hash className="w-3.5 h-3.5" /> Seed Control
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={seed ?? ''}
                                  onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                                  placeholder="Random (-1)"
                                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-brand-blue focus:border-transparent placeholder:text-slate-400 transition-shadow"
                                />
                                <button 
                                  onClick={() => setSeed(Math.floor(Math.random() * 1000000))}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-brand-blue hover:bg-slate-100 rounded-md transition-colors"
                                  title="Randomize Seed"
                                >
                                  <Dices className="w-4 h-4" />
                                </button>
                              </div>
                           </div>

                           <div className="space-y-1.5">
                              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                <ScanLine className="w-3.5 h-3.5" /> Quality
                              </label>
                              <div 
                                onClick={() => setUpscale4K(!upscale4K)}
                                className={`w-full px-3 py-2 flex items-center justify-between border rounded-lg cursor-pointer transition-all group select-none ${
                                  upscale4K 
                                  ? 'bg-brand-blue/5 border-brand-blue/50 shadow-sm' 
                                  : 'bg-white border-slate-200 hover:border-brand-blue/30 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-1.5 rounded-md transition-colors ${upscale4K ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-400 group-hover:text-brand-blue'}`}>
                                     <ScanLine className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className={`text-sm font-semibold leading-tight ${upscale4K ? 'text-brand-blue' : 'text-slate-700'}`}>Upscale to 4K</span>
                                    <span className="text-[10px] text-slate-500 leading-tight">Post-process enhancement</span>
                                  </div>
                                </div>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${upscale4K ? 'border-brand-blue bg-brand-blue' : 'border-slate-300 bg-slate-50'}`}>
                                   <Check className={`w-3 h-3 text-white transition-transform ${upscale4K ? 'scale-100' : 'scale-0'}`} />
                                </div>
                              </div>
                           </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section 
          ref={galleryRef} 
          className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Gallery</h2>
            <span className="text-sm text-slate-500">{history.length} items generated</span>
          </div>

          {error && (
            <ErrorMessage 
              message={error} 
              onClose={() => setError(null)} 
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isGenerating && (
               <div className="col-span-1">
                 <LoadingState message={loadingMessage} />
               </div>
            )}
            
            {history.map((item) => (
              <MediaCard 
                key={item.id} 
                item={item} 
                onUpscale={item.type === MediaType.IMAGE && !item.prompt.includes("(Upscaled") ? () => handleUpscale(item) : undefined} 
                onEditSave={item.type === MediaType.IMAGE ? (newUrl) => handleEditSave(item, newUrl) : undefined}
                onAIEdit={item.type === MediaType.IMAGE ? (editPrompt) => handleAIEdit(item, editPrompt) : undefined}
              />
            ))}

            {!isGenerating && history.length === 0 && !error && (
              <div className="col-span-full flex flex-col items-center justify-center py-24 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <div className="p-4 bg-slate-100 rounded-full mb-4">
                   <Sparkles className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-lg font-medium mb-1">Your canvas is empty</p>
                <p className="text-sm">Enter a prompt above to start creating.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;