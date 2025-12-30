import { GoogleGenAI } from "@google/genai";
import { fileToBase64 } from "./promptService";

export interface EditOption {
  blob: Blob;
  url: string;
}

export type EditMode = 'erase' | 'creative';

export const generateEditOptions = async (
  pieceBlob: Blob,
  prompt: string,
  mimeType: string,
  count: number = 1,
  mode: EditMode = 'creative',
  referenceBlob?: Blob,
  maskBlob?: Blob
): Promise<EditOption[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const targetBase64 = await fileToBase64(pieceBlob);
  const parts: any[] = [{ inlineData: { data: targetBase64, mimeType } }];

  if (referenceBlob) {
    const refBase64 = await fileToBase64(referenceBlob);
    parts.push({ inlineData: { data: refBase64, mimeType: referenceBlob.type } });
  }

  if (maskBlob) {
    const maskBase64 = await fileToBase64(maskBlob);
    parts.push({ inlineData: { data: maskBase64, mimeType: 'image/png' } });
  }

  // Refine prompt based on mode
  let finalPrompt = "";
  if (mode === 'erase') {
    finalPrompt = "Strictly remove all watermarks, text, or distractions from the masked area. Fill the removed area seamlessly to match the surrounding textures and lighting perfectly. Do not change any other parts of the image.";
  } else {
    finalPrompt = prompt || "Enhance and refine the image based on the context.";
  }

  const systemText = `Task: ${finalPrompt} 
  CRITICAL: The output image MUST maintain the exact same aspect ratio and high resolution as the original piece. 
  ${referenceBlob ? "Use the second image as a visual style reference." : ""} 
  ${maskBlob ? "The third image is a mask (white area is target for change)." : ""}`;
  
  parts.push({ text: systemText });

  const tasks = Array.from({ length: count }).map(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
    });

    let newBase64 = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        newBase64 = part.inlineData.data;
        break;
      }
    }

    if (!newBase64) throw new Error("AI failed to return an image.");

    const byteCharacters = atob(newBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const newBlob = new Blob([byteArray], { type: mimeType });
    return { blob: newBlob, url: URL.createObjectURL(newBlob) };
  });

  return Promise.all(tasks);
};