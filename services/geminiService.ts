
import { GoogleGenAI, Modality, LiveServerMessage, Type } from "@google/genai";

class GeminiService {
  private isBlocked: boolean = false;

  constructor() {
    if (!process.env.API_KEY) {
      console.warn("⚠️ Google Gemini API Key is missing.");
      this.isBlocked = true;
    }
  }

  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async moderateChat(message: string): Promise<{ wittyResponse: string, action: 'allow' | 'flag' | 'hide' }> {
    if (this.isBlocked) return { wittyResponse: "Papi is offline. Be nice!", action: 'allow' };

    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Evaluate: "${message}"`,
        config: {
          systemInstruction: "You are Papi, a witty AI moderator. Categorize messages for a live stream. Return JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              wittyResponse: { type: Type.STRING },
              action: { type: Type.STRING, enum: ['allow', 'flag', 'hide'] }
            },
            required: ["wittyResponse", "action"]
          }
        },
      });
      
      const result = JSON.parse(response.text || '{"wittyResponse": "Papi is watching.", "action": "allow"}');
      return { wittyResponse: result.wittyResponse, action: result.action || 'allow' };
    } catch (error) {
      console.error("Moderation Error:", error);
      return { wittyResponse: "Moderation glitch. Stay cool!", action: 'allow' };
    }
  }

  async connectToAiCompanion(callbacks: {
    onMessage: (msg: LiveServerMessage) => void;
    onError: (err: any) => void;
    onClose?: () => void;
  }) {
    if (this.isBlocked) return null;

    try {
        const ai = this.getClient();
        return ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => console.log("AI Buddy Joined"),
            onmessage: callbacks.onMessage,
            onerror: callbacks.onError,
            onclose: callbacks.onClose,
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
            },
            systemInstruction: "You are Papi, the energetic AI host of YoungPapi Live. Welcome viewers and hype the stream!",
          },
        });
    } catch (e) {
        callbacks.onError(e);
        return null;
    }
  }
}

export const geminiService = new GeminiService();
