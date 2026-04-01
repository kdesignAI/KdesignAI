import { AspectRatio, AdvancedOptions } from '../types';

export interface ExternalApiConfig {
  endpoint: string;
  apiKey: string;
  model: string;
}

export const generateExternalImage = async (
  prompt: string,
  aspectRatio: AspectRatio,
  config: ExternalApiConfig,
  options?: AdvancedOptions
): Promise<string> => {
  if (!config.apiKey) {
    throw new Error("External API Key is missing. Please configure it in the settings.");
  }

  // Construct enhanced prompt based on advanced options
  let finalPrompt = prompt;
  if (options?.stylePreset && options.stylePreset !== 'None') {
    finalPrompt += `. Style: ${options.stylePreset}`;
  }
  if (options?.negativePrompt) {
    finalPrompt += `. (Exclude: ${options.negativePrompt})`;
  }

  // Map aspect ratio to standard OpenAI sizes if possible
  let size = "1024x1024";
  if (aspectRatio === '16:9') size = "1792x1024";
  if (aspectRatio === '9:16') size = "1024x1792";

  const payload = {
    model: config.model || "dall-e-3",
    prompt: finalPrompt,
    n: 1,
    size: size,
    response_format: "b64_json"
  };

  const response = await fetch(config.endpoint || "https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `External API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.data && data.data[0] && data.data[0].b64_json) {
    return `data:image/png;base64,${data.data[0].b64_json}`;
  } else if (data.data && data.data[0] && data.data[0].url) {
    // Fallback to URL if b64_json is not returned
    const imgResponse = await fetch(data.data[0].url);
    const blob = await imgResponse.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  throw new Error("No image data returned from External API.");
};
