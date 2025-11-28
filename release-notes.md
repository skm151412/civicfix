# CivicFix Full Audit Release Notes — 2025-11-26

## Files changed / added
- `components/PhoneVerificationModal.tsx` — added E2E bypass hook plus analytics tracking on successful verification.
- `pages/ReportIssue.tsx` — introduced stable `data-testid` hooks for automation and kept offline/duplicate UX intact.
- `pages/TrackIssues.tsx` — added `data-testid` markers so Playwright can target specific issue rows.
- `package.json`, `package-lock.json` — added `@playwright/test`, new `test:e2e` script, and refreshed dependency tree.
- `playwright.config.ts` — spins up Vite automatically, injects `VITE_E2E_BYPASS_PHONE`, and configures Chromium runs.
- `tests/e2e/**` — new smoke specs for auth + phone verification, report creation (GPS + image), sidebar navigation, and issue engagement (upvote/chat) with reusable helpers.
- `audit/static-audit.md`, `audit/console-errors.txt`, `audit/e2e-results.md` — documented build/test status, console findings, and current Playwright output.
- `services/telemetry.ts`, `utils/errorReporter.ts`, `hooks/useGlobalErrorToasts.ts`, `utils/toastBus.ts`, `index.tsx`, `App.tsx` — (from Step 12) wired Sentry + Firebase Analytics and centralized friendly error toasts.

## Features implemented / fixed
1. **Production telemetry** — Sentry captures runtime errors/unhandled rejections; Firebase Analytics logs `issue_created`, `issue_resolved`, and `user_verified` events.
2. **Global friendly toasts** — unhandled promise rejections surface to users and error reporter stores the last 50 events for triage.
3. **Hardened Firestore rules** — only authenticated reporters can create issues, reporters can edit non-status fields, staff may move work-in-progress states, and only admins can set/modify `Resolved`. Profile updates are now owner-only.
4. **Playwright smoke coverage** — reusable helpers plus four suites exercise login + phone verification modal, report creation with GPS + attachments, sidebar navigation, and issue upvote/chat flows.
5. **Automation-ready UI hooks** — report form and citizen issue list expose `data-testid` attributes so CI can target stable selectors without brittle DOM queries.

## Known issues / follow-ups
- `npx playwright test` currently skips because no `E2E_*` credentials were provided. Configure accounts (preferably via Firebase emulators) to run the full suite.
- Firebase hosting deploy is still pending; staging URL cannot be confirmed until credentials are shared (`firebase login` required).
- Bundled JS (`dist/assets/index-DLjzaLDA.js`) remains >500 kB after adding telemetry. Consider dynamic imports for dashboards/maps during performance hardening.
- Push notifications remain disabled (per earlier OTP fix notes); revisit once OTP flow is stable.

## How to test (reviewer checklist)
1. `npm install`
2. `npm run build`
3. (Optional but recommended) `firebase emulators:start --only auth,firestore,storage`
4. Export env vars before running smoke tests:
   - `E2E_CITIZEN_EMAIL`, `E2E_CITIZEN_PASSWORD`
   - `E2E_UNVERIFIED_EMAIL`, `E2E_UNVERIFIED_PASSWORD`
   - `E2E_PHONE_NUMBER` and `E2E_PHONE_OTP` (use emulator test numbers; OTP bypass is enabled via `VITE_E2E_BYPASS_PHONE=true` while tests run)
5. `npx playwright test`
6. Manual QA on staging (once deployed): verify no console errors, phone verification modal closes cleanly, issue creation uploads images, nav links, and issue chats/upvotes reflect in Firestore.

## New Firestore indexes
- None required for the changes in Steps 11–13.

## Firestore & Storage rules changes
- `firestore.rules` (latest):
  - Only authenticated users can create `/issues` docs for their own `userId`.
  - Status transitions: reporters can edit metadata without changing status, staff can update non-resolved statuses, and only admins can set or modify `status == 'Resolved'` or delete issues.
  - `/users/{uid}` documents are owner-writable/delete-only to prevent admins from editing citizen profiles directly.
- `storage.rules`: unchanged in this step; existing constraints still apply (issue images stored under user-specific prefixes).

## Deployment / staging status
- `npm run build` ✅ (2025-11-26)
- `firebase deploy --only hosting` ⏳ pending staging credentials; run once Firebase CLI access is granted.
- Staging smoke tests + console sweeps will need to be rerun immediately after deployment.
