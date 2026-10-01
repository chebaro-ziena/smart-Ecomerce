import * as Sentry from "@sentry/nextjs";

export function logError(error: unknown, context?: Record<string, unknown>) {
  console.error(error);
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
