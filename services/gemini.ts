import { GoogleGenAI, Modality } from "@google/genai";
import { MediaType, AspectRatio, AdvancedOptions } from '../types';

// Models
const IMAGE_MODEL = 'gemini-2.5-flash-image';
const IMAGE_MODEL_4K = 'gemini-3.1-flash-image-preview';
const VEO_MODEL = 'veo-3.1-lite-generate-preview';
const EDIT_MODEL = 'gemini-2.5-flash-image';
const EDIT_MODEL_4K = 'gemini-3.1-flash-image-preview';
const TEXT_MODEL = 'gemini-2.5-flash';

export const checkApiKeySelection = async (): Promise<void> => {
  if (window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
  }
};

// Helper to convert Blob to Base64 for storage persistence
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Retry logic with exponential backoff
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 5, // Increased retries for better resilience
  initialDelay: number = 3000 // Increased initial delay to 3s
): Promise<T> => {
  let delay = initialDelay;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      // Robustly parse error message to ensure we catch hidden 429s/Quota errors
      let message = error.message || "";
      if (error.error?.message) message = error.error.message;
      if (error.response?.data?.error?.message) message = error.response.data.error.message;
      
      // Handle stringified JSON errors
      if (typeof error === 'string') {
         try {
             const parsed = JSON.parse(error);
             if (parsed.error?.message) message = parsed.error.message;
         } catch (e) {}
         message += " " + error;
      }

      // Check for rate limit (429) or server overload (503)
      const isRetryable = 
        error.status === 429 || 
        error.code === 429 || 
        error.error?.code === 429 || 
        error.status === 503 ||
        error.code === 503 ||
        message.includes('429') || 
        message.toLowerCase().includes('quota') || 
        message.includes('RESOURCE_EXHAUSTED') ||
        message.includes('overloaded');

      if (isRetryable && i < maxRetries - 1) {
        console.warn(`API Request failed with retryable error (${message}). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff (3s -> 6s -> 12s -> 24s -> 48s)
        continue;
      }
      
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
};

// Centralized Error Handler
const handleGeminiError = (error: any): never => {
  console.error("Gemini Service Error:", error);
  
  let message = error.message || "An unknown error occurred.";

  // Attempt to find a deeper message in standard Google API error structures
  if (error.error?.message) {
    message = error.error.message;
  } else if (error.response?.data?.error?.message) {
    message = error.response.data.error.message;
  }

  // Edge case: Error might be a JSON string
  if (typeof error === 'string' && error.trim().startsWith('{')) {
      try {
          const parsed = JSON.parse(error);
          if (parsed.error?.message) message = parsed.error.message;
          // Also update the error object reference if possible for status checks below
          if (parsed.error) error = parsed; 
      } catch (e) {}
  }

  // Check for 429 Quota / Resource Exhausted
  if (
    error.status === 429 || 
    error.code === 429 || 
    error.error?.code === 429 || 
    message.includes('429') || 
    message.includes('quota') ||
    message.includes('RESOURCE_EXHAUSTED')
  ) {
    throw new Error("API quota exceeded (429). Please check your billing plan or wait before trying again.");
  }

  // Check for 404 Veo Key Issue (Requested entity was not found)
  const stringified = JSON.stringify(error);
  if (stringified.includes("Requested entity was not found") || message.includes("Requested entity was not found")) {
      if (window.aistudio) {
         // Trigger key selection dialog
         window.aistudio.openSelectKey();
         throw new Error("Access denied. Please re-select your API key.");
      }
  }

  throw new Error(message);
};

// Helper to upscale image
export const upscaleImage = async (imageBase64: string, prompt: string): Promise<string> => {
  await checkApiKeySelection();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Extract valid base64 data
  const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid image data source for upscaling.");
  }
  const mimeType = matches[1];
  const data = matches[2];

  try {
    return await retryWithBackoff(async () => {
      const response = await ai.models.generateContent({
        model: EDIT_MODEL_4K,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: data
              }
            },
            {
              text: `Upscale this image to an ultra-high resolution (4000 pixels on the longest side) while preserving the original aspect ratio. Remove all noise and artifacts. Significantly enhance details, sharpness, and texture fidelity. The result must be ultra-realistic, crystal clear, and free of blur. Original context: ${prompt}`
            }
          ]
        },
        config: {
          imageConfig: {
            imageSize: "4K"
          }
        }
      });

      const candidate = response.candidates?.[0];
      
      if (!candidate) {
        if (response.promptFeedback?.blockReason) {
          throw new Error(`Prompt blocked by safety filters: ${response.promptFeedback.blockReason}`);
        }
        throw new Error(`No candidates returned. Response: ${JSON.stringify(response)}`);
      }

      if (!candidate.content || !candidate.content.parts) {
        throw new Error(`No content parts returned. Finish reason: ${candidate.finishReason}. Response: ${JSON.stringify(response)}`);
      }

      const part = candidate.content.parts.find(p => p.inlineData);
      
      if (part?.inlineData?.data) {
        const returnMime = part.inlineData.mimeType || 'image/png';
        return `data:${returnMime};base64,${part.inlineData.data}`;
      }

      // Check for text refusal or safety stop
      const textPart = candidate.content.parts.find(p => p.text);
      if (textPart?.text) {
          throw new Error(`Model refused to upscale: ${textPart.text}`);
      }
      if (candidate.finishReason && candidate.finishReason !== 'STOP') {
          throw new Error(`Upscaling stopped due to: ${candidate.finishReason}`);
      }
      
      throw new Error(`Upscaling process completed but returned no image data. Parts: ${JSON.stringify(candidate.content.parts)}`);
    });

  } catch (error) {
    handleGeminiError(error);
    throw error;
  }
};

// Helper to edit image with text prompt
export const editImageWithPrompt = async (imageBase64: string, editPrompt: string): Promise<string> => {
  await checkApiKeySelection();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Extract valid base64 data
  const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid image data source for editing.");
  }
  const mimeType = matches[1];
  const data = matches[2];

  try {
    return await retryWithBackoff(async () => {
      const response = await ai.models.generateContent({
        model: EDIT_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: data
              }
            },
            {
              text: editPrompt
            }
          ]
        }
      });

      const candidate = response.candidates?.[0];
      
      if (!candidate) {
        if (response.promptFeedback?.blockReason) {
          throw new Error(`Prompt blocked by safety filters: ${response.promptFeedback.blockReason}`);
        }
        throw new Error(`No candidates returned. Response: ${JSON.stringify(response)}`);
      }

      if (!candidate.content || !candidate.content.parts) {
        throw new Error(`No content parts returned. Finish reason: ${candidate.finishReason}. Response: ${JSON.stringify(response)}`);
      }

      const part = candidate.content.parts.find(p => p.inlineData);
      
      if (part?.inlineData?.data) {
        const returnMime = part.inlineData.mimeType || 'image/png';
        return `data:${returnMime};base64,${part.inlineData.data}`;
      }
      
      // Check for text refusal or safety stop
      const textPart = candidate.content.parts.find(p => p.text);
      if (textPart?.text) {
          throw new Error(`Model refused edit request: ${textPart.text}`);
      }
      if (candidate.finishReason && candidate.finishReason !== 'STOP') {
          throw new Error(`Editing stopped due to: ${candidate.finishReason}`);
      }
      
      throw new Error(`AI editing process completed but returned no image data. Parts: ${JSON.stringify(candidate.content.parts)}`);
    });

  } catch (error) {
    handleGeminiError(error);
    throw error;
  }
};

// New Helper for Professional Manipulation
export const manipulateImage = async (imageBase64: string, userPrompt: string, presetStyle: string): Promise<string> => {
  await checkApiKeySelection();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Extract valid base64 data
  const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid image data source for manipulation.");
  }
  const mimeType = matches[1];
  const data = matches[2];

  // Construct a powerful system-like prompt for the edit model
  const enhancedPrompt = `
    Professional Image Manipulation Task.
    Style Preset: ${presetStyle}.
    User Instructions: ${userPrompt}.
    
    Directives:
    1. Manipulate the image to match the requested style and instructions.
    2. Ensure lighting, shadows, and perspective are photorealistic and consistent.
    3. If the user asks for a background change, ensure perfect subject isolation and blending.
    4. Output must be High Definition (HD), professional advertising quality, 8k resolution, highly detailed.
    5. Maintain the integrity of the main subject/product.
  `.trim();

  try {
    return await retryWithBackoff(async () => {
      const response = await ai.models.generateContent({
        model: EDIT_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: data
              }
            },
            {
              text: enhancedPrompt
            }
          ]
        }
      });

      const candidate = response.candidates?.[0];
      
      if (!candidate) {
        if (response.promptFeedback?.blockReason) {
          throw new Error(`Prompt blocked by safety filters: ${response.promptFeedback.blockReason}`);
        }
        throw new Error(`No candidates returned. Response: ${JSON.stringify(response)}`);
      }

      if (!candidate.content || !candidate.content.parts) {
        throw new Error(`No content parts returned. Finish reason: ${candidate.finishReason}. Response: ${JSON.stringify(response)}`);
      }

      const part = candidate.content.parts.find(p => p.inlineData);
      
      if (part?.inlineData?.data) {
        const returnMime = part.inlineData.mimeType || 'image/png';
        return `data:${returnMime};base64,${part.inlineData.data}`;
      }

      // Check for text refusal or safety stop
      const textPart = candidate.content.parts.find(p => p.text);
      if (textPart?.text) {
          throw new Error(`Model cannot process image: ${textPart.text}`);
      }
      if (candidate.finishReason && candidate.finishReason !== 'STOP') {
          throw new Error(`Manipulation stopped due to: ${candidate.finishReason}`);
      }
      
      throw new Error(`Manipulation process completed but returned no image data. Parts: ${JSON.stringify(candidate.content.parts)}`);
    });

  } catch (error) {
    handleGeminiError(error);
    throw error;
  }
};

// New Helper for Logo Generation
export const generateLogo = async (prompt: string, presetStyle: string): Promise<string> => {
  await checkApiKeySelection();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Construct optimized prompt for logo generation
  const enhancedPrompt = `
    Design a professional, high-quality logo.
    Concept: ${prompt}.
    Style: ${presetStyle}.
    
    Requirements:
    1. Clean, vector-style aesthetics.
    2. Solid white background (easy to remove).
    3. Clear shapes, excellent composition.
    4. Scalable look, suitable for branding.
    5. High resolution, sharp edges.
  `.trim();

  try {
    return await retryWithBackoff(async () => {
      const response = await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: {
          parts: [{ text: enhancedPrompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      const candidate = response.candidates?.[0];
      
      if (!candidate) {
        if (response.promptFeedback?.blockReason) {
          throw new Error(`Prompt blocked by safety filters: ${response.promptFeedback.blockReason}`);
        }
        throw new Error(`No candidates returned. Response: ${JSON.stringify(response)}`);
      }

      if (!candidate.content || !candidate.content.parts) {
        throw new Error(`No content parts returned. Finish reason: ${candidate.finishReason}. Response: ${JSON.stringify(response)}`);
      }

      const part = candidate.content.parts.find(p => p.inlineData);
      
      if (part?.inlineData?.data) {
        const returnMime = part.inlineData.mimeType || 'image/jpeg';
        return `data:${returnMime};base64,${part.inlineData.data}`;
      }

      // Check for text refusal or safety stop
      const textPart = candidate.content.parts.find(p => p.text);
      if (textPart?.text) {
          throw new Error(`Model refused to generate logo: ${textPart.text}`);
      }
      if (candidate.finishReason && candidate.finishReason !== 'STOP') {
          throw new Error(`Logo generation stopped due to: ${candidate.finishReason}`);
      }
      
      throw new Error(`No logo data returned from API. Parts: ${JSON.stringify(candidate.content.parts)}`);
    });

  } catch (error) {
    handleGeminiError(error);
    throw error;
  }
};

export const generateImage = async (
  prompt: string,
  aspectRatio: AspectRatio,
  options?: AdvancedOptions
): Promise<string> => {
  await checkApiKeySelection();
  // Always instantiate fresh to capture any key updates
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Construct enhanced prompt based on advanced options
  let finalPrompt = prompt;
  
  if (options?.stylePreset && options.stylePreset !== 'None') {
    finalPrompt += `. Style: ${options.stylePreset}`;
  }
  
  if (options?.negativePrompt) {
    // Appending negative prompt instruction is a robust way to handle exclusions
    finalPrompt += `. (Exclude: ${options.negativePrompt})`;
  }

  try {
    let finalImage = await retryWithBackoff(async () => {
      const response = await ai.models.generateContent({
        model: options?.upscale4K ? IMAGE_MODEL_4K : IMAGE_MODEL,
        contents: {
          parts: [{ text: finalPrompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            ...(options?.upscale4K ? { imageSize: "4K" } : {})
          }
        }
      });

      const candidate = response.candidates?.[0];
      
      if (!candidate) {
        if (response.promptFeedback?.blockReason) {
          throw new Error(`Prompt blocked by safety filters: ${response.promptFeedback.blockReason}`);
        }
        throw new Error(`No candidates returned. Response: ${JSON.stringify(response)}`);
      }

      if (!candidate.content || !candidate.content.parts) {
        throw new Error(`No content parts returned. Finish reason: ${candidate.finishReason}. Response: ${JSON.stringify(response)}`);
      }

      const part = candidate.content.parts.find(p => p.inlineData);
      
      if (part?.inlineData?.data) {
        const returnMime = part.inlineData.mimeType || 'image/jpeg';
        return `data:${returnMime};base64,${part.inlineData.data}`;
      }

      // Check for text refusal or safety stop
      const textPart = candidate.content.parts.find(p => p.text);
      if (textPart?.text) {
          throw new Error(`Model refused to generate image: ${textPart.text}`);
      }
      if (candidate.finishReason && candidate.finishReason !== 'STOP') {
          throw new Error(`Image generation stopped due to: ${candidate.finishReason}`);
      }
      
      throw new Error(`No image data returned from API. Parts: ${JSON.stringify(candidate.content.parts)}`);
    });

    // Note: upscale4K is now handled natively by the model via imageSize: "4K"
    // We no longer need to call upscaleImage separately if it's already generated at 4K.
    // However, if the user specifically requested upscaling of an existing image, that's handled elsewhere.

    return finalImage;
  } catch (error) {
    handleGeminiError(error);
    throw error;
  }
};

export const generateVideo = async (
  prompt: string,
  aspectRatio: AspectRatio
): Promise<string> => {
  // Veo specifically requires the user to select a key in some environments
  await checkApiKeySelection();
  
  // Re-instantiate after potential key selection
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // STRICT VALIDATION: Veo only supports 16:9 or 9:16.
  // We do not auto-correct here to respect the application's validation logic.
  if (aspectRatio !== '16:9' && aspectRatio !== '9:16') {
    throw new Error("Video generation currently only supports 16:9 (Landscape) and 9:16 (Portrait) aspect ratios.");
  }

  try {
    return await retryWithBackoff(async () => {
      let operation = await ai.models.generateVideos({
        model: VEO_MODEL,
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p', // fast-generate-preview works well with 720p
          aspectRatio: aspectRatio,
        }
      });

      // Poll for completion
      // Note: Not wrapping polling in global retry as it manages its own long-running state, 
      // but the initial request is covered.
      while (!operation.done) {
        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) {
        throw new Error("Video generation failed or no URI returned.");
      }

      // Fetch the actual video bytes
      const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!videoResponse.ok) {
        throw new Error("Failed to download generated video.");
      }
      
      const videoBlob = await videoResponse.blob();
      // Convert to Base64 to allow LocalStorage persistence (Blob URLs expire on session end)
      return await blobToBase64(videoBlob);
    }, 3, 5000); // Specific aggressive retry for Video (3 retries, 5s initial delay)

  } catch (error: any) {
    handleGeminiError(error);
    throw error;
  }
};