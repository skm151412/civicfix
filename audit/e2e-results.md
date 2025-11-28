# Playwright E2E Results — 2025-11-26

Command: `npx playwright test`
Environment: local dev server via `npm run dev -- --host 127.0.0.1 --port 5173`

```
Running 4 tests using 4 workers

  4 skipped
```

Reason for skips:
- `E2E_CITIZEN_EMAIL` / `E2E_CITIZEN_PASSWORD` credentials not provided.
- `E2E_UNVERIFIED_EMAIL` / `E2E_UNVERIFIED_PASSWORD` credentials not provided.

To run the suite end-to-end:
1. Start Firebase emulators or share staging credentials.
2. Export the env vars above (plus optional `E2E_PHONE_NUMBER` & `E2E_PHONE_OTP`).
3. Execute `npx playwright test` again; the new tests cover login + phone verification, report creation with photo + GPS, sidebar navigation, and issue upvote/chat flows.
