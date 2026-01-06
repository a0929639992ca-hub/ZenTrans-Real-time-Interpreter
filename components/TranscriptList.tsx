
import React from 'react';
import { TranscriptItem } from '../types';

interface TranscriptListProps {
  transcripts: TranscriptItem[];
}

const TranscriptList: React.FC<TranscriptListProps> = ({ transcripts }) => {
  return (
    <div className="glass rounded-[2rem] h-[600px] flex flex-col shadow-2xl overflow-hidden border-white/5">
      <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">翻譯紀錄回溯</h2>
        <span className="text-[10px] font-black bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full border border-blue-500/10">
          {transcripts.length} 訊息
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
        {transcripts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-3 opacity-40">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V12L15 15"/><circle cx="12" cy="12" r="10"/></svg>
            <p className="text-[11px] font-bold tracking-widest">等待即時語音辨識...</p>
          </div>
        ) : (
          transcripts.map((item) => (
            <div key={item.id} className="group animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[9px] font-black text-blue-500/60 tabular-nums">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <div className="h-[1px] flex-1 bg-white/5"></div>
              </div>
              <div className="space-y-4">
                <div className="text-slate-500 text-xs font-medium leading-relaxed font-noto-tc pl-4 border-l border-white/10 italic">
                  {item.originalText}
                </div>
                <div className="text-white text-xl font-bold leading-snug font-noto-tc pl-4">
                  {item.translatedText}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default TranscriptList;
