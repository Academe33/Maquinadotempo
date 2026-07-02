# 🎙️ Infraestrutura de Modelo de Voz - Documentação de Replicação

Este documento detalha a arquitetura completa, configurações e implementação do modelo de voz em tempo real utilizado no projeto **Máquina do Tempo**. Ele serve como um guia definitivo para replicar a funcionalidade de conversação fluida com baixa latência.

## 🏗️ Visão Geral da Arquitetura

O sistema utiliza uma arquitetura **Client-Side Real-Time**, conectando o navegador diretamente à API Multimodal do Google Gemini via WebSocket. Isso elimina a latência de servidores intermediários para processamento de áudio.

### Fluxo de Dados
1.  **Captura (Microfone)**: Áudio capturado a 16kHz (PCM 16-bit).
2.  **Processamento Local**: Conversão de Float32 para Int16 e codificação Base64.
3.  **Transporte**: Envio via WebSocket seguro (WSS) para o Google Gemini.
4.  **Processamento IA**: Modelo `gemini-2.5-flash` processa áudio e gera resposta.
5.  **Recepção**: Áudio recebido em chunks Base64 (PCM 24kHz).
6.  **Reprodução**: Decodificação e reprodução via Web Audio API com controle de ganho dinâmico.

---

## 🛠️ Stack Tecnológico

*   **Frontend**: React (TypeScript)
*   **SDK de IA**: `@google/genai` (Google GenAI SDK para Web)
*   **API de Áudio**: Web Audio API (Nativa do navegador)
*   **Modelo de IA**: `gemini-2.5-flash-native-audio-preview-12-2025`

---

## ⚙️ Configurações Críticas (The "Secret Sauce")

Para garantir a qualidade e a baixa latência, estas configurações **DEVEM** ser respeitadas rigorosamente:

| Parâmetro | Valor | Justificativa |
| :--- | :--- | :--- |
| **Input Sample Rate** | `16000 Hz` | Padrão nativo para reconhecimento de voz (ASR). |
| **Output Sample Rate** | `24000 Hz` | Alta fidelidade para síntese de voz (TTS) do Gemini. |
| **Buffer Size** | `4096` | Equilíbrio ideal entre latência (~250ms) e estabilidade. |
| **Formato de Áudio** | PCM 16-bit Mono | Formato bruto exigido pela API para menor overhead. |
| **Vozes Disponíveis** | `Puck`, `Charon`, `Kore`, `Fenrir`, `Zephyr` | Vozes pré-treinadas do Gemini. |

---

## 💻 Implementação dos Componentes Principais

### 1. Serviço Utilitário (`services/gemini.ts`)

Responsável pela codificação/decodificação de áudio bruto.

```typescript
// Converter Float32 (Web Audio) para Int16 (PCM)
// Necessário pois o Web Audio API trabalha com floats de -1.0 a 1.0,
// mas a API espera inteiros de 16-bit (-32768 a 32767).
export const createBlob = (data: Float32Array) => {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)), // Base64 helper
    mimeType: 'audio/pcm;rate=16000',
  };
};

// Decodificar PCM Base64 para AudioBuffer tocável
export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number) {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}
```

### 2. Gerenciador de Conversa (`components/LiveConversation.tsx`)

O coração do sistema. Gerencia o ciclo de vida da conexão e o pipeline de áudio.

#### A. Inicialização e Constraints
```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true, // Essencial para evitar que a IA ouça a si mesma
    noiseSuppression: true, // Limpa o áudio do usuário
    autoGainControl: true,  // Nivela o volume da voz
  }
});
```

#### B. Pipeline de Entrada (Input)
```typescript
// Contexto específico para entrada em 16kHz
const inputCtx = new window.AudioContext({ sampleRate: 16000 });
const source = inputCtx.createMediaStreamSource(stream);

// ScriptProcessor para capturar áudio bruto
const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);

scriptProcessor.onaudioprocess = (e) => {
  const inputData = e.inputBuffer.getChannelData(0);
  // Envia para a API...
};

// TRUQUE ANTI-FEEDBACK:
// O ScriptProcessor precisa estar conectado ao destino para rodar,
// mas não queremos ouvir nossa própria voz (monitoramento).
// Solução: Conectar a um GainNode com volume 0 (Mute).
const muteNode = inputCtx.createGain();
muteNode.gain.value = 0;
source.connect(scriptProcessor);
scriptProcessor.connect(muteNode);
muteNode.connect(inputCtx.destination);
```

#### C. Pipeline de Saída (Output) com Boost Mobile
```typescript
// Contexto de saída em 24kHz (Melhor qualidade)
const outputCtx = new window.AudioContext({ sampleRate: 24000 });

// Detecção de Mobile para Boost de Volume
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const gainNode = outputCtx.createGain();

// Boost de 300% no mobile, 100% no desktop
gainNode.gain.value = isMobile ? 3.0 : 1.0; 
gainNode.connect(outputCtx.destination);

// Reprodução
const source = outputCtx.createBufferSource();
source.buffer = audioBuffer; // Do decodeAudioData
source.connect(gainNode);
source.start(nextStartTime);
```

---

## 🚀 Como Replicar

1.  **Instale as Dependências**:
    ```bash
    npm install @google/genai lucide-react
    ```

2.  **Configure as Variáveis de Ambiente**:
    ```env
    NEXT_PUBLIC_GEMINI_API_KEY=sua_chave_aqui
    ```

3.  **Copie os Arquivos**:
    *   `services/gemini.ts`: Utilitários de áudio.
    *   `components/LiveConversation.tsx`: Componente React.
    *   `types.ts`: Definições de tipos.

4.  **Integre**:
    Instancie `<LiveConversation character={...} />` em sua página. Certifique-se de passar um objeto `character` com `systemInstruction` e `voiceName`.

---

## ⚠️ Solução de Problemas Comuns

*   **Eco/Feedback**: Verifique se o `muteNode` está implementado corretamente no pipeline de entrada.
*   **Latência Alta**: Certifique-se de que o `bufferSize` do `ScriptProcessor` é 4096 (ou 2048 se a CPU aguentar). Valores como 16384 causam atrasos perceptíveis.
*   **Voz "Robótica" ou Acelerada**: Verifique se os `sampleRate` de entrada (16k) e saída (24k) estão configurados explicitamente nos construtores do `AudioContext`.
*   **Volume Baixo no Celular**: O `GainNode` com valor `3.0` é obrigatório para dispositivos móveis, que tendem a ter saída de áudio Web mais baixa.
