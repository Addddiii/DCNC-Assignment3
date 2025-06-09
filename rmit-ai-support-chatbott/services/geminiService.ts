
import { GoogleGenAI, Chat, GenerateContentResponse, Content, GenerateContentConfig } from "@google/genai";
import { GEMINI_MODEL_NAME, RMIT_SYSTEM_INSTRUCTION } from '../constants';

let ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!ai) {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set. Please ensure it is configured.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

export const startChatSession = (initialHistory?: Content[]): Chat => {
  const generativeAI = getAI();
  const chatInternalConfig: GenerateContentConfig = { // This is GenerateContentConfig
    systemInstruction: RMIT_SYSTEM_INSTRUCTION,
    tools: [{ googleSearch: {} }], // Enable Google Search grounding
    // thinkingConfig: { thinkingBudget: 0 } // Optionally disable thinking for lower latency if needed
  };
  
  return generativeAI.chats.create({
    model: GEMINI_MODEL_NAME,
    config: chatInternalConfig, // Pass the GenerateContentConfig object here
    history: initialHistory || [],
  });
};

export async function* sendMessageStream(
  chat: Chat,
  message: string,
  policyContext: string
): AsyncGenerator<GenerateContentResponse, void, undefined> {
  const promptWithContext = `
Context from RMIT Policy Documents:
--- START OF RMIT POLICY DOCUMENTS ---
${policyContext}
--- END OF RMIT POLICY DOCUMENTS ---

Based on these documents and your general knowledge of RMIT, please answer the following question. 
If the question requires information beyond these documents (e.g., current events, specific program details not covered), use Google Search. 
When searching for RMIT-specific information, you MUST restrict your search and sourcing exclusively to the official \`rmit.edu.au\` domain. 
Cite only URLs from \`rmit.edu.au\`. If the answer cannot be found on \`rmit.edu.au\` after searching, clearly state that.
User Question: ${message}
`;

  try {
    const result = await chat.sendMessageStream({ message: promptWithContext });
    for await (const chunk of result) {
      yield chunk;
    }
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    if (error instanceof Error) {
        yield { 
            text: `Error: ${error.message}. Please check your API key and network connection.`,
            candidates: [],
            usageMetadata: undefined,
            promptFeedback: undefined,
         } as unknown as GenerateContentResponse; // Type assertion needed for error object
    } else {
        yield { 
            text: "An unknown error occurred while communicating with the AI.",
            candidates: [],
            usageMetadata: undefined,
            promptFeedback: undefined,
        } as unknown as GenerateContentResponse;
    }
  }
}