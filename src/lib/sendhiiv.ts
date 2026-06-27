/**
 * Sendhiiv client
 * Docs: https://sendhiiv.com/docs/api
 *
 * CONFIRMED: POST /api/v1/messages — sends a single transactional email.
 *            Used here for the "welcome to the newsletter" email.
 *
 * NOT YET CONFIRMED: an "add to audience/list" endpoint, which is what
 *            you'd want for ongoing campaign sends (the actual weekly
 *            newsletter). Check your Sendhiiv dashboard → API docs for
 *            the audience/contacts endpoint and drop the real call into
 *            `addToSendhiivAudience()` below — it's isolated so nothing
 *            else needs to change.
 *
 * Until that's wired up, MongoDB's `newsletter` collection is the
 * source of truth for subscribers (see /api/newsletter route).
 */

const SENDHIIV_BASE_URL = "https://api.sendhiiv.com/api/v1";

interface SendTransactionalEmailParams {
  to: string;
  subject: string;
  html: string;
  templateKey?: string;
}

/** Sends a single transactional email via Sendhiiv's confirmed /messages endpoint. */
export async function sendTransactionalEmail({
  to,
  subject,
  html,
  templateKey,
}: SendTransactionalEmailParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.SENDHIIV_API_KEY;

  if (!apiKey) {
    console.warn("[sendhiiv] SENDHIIV_API_KEY not set — skipping email send");
    return { success: false, error: "Sendhiiv not configured" };
  }

  try {
    const res = await fetch(`${SENDHIIV_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "StudentOS Africa <hello@studentos.africa>",
        to,
        subject,
        ...(templateKey ? { template_key: templateKey } : {}),
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[sendhiiv] send failed", res.status, body);
      return { success: false, error: `Sendhiiv responded ${res.status}` };
    }

    return { success: true };
  } catch (err) {
    console.error("[sendhiiv] network error", err);
    return { success: false, error: "Network error contacting Sendhiiv" };
  }
}

/**
 * PLACEHOLDER — wire this up once you confirm the real audience/contacts
 * endpoint from your Sendhiiv dashboard. Until then this is a no-op that
 * logs intent, so calling it is always safe.
 */
export async function addToSendhiivAudience(
  email: string
): Promise<{ success: boolean; error?: string }> {
  console.warn(
    `[sendhiiv] addToSendhiivAudience() not yet wired up — would add ${email}. ` +
      "Find the real endpoint in your Sendhiiv dashboard and implement here."
  );
  return { success: false, error: "Not implemented" };
}

/** The welcome email sent on signup */
export function welcomeEmailHtml(): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
      <h1 style="color: #0E5C2F;">Welcome to StudentOS Africa 🎓</h1>
      <p>You're now subscribed to our weekly newsletter — scholarships, internships,
      fellowships, and student benefits, curated for students across Africa.</p>
      <p>Look out for your first drop this week.</p>
      <p style="color: #6B7D6E; font-size: 13px; margin-top: 32px;">
        StudentOS Africa
      </p>
    </div>
  `.trim();
}
