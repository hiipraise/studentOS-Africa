import "server-only";

export type { EmailMessage, EmailResult } from "@/lib/email/send";
export { sendEmail, emailProvider } from "@/lib/email/send";
