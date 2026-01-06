
import React from 'react';
import { TranscriptItem } from '../types';

interface TranscriptListProps {
  transcripts: TranscriptItem[];
}

const TranscriptList: React.FC<TranscriptListProps> = ({ transcripts }) => {
  return (
    <div className="glass-effect rounded-3xl h-[640px] flex flex-col shadow-2xl overflow-hidden border-slate-800">
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">翻譯紀錄</h2>
        <span className="text-[10px] font-bold bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">
          {transcripts.length} 筆
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {transcripts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
            <div className="w-12 h-12 rounded-full border-2 border-slate-800 flex items-center justify-center opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p className="text-xs font-bold tracking-tight">等待語音輸入以進行翻譯...</p>
          </div>
        ) : (
          transcripts.map((item) => (
            <div key={item.id} className="group animate-in fade-in slide-in-from-bottom-3 duration-500">
              <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-widest">
                <span className="text-blue-500">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-slate-700">|</span>
                <span className="text-slate-500">AI 即時口譯</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                <div className="px-4 py-2 text-slate-400 text-xs leading-relaxed border-l-2 border-slate-800 ml-1">
                  {item.originalText}
                </div>
                <div className="px-4 py-3 bg-blue-500/5 rounded-2xl rounded-tl-none border border-blue-500/10 group-hover:bg-blue-500/10 transition-colors">
                  <p className="text-white text-base font-bold leading-relaxed font-noto-tc">{item.translatedText}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

export default TranscriptList;
