import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 強制同步橋接環境變數
const syncEnvironmentVariables = () => {
  if (typeof window === 'undefined') return;

  // 初始化 process.env 物件
  (window as any).process = (window as any).process || {};
  (window as any).process.env = (window as any).process.env || {};

  // 從所有可能的 Vite 來源嘗試讀取
  const viteKey = (import.meta as any).env?.VITE_API_KEY;
  const directKey = (import.meta as any).env?.API_KEY;
  
  // 取得現有的 process.env 值
  const existingKey = (window as any).process.env.API_KEY;

  // 決策：如果目前 process.env.API_KEY 是空的，則填入偵測到的金鑰
  if (!existingKey || existingKey === "") {
    const finalKey = viteKey || directKey;
    if (finalKey) {
      (window as any).process.env.API_KEY = finalKey;
    }
  }
  
  if ((window as any).process.env.API_KEY) {
    console.debug('ZenTrans: API Key 環境同步完成');
  } else {
    console.warn('ZenTrans: 警告 - 未能在任何位置偵測到 API Key');
  }
};

syncEnvironmentVariables();

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