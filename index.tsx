
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 初始化並橋接環境變數
const initEnv = () => {
  // 確保 window.process.env 結構存在
  const win = window as any;
  win.process = win.process || {};
  win.process.env = win.process.env || {};

  // 1. 嘗試從 Vite 內建的 import.meta.env 取得金鑰 (Vite 專案標準)
  // 2. 嘗試從 window 全域物件取得 (部分環境會直接注入)
  // 3. 嘗試從既有的 process.env 取得
  const foundKey = 
    (import.meta as any).env?.VITE_API_KEY || 
    (import.meta as any).env?.API_KEY || 
    win.VITE_API_KEY ||
    win.API_KEY ||
    win.process.env?.VITE_API_KEY || 
    win.process.env?.API_KEY;

  if (foundKey) {
    win.process.env.API_KEY = foundKey;
    console.log('ZenTrans: API Key 偵測成功並已掛載。');
  } else {
    console.warn('ZenTrans: 目前環境中未偵測到 API Key。');
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
