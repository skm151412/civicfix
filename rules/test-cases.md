# Firestore Rules Test Cases

These cases outline the minimum behaviors we expect from `firestore.rules`. Run them with the Firestore emulator (`firebase emulators:start --only firestore`) or in a staging project with `firebase deploy --only firestore:rules` before promoting to production.

## Key expectations
- Only authenticated users can create `issues` documents for themselves.
- Only the profile owner may create, update, or delete their document in `/users/{uid}`.
- Only staff/admin accounts can mutate issue workflow fields, and only admins can set or retain a `status` of `Resolved`.
- Admins retain global delete rights on issues for moderation.

## Emulator/staging test matrix
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1 | Anonymous issue create blocked | Use REST/SDK without `request.auth` to `add` to `/issues` | `PERMISSION_DENIED` |
| 2 | Authenticated issue create succeeds | Auth user writes `/issues/{id}` with `userId == auth.uid` | Write allowed |
| 3 | Authenticated issue create with mismatched userId fails | Auth A writes `userId` of B | `PERMISSION_DENIED` |
| 4 | User updates own profile | Auth user updates `/users/{uid}` where `uid == auth.uid` | Write allowed |
| 5 | Admin tries to update another user profile | Admin updates `/users/{otherUid}` | `PERMISSION_DENIED` (owners only) |
| 6 | Reporter edits own issue metadata without changing status | Owner updates description while keeping original status | Write allowed |
| 7 | Reporter tries to change status | Owner sets status `In Progress` | `PERMISSION_DENIED` |
| 8 | Staff sets status `In Progress` | Staff (or admin) updates issue status to non-`Resolved` | Write allowed |
| 9 | Staff attempts to set status `Resolved` | Staff update changes status to `Resolved` | `PERMISSION_DENIED` |
| 10 | Admin sets status `Resolved` | Admin updates status to `Resolved` | Write allowed |
| 11 | Staff edits a resolved issue | Issue already `Resolved`; staff edits any field | `PERMISSION_DENIED` |
| 12 | Admin deletes issue | Admin removes `/issues/{id}` | Write allowed |
| 13 | Non-admin delete issue | Reporter or staff tries to delete issue | `PERMISSION_DENIED` |

## How to run
1. Start emulator: `firebase emulators:start --only firestore`.
2. From another terminal, run targeted tests (REST calls, integration tests, or Playwright flows) using emulator host/port.
3. For staging validation, deploy rules with `firebase deploy --only firestore:rules` and repeat scenarios using staging credentials.
4. Capture results (allowed/denied) and attach logs/screenshots to the deployment checklist before launching to production.
