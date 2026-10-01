import { GoogleGenAI } from "@google/genai";


async function main() {
  const apiKey = "";

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing from .env");
  }

 const ai = new GoogleGenAI({ apiKey });

  const models = [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-2.5-flash",
    "gemini-flash-lite-latest",
  ];

  for (const model of models) {
    const start = Date.now();

    try {
      const response = await ai.models.generateContent({
        model,
        contents: "Reply with exactly: OK",
      });

      console.log(
        `✅ ${model} → ${response.text} (${Date.now() - start}ms)`
      );
    } catch (error: any) {
      console.log(
        `❌ ${model} → ${error?.status ?? error?.error?.code} (${Date.now() - start}ms)`
      );
    }
  }
}

main().catch(console.error);