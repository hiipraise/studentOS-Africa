# Privacy notes

This is an engineering inventory, not legal advice. The owner must have the
public privacy policy reviewed by counsel before launch.

## Data we store

| Data | Where | Why | Retention |
|---|---|---|---|
| Google account email, name, image | `users`, Auth.js session | Sign-in, saved items, reminders | Until account deletion |
| Saved opportunity slugs | `saved_items` | Personal tracker | Until removed or account deleted |
| Newsletter email, status, consent time, source, preferences | `newsletter` | Double opt-in and delivery | Until unsubscribe, then status is kept to honour it |
| Reminder send marker (email, date) | `reminders_sent` | One consolidated reminder per day | Operational; safe to prune after 12 months |
| Report school, country, outcome, optional email, comment | `reports` | Community evidence and moderation | Until deleted by an editor |
| Comment hash | `reports.commentHash` | Duplicate detection | Same as the report |
| Suggestion text and optional contact | `suggestions` | Review queue | Until resolved, then pruned |
| Finder profile and results | `finder_cache`, `finder_shares` | Short-lived cache and share links | TTL indexes; share links expire |
| Analytics events | `events` | Product metrics | 180 days (TTL) |
| Hashed IP for rate limiting | `rate_limits` | Abuse prevention | Until the window resets (TTL) |
| Job outcomes | `ingest_runs` | Operations | Keep recent runs; no personal data |

We do not store passwords. Authentication is Google OAuth only.

## Cookies and local storage

- Auth.js session cookie: required for sign-in.
- Locale cookie: remembers English or French.
- `localStorage` saved list: anonymous saves, merged into the account on sign-in.
- No advertising or cross-site tracking cookies are set by the application.

## Processors

| Processor | Data | Notes |
|---|---|---|
| Google | OAuth identity | Sign-in only |
| Vercel | Request logs, hosting | Platform logs follow Vercel retention |
| MongoDB Atlas | All application data | Region chosen by the owner |
| Groq | Finder profile and compact candidate list | No account email is sent; prompts are bounded |
| Cloudinary | Admin-uploaded images | Public assets |
| Sendhiiv or Resend | Email address, message content | Whichever key is configured |
| Cloudflare Turnstile | Browser challenge signals | Optional; only when keys are set |
| Telegram | Listing titles and links | Owner channel only; no student data |

Update this table whenever a processor is added.

## User choices

- Newsletter: double opt-in, one-click unsubscribe, and a preferences page.
- Reminders: opt out from the account page; the opt-out flag is stored on the
  user record.
- Reports: email is optional. Editors can remove a report on request.
- Accounts: deletion is handled manually today (see the runbook). There is no
  self-service delete button yet.

## Data minimisation rules

- Never log full request bodies, emails or report comments.
- Analytics store page type, not full URLs, and no user identifiers.
- Rate limiting stores a hash of the IP, not the address.
- Reports strip links before storage and reject duplicates.
- Unknown listing facts stay `null`/unverified; we do not invent eligibility,
  deadlines or funding claims.

## Gaps to close before launch

1. Publish a real privacy policy and terms page reviewed by counsel.
2. Add a self-service account deletion flow with a confirmation email.
3. Define a written retention schedule for reports and suggestions.
4. Confirm the Atlas region and Vercel log retention with the owner.
5. Sign data-processing agreements where the provider requires one.
6. Document a breach-response owner and notification timeline.
