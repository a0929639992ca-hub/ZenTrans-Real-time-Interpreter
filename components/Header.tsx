
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 pb-6">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 8 6 6"/><path d="M2 5h12"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            ZenTrans 
            <span className="text-[10px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded leading-none">PRO</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium">中日雙語即時口譯系統</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
        Gemini 2.5 Live
      </div>
    </header>
  );
};

export default Header;
