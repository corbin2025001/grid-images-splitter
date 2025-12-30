export interface SplitPiece {
  id: string;
  blob: Blob;
  url: string;
  originalBlob: Blob; // To allow restoration
  originalUrl: string; // To allow restoration
  row: number;
  col: number;
  fileName: string;
  isModified?: boolean;
}

export interface Transition {
  from: string;
  to: string;
  prompt_zh: string;
  prompt_en: string;
}

export interface ProcessedImage {
  id: string;
  originalFile: File;
  previewUrl: string;
  width: number;
  height: number;
  pieces: SplitPiece[];
  rows: number;
  cols: number;
  gap: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  transitions?: Transition[];
}

export interface GridConfig {
  rows: number;
  cols: number;
  gap: number;
}