import JSZip from 'jszip';
import saveAs from 'file-saver';
import { ProcessedImage } from '../types';

const generatePromptsText = (image: ProcessedImage): string => {
  if (!image.transitions || image.transitions.length === 0) return '';
  
  let text = `Video Transition Prompts for ${image.originalFile.name}\n`;
  text += `Grid: ${image.rows}x${image.cols}\n`;
  text += `==========================================\n\n`;
  
  image.transitions.forEach((t, i) => {
    text += `[Transition ${i + 1}] (${t.from}) -> (${t.to})\n`;
    text += `CN: ${t.prompt_zh}\n`;
    text += `EN: ${t.prompt_en}\n`;
    text += `------------------------------------------\n\n`;
  });
  
  return text;
};

export const downloadSingleImageZip = async (image: ProcessedImage) => {
  const zip = new JSZip();
  const folderName = image.originalFile.name.split('.')[0] + '_split';
  const folder = zip.folder(folderName);

  if (!folder) return;

  image.pieces.forEach((piece) => {
    folder.file(piece.fileName, piece.blob);
  });

  // Add prompts.txt if available
  if (image.transitions && image.transitions.length > 0) {
    folder.file('video_prompts.txt', generatePromptsText(image));
  }

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${folderName}.zip`);
};

export const downloadAllZip = async (images: ProcessedImage[]) => {
  const zip = new JSZip();
  const mainFolder = zip.folder('split_images_batch');

  if (!mainFolder) return;

  images.forEach((img) => {
    const cleanName = img.originalFile.name.split('.')[0];
    const subFolder = mainFolder.folder(cleanName);
    
    if (subFolder) {
        img.pieces.forEach((piece) => {
            subFolder.file(piece.fileName, piece.blob);
        });
        
        if (img.transitions && img.transitions.length > 0) {
            subFolder.file('video_prompts.txt', generatePromptsText(img));
        }
    }
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  saveAs(content, `batch_split_${timestamp}.zip`);
};