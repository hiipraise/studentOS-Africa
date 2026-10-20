import { isIP } from "node:net";

/**
 * Only public HTTP(S) destinations are allowed for outbound redirects.
 * Blocks localhost, private ranges and non-HTTP protocols, so /go cannot be
 * used as an open redirect to internal services.
 */
export function isPublicHttpUrl(input: string | null | undefined): input is string {
  if (!input) return false;
  try {
    const url = new URL(input);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return false;
    const version = isIP(host);
    if (version === 6 && (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80"))) return false;
    if (version === 4 && (/^10\./.test(host) || /^127\./.test(host) || /^169\.254\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host) || host === "0.0.0.0")) return false;
    return true;
  } catch {
    return false;
  }
}
