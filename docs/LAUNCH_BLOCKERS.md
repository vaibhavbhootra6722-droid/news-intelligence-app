# Commercial launch blockers
1. **Content rights** for Google News-sourced headlines in a paid product (legal review).
2. **Market data licence** (current Yahoo source is unofficial).
3. **Backend** (auth, DB, entitlements) — not built; GitHub Pages is static. No paid access can be enforced client-side.
4. **Payments**: provider onboarding (Razorpay), webhook verification, refunds, GST invoices — none implemented; no real money is handled.
5. **AI analyst** needs a server-held key + retrieval + quotas.
6. **Legal pages**: privacy policy, terms, refund/cancellation, copyright complaint process — drafts only; need counsel (DPDP, consumer law).
7. **Per-story photos**: publisher licensing decision.
8. **Real-device, Safari/Firefox/Edge and field-performance testing.**
9. **Admin dashboard, push notifications, per-user sync**: need backend.
