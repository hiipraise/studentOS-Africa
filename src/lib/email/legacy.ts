/** Legacy welcome HTML retained for callers that still import it. */
export function welcomeEmailHtml(): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
      <h1 style="color: #0E5C2F;">Welcome to StudentOS Africa 🎓</h1>
      <p>You're now subscribed to our weekly newsletter — scholarships, internships,
      fellowships, and student benefits, curated for students across Africa.</p>
      <p>Look out for your first drop this week.</p>
      <p style="color: #6B7D6E; font-size: 13px; margin-top: 32px;">StudentOS Africa</p>
    </div>
  `.trim();
}
