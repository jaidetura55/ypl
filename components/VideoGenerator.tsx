
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

interface VideoGeneratorProps {
  onVideoGenerated: (url: string) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function VideoGenerator({ onVideoGenerated, onClose }: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    } catch (e) {
      console.error("Error checking API key:", e);
    }
  };

  const handleSelectKey = async () => {
    await window.aistudio.openSelectKey();
    setHasKey(true);
  };

  const generateVideo = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setStatus('Initializing generation...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      setStatus('Requesting video generation (this may take a few minutes)...');
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      // Poll for completion
      while (!operation.done) {
        setStatus('Generating video... Please wait.');
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setStatus('Downloading video...');
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': process.env.API_KEY || '',
          },
        });
        
        if (!response.ok) throw new Error('Failed to download generated video');
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        onVideoGenerated(url);
        setStatus('Success!');
      } else {
        throw new Error('No video URI returned from model');
      }
    } catch (err: any) {
      console.error("Video generation error:", err);
      setError(err.message || 'An error occurred during generation');
      if (err.message?.includes("Requested entity was not found")) {
          setHasKey(false);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-fade-in-up">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <i className="fa-solid fa-clapperboard text-indigo-500"></i>
            AI Intro Generator
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!hasKey ? (
            <div className="text-center space-y-4 py-8">
              <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-key text-indigo-400 text-3xl"></i>
              </div>
              <h3 className="text-white font-bold text-lg">API Key Required</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">
                To use AI Video Generation, you must select a paid Google Cloud project API key.
              </p>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-400 text-xs hover:underline block"
              >
                Learn about billing
              </a>
              <button 
                onClick={handleSelectKey}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
              >
                Select API Key
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Video Prompt</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your intro animation... e.g., 'A cinematic neon logo reveal with cyberpunk city background'"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors h-32 resize-none"
                  disabled={isGenerating}
                />
              </div>

              {isGenerating && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex flex-col items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-indigo-400 text-xs font-bold text-center">{status}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
                  <i className="fa-solid fa-circle-exclamation text-red-500"></i>
                  <p className="text-red-400 text-xs font-bold">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 bg-white/5 text-white py-4 rounded-2xl font-bold hover:bg-white/10 transition-colors"
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button 
                  onClick={generateVideo}
                  disabled={isGenerating || !prompt.trim()}
                  className="flex-[2] bg-gradient-to-r from-indigo-600 to-pink-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isGenerating ? 'Generating...' : 'Generate AI Intro'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
