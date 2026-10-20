import "server-only";
import { sendEmail } from "@/lib/email/adapter";
import { confirmSubscriptionEmail, confirmedEmail } from "@/lib/email/templates";

/** Backwards-compatible wrapper used by older call sites. */
export async function sendTransactionalEmail(input: { to: string; subject: string; html: string }) {
  const result = await sendEmail(input);
  return { success: result.success, error: result.error };
}

export async function sendConfirmationEmail(to: string, confirmUrl: string, unsubscribeUrl: string) {
  const template = confirmSubscriptionEmail(confirmUrl, unsubscribeUrl);
  return sendEmail({ to, subject: template.subject, html: template.html, text: template.text, unsubscribeUrl });
}

export async function sendConfirmedEmail(to: string, homeUrl: string) {
  const template = confirmedEmail(homeUrl);
  return sendEmail({ to, ...template });
}

/**
 * Sendhiiv does not publish a stable contacts endpoint. Keeping this as a
 * best-effort adapter means the newsletter never depends on it: MongoDB is
 * the source of truth and the digest uses the transactional endpoint in
 * batches. Swap this implementation if Sendhiiv confirms an audience API.
 */
export async function addToSendhiivAudience(email: string) {
  console.info(`[sendhiiv] audience sync skipped; transactional sends remain the source of truth for ${email}`);
  return { success: false, error: "Audience endpoint not available; using transactional batches" };
}
