
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { LanguageMode, TranscriptItem } from './types';
import { decode, decodeAudioData, createBlob } from './utils/audio-helpers';
import Header from './components/Header';
import Translator from './components/Translator';
import TranscriptList from './components/TranscriptList';
import FloatingOverlay from './components/FloatingOverlay';

/**
 * ZenTrans Pro: 即時中日翻譯應用程式
 * 使用 Gemini 2.5 Native Audio API
 */
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
      try { sessionRef.current.close(); } catch (e) {}
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
      
      // 嚴格從 process.env.API_KEY 讀取 (由 index.tsx 負責注入)
      const apiKey = process.env.API_KEY;
      
      if (!apiKey || apiKey === "" || apiKey === "undefined") {
        setError('系統未偵測到 API Key。如果您已在 Vercel 設定 VITE_API_KEY，請務必重新進行「Redeploy」以使設定生效。');
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const systemInstruction = `你是一位專業的即時口譯員。
      - 若聽到日語（日本語），請翻譯為繁體中文（台灣習慣用語）。
      - 若聽到繁體中文，請翻譯為流暢的日語。
      - 僅輸出翻譯內容，不要有任何多餘贅詞。`;

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
                // 透過 promise 確保 session 已建立
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
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
          onerror: (e) => {
            console.error('Session Error:', e);
            setError('與翻譯伺服器連線中斷。請檢查網路或金鑰權限。');
            stopSession();
          },
          onclose: () => stopSession()
        }
      });
      
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      setError(`啟動失敗: ${err.message || '請確認麥克風權限'}`);
      stopSession();
    }
  };

  const handleToggle = () => isActive ? stopSession() : startSession();

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        <Header />
        
        <main className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-8">
            <Translator 
              isActive={isActive} 
              onToggle={handleToggle} 
              mode={mode} 
              onModeChange={setMode}
              error={error}
            />
            
            <button 
              onClick={() => setIsOverlayOpen(!isOverlayOpen)}
              className="w-full py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.08] transition-all"
            >
              {isOverlayOpen ? '關閉懸浮字幕窗' : '啟動直播字幕模式'}
            </button>
          </div>
          
          <div className="lg:col-span-8">
            <TranscriptList transcripts={transcripts} />
          </div>
        </main>
      </div>

      {isOverlayOpen && (
        <FloatingOverlay 
          latestTranscript={transcripts[0]} 
          onClose={() => setIsOverlayOpen(false)} 
        />
      )}
      
      <style>{`
        .glass { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
};

export default App;
