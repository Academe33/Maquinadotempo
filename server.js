import express from 'express';
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
      model: 'gemini-2.5-flash',
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

// 2. Endpoint REST que emite um token efêmero para a Live API.
// O navegador conecta direto no WebSocket do Google usando o token —
// a chave real nunca sai do servidor e não é preciso proxy WS
// (que a Vercel não suporta em funções serverless).
app.post('/api/live-token', async (req, res) => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('API Key nao configurada no ambiente do servidor');

    const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1alpha' } });
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      },
    });

    res.json({ token: token.name });
  } catch (error) {
    console.error('Erro ao criar token efêmero:', error);
    res.status(500).json({ error: error.message });
  }
});

const server = http.createServer(app);

// (Proxy WebSocket removido: o cliente agora conecta direto no Google
// com token efêmero emitido por /api/live-token)
// Servir frontend em produção
app.use(express.static(path.join(__dirname, 'dist')));
app.get(/.*/, (req, res) => {
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

export default server;
