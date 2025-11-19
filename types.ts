export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  MANIPULATION = 'MANIPULATION',
  LOGO = 'LOGO',
}

export interface AdvancedOptions {
  stylePreset?: string;
  negativePrompt?: string;
  seed?: number;
  upscale4K?: boolean;
}

export interface GeneratedItem {
  id: string;
  type: MediaType;
  url: string;
  prompt: string;
  timestamp: number;
  aspectRatio: string;
  advancedOptions?: AdvancedOptions;
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface GenerationConfig {
  prompt: string;
  aspectRatio: AspectRatio;
  mediaType: MediaType;
}

// Global augmentation for the AI Studio key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}