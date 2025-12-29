import JSZip from 'jszip';
import saveAs from 'file-saver';
import { ProcessedImage } from '../types';

export const downloadSingleImageZip = async (image: ProcessedImage) => {
  const zip = new JSZip();
  const folderName = image.originalFile.name.split('.')[0] + '_split';
  const folder = zip.folder(folderName);

  if (!folder) return;

  image.pieces.forEach((piece) => {
    folder.file(piece.fileName, piece.blob);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${folderName}.zip`);
};

export const downloadAllZip = async (images: ProcessedImage[]) => {
  const zip = new JSZip();
  const mainFolder = zip.folder('split_images_batch');

  if (!mainFolder) return;

  images.forEach((img) => {
    // Create a subfolder for each original image to keep things organized
    const cleanName = img.originalFile.name.split('.')[0];
    const subFolder = mainFolder.folder(cleanName);
    
    if (subFolder) {
        img.pieces.forEach((piece) => {
            subFolder.file(piece.fileName, piece.blob);
        });
    }
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  saveAs(content, `batch_split_${timestamp}.zip`);
};
