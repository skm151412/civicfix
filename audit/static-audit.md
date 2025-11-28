# Static Audit — 2025-11-26

## Step 14 follow-up
- `npm run build` (2025-11-26) ✅ — Vite 6.4.1 build succeeded; bundle still triggers >500 kB warning (`dist/assets/index-DLjzaLDA.js`). Consider manual chunking for dashboard/map modules.
- `npx playwright test` ✅ command executed; all suites skipped because `E2E_*` credentials were not configured. Set `E2E_CITIZEN_EMAIL`, `E2E_CITIZEN_PASSWORD`, and `E2E_UNVERIFIED_EMAIL` (ideally pointing at Firebase emulators) to run smoke flows end-to-end.
- Firebase hosting deploy ⏳ — blocked until staging credentials are provided. Run `firebase login --reauth && firebase deploy --only hosting` once access is granted.


## Setup & Environment
- `git checkout -b fix/full-audit-20251126` **blocked**: workspace appears to be missing the `.git` directory, so branch creation failed. Need guidance on initializing/restoring git before committing changes.
- `npm ci` succeeded after killing stray Node processes that held locks on `node_modules`.
- `npm run dev` launched Vite successfully (localhost:3000) and was terminated manually after validation.

## Automated Checks
- `npm run build` ✅ — Build succeeded; Rollup warned about a >500 kB JS chunk (`dist/assets/index-CRRCbswx.js`). Consider code-splitting dashboards/maps.
- `npx tsc --noEmit` ✅ — Completed with no reported TypeScript errors.
- `npm run lint` ❌ — Script not defined in `package.json`. ESLint config/deps are absent; need to add tooling before linting can run.

## Pattern Search Findings
### "Coming soon"
- 1 occurrence at `routes/AppRoutes.tsx:23` displaying a "Coming soon" banner. **Priority: High** (placeholder must be replaced with real UX per requirements).

### "TODO" / "todo"
- 0 matches. No explicit TODO markers found.

### "disabled"
- 25 matches across 10 files. Highlights:
  - `services/firebase.ts` & `context/AuthContext.tsx` include "DISABLED FOR OTP FIX" comments—suggests push messaging & reCAPTCHA flows are still turned off.
  - Multiple buttons (`pages/ReportIssue.tsx`, `pages/StaffDashboard.tsx`, `components/Button.tsx`, `components/PhoneVerificationModal.tsx`, etc.) gate functionality via `disabled` props. Need to confirm each path becomes enabled with the right preconditions (auth, uploads, status updates).

### "onClick"
- 43 matches across UI components/pages. Every occurrence currently references a handler, but many routes/actions (e.g., `LandingPage` CTAs, sidebar logout, dashboard action buttons) need manual verification to ensure navigation/auth flows actually fire now that placeholders must be removed.

## Immediate Priority Issues
1. Git workflow blocked (no `.git` folder) — cannot follow branching requirement until repository metadata restored.
2. ESLint tooling missing — must add configs/deps to comply with "npm run lint" mandate.
3. Remaining "Coming soon" UI (AppRoutes hero) violates requirement to remove placeholders.
4. OTP-related services intentionally disabled — conflicts with requirement for working phone auth + push notifications; requires investigation before re-enabling safely.
