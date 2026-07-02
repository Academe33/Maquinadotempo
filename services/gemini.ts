
import { GoogleGenAI } from "@google/genai";
import { Character } from "../types";

// Determine the base URL for the backend
// Use window.location.origin as fallback so it works with Vite proxy in dev, and Express in prod
const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

// Busca um token efêmero no backend e conecta direto no Google.
// A chave real nunca sai do servidor; o token expira em minutos
// e vale para uma única sessão Live.
export const getGeminiClient = async () => {
  const response = await fetch('/api/live-token', { method: 'POST' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Falha ao obter token de sessão');
  }
  const { token } = await response.json();

  return new GoogleGenAI({
    apiKey: token,
    httpOptions: { apiVersion: 'v1alpha' },
  });
};

export const generateCharacterProfile = async (query: string): Promise<Character> => {
  // Chama a nossa API REST no Node.js
  const response = await fetch('/api/generate-character', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Falha ao gerar personagem');
  }

  return await response.json();
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
