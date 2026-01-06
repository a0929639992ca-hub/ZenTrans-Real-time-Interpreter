
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { LanguageMode, TranscriptItem } from './types';
import { decode, decodeAudioData, createBlob } from './utils/audio-helpers';
import Header from './components/Header';
import Translator from './components/Translator';
import TranscriptList from './components/TranscriptList';
import FloatingOverlay from './components/FloatingOverlay';

const App: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<LanguageMode>(LanguageMode.AUTO);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptionRef = useRef({ input: '', output: '' });

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close?.();
      sessionRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    setIsActive(false);
  }, []);

  const startSession = async () => {
    try {
      setError(null);
      const apiKey = process.env.API_KEY;
      
      if (!apiKey || apiKey === "") {
        setError('系統未偵測到 API 金鑰。請確保 Vercel 環境變數中已設定 VITE_API_KEY。');
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const systemInstruction = `你是一位高效能的即時口譯員，專精於日語（日本語）與繁體中文（台灣）。
      - 聽到日語時，請翻譯為繁體中文。
      - 聽到繁體中文時，請翻譯為日語。
      - 提供自然、流暢且即時的翻譯。
      - 不要包含任何解釋，僅輸出翻譯結果。`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (sessionRef.current) {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionRef.current.sendRealtimeInput({ media: pcmBlob });
              }
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              transcriptionRef.current.input += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              transcriptionRef.current.output += message.serverContent.outputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const input = transcriptionRef.current.input;
              const output = transcriptionRef.current.output;
              if (input || output) {
                setTranscripts(prev => [{
                  id: crypto.randomUUID(),
                  timestamp: Date.now(),
                  originalText: input,
                  translatedText: output,
                  type: 'model'
                }, ...prev].slice(0, 30));
              }
              transcriptionRef.current = { input: '', output: '' };
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: () => {
            setError('與伺服器的連線不穩定，正在嘗試恢復...');
            stopSession();
          },
          onclose: () => stopSession()
        }
      });
      
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      setError('設備權限或連線問題：' + (err.message || '未知錯誤'));
      stopSession();
    }
  };

  const toggleSession = () => isActive ? stopSession() : startSession();

  return (
    <div className="min-h-screen flex flex-col max-w-6xl mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-1000">
      <Header />
      
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <aside className="lg:col-span-4 space-y-6">
          <Translator 
            isActive={isActive} 
            onToggle={toggleSession}
            mode={mode}
            onModeChange={setMode}
            error={error}
          />
          
          <button 
            onClick={() => setIsOverlayOpen(!isOverlayOpen)}
            className="w-full py-4 px-6 bg-slate-900/30 hover:bg-slate-800/50 rounded-2xl flex items-center justify-center gap-3 transition-all border border-white/5 text-slate-400 text-xs font-bold tracking-widest uppercase"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M3 9h18"/><path d="M15 21V9"/></svg>
            {isOverlayOpen ? '關閉懸浮視窗' : '啟動直播字幕'}
          </button>
        </aside>
        
        <section className="lg:col-span-8">
          <TranscriptList transcripts={transcripts} />
        </section>
      </main>

      {isOverlayOpen && (
        <FloatingOverlay 
          latestTranscript={transcripts[0]} 
          onClose={() => setIsOverlayOpen(false)}
        />
      )}
      
      <footer className="text-center">
        <p className="text-slate-800 text-[9px] font-black tracking-[0.3em] uppercase">
          Powered by Gemini 2.5 Flash native audio • Optimized for streamers
        </p>
      </footer>
    </div>
  );
};

export default App;
