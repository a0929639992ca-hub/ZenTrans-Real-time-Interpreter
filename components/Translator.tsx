
import React from 'react';
import { LanguageMode } from '../types';

interface TranslatorProps {
  isActive: boolean;
  onToggle: () => void;
  mode: LanguageMode;
  onModeChange: (mode: LanguageMode) => void;
  error: string | null;
}

const Translator: React.FC<TranslatorProps> = ({ isActive, onToggle, mode, onModeChange, error }) => {
  return (
    <div className="glass rounded-[2rem] p-8 space-y-8 border-white/5">
      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">偏好模式</label>
        <div className="flex flex-col gap-2">
          {[
            { id: LanguageMode.AUTO, label: '中日自動雙向偵測', icon: '⚡' },
            { id: LanguageMode.JP_TO_ZH, label: '日語翻繁中', icon: '🇯🇵' },
            { id: LanguageMode.ZH_TO_JP, label: '繁中翻日語', icon: '🇹🇼' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onModeChange(item.id)}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-xs font-bold border ${
                mode === item.id 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-900/20' 
                  : 'bg-white/[0.03] border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]'
              }`}
            >
              <span className="text-lg opacity-80">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={onToggle}
          className={`w-full py-5 rounded-[1.5rem] font-black text-sm flex items-center justify-center gap-4 transition-all active:scale-[0.97] ${
            isActive 
              ? 'bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20' 
              : 'bg-white text-black hover:bg-slate-200'
          }`}
        >
          {isActive ? (
            <><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> 停止口譯系統</>
          ) : (
            <><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg> 啟動即時翻譯</>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-bold text-center animate-shake">
          {error}
        </div>
      )}
    </div>
  );
};

export default Translator;
