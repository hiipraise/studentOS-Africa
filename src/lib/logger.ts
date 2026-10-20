import { randomUUID } from "node:crypto";

export interface LogContext {
  requestId: string;
  route?: string;
  [key: string]: unknown;
}

export function newRequestId() {
  return randomUUID();
}

/** Structured, single-line error logging with a request id for correlation. */
export function logError(message: string, error: unknown, context: Partial<LogContext> = {}) {
  const payload = {
    level: "error",
    message,
    requestId: context.requestId ?? newRequestId(),
    route: context.route,
    error: error instanceof Error ? { name: error.name, message: error.message, stack: process.env.NODE_ENV === "production" ? undefined : error.stack } : String(error),
    at: new Date().toISOString(),
    ...context,
  };
  console.error(JSON.stringify(payload));
}

export function logInfo(message: string, context: Partial<LogContext> = {}) {
  console.log(JSON.stringify({ level: "info", message, at: new Date().toISOString(), ...context }));
}
