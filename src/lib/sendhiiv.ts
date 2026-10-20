/**
 * Compatibility shim. Email now goes through the provider adapter in
 * `lib/email/` so Sendhiiv can be swapped for Resend without touching routes.
 */
export {
  sendTransactionalEmail,
  sendConfirmationEmail,
  sendConfirmedEmail,
  addToSendhiivAudience,
} from "@/lib/email";
export { welcomeEmailHtml } from "@/lib/email/legacy";
