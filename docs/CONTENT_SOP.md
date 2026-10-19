# StudentOS Africa content verification SOP

## Verification rules

1. Start from the programme owner’s official page. Aggregator pages may help discover a listing but are not proof of dates, funding, eligibility, or a live application.
2. Record the exact official source URL and the date checked. Read the current cycle page, eligibility rules, FAQ, and application portal. Never infer a deadline, award amount, country list, degree level, or recurrence from an old cycle.
3. Normalize each country to ISO 3166-1 alpha-2. Use `AFRICA`, `SSA`, `NORTH_AFRICA`, or `GLOBAL` only when the source explicitly describes that scope. Keep a short note when the source has exceptions.
4. Store a deadline as an ISO 8601 instant. Include the programme timezone and any displayed cutoff note (for example, “11:59pm GMT”) so editors and students can understand the source wording.
5. Set source type, verifier, verified date, confidence, link-check result, and review flag. Low confidence or incomplete mapping stays unpublished or marked for review.

## Required before publishing

- Title, category, concise original summary, official source URL, and slug.
- Eligible countries or explicit regions, eligible education levels, and fields if stated.
- Status and current cycle dates; unknown remains `unknown`.
- Funding type; unknown remains `unknown` (never estimate amount/currency).
- Requirements and application steps copied as short factual points, not aggregator prose.
- Provenance and verification fields, plus deadline timezone/note where relevant.

## Review checklist

- [ ] Official programme page is accessible and matches the listing.
- [ ] Cycle, opening and closing instants have been checked for the current cycle.
- [ ] Country/region, level and field restrictions match the official text.
- [ ] Funding description and application URL are current.
- [ ] No unsupported claims, stale dates, or copied long passages.
- [ ] Source and verification metadata are present; confidence reflects evidence.
- [ ] Closed recurring items describe the next expected window only when the source supports it.

## Weekly editorial rhythm

- Monday: review student reports and links flagged as outdated; resolve the needs-attention queue.
- Tuesday: discover listings from official university, government, foundation, and programme pages; import them as drafts.
- Wednesday: verify drafts against official sources; fill structured fields and request a second review for high-impact awards.
- Thursday: publish approved records; check all closing dates in the next 30 days.
- Friday: recheck the oldest 20 published records and update verification/link-check metadata.
- Keep an audit trail of source URL, reviewer, and checked date. When an official page changes, mark `needsReview` until a human verifies the new details.

## Coverage planning targets (goals, not current counts)

Review coverage quarterly across all seven categories: Scholarship, Internship, Fellowship, Competition, Hackathon, Grant, and Program. Internship, Hackathon, and Program currently need discovery and verified coverage. Suggested planning target: at least three active or recurring verified records per category, then assess relevance and maintenance cost before expanding.

Check country coverage across Nigeria, Kenya, Ghana, South Africa, Egypt, Ethiopia, Uganda, Tanzania, Cameroon, and Senegal. These are review goals, not a claim that equal listings exist in each market. Prefer pan-African opportunities plus country-specific records sourced from official national agencies and universities.

## CSV import

Fill `docs/opportunity-import-template.csv`. Use ISO codes separated by `|`, one category from the seven supported categories, ISO 8601 deadline instants, and a direct official URL. Run `npm run import:opportunities -- --file=docs/opportunity-import-template.csv` to validate a dry run. Run with `--apply` only after review; every imported record is created as an unpublished draft. Do not use invented placeholder listings.
