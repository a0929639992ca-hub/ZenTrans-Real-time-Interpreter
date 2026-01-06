
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
    <div className="glass-effect rounded-3xl p-6 space-y-6">
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">翻譯模式</label>
        <div className="flex flex-col gap-2">
          {[
            { id: LanguageMode.AUTO, label: '自動偵測 (中日互譯)', icon: '✨' },
            { id: LanguageMode.JP_TO_ZH, label: '日語 ➔ 繁體中文', icon: '🇯🇵' },
            { id: LanguageMode.ZH_TO_JP, label: '繁體中文 ➔ 日語', icon: '🇹🇼' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onModeChange(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold border ${
                mode === item.id 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                  : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={onToggle}
          className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] ${
            isActive 
              ? 'bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500/20' 
              : 'bg-white text-slate-950 hover:bg-slate-100 shadow-lg shadow-white/5'
          }`}
        >
          {isActive ? (
            <>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              停止口譯
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
              開始口譯
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-bold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12" y1="16" y2="16.01"/></svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default Translator;
