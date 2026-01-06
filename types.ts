
export enum LanguageMode {
  AUTO = 'AUTO',
  JP_TO_ZH = 'JP_TO_ZH',
  ZH_TO_JP = 'ZH_TO_JP'
}

export interface TranscriptItem {
  id: string;
  timestamp: number;
  originalText: string;
  translatedText: string;
  type: 'user' | 'model';
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
}
