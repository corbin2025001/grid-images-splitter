export interface SplitPiece {
  id: string;
  blob: Blob;
  url: string;
  row: number;
  col: number;
  fileName: string;
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
}

export interface GridConfig {
  rows: number;
  cols: number;
  gap: number;
}