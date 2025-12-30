import { GoogleGenAI, Type } from "@google/genai";
import { Transition } from "../types";

export const generateVideoPrompts = async (
  base64Image: string,
  mimeType: string,
  rows: number,
  cols: number
): Promise<Transition[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `I have an image that has been split into a ${rows}x${cols} grid. 
  I need to generate high-quality video transition prompts for a series of short clips. 
  Each clip uses one grid cell as the START frame and the next grid cell (in reading order: Row 1 Col 1 -> Row 1 Col 2... then next row) as the END frame.
  
  Please analyze the image content and generate creative, cinematic transition descriptions for EACH consecutive pair in the sequence. 
  For example, if it's a 3x3 grid, you should provide prompts for:
  (1,1) to (1,2), (1,2) to (1,3), (1,3) to (2,1), (2,1) to (2,2), etc., until (3,2) to (3,3).

  Return the result as a JSON array of objects.
  Each object must have:
  - "from": The starting coordinates like "1,1"
  - "to": The ending coordinates like "1,2"
  - "prompt_zh": A vivid Chinese description of the transition.
  - "prompt_en": A vivid English description of the transition.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: prompt }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            from: { type: Type.STRING },
            to: { type: Type.STRING },
            prompt_zh: { type: Type.STRING },
            prompt_en: { type: Type.STRING },
          },
          required: ["from", "to", "prompt_zh", "prompt_en"]
        }
      }
    }
  });

  try {
    const text = response.text;
    return JSON.parse(text || "[]");
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return [];
  }
};

export const fileToBase64 = (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};