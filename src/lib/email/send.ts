export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Optional List-Unsubscribe target, required for bulk sends. */
  unsubscribeUrl?: string;
}

export interface EmailResult {
  success: boolean;
  provider: "sendhiiv" | "resend" | "log";
  error?: string;
}

export function emailProvider(): "sendhiiv" | "resend" | "log" {
  if (process.env.SENDHIIV_API_KEY) return "sendhiiv";
  if (process.env.RESEND_API_KEY) return "resend";
  return "log";
}

async function sendWithSendhiiv(message: EmailMessage): Promise<EmailResult> {
  const apiKey = process.env.SENDHIIV_API_KEY;
  if (!apiKey) return { success: false, provider: "sendhiiv", error: "not configured" };
  const response = await fetch("https://api.sendhiiv.com/api/v1/messages", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "StudentOS Africa <hello@studentos.africa>",
      to: message.to,
      subject: message.subject,
      html: message.html,
      ...(message.text ? { text: message.text } : {}),
      ...(message.unsubscribeUrl ? { headers: { "List-Unsubscribe": `<${message.unsubscribeUrl}>` } } : {}),
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return { success: false, provider: "sendhiiv", error: `HTTP ${response.status} ${body.slice(0, 200)}` };
  }
  return { success: true, provider: "sendhiiv" };
}

async function sendWithResend(message: EmailMessage): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, provider: "resend", error: "not configured" };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "StudentOS Africa <hello@studentos.africa>",
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.unsubscribeUrl ? { headers: { "List-Unsubscribe": `<${message.unsubscribeUrl}>` } } : {}),
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return { success: false, provider: "resend", error: `HTTP ${response.status} ${body.slice(0, 200)}` };
  }
  return { success: true, provider: "resend" };
}

/**
 * Provider-neutral send. Selecting Sendhiiv first keeps the existing
 * integration working; Resend is a drop-in free-tier replacement. With no
 * provider configured the message is logged (useful in CI and local dev),
 * and the caller still gets a successful result so flows are testable.
 *
 * This module deliberately has no `server-only` import so scheduled scripts
 * can reuse it. Import it through `@/lib/email/adapter` in app code.
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const provider = emailProvider();
  try {
    if (provider === "sendhiiv") return await sendWithSendhiiv(message);
    if (provider === "resend") return await sendWithResend(message);
    console.info(`[email:log] to=${message.to} subject=${message.subject} unsubscribe=${message.unsubscribeUrl ?? "none"}`);
    return { success: true, provider: "log" };
  } catch (error) {
    return { success: false, provider, error: error instanceof Error ? error.message : String(error) };
  }
}
