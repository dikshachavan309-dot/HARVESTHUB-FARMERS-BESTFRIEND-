import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface FarmingTips {
  plantingTips: string[];
  farmingTips: string[];
  soilFertilityTips: string[];
  marketInsights: string[];
  sustainabilityScore: number;
  resourceEstimates: {
    water: string;
    fertilizer: string;
    labor: string;
  };
  riskAssessment: string[];
  profitEstimator: {
    estimatedCost: string;
    potentialRevenue: string;
    profitMargin: string;
  };
  cropTimeline: {
    stage: string;
    duration: string;
    task: string;
  }[];
}

export async function getHarvestTips(
  cropType: string,
  landType: string,
  soilType: string,
  season: string
): Promise<FarmingTips> {
  const prompt = `Give me simple farming advice for:
    Crop: ${cropType}
    Land: ${landType}
    Soil: ${soilType}
    Season: ${season}

    Use very simple English (easy for everyone to understand). 
    Talk like a friendly local farmer.
    
    Return the data in these categories:
    1. Planting Tips: How to sow and space seeds.
    2. Farming Tips: How to take care of the crop and stop pests.
    3. Soil Fertility Tips: How to keep the soil healthy.
    4. Market Insights: Is there good demand? Will prices be good?
    5. Sustainability Score: A number 0-100 (how good is this for nature?).
    6. Resource Estimates: Simple words for how much water, fertilizer, and help you need.
    7. Risk Assessment: Simple warnings about bugs or bad weather.
    8. Profit Estimator: Simple estimates for cost, revenue, and profit margin.
    9. Crop Timeline: A list of 4-5 stages (like Sowing, Growing, Harvesting) with duration and main task.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plantingTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            farmingTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            soilFertilityTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            marketInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
            sustainabilityScore: { type: Type.NUMBER },
            resourceEstimates: {
              type: Type.OBJECT,
              properties: {
                water: { type: Type.STRING },
                fertilizer: { type: Type.STRING },
                labor: { type: Type.STRING }
              },
              required: ["water", "fertilizer", "labor"]
            },
            riskAssessment: { type: Type.ARRAY, items: { type: Type.STRING } },
            profitEstimator: {
              type: Type.OBJECT,
              properties: {
                estimatedCost: { type: Type.STRING },
                potentialRevenue: { type: Type.STRING },
                profitMargin: { type: Type.STRING }
              },
              required: ["estimatedCost", "potentialRevenue", "profitMargin"]
            },
            cropTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stage: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  task: { type: Type.STRING }
                },
                required: ["stage", "duration", "task"]
              }
            }
          },
          required: [
            "plantingTips", 
            "farmingTips", 
            "soilFertilityTips", 
            "marketInsights", 
            "sustainabilityScore", 
            "resourceEstimates", 
            "riskAssessment",
            "profitEstimator",
            "cropTimeline"
          ]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text) as FarmingTips;
  } catch (error) {
    console.error("Error fetching tips from Gemini:", error);
    throw error;
  }
}

export async function streamChat(
  message: string,
  history: { role: "user" | "model"; parts: { text: string }[] }[]
): Promise<string> {
  try {
    // Combine system instruction with history for generateContent
    const contents = [
      {
        role: "user",
        parts: [{ text: "You are a friendly local farming expert. Use very simple English. Avoid big technical words. Give practical, easy-to-follow advice for farmers." }]
      },
      {
        role: "model",
        parts: [{ text: "Understood. I will provide simple and practical farming advice in easy English." }]
      },
      ...history,
      {
        role: "user",
        parts: [{ text: message }]
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
    });

    return response.text || "I'm sorry, I couldn't answer that. Try asking again simply.";
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
}
