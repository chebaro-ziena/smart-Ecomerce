
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();

export const rateLimiters = {   

  aiAnalyzer: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "smart-ecommerce:ai-analyzer",
  }),

  checkout: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "smart-ecommerce:checkout",
  }),

  payment: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "smart-ecommerce:payment",
  }),

  cart: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "smart-ecommerce:cart",
  }),

  mockPayment: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "smart-ecommerce:mock-payment",
  }),
};

export async function enforceRateLimit(
  limiter: Ratelimit,
  identifier: string,
) {
  const result = await limiter.limit(identifier);

  if (result.success) {
    return null;
  }

  const retryAfter = Math.max(
    1,
    Math.ceil((result.reset - Date.now()) / 1000),
  );

  return NextResponse.json(
    {
      error: "Too many requests. Please try again later.",
      retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}
