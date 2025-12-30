import { GridConfig, ProcessedImage, SplitPiece } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const splitImage = async (
  file: File,
  config: GridConfig
): Promise<ProcessedImage> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = async () => {
      try {
        const { rows, cols, gap = 0 } = config;
        const totalWidth = img.naturalWidth;
        const totalHeight = img.naturalHeight;
        const pieces: SplitPiece[] = [];

        const totalGapWidth = gap * (cols - 1);
        const totalGapHeight = gap * (rows - 1);

        if (totalGapWidth >= totalWidth || totalGapHeight >= totalHeight) {
             throw new Error("Gap is too large for the image dimensions.");
        }

        const cellWidth = (totalWidth - totalGapWidth) / cols;
        const cellHeight = (totalHeight - totalGapHeight) / rows;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const x = Math.floor(c * (cellWidth + gap));
            const y = Math.floor(r * (cellHeight + gap));
            const w = Math.floor(cellWidth);
            const h = Math.floor(cellHeight);

            if (w <= 0 || h <= 0) continue;

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              throw new Error('Could not get canvas context');
            }

            ctx.drawImage(img, x, y, w, h, 0, 0, w, h);

            const blob = await new Promise<Blob | null>((blobResolve) =>
              canvas.toBlob(blobResolve, file.type, 0.95)
            );

            if (blob) {
              const pieceUrl = URL.createObjectURL(blob);
              const ext = file.name.split('.').pop() || 'png';
              const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
              
              pieces.push({
                id: uuidv4(),
                blob,
                url: pieceUrl,
                originalBlob: blob, // Store for restoration
                originalUrl: pieceUrl, // Store for restoration
                row: r,
                col: c,
                fileName: `${nameWithoutExt}_row${r + 1}_col${c + 1}.${ext}`,
                isModified: false
              });
            }
          }
        }

        resolve({
          id: uuidv4(),
          originalFile: file,
          previewUrl: objectUrl,
          width: totalWidth,
          height: totalHeight,
          pieces,
          rows,
          cols,
          gap,
          status: 'done',
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
};