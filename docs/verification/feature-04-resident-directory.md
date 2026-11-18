# Feature 04 verification and usage

Open `/directory` after signing in. The building selector shows only buildings available to that account. Registered active residents appear once per building with their occupied unit labels.

Residents can save three independent sharing switches. All default to off. These switches control peer access; management and assigned security retain operational/emergency access. Emergency profiles contain optional blood group, next-of-kin, and physician information. Managers/admins edit profiles; residents/security read them.

Managers assign an existing security account by its numeric user ID in **Building security**. Only the building's manager or an admin can assign/revoke. An admin can associate a manager using **Building manager**. Removing an assignment denies the next request even with the same JWT. These operations do not create accounts.

Public registration now creates resident accounts only. Existing privileged accounts can still sign in. A clean installation needs trusted administrator/manager/security provisioning outside this feature; no public privileged-account creation route is provided. Buildings created by managers are associated with that manager by default. Existing unassigned buildings require an admin association.

## Automated checks

Run from `Server/`: `./mvnw test`.

- Existing authentication/building/apartment tests.
- `DirectoryPrivacyTest`: independent sharing flags and unrelated-building denial.
- `ResidentDirectoryPersistenceTest`: V3-to-V4 data preservation, false defaults, unique assignment keys, cascading deletion, repeat migration and foreign-key integrity.
- `ResidentDirectoryApiTest`: actual security-filter/controller/JPA/SQLite flow with temporary database and generated test JWTs. Tests consent, hidden responses, manager edit permissions, assignment/revocation, guard building scope, existing API redaction, invalid preferences, roles, multiple units/buildings, move-out, inactive users, profile validation and admin association.

Run from `Client/`: `node --test src/services/api.test.js` and `npm run build`.

Transport checks cover parsed responses after refresh, validation errors, 204 handling, logout during refresh, and concurrent refresh. Browser smoke checks in headless Chrome exercised `/directory`, three default-off switches, independent save payload, emergency call links, manager edit/assignment controls, and rendering at a narrow viewport. Browser API responses were mocked; backend behavior is covered independently by integration tests. This is not a fully connected browser/backend end-to-end test.

## Manual acceptance checks

Use fictional records and separate resident/manager/security sessions. Never commit real tokens or contacts.

- [ ] Search by mixed-case resident name and unit number.
- [ ] Share phone only; another resident sees phone but no email or emergency details.
- [ ] Share/unshare emergency details; other residents' next fetch follows the setting.
- [ ] Manager/security retain access regardless of peer-sharing switches.
- [ ] Guard assigned to A cannot request B directory, building, floors, stats, apartments or history, even by editing the URL.
- [ ] Revoke guard A assignment; next request fails. A separate B assignment remains usable.
- [ ] Manager edits/clears a profile; resident can read own updated record but cannot edit it.
- [ ] Delayed responses during building/resident switches do not show the previous selection's contacts.
- [ ] Logout while requests are pending; the next login sees no previous session's contacts.
- [ ] Network/validation errors leave entered form values intact and display feedback.
- [ ] Check keyboard focus and layout on the target security device.

Contact responses use `Cache-Control: no-store`. Directory/emergency records are never written to browser storage. There is no live push, SMS, automatic dialing, or retroactive removal of data already viewed by another user. Reopening details or focusing the window rechecks current data.

## Recorded implementation checks

- Backend: 17 tests, zero failures/errors/skips (`./mvnw test`).
- Client transport: five tests passed (`node --test src/services/api.test.js`).
- Client production build: passed (`npm run build`).
- Headless Chrome: route load, default-off settings, independent preference payload, emergency `tel:` link, manager edit controls, and narrow viewport rendering passed. This smoke uses mocked API responses; backend authorization/persistence are tested separately through MockMvc and SQLite.
- Fresh review identified the concurrent-refresh race; a failing test reproduced it and the fix passed all five client transport tests.

To repeat the browser smoke: run Vite at `http://127.0.0.1:5175`, start a disposable headless Chrome profile with remote debugging port `9335`, then run `node Client/scripts/verify-directory-browser.mjs` from the repository root. The script uses built-in Node WebSocket/fetch and a dedicated Chrome test tab/profile; it clears that origin's storage. Do not point it at a personal browser profile. Exact commands used:

```bash
# From Client/:
npm run dev -- --host 127.0.0.1 --port 5175
# In a separate terminal:
google-chrome --headless --no-sandbox --disable-gpu --remote-debugging-port=9335 --user-data-dir=/tmp/barilog-chrome-review about:blank
# From the repository root:
node Client/scripts/verify-directory-browser.mjs
```

The remaining manual acceptance matrix is in the implementation plan. Actual phone dialing, physical mobile-device usability, concurrent multi-browser live interaction, and a live browser-to-server walkthrough were not verified by this smoke. There is no live push revocation of data already displayed; the next API access/focus refresh enforces changed permissions.
