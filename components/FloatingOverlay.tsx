
import React, { useState } from 'react';
import { TranscriptItem } from '../types';

interface FloatingOverlayProps {
  latestTranscript?: TranscriptItem;
  onClose: () => void;
}

const FloatingOverlay: React.FC<FloatingOverlayProps> = ({ latestTranscript, onClose }) => {
  const [position, setPosition] = useState({ x: 40, y: window.innerHeight - 160 });
  const [isDragging, setIsDragging] = useState(false);
  const [rel, setRel] = useState({ x: 0, y: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setRel({
      x: e.pageX - rect.left,
      y: e.pageY - rect.top
    });
    e.stopPropagation();
    e.preventDefault();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - 420, e.pageX - rel.x)),
      y: Math.max(0, Math.min(window.innerHeight - 120, e.pageY - rel.y))
    });
  };

  const onMouseUp = () => setIsDragging(false);

  React.useEffect(() => {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, rel]);

  return (
    <div 
      className="fixed z-[9999] pointer-events-none"
      style={{ left: position.x, top: position.y }}
    >
      <div 
        onMouseDown={onMouseDown}
        className={`w-[440px] pointer-events-auto cursor-move select-none p-4 rounded-2xl border shadow-2xl transition-all duration-300 group ${
          latestTranscript 
            ? 'bg-black/85 border-blue-500/40 backdrop-blur-xl' 
            : 'bg-black/60 border-slate-800 backdrop-blur-md'
        }`}
      >
        <div className="flex items-center justify-between mb-2 opacity-40 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${latestTranscript ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`}></div>
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">即時翻譯字幕</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        
        <div className="min-h-[54px] flex flex-col justify-center">
          {latestTranscript ? (
            <div className="space-y-1 animate-in fade-in slide-in-from-bottom-1 duration-300">
              <p className="text-[10px] text-slate-500 font-medium line-clamp-1 italic">{latestTranscript.originalText}</p>
              <p className="text-xl font-black text-white leading-tight font-noto-tc drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {latestTranscript.translatedText}
              </p>
            </div>
          ) : (
            <p className="text-slate-600 text-[10px] font-bold text-center italic tracking-wider py-2">等待語音...</p>
          )}
        </div>
        
        {/* Resize handle decoration */}
        <div className="absolute bottom-1 right-1 w-2 h-2 border-r border-b border-slate-700 opacity-20"></div>
      </div>
    </div>
  );
};

export default FloatingOverlay;
