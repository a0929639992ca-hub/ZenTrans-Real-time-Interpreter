
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 初始化並橋接環境變數
const initEnv = () => {
  // 確保 window.process.env 結構存在
  (window as any).process = (window as any).process || {};
  (window as any).process.env = (window as any).process.env || {};

  // 1. 嘗試從 Vite 內建的 import.meta.env 取得金鑰 (這是 Vercel VITE_ 前綴變數的標準路徑)
  // 2. 嘗試從其他可能的環境變數路徑取得
  const foundKey = 
    (import.meta as any).env?.VITE_API_KEY || 
    (import.meta as any).env?.API_KEY || 
    (window as any).process.env?.VITE_API_KEY || 
    (window as any).process.env?.API_KEY;

  if (foundKey) {
    (window as any).process.env.API_KEY = foundKey;
    console.debug('ZenTrans: API Key 成功掛載至 process.env');
  } else {
    console.warn('ZenTrans: 偵測不到 API Key，請檢查 Vercel 環境變數設定並重新部署。');
  }
};

initEnv();

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
