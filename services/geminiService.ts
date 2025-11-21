import { GoogleGenAI, Type } from "@google/genai";
import { Highlight } from "../types";
import { GEMINI_MODEL } from "../constants";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("VITE_GEMINI_API_KEY Key not found in environment");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async analyzeVideo(base64Data: string, mimeType: string): Promise<Highlight[]> {
    const model = GEMINI_MODEL;
    
    const prompt = `
      Analyze this video and identify the 5 most highlight-worthy moments that are viral-worthy.
      For each highlight, provide exact start and end timestamps in [MM:SS] format and a brief, engaging description.
      Also provide a subtitle text for the clip.
      Ensure the clips are between 15 to 60 seconds long.
      Return the response in strict JSON format.
    `;
    // const prompt = `
    //   Act as an expert Teamfight Tactics (TFT) video editor. Analyze this gameplay video and extract up to 5 of the most intense "late-game" combat highlights.

    //   **Selection Criteria:**
    //   1.  **Late Game Focus:** Prioritize clips from the final 25% of the video (Stage 5, 6, or final showdowns). Look for high-level boards (level 8/9/10), 3-star high-cost units, or "capped" boards.
    //   2.  **Full Fight Integrity:** Each clip MUST capture the entire combat interaction.
    //       -   **Start:** 2-3 seconds before the first attack happens (during the final moments of positioning).
    //       -   **End:** 2-3 seconds after the round concludes and Little Legend damage is dealt.
    //   3.  **Viral Potential:** Prioritize close calls, massive area-of-effect (AOE) wipes, or "clutch" victories.

    //   **Output Constraints:**
    //   -   Clip Duration: 15 to 60 seconds.
    // `;

    const response = await this.ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            highlights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  start_time: { type: Type.STRING, description: "Start time in MM:SS" },
                  end_time: { type: Type.STRING, description: "End time in MM:SS" },
                  description: { type: Type.STRING, description: "Reason for highlight" },
                  subtitle: { type: Type.STRING, description: "Short punchy text to overlay" }
                },
                required: ["start_time", "end_time", "description", "subtitle"]
              }
            }
          }
        }
      }
    });

    try {
      const text = response.text;
      if (!text) throw new Error("No text returned from Gemini");
      
      const data = JSON.parse(text);
      return data.highlights || [];
    } catch (error) {
      console.error("Failed to parse Gemini response", error);
      throw new Error("Failed to analyze video highlights.");
    }
  }
}
