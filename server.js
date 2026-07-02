import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

function getApiKey() {
  return process.env.GEMINI_API_KEY;
}

if (!getApiKey()) {
  console.warn('AVISO: GEMINI_API_KEY nao esta configurada no ambiente do servidor.');
}

// 1. Endpoint REST seguro para gerar o perfil do personagem
app.post('/api/generate-character', async (req, res) => {
  try {
    const { query } = req.body;

    const apiKey = getApiKey();
    if (!apiKey) throw new Error('API Key nao configurada no ambiente do servidor');

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Crie um perfil detalhado para o personagem ou tutor: "${query}". Retorne em formato JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            title: { type: "STRING" },
            description: { type: "STRING" },
            systemInstruction: { type: "STRING" },
            voiceName: { type: "STRING", enum: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'] }
          },
          required: ["name", "title", "description", "systemInstruction", "voiceName"]
        }
      }
    });
    
    const data = JSON.parse(response.text || "{}");
    const character = {
      ...data,
      id: `dynamic-${Date.now()}`,
      image: `https://picsum.photos/seed/${encodeURIComponent(data.name)}/300/300`,
      category: 'CUSTOM'
    };
    
    res.json(character);
  } catch (error) {
    console.error('Erro na geração de personagem:', error);
    res.status(500).json({ error: error.message });
  }
});

const server = http.createServer(app);

// 2. Servidor WebSocket Proxy para o Gemini Live API
const wss = new WebSocketServer({ server });

wss.on('connection', (clientWs, req) => {
  // Apenas intercepta conexões que venham da nossa rota proxy configurada
  if (req.url && req.url.startsWith('/api/gemini/ws/')) {
    const apiKey = getApiKey();

    if (!apiKey) {
      console.error('[WS Proxy] GEMINI_API_KEY ausente no ambiente do servidor.');
      clientWs.close(1011, 'Server API key missing');
      return;
    }

    console.log('[WS Proxy] Nova conexão recebida:', req.url);
    
    // Remove o prefixo do nosso proxy interno
    const targetUrlPath = req.url.replace('/api/gemini', '');
    
    // Constrói a URL de destino oficial do Google Gemini
    // Substituindo a chave "dummy" pela chave real segura no backend
    const urlObj = new URL(`wss://generativelanguage.googleapis.com${targetUrlPath}`);
    urlObj.searchParams.set('key', apiKey);
    
    console.log(`[WS Proxy] Conectando ao Google Gemini API...`);
    const geminiWs = new WebSocket(urlObj.toString());
    
    geminiWs.on('open', () => {
      console.log('[WS Proxy] Conectado com sucesso ao Gemini');
    });
    
    // Encaminha as mensagens do Gemini para o Cliente (Frontend)
    geminiWs.on('message', (data, isBinary) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data, { binary: isBinary });
      }
    });
    
    // Encaminha as mensagens do Cliente (Frontend) para o Gemini
    clientWs.on('message', (data, isBinary) => {
      if (geminiWs.readyState === WebSocket.OPEN) {
        geminiWs.send(data, { binary: isBinary });
      }
    });
    
    clientWs.on('close', () => {
      console.log('[WS Proxy] Cliente desconectou');
      if (geminiWs.readyState === WebSocket.OPEN) geminiWs.close();
    });
    
    geminiWs.on('close', () => {
      console.log('[WS Proxy] Gemini desconectou');
      if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
    });
    
    geminiWs.on('error', (err) => {
      console.error('[WS Proxy] Erro no Gemini:', err);
      if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
    });
    
    clientWs.on('error', (err) => {
      console.error('[WS Proxy] Erro no Cliente:', err);
      if (geminiWs.readyState === WebSocket.OPEN) geminiWs.close();
    });
  } else {
    // Rejeita qualquer outra conexão WS
    clientWs.close();
  }
});

// Servir frontend em produção
app.use(express.static(path.join(__dirname, 'dist')));
app.get('/(.*)', (req, res) => {
  const distPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(distPath)) {
    res.sendFile(distPath);
  } else {
    res.status(404).send('Frontend não encontrado. Execute "npm run build" primeiro.');
  }
});

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isDirectRun) {
  server.listen(PORT, () => {
    console.log(`Backend seguro Node.js rodando na porta ${PORT}`);
    console.log('As chaves de API permanecem apenas no ambiente do servidor.');
  });
}

// Handle WebSocket upgrade
// (Already handled internally by the WebSocketServer instance)

export default server;
