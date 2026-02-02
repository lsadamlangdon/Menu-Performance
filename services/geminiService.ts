
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResults } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER, description: "Final score out of 100" },
    oneSentenceSummary: { type: Type.STRING, description: "Professional executive summary" },
    confidenceLevel: { type: Type.STRING, description: "High, Medium, or Low" },
    metrics: {
      type: Type.OBJECT,
      properties: {
        totalItems: { type: Type.NUMBER },
        sizeCategory: { type: Type.STRING, description: "Small (<25), Medium (25-50), Large (>50)" },
        complexityScore: { type: Type.NUMBER, description: "A calculated value from 1 to 10 representing operational complexity." },
        pricing: {
          type: Type.OBJECT,
          properties: {
            minPrice: { type: Type.NUMBER },
            maxPrice: { type: Type.NUMBER },
            medianPrice: { type: Type.NUMBER },
          }
        }
      }
    },
    breakdown: {
      type: Type.OBJECT,
      properties: {
        simplicityScore: { type: Type.NUMBER, description: "Out of 25" },
        pricingScore: { type: Type.NUMBER, description: "Out of 25" },
        balanceScore: { type: Type.NUMBER, description: "Out of 25" },
        marginScore: { type: Type.NUMBER, description: "Out of 25" },
      }
    },
    positives: { type: Type.ARRAY, items: { type: Type.STRING } },
    issues: { type: Type.ARRAY, items: { type: Type.STRING } },
    quickWins: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exactly 5 high-impact strategic actions for the menu." },
  },
  required: ["overallScore", "oneSentenceSummary", "breakdown", "positives", "issues", "quickWins", "metrics", "confidenceLevel"]
};

export const analyzeMenu = async (base64Data: string, mimeType: string): Promise<AnalysisResults> => {
  const prompt = `
    You are a professional hospitality performance analyst. 
    Analyze the provided menu image or PDF.
    
    Step 1: Perform OCR to extract items, categories, and prices.
    Step 2: Evaluate based on these benchmarks:
    - Simplicity & Focus: Small (<25 items) is better for efficiency. (Max 25 points for simplicityScore).
    - Pricing Structure: Consistency, clear spreads, median vs max. (Max 25 points for pricingScore).
    - Category Balance: Ratio of mains to sides/drinks. Upsell opportunities. (Max 25 points for balanceScore).
    - Estimated Margin: Identify high-margin (drinks, sides) vs potentially low-margin complex mains. (Max 25 points for marginScore).
    
    Metrics Calculation:
    - totalItems: The actual count of menu items.
    - complexityScore: MUST be a value between 1 and 10. (1 = very simple, 10 = extremely complex/unfocused). 
    
    Constraint: Round all scores to whole numbers. 
    Tone: Professional, supportive, benchmark-based. 
    Quick Wins: YOU MUST PROVIDE EXACTLY 5 STRATEGIC RECOMMENDATIONS.
    Confidence: Return 'Low' if text is blurry or unreadable.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    // Safety check for complexity score
    if (result.metrics && typeof result.metrics.complexityScore === 'number') {
      result.metrics.complexityScore = Math.min(Math.max(result.metrics.complexityScore, 1), 10);
    }
    
    // Ensure at least 5 quick wins
    if (!result.quickWins || result.quickWins.length < 5) {
      result.quickWins = result.quickWins || [];
      const filler = [
        "Review item descriptions for upselling", 
        "Update menu layout for better flow", 
        "Audit seasonal pricing strategy",
        "Introduce a signature high-margin special",
        "Streamline underperforming menu sections"
      ];
      while(result.quickWins.length < 5) {
        result.quickWins.push(filler[result.quickWins.length] || "Optimize high-margin visibility");
      }
    }

    return result as AnalysisResults;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze the menu. Please check the image quality and try again.");
  }
};
