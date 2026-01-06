
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 環境變數橋接：解決 Vercel 上 VITE_ 前綴變數無法被 process.env 讀取的問題
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || {};
  (window as any).process.env = (window as any).process.env || {};
  
  // 優先使用已存在的 process.env.API_KEY，若無則從 Vite 環境變數中抓取
  if (!(window as any).process.env.API_KEY) {
    // @ts-ignore
    (window as any).process.env.API_KEY = import.meta.env?.VITE_API_KEY || import.meta.env?.API_KEY;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
