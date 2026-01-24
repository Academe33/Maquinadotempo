
import { GoogleGenAI, Type } from "@google/genai";
import { Character } from "../types";

// Always use the API key directly from process.env.GEMINI_API_KEY (preferred) or process.env.API_KEY and initialize as a named parameter
export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
};

export const generateCharacterProfile = async (query: string): Promise<Character> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Crie um perfil detalhado para o personagem ou tutor: "${query}". Retorne em formato JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          systemInstruction: { type: Type.STRING, description: 'Instrução de sistema detalhada para a IA agir como este personagem em primeira pessoa' },
          voiceName: { type: Type.STRING, enum: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'] }
        },
        required: ["name", "title", "description", "systemInstruction", "voiceName"]
      }
    }
  });

  // The GenerateContentResponse object features a text property (not a method)
  const data = JSON.parse(response.text || "{}");
  return {
    ...data,
    id: `dynamic-${Date.now()}`,
    image: `https://picsum.photos/seed/${encodeURIComponent(data.name)}/300/300`,
    category: 'CUSTOM'
  };
};

// Audio Helpers - Implementing manually following the provided examples to avoid external library issues
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
