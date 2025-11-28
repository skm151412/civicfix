# Rollback Plan — CivicFix Full Audit Release

1. **Before deploying the new build**
   - Ensure working tree is clean and tests pass (`npm run build`, `npx playwright test`).
   - Tag the current production-ready commit:
     ```bash
     git tag -a pre-fix-YYYYMMDD -m "Pre full-audit release"
     git push origin pre-fix-YYYYMMDD
     ```
   - Document the tag and deployed hosting version in the change log.

2. **Deploy new release**
   - `npm run build`
   - `firebase deploy --only hosting`
   - Run smoke tests against the staging/production URL and monitor `utils/errorReporter` output for regressions.

3. **If issues are detected after deploy**
   - Roll back hosting to the pre-release tag by checking it out locally:
     ```bash
     git checkout pre-fix-YYYYMMDD
     npm run build
     firebase deploy --only hosting
     ```
   - Alternatively, use Firebase Hosting release history (`firebase hosting:channel:list` / `firebase hosting:rollback`) if channels are configured.
   - Communicate to stakeholders that the hotfix deploy has been reverted and capture root cause in release-notes.

4. **Post-rollback**
   - Investigate errors captured by Sentry and `sessionStorage['civicfix:lastErrors']`.
   - Open a follow-up issue referencing the failed deployment, attach logs, and block future deploys until the regression is addressed.
