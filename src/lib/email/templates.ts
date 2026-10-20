function shell(title: string, body: string, footer = "") {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#14261a">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
    <p style="font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#0E5C2F;margin:0 0 18px">StudentOS Africa</p>
    <h1 style="font-size:24px;line-height:1.3;margin:0 0 16px">${escapeHtml(title)}</h1>
    ${body}
    <hr style="border:none;border-top:1px solid #e6e9e1;margin:28px 0 16px" />
    <p style="font-size:12px;color:#6B7D6E;line-height:1.6;margin:0">You receive this because you subscribed to StudentOS Africa. ${footer}</p>
  </div></body></html>`;
}

/** Listing titles and moderation reasons come from users/scrapers; never inject raw HTML. */
export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function confirmSubscriptionEmail(confirmUrl: string, unsubscribeUrl: string) {
  return {
    subject: "Confirm your StudentOS Africa subscription",
    html: shell(
      "One quick tap to confirm",
      `<p style="font-size:15px;line-height:1.7">Thanks for signing up. Confirm your email to start receiving the weekly digest of scholarships, internships, fellowships and student benefits.</p>
       <p style="margin:24px 0"><a href="${confirmUrl}" style="display:inline-block;background:#0E5C2F;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">Confirm subscription</a></p>
       <p style="font-size:13px;color:#6B7D6E">If the button does not work, copy this link: ${confirmUrl}</p>
       <p style="font-size:13px;color:#6B7D6E">If you did not request this, ignore the email and you will not be subscribed.</p>`,
      `<a href="${unsubscribeUrl}" style="color:#6B7D6E">Unsubscribe</a>`
    ),
    text: `Confirm your StudentOS Africa subscription: ${confirmUrl}\n\nUnsubscribe: ${unsubscribeUrl}`,
  };
}

export function confirmedEmail(homeUrl: string) {
  return {
    subject: "You're confirmed — welcome to StudentOS Africa",
    html: shell(
      "You're on the list",
      `<p style="font-size:15px;line-height:1.7">Your subscription is confirmed. Every week we send a short list of opportunities worth your time, plus one practical guide.</p>
       <p style="margin:24px 0"><a href="${homeUrl}" style="display:inline-block;background:#0E5C2F;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">Explore opportunities</a></p>`
    ),
    text: `Your subscription is confirmed. Visit ${homeUrl}.`,
  };
}

export function deadlineReminderEmail(name: string, items: Array<{ title: string; url: string; closesOn: string }>, unsubscribeUrl: string) {
  const rows = items
    .map(
      (item) => `<tr><td style="padding:12px 0;border-bottom:1px solid #eef0ea">
        <a href="${item.url}" style="color:#0E5C2F;font-weight:600;text-decoration:none">${escapeHtml(item.title)}</a>
        <div style="font-size:13px;color:#6B7D6E;margin-top:4px">Closes ${escapeHtml(item.closesOn)}</div>
      </td></tr>`
    )
    .join("");
  return {
    subject: `${items.length} saved ${items.length === 1 ? "opportunity closes" : "opportunities close"} soon`,
    html: shell(
      `Hi ${escapeHtml(name || "there")}, a deadline is close`,
      `<p style="font-size:15px;line-height:1.7">You saved these and the deadline is coming up:</p>
       <table style="width:100%;border-collapse:collapse">${rows}</table>
       <p style="font-size:13px;color:#6B7D6E;margin-top:20px">Open your tracker to update your progress.</p>`,
      `<a href="${unsubscribeUrl}" style="color:#6B7D6E">Unsubscribe from reminders</a>`
    ),
    text: items.map((item) => `${item.title} — closes ${item.closesOn}: ${item.url}`).join("\n"),
  };
}

export function moderationEmail(benefitTitle: string, approved: boolean, reason: string) {
  return {
    subject: approved ? `Your report about ${benefitTitle} is live` : `Your report about ${benefitTitle}`,
    html: shell(
      approved ? "Thank you — your report is published" : "We could not publish your report",
      `<p style="font-size:15px;line-height:1.7">${approved ? "Your experience is now helping other students decide whether this benefit works for them." : "Thanks for taking the time to share your experience."}</p>
       ${reason ? `<p style="font-size:14px;line-height:1.7;background:#f6f7f2;border-radius:10px;padding:14px">${escapeHtml(reason)}</p>` : ""}`
    ),
    text: `${approved ? "Published" : "Not published"}: ${reason}`,
  };
}

export function digestEmail(input: { closing: Array<{ title: string; url: string; closesOn: string }>; fresh: Array<{ title: string; url: string }>; guide?: { title: string; url: string }; unsubscribeUrl: string }) {
  const closing = input.closing.map((item) => `<li style="margin-bottom:10px"><a href="${item.url}" style="color:#0E5C2F">${escapeHtml(item.title)}</a> — closes ${escapeHtml(item.closesOn)}</li>`).join("");
  const fresh = input.fresh.map((item) => `<li style="margin-bottom:10px"><a href="${item.url}" style="color:#0E5C2F">${escapeHtml(item.title)}</a></li>`).join("");
  return {
    subject: "This week on StudentOS Africa",
    html: shell(
      "The weekly drop",
      `<h2 style="font-size:16px">Closing soon</h2><ul style="padding-left:18px;font-size:14px;line-height:1.6">${closing || "<li>Nothing closing this week.</li>"}</ul>
       <h2 style="font-size:16px;margin-top:22px">New this week</h2><ul style="padding-left:18px;font-size:14px;line-height:1.6">${fresh || "<li>New listings appear here.</li>"}</ul>
       ${input.guide ? `<h2 style="font-size:16px;margin-top:22px">Guide of the week</h2><p style="font-size:14px"><a href="${input.guide.url}" style="color:#0E5C2F">${escapeHtml(input.guide.title)}</a></p>` : ""}`,
      `<a href="${input.unsubscribeUrl}" style="color:#6B7D6E">Unsubscribe</a>`
    ),
    text: "This week on StudentOS Africa",
  };
}
