import { GoogleGenAI, Type } from "@google/genai";
import { ColumnStats, CleaningOperation, OperationType } from "../types";

const SYSTEM_INSTRUCTION = `
You are DataToyAI, an expert data engineer. 
Your goal is to interpret natural language requests to clean or transform datasets.
You will be provided with the "Column Statistics" of the current dataset.
You must return a JSON array of cleaning operations to apply based on the user's request.

Available Operation Types:
- FILL_MISSING: Replace nulls. value is required.
- DROP_MISSING: Remove rows with nulls in specific column.
- CONVERT_TYPE: Change column type (targetType: 'string', 'number', 'boolean').
- DROP_COLUMN: Remove a column.
- MAP_VALUES: Map categorical values to others (e.g. 'Male' -> 0). mapping object required.

Rules:
- If the user asks to "clean everything", look for columns with missing values and impute them (mean for numbers, mode for categorical) or drop them if >50% missing.
- If the user is vague, make a reasonable assumption and mention it in the description.
- Return a valid JSON list.
`;

export const interpretCleaningRequest = async (
  query: string, 
  stats: ColumnStats[]
): Promise<CleaningOperation[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const statsSummary = stats.map(s => 
    `${s.name}: ${s.type}, missing: ${s.missingCount}, unique: ${s.uniqueCount}, samples: [${s.sample.join(', ')}]`
  ).join('\n');

  const prompt = `
    Current Dataset Stats:
    ${statsSummary}

    User Request: "${query}"

    Generate the cleaning operations.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: Object.values(OperationType) },
              column: { type: Type.STRING, description: "Target column name" },
              value: { type: Type.STRING, description: "Value for fill operations (cast to number if needed in logic)" },
              targetType: { type: Type.STRING, enum: ['string', 'number', 'boolean'] },
              description: { type: Type.STRING },
              // Schema limitations for dynamic maps, we will parse mapping from a stringified JSON in value if strictly needed, 
              // but for this demo let's assume simple mappings or handle categorical mapping via multiple simple ops or skip complex mapping via schema enforcement
            },
            required: ["type", "description"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const ops = JSON.parse(text) as any[];
    
    // Post-process to fix types if needed (Gemini might return strings for numbers in 'value')
    return ops.map(op => {
      // Basic type inference for 'value' if it looks like a number
      if (op.value && !isNaN(Number(op.value)) && op.value !== '') {
         // Keep as string if it was intended as string, but usually fill values for numeric columns should be numbers
         // We can check against stats, but for now let's be flexible.
         // Actually, let's leave it to the application logic to cast based on column type.
      }
      return op;
    });

  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to interpret cleaning request.");
  }
};
