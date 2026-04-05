import React, { useState, useRef, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Container, Box, Typography, TextField, Button, Grid, Paper, ToggleButtonGroup, ToggleButton, Select, MenuItem, FormControl, InputLabel, Accordion, AccordionSummary, AccordionDetails, IconButton, Tooltip, Chip, Collapse, InputAdornment, CircularProgress } from '@mui/material';
import { Header } from './components/Header';
import { MediaCard } from './components/MediaCard';
import { LoadingState } from './components/LoadingState';
import { ErrorMessage } from './components/ErrorMessage';
import { ApiKeyModal } from './components/ApiKeyModal';
import { GeneratedItem, MediaType, AspectRatio, AdvancedOptions } from './types';
import { generateImage, generateVideo, upscaleImage, editImageWithPrompt, manipulateImage, generateLogo } from './services/gemini';
import { generateExternalImage, ExternalApiConfig } from './services/external';
import { Sparkles, Film, Image as ImageIcon, Settings2, ChevronDown, ChevronUp, Dices, Lightbulb, ScanLine, Wand2, Upload, X, PenTool, Palette, Ban, Hash, Check, Globe, Key } from 'lucide-react';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0f172a', // slate-900
      light: '#334155', // slate-700
      dark: '#020617', // slate-950
    },
    secondary: {
      main: '#3b82f6', // blue-500
      light: '#60a5fa', // blue-400
      dark: '#2563eb', // blue-600
    },
    background: {
      default: '#f8fafc', // slate-50
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a', // slate-900
      secondary: '#64748b', // slate-500
    },
    divider: '#e2e8f0', // slate-200
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.025em' },
    h2: { fontWeight: 800, letterSpacing: '-0.025em' },
    h3: { fontWeight: 700, letterSpacing: '-0.025em' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500 },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderRadius: '12px',
          padding: '10px 24px',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            transform: 'translateY(-1px)',
          },
          transition: 'all 0.2s ease-in-out',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
          }
        }
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
        elevation2: {
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
        elevation3: {
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            transition: 'all 0.2s ease-in-out',
            '&:hover fieldset': {
              borderColor: '#94a3b8',
            },
            '&.Mui-focused fieldset': {
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          padding: '4px',
          backgroundColor: '#f1f5f9',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: 'none',
          borderRadius: '8px !important',
          margin: '0 2px',
          textTransform: 'none',
          fontWeight: 500,
          color: '#64748b',
          '&.Mui-selected': {
            backgroundColor: '#ffffff',
            color: '#0f172a',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            '&:hover': {
              backgroundColor: '#ffffff',
            },
          },
        },
      },
    },
  },
});

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
  'Sketch',
  'Color Glaze',
  'Watercolor Splash Art',
  'Mixed Media Sketch',
  'Vibrant Bokeh Splash',
  'High-Speed Photography',
  'Vector Splatter Portrait',
  'Comic Book Illustration',
  'Cel-Shaded Art',
  'Neon Dual Lighting',
  'Synthwave Portrait',
  'Stylized 3D Character',
  'Retro Minimalist',
  'Modern Emblem',
  'Abstract Geometric',
  'Mascot Character',
  'Vintage Badge',
  'Typographic Monogram',
  'Futuristic Tech',
  'Organic Hand-drawn',
  'Negative Space',
  'Luxury Gold & Black'
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
  'Dotted Halftone',
  'Vaporwave Aesthetic',
  'Steampunk Gear',
  'Celtic Knotwork',
  'Gothic Lettering',
  'Synthwave Grid',
  'Pop Art Comic',
  'Origami Folded',
  'Stained Glass',
  'Neon Sign',
  'Woodcut Print',
  'Isometric Architectural',
  'Monogram Typographic',
  'Geometric Abstract',
  'Heraldic Crest',
  'Playful Cartoon',
  'Minimalist Clean',
  'Vintage Stamp',
  // Conceptual Presets
  'Eco-Friendly & Sustainable',
  'Zen & Mindfulness',
  'Quantum Computing',
  'Cosmic & Astronomical',
  'Biomimicry & Nature-Inspired',
  'Data Flow & Connectivity',
  'Optical Illusion',
  'Kinetic Typography',
  'Fluid Dynamics',
  'Sacred Geometry',
  'Cybernetic Organism',
  'Holographic Projection',
  'Ethereal & Dreamlike',
  'Brutalist Architecture',
  'Alchemy & Mysticism',
  'Soundwave & Audio',
  'Microscopic Cellular',
  'Time & Chronology',
  'Metamorphosis & Evolution',
  'Paradox & Impossible Shapes'
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
  'Watercolor Splash Art',
  'Mixed Media Sketch',
  'Vibrant Bokeh Splash',
  'High-Speed Photography',
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
  'Vector Splatter Portrait',
  'Comic Book Illustration',
  'Cel-Shaded Art',
  'Neon Dual Lighting',
  'Synthwave Portrait',
  'Stylized 3D Character',

  // 6. Clothing & Apparel
  'T-Shirt Mockup',
  'Hoodie Mockup',
  'Tracksuit Display',
  'Sports Jersey/Kit',
  'Denim Jacket Style',
  'Fashion Editorial',

  // 7. Artistic Styles
  'Polygonal Low Poly',
  'Neon Cyberpunk',
  'Watercolor Artistic',
  'Graffiti / Street Art'
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
  
  // External API State
  const [apiProvider, setApiProvider] = useState<'gemini' | 'external'>('gemini');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [externalConfig, setExternalConfig] = useState<ExternalApiConfig>(() => {
    try {
      const saved = localStorage.getItem('solaris_external_config');
      return saved ? JSON.parse(saved) : { endpoint: 'https://api.openai.com/v1/images/generations', apiKey: '', model: 'dall-e-3' };
    } catch {
      return { endpoint: 'https://api.openai.com/v1/images/generations', apiKey: '', model: 'dall-e-3' };
    }
  });

  useEffect(() => {
    localStorage.setItem('solaris_external_config', JSON.stringify(externalConfig));
  }, [externalConfig]);

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

      if (apiProvider === 'external' && (mediaType === MediaType.IMAGE || mediaType === MediaType.LOGO)) {
        if (mediaType === MediaType.IMAGE) {
          url = await generateExternalImage(prompt, aspectRatio, externalConfig, advancedOptions);
        } else {
          url = await generateExternalImage(`Logo: ${prompt}`, '1:1', externalConfig, { stylePreset: logoPreset });
        }
      } else {
        if (mediaType === MediaType.IMAGE) {
          url = await generateImage(prompt, aspectRatio, advancedOptions);
        } else if (mediaType === MediaType.VIDEO) {
          url = await generateVideo(prompt, aspectRatio);
        } else if (mediaType === MediaType.MANIPULATION && uploadedImage) {
          url = await manipulateImage(uploadedImage, prompt, manipulationPreset);
        } else if (mediaType === MediaType.LOGO) {
          url = await generateLogo(prompt, logoPreset);
        }
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
      if (err.message === "CUSTOM_API_KEY_REQUIRED") {
        setShowApiKeyModal(true);
        setError("Please set your Gemini API key to continue.");
      } else {
        setError(err.message || "An unknown error occurred during generation.");
      }
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
      if (err.message === "CUSTOM_API_KEY_REQUIRED") {
        setShowApiKeyModal(true);
        setError("Please set your Gemini API key to continue.");
      } else {
        setError("Failed to upscale image: " + err.message);
      }
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
      if (err.message === "CUSTOM_API_KEY_REQUIRED") {
        setShowApiKeyModal(true);
        setError("Please set your Gemini API key to continue.");
      } else {
        setError("Failed to edit image: " + err.message);
      }
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        <Header onOpenSettings={() => setShowApiKeyModal(true)} />

        <ApiKeyModal 
          isOpen={showApiKeyModal} 
          onClose={() => setShowApiKeyModal(false)}
          onSave={(key) => {
            if (error === "Please set your Gemini API key to continue.") {
              setError(null);
            }
          }}
          initialKey={localStorage.getItem('custom_gemini_api_key') || ''}
        />

        <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Hero / Input Section */}
        <Box sx={{ position: 'relative', bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', overflow: 'hidden' }}>
          {/* Modern Background Elements */}
          <Box sx={{ position: 'absolute', top: '-20%', left: '-10%', width: '50%', height: '100%', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50%', height: '100%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }} />
          
          <Container maxWidth="md" sx={{ py: { xs: 6, lg: 10 }, position: 'relative', zIndex: 1 }}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Chip 
                label="Powered by Gemini 3.1 & Veo 3.1" 
                size="small" 
                sx={{ mb: 3, bgcolor: 'primary.50', color: 'primary.main', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.7rem', border: '1px solid', borderColor: 'primary.100' }} 
              />
              <Typography variant="h2" component="h1" fontWeight="800" sx={{ mb: 2, color: 'grey.900', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                Visualize the <Box component="span" sx={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Extraordinary</Box>
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 'md', mx: 'auto', fontWeight: 500, lineHeight: 1.6 }}>
                Transform your words into vivid images, cinematic videos, professional logos, and creative manipulations with next-generation AI.
              </Typography>
            </Box>

            <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, border: '1px solid', borderColor: 'rgba(0,0,0,0.08)', bgcolor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(24px)', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.05), 0 0 0 1px rgb(0 0 0 / 0.02)', transition: 'all 0.3s' }}>
              
              {/* File Upload Area (Only for Manipulation) */}
              {mediaType === MediaType.MANIPULATION && (
                <Box sx={{ mb: 3, animation: 'fadeIn 0.3s' }}>
                  {!uploadedImage ? (
                    <Box component="label" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: 192, border: '2px dashed', borderColor: 'grey.300', borderRadius: 3, cursor: 'pointer', bgcolor: 'rgba(248, 250, 252, 0.5)', '&:hover': { bgcolor: 'grey.50', borderColor: 'primary.main' }, transition: 'all 0.2s' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pt: 5, pb: 6 }}>
                        <Box sx={{ p: 2, bgcolor: 'white', borderRadius: '50%', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', mb: 2 }}>
                          <Upload size={24} color="#64748b" />
                        </Box>
                        <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ mb: 0.5 }}>Click to upload or drag and drop</Typography>
                        <Typography variant="caption" color="text.secondary">SVG, PNG, JPG or GIF (max. 10MB)</Typography>
                      </Box>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                    </Box>
                  ) : (
                    <Box sx={{ position: 'relative', width: '100%', height: 192, bgcolor: 'grey.100', borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', '&:hover .overlay': { opacity: 1 } }}>
                      <img src={uploadedImage} alt="Uploaded" style={{ height: '100%', width: 'auto', objectFit: 'contain' }} />
                      <Box className="overlay" sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconButton 
                          onClick={() => setUploadedImage(null)}
                          sx={{ bgcolor: 'white', color: 'error.main', '&:hover': { bgcolor: 'error.50' }, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        >
                          <X size={20} />
                        </IconButton>
                      </Box>
                      <Chip label="Source Image" size="small" sx={{ position: 'absolute', bottom: 12, left: 12, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', backdropFilter: 'blur(4px)', fontWeight: 600 }} />
                    </Box>
                  )}
                </Box>
              )}

              <Box sx={{ position: 'relative' }}>
                <TextField
                  multiline
                  rows={4}
                  fullWidth
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    if (error && e.target.value.trim()) setError(null);
                  }}
                  placeholder={getPlaceholderText()}
                  variant="outlined"
                  error={!!error && !prompt.trim()}
                  sx={{ 
                    bgcolor: 'white', 
                    '& .MuiOutlinedInput-root': { 
                      borderRadius: 3,
                      fontSize: '1.125rem',
                      p: 2.5,
                      boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.02)',
                      '& fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
                      '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.2)' },
                      '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: '2px' }
                    } 
                  }}
                />
                <Box sx={{ position: 'absolute', bottom: 16, right: 16 }}>
                  <Chip label={`${prompt.length} chars`} size="small" sx={{ bgcolor: 'grey.50', color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600, border: '1px solid', borderColor: 'divider' }} />
                </Box>
              </Box>

              {/* Prompt Suggestions */}
              <Box sx={{ mt: 2.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.disabled', typography: 'caption', fontWeight: 700, textTransform: 'uppercase', userSelect: 'none', mr: 0.5, letterSpacing: '0.05em' }}>
                  <Lightbulb size={14} />
                  <span>Try:</span>
                </Box>
                {SUGGESTIONS[mediaType].map((suggestion, idx) => (
                  <Chip
                    key={idx}
                    label={suggestion}
                    onClick={() => {
                      setPrompt(suggestion);
                      if (error) setError(null);
                    }}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      maxWidth: { xs: 180, sm: 300 }, 
                      bgcolor: 'white', 
                      borderColor: 'grey.200',
                      color: 'text.secondary',
                      fontWeight: 500,
                      boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                      '&:hover': { bgcolor: 'primary.50', color: 'primary.main', borderColor: 'primary.200', transform: 'translateY(-1px)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' },
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </Box>

              <Box sx={{ mt: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                
                {/* Controls */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  {/* Mode Toggle */}
                  <ToggleButtonGroup
                    value={mediaType}
                    exclusive
                    onChange={(e, newType) => {
                      if (newType !== null) {
                        setMediaType(newType);
                        setError(null);
                        if (newType === MediaType.VIDEO) setShowAdvanced(false);
                      }
                    }}
                    size="small"
                    sx={{ 
                      bgcolor: 'grey.50', 
                      p: 0.5, 
                      borderRadius: 3, 
                      border: 1,
                      borderColor: 'divider',
                      boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.02)',
                      '& .MuiToggleButton-root': { 
                        border: 'none', 
                        borderRadius: '10px !important', 
                        px: 2, 
                        py: 1, 
                        textTransform: 'none', 
                        fontWeight: 600, 
                        color: 'text.secondary', 
                        transition: 'all 0.2s',
                        '&.Mui-selected': { 
                          bgcolor: 'white', 
                          color: 'primary.main', 
                          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', 
                          '&:hover': { bgcolor: 'white' } 
                        },
                        '&:hover:not(.Mui-selected)': {
                          bgcolor: 'grey.100',
                          color: 'text.primary'
                        }
                      } 
                    }}
                  >
                    <ToggleButton value={MediaType.IMAGE}>
                      <ImageIcon size={16} style={{ marginRight: 8 }} /> Image
                    </ToggleButton>
                    <ToggleButton value={MediaType.VIDEO}>
                      <Film size={16} style={{ marginRight: 8 }} /> Video
                    </ToggleButton>
                    <ToggleButton value={MediaType.MANIPULATION}>
                      <Wand2 size={16} style={{ marginRight: 8 }} /> Edit
                    </ToggleButton>
                    <ToggleButton value={MediaType.LOGO}>
                      <PenTool size={16} style={{ marginRight: 8 }} /> Logo
                    </ToggleButton>
                  </ToggleButtonGroup>

                  {/* API Provider Toggle (Image & Logo only) */}
                  {(mediaType === MediaType.IMAGE || mediaType === MediaType.LOGO) && (
                    <ToggleButtonGroup
                      value={apiProvider}
                      exclusive
                      onChange={(e, newValue) => {
                        if (newValue) setApiProvider(newValue);
                      }}
                      size="small"
                      sx={{ 
                        bgcolor: 'grey.50', 
                        p: 0.5, 
                        borderRadius: 3, 
                        border: 1,
                        borderColor: 'divider',
                        boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.02)',
                        '& .MuiToggleButton-root': { 
                          border: 'none', 
                          borderRadius: '10px !important', 
                          px: 1.5, 
                          py: 1, 
                          textTransform: 'none', 
                          fontWeight: 600, 
                          color: 'text.secondary', 
                          transition: 'all 0.2s',
                          '&.Mui-selected': { 
                            bgcolor: 'white', 
                            color: 'text.primary', 
                            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', 
                            '&:hover': { bgcolor: 'white' } 
                          },
                          '&:hover:not(.Mui-selected)': {
                            bgcolor: 'grey.100',
                            color: 'text.primary'
                          }
                        } 
                      }}
                    >
                      <ToggleButton value="gemini">
                        <Sparkles size={14} style={{ marginRight: 6 }} /> Gemini
                      </ToggleButton>
                      <ToggleButton value="external">
                        <Globe size={14} style={{ marginRight: 6 }} /> External API
                      </ToggleButton>
                    </ToggleButtonGroup>
                  )}

                  {/* Config Selectors */}
                  {mediaType !== MediaType.MANIPULATION && mediaType !== MediaType.LOGO && (
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <Select
                        value={aspectRatio}
                        onChange={(e) => {
                          setAspectRatio(e.target.value as AspectRatio);
                          setError(null);
                        }}
                        sx={{ 
                          bgcolor: 'white', 
                          borderRadius: 3, 
                          '& fieldset': { borderColor: 'divider' }, 
                          '&:hover fieldset': { borderColor: 'primary.main' },
                          fontWeight: 600, 
                          color: 'text.primary',
                          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                        }}
                      >
                        <MenuItem value="1:1" disabled={mediaType === MediaType.VIDEO}>Square (1:1) {mediaType === MediaType.VIDEO ? '(Image only)' : ''}</MenuItem>
                        <MenuItem value="16:9">Landscape (16:9)</MenuItem>
                        <MenuItem value="9:16">Portrait (9:16)</MenuItem>
                        <MenuItem value="4:3" disabled={mediaType === MediaType.VIDEO}>Standard (4:3) {mediaType === MediaType.VIDEO ? '(Image only)' : ''}</MenuItem>
                        <MenuItem value="3:4" disabled={mediaType === MediaType.VIDEO}>Vertical (3:4) {mediaType === MediaType.VIDEO ? '(Image only)' : ''}</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                  
                  {mediaType === MediaType.MANIPULATION && (
                    <FormControl size="small" sx={{ minWidth: 200, maxWidth: 240 }}>
                      <Select
                        value={manipulationPreset}
                        onChange={(e) => setManipulationPreset(e.target.value)}
                        sx={{ 
                          bgcolor: 'white', 
                          borderRadius: 3, 
                          '& fieldset': { borderColor: 'divider' }, 
                          '&:hover fieldset': { borderColor: 'primary.main' },
                          fontWeight: 600, 
                          color: 'text.primary',
                          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                        }}
                      >
                        {MANIPULATION_PRESETS.map(preset => (
                          <MenuItem key={preset} value={preset}>{preset}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                   {mediaType === MediaType.LOGO && (
                    <FormControl size="small" sx={{ minWidth: 200, maxWidth: 240 }}>
                      <Select
                        value={logoPreset}
                        onChange={(e) => setLogoPreset(e.target.value)}
                        sx={{ 
                          bgcolor: 'white', 
                          borderRadius: 3, 
                          '& fieldset': { borderColor: 'divider' }, 
                          '&:hover fieldset': { borderColor: 'primary.main' },
                          fontWeight: 600, 
                          color: 'text.primary',
                          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                        }}
                      >
                        {LOGO_PRESETS.map(preset => (
                          <MenuItem key={preset} value={preset}>{preset}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Box>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim() || (mediaType === MediaType.MANIPULATION && !uploadedImage)}
                  variant="contained"
                  size="large"
                  sx={{ 
                    px: 4, 
                    py: 1.5, 
                    borderRadius: 3, 
                    background: mediaType === MediaType.MANIPULATION ? 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)' : mediaType === MediaType.LOGO ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', 
                    color: 'white', 
                    fontWeight: 700, 
                    letterSpacing: '0.02em',
                    '&:hover': { 
                      background: mediaType === MediaType.MANIPULATION ? 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)' : mediaType === MediaType.LOGO ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                      transform: 'translateY(-1px)'
                    },
                    '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' },
                    width: { xs: '100%', md: 'auto' },
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <Sparkles size={20} />}
                >
                  {isGenerating ? 'Thinking...' : mediaType === MediaType.MANIPULATION ? 'Manipulate' : mediaType === MediaType.LOGO ? 'Create Logo' : 'Generate'}
                </Button>
              </Box>

              {/* Advanced Options & Settings Toggle */}
              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  color="inherit"
                  sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' }, textTransform: 'none', fontWeight: 600 }}
                  startIcon={<Settings2 size={16} />}
                  endIcon={showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                >
                  Advanced Options & Settings
                </Button>

                {/* Advanced Options Panel */}
                <Collapse in={showAdvanced}>
                  <Paper variant="outlined" sx={{ mt: 2, p: 3, bgcolor: 'rgba(248, 250, 252, 0.5)', borderRadius: 3, borderColor: 'divider', boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.02)' }}>
                    
                    {/* API Settings */}
                    <Box sx={{ mb: 3, pb: 3, borderBottom: 1, borderColor: 'divider' }}>
                      <Typography variant="subtitle2" fontWeight="700" color="text.primary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        {apiProvider === 'external' ? <Globe size={16} /> : <Key size={16} />} 
                        {apiProvider === 'external' ? 'External API Configuration' : 'Gemini API Configuration'}
                      </Typography>
                      
                      {apiProvider === 'external' ? (
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Endpoint URL"
                              value={externalConfig.endpoint}
                              onChange={(e) => setExternalConfig({...externalConfig, endpoint: e.target.value})}
                              placeholder="https://api.openai.com/v1/images/generations"
                              InputLabelProps={{ shrink: true }}
                              sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              size="small"
                              type="password"
                              label="API Key"
                              value={externalConfig.apiKey}
                              onChange={(e) => setExternalConfig({...externalConfig, apiKey: e.target.value})}
                              placeholder="sk-..."
                              InputLabelProps={{ shrink: true }}
                              sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Model"
                              value={externalConfig.model}
                              onChange={(e) => setExternalConfig({...externalConfig, model: e.target.value})}
                              placeholder="dall-e-3"
                              InputLabelProps={{ shrink: true }}
                              sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          </Grid>
                        </Grid>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, p: 2, bgcolor: 'white', borderRadius: 2, border: 1, borderColor: 'divider', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
                          <Box>
                            <Typography variant="body2" fontWeight="700" color="text.primary">Gemini API Key</Typography>
                            <Typography variant="caption" color="text.secondary">Select a Google Cloud project API key to use paid models (like Veo for Video Generation) or increase quotas.</Typography>
                          </Box>
                          <Button
                            onClick={async () => {
                              // @ts-ignore
                              if (window.aistudio?.openSelectKey) {
                                // @ts-ignore
                                await window.aistudio.openSelectKey();
                              } else {
                                setShowApiKeyModal(true);
                              }
                            }}
                            variant="outlined"
                            color="inherit"
                            size="small"
                            sx={{ whiteSpace: 'nowrap', borderRadius: 2, fontWeight: 600, borderColor: 'divider', '&:hover': { bgcolor: 'grey.50', borderColor: 'grey.400' } }}
                          >
                            Set API Key
                          </Button>
                        </Box>
                      )}
                    </Box>

                    {mediaType === MediaType.IMAGE && (
                      <Grid container spacing={3}>
                        
                        {/* Left Column: Creative Control */}
                        <Grid item xs={12} md={6}>
                           <Box sx={{ mb: 2 }}>
                              <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <Palette size={14} /> Style Preset
                              </Typography>
                              <FormControl fullWidth size="small">
                                <Select
                                  value={stylePreset}
                                  onChange={(e) => setStylePreset(e.target.value)}
                                  sx={{ bgcolor: 'white', borderRadius: 2, '& fieldset': { borderColor: 'divider' }, '&:hover fieldset': { borderColor: 'primary.main' } }}
                                >
                                  {STYLE_PRESETS.map(style => (
                                    <MenuItem key={style} value={style}>{style}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                           </Box>

                           <Box>
                              <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <Ban size={14} /> Negative Prompt
                              </Typography>
                              <TextField
                                fullWidth
                                size="small"
                                value={negativePrompt}
                                onChange={(e) => setNegativePrompt(e.target.value)}
                                placeholder="What to exclude (e.g. blurry, distortion)"
                                sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                              />
                           </Box>
                        </Grid>

                        {/* Right Column: Technical Settings */}
                        <Grid item xs={12} md={6}>
                           <Box sx={{ mb: 2 }}>
                              <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <Hash size={14} /> Seed Control
                              </Typography>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                value={seed ?? ''}
                                onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                                placeholder="Random (-1)"
                                sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <IconButton 
                                        onClick={() => setSeed(Math.floor(Math.random() * 1000000))}
                                        edge="end"
                                        size="small"
                                        title="Randomize Seed"
                                      >
                                        <Dices size={16} />
                                      </IconButton>
                                    </InputAdornment>
                                  ),
                                }}
                              />
                           </Box>

                           <Box>
                              <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <ScanLine size={14} /> Quality
                              </Typography>
                              <Box 
                                onClick={() => setUpscale4K(!upscale4K)}
                                sx={{ 
                                  width: '100%', 
                                  px: 2, 
                                  py: 1, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between', 
                                  border: 1, 
                                  borderColor: upscale4K ? 'primary.main' : 'divider', 
                                  borderRadius: 2, 
                                  cursor: 'pointer', 
                                  bgcolor: upscale4K ? 'primary.50' : 'white',
                                  transition: 'all 0.2s',
                                  userSelect: 'none',
                                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <Box sx={{ p: 0.5, borderRadius: 1.5, bgcolor: upscale4K ? 'primary.main' : 'grey.100', color: upscale4K ? 'white' : 'text.disabled', transition: 'all 0.2s' }}>
                                     <ScanLine size={16} />
                                  </Box>
                                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="body2" fontWeight="700" color={upscale4K ? 'primary.main' : 'text.primary'} sx={{ lineHeight: 1.2 }}>Upscale to 4K</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>Post-process enhancement</Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ width: 20, height: 20, borderRadius: '50%', border: 1, borderColor: upscale4K ? 'primary.main' : 'grey.300', bgcolor: upscale4K ? 'primary.main' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                                   <Check size={12} color="white" style={{ transform: upscale4K ? 'scale(1)' : 'scale(0)', transition: 'transform 0.2s' }} />
                                </Box>
                              </Box>
                           </Box>
                        </Grid>

                      </Grid>
                    )}
                  </Paper>
                </Collapse>
              </Box>
            </Paper>
          </Container>
        </Box>

        {/* Results Section */}
        <Container 
          ref={galleryRef} 
          maxWidth="xl" 
          sx={{ flex: 1, py: { xs: 4, md: 6 }, display: 'flex', flexDirection: 'column' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
            <Typography variant="h5" fontWeight="800" color="text.primary" sx={{ letterSpacing: '-0.02em' }}>Gallery</Typography>
            <Chip label={`${history.length} items`} size="small" sx={{ bgcolor: 'grey.100', color: 'text.secondary', fontWeight: 600, border: 1, borderColor: 'divider' }} />
          </Box>

          {error && (
            <Box sx={{ mb: 4 }}>
              <ErrorMessage 
                message={error} 
                onClose={() => setError(null)} 
              />
            </Box>
          )}

          <Grid container spacing={3}>
            {isGenerating && (
               <Grid item xs={12} sm={6} md={4}>
                 <LoadingState message={loadingMessage} />
               </Grid>
            )}
            
            {history.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <MediaCard 
                  item={item} 
                  onUpscale={item.type === MediaType.IMAGE && !item.prompt.includes("(Upscaled") ? () => handleUpscale(item) : undefined} 
                  onEditSave={item.type === MediaType.IMAGE ? (newUrl) => handleEditSave(item, newUrl) : undefined}
                  onAIEdit={item.type === MediaType.IMAGE ? (editPrompt) => handleAIEdit(item, editPrompt) : undefined}
                />
              </Grid>
            ))}

            {!isGenerating && history.length === 0 && !error && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 12, textAlign: 'center', color: 'text.disabled', border: '2px dashed', borderColor: 'divider', borderRadius: 4, bgcolor: 'rgba(248, 250, 252, 0.5)', transition: 'all 0.3s', '&:hover': { bgcolor: 'grey.50', borderColor: 'grey.300' } }}>
                  <Box sx={{ p: 3, bgcolor: 'white', borderRadius: '50%', mb: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                     <Sparkles size={40} color="#94a3b8" />
                  </Box>
                  <Typography variant="h6" fontWeight="700" color="text.primary" sx={{ mb: 1 }}>Your canvas is empty</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>Enter a prompt above to start creating your next masterpiece.</Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;