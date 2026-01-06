
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { LanguageMode, TranscriptItem } from './types';
import { decode, decodeAudioData, createBlob } from './utils/audio-helpers';
import Header from './components/Header';
import Translator from './components/Translator';
import TranscriptList from './components/TranscriptList';
import FloatingOverlay from './components/FloatingOverlay';

/**
 * Main application component for ZenTrans Pro.
 * Handles Gemini Live API session management, audio streaming, and transcription.
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

  /**
   * Stops the current translation session and cleans up resources.
   */
  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      try {
        sessionRef.current.close?.();
      } catch (e) {}
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

  /**
   * Starts a new Gemini Live session for real-time translation.
   */
  const startSession = async () => {
    try {
      setError(null);
      
      // Use process.env.API_KEY directly as required by guidelines
      const apiKey = process.env.API_KEY;
      
      if (!apiKey || apiKey.trim() === "") {
        setError('系統未偵測到 API Key。請確保環境變數已正確設定。');
        return;
      }

      // Create a fresh GoogleGenAI instance for the connection
      const ai = new GoogleGenAI({ apiKey });
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const systemInstruction = `你是一位專業的即時口譯員，專精於日語（日本語）與繁體中文（台灣）。
      - 若聽到日語，翻譯成繁體中文。
      - 若聽到繁體中文，翻譯成日語。
      - 僅輸出翻譯結果，維持高效簡潔。`;

      // Initiate connection to Gemini 2.5 Live
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
            
            // Stream audio from the microphone to the model
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              // CRITICAL: Solely rely on sessionPromise resolves to send data to avoid race conditions
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Process audio transcriptions for both input and output
            if (message.serverContent?.inputTranscription) {
              transcriptionRef.current.input += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              transcriptionRef.current.output += message.serverContent.outputTranscription.text;
            }

            // Update transcript history when a turn is completed
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

            // Handle output audio bytes from the model
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              // Track end of playback queue for gapless audio
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                outputAudioContextRef.current,
                24000,
                1
              );
              const source = outputAudioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContextRef.current.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle interruption signal to stop all playing audio
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(source => {
                try { source.stop(); } catch (e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Live API connection error:', e);
            setError('發生連線錯誤，請重試。');
            stopSession();
          },
          onclose: () => {
            stopSession();
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error('Failed to initialize session:', err);
      setError(`系統啟動失敗: ${err.message || '未知錯誤'}`);
      stopSession();
    }
  };

  /**
   * Toggles the active state of the translation session.
   */
  const handleToggle = () => {
    if (isActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto px-6 py-10 md:py-16">
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
            
            <div className="glass rounded-3xl p-6 border-white/5 bg-gradient-to-br from-blue-600/5 to-transparent">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">系統狀態</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">連線狀態</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${isActive ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-500'}`}>
                    {isActive ? 'ACTIVE' : 'IDLE'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">延遲優化</span>
                  <span className="text-[10px] font-black text-blue-500">Enabled</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setIsOverlayOpen(!isOverlayOpen)}
              className="w-full py-4 rounded-2xl bg-white/[0.02] border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.05] transition-colors"
            >
              {isOverlayOpen ? '關閉懸浮字幕' : '開啟懸浮字幕'}
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
        .glass {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default App;
