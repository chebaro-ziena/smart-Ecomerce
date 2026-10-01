import { GoogleGenAI } from "@google/genai";
import * as Sentry from "@sentry/nextjs";

export interface AiProductSuggestion {
  name: string;
  description: string;
  tags: string[];
  category: string;
  suggestedPrice: number | null;
}

/**
 * Model priority:
 *
 * 1. Gemini 3.7 Flash  - primary
 * 2. Gemini 3.6 Flash  - fallback
 * 3. Gemini 2.5 Flash  - stable fallback
 * 4. Gemini Flash Lite - final lightweight fallback
 */
const MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.7-flash",
] as const;

// Maximum 2 attempts for the current model.
// After that we immediately move to the next model.
const MAX_ATTEMPTS_PER_MODEL = 2;

const SYSTEM_PROMPT = `You are a product cataloging assistant for an e-commerce store.

You will be shown a photo of a single product.

Respond with ONLY a JSON object (no markdown fences, no commentary) matching this exact shape:

{
  "name": string,
  "description": string,
  "tags": string[],
  "category": string,
  "suggestedPrice": number | null
}

Rules:
- name: short, sellable product title, max 70 characters
- description: 2-4 sentences, persuasive but accurate
- tags: 4-8 lowercase search tags
- category: best single category, for example "Electronics", "Clothing", "Home & Kitchen", "Beauty", "Toys", "Sports"
- suggestedPrice: reasonable USD price guess if identifiable, otherwise null
- Only describe what is visibly present in the image.
- Do not invent brand names that cannot be seen.
- Do not invent specifications that cannot be determined from the image.
- If something cannot be determined, omit it or use null.`;

function getClient(): GoogleGenAI {
  const apiKey = process.env.Gemini_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add your Gemini API key to .env."
    );
  }

  return new GoogleGenAI({ apiKey });
}

function mimeFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);base64,/);

  return match?.[1] ?? "image/jpeg";
}

function base64FromDataUrl(dataUrl: string): string {
  const marker = "base64,";
  const index = dataUrl.indexOf(marker);

  if (index === -1) {
    return dataUrl;
  }

  return dataUrl.slice(index + marker.length);
}


function isRetryableError(error: any): boolean {
  const status = error?.status ?? error?.error?.code;

  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}


function getRetryDelay(attempt: number): number {
  const baseDelay = 1000 * Math.pow(2, attempt - 1);

  // 0-500ms random jitter
  const jitter = Math.floor(Math.random() * 500);

  return baseDelay + jitter;
}


async function generateWithRetry(
  client: GoogleGenAI,
  model: string,
  contents: any,
  config: any
) {
  for (
    let attempt = 1;
    attempt <= MAX_ATTEMPTS_PER_MODEL;
    attempt++
  ) {
    try {
      console.log(
        `Trying Gemini model ${model} ` +
          `(attempt ${attempt}/${MAX_ATTEMPTS_PER_MODEL})`
      );

      const response = await client.models.generateContent({
        model,
        contents,
        config,
      });

      console.log(
        `Gemini succeeded using ${model}`
      );

      return response;
    } catch (error: any) {
      const status =
        error?.status ?? error?.error?.code;

      console.warn(
        `Gemini ${model} failed. ` +
          `status=${status}, ` +
          `attempt=${attempt}/${MAX_ATTEMPTS_PER_MODEL}`
      );

    
      if (!isRetryableError(error)) {
        throw error;
      }

      
      if (attempt === MAX_ATTEMPTS_PER_MODEL) {
        throw error;
      }

      const delay = getRetryDelay(attempt);

      console.warn(
        `Retrying ${model} in ${delay}ms...`
      );

      await new Promise((resolve) =>
        setTimeout(resolve, delay)
      );
    }
  }

  throw new Error(
    `Gemini ${model} failed after retries.`
  );
}

/**
 * Try the available models in order.
 *
 * Primary:
 *   Gemini 3.7 Flash
 *
 * Fallbacks:
 *   Gemini 3.6 Flash
 *   Gemini 2.5 Flash
 *   Gemini Flash Lite
 */
async function generateWithFallback(
  client: GoogleGenAI,
  contents: any,
  config: any
) {
  let lastError: unknown;

  for (const model of MODELS) {
    try {
      const response = await generateWithRetry(
        client,
        model,
        contents,
        config
      );

      return response;
    } catch (error: any) {
      lastError = error;

      const status =
        error?.status ?? error?.error?.code;

      console.warn(
        `Model ${model} unavailable. ` +
          `status=${status}.`
      );

      
      Sentry.captureException(error, {
        level: "warning",
        tags: {
          feature: "ai-product-generation",
          model,
          failureType: "model-failure",
        },
      });

      
      if (!isRetryableError(error)) {
        throw error;
      }

      console.warn(
        `Moving to next Gemini fallback model...`
      );
    }
  }

  throw (
    lastError ??
    new Error("All Gemini models failed.")
  );
}

export async function generateProductFromImage(
  imageDataUrl: string
): Promise<AiProductSuggestion> {
  const client = getClient();

  const mediaType = mimeFromDataUrl(
    imageDataUrl
  );

  const base64 = base64FromDataUrl(
    imageDataUrl
  );

  try {
    const response = await generateWithFallback(
      client,
      [
        {
          inlineData: {
            mimeType: mediaType,
            data: base64,
          },
        },
        {
          text: `${SYSTEM_PROMPT}

Analyze this product photo and return the JSON object exactly as instructed.`,
        },
      ],
      {
        responseMimeType: "application/json",
      }
    );

    const text = response.text;

    if (!text) {
      throw new Error(
        "AI response did not contain text content."
      );
    }

    const jsonText = extractJson(text);

    const parsed = JSON.parse(jsonText);

    return normalizeSuggestion(parsed);
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        feature: "ai-product-generation",
      },
    });

    throw error;
  }
}

function extractJson(text: string): string {
  const trimmed = text.trim();

  const fenceMatch = trimmed.match(
    /```(?:json)?\s*([\s\S]*?)\s*```/
  );

  if (fenceMatch) {
    return fenceMatch[1];
  }

  const firstBrace =
    trimmed.indexOf("{");

  const lastBrace =
    trimmed.lastIndexOf("}");

  if (
    firstBrace !== -1 &&
    lastBrace !== -1
  ) {
    return trimmed.slice(
      firstBrace,
      lastBrace + 1
    );
  }

  return trimmed;
}

function normalizeSuggestion(
  parsed: any
): AiProductSuggestion {
  return {
    name:
      String(parsed.name ?? "").slice(0, 120) ||
      "Untitled Product",

    description: String(
      parsed.description ?? ""
    ).slice(0, 2000),

    tags: Array.isArray(parsed.tags)
      ? parsed.tags
          .map((tag: unknown) =>
            String(tag)
              .toLowerCase()
              .trim()
          )
          .filter(Boolean)
          .slice(0, 10)
      : [],

    category:
      String(
        parsed.category ??
          "Uncategorized"
      ),

    suggestedPrice:
      typeof parsed.suggestedPrice ===
        "number" &&
      Number.isFinite(
        parsed.suggestedPrice
      )
        ? Math.max(
            0,
            Math.round(
              parsed.suggestedPrice * 100
            ) / 100
          )
        : null,
  };
}
