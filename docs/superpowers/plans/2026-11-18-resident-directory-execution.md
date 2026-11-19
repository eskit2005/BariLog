# Feature 04 execution ledger

Implementation performed on the existing `sqlite` branch, explicitly requested by Ilham. Original planning-only instructions were superseded by his instruction to execute.

Ruling: reuse existing apartment queries and small service mapping methods instead of introducing additional JPQL repositories and a dedicated directory mapper — keeps the feature within existing architecture; cost is additional queries for larger buildings. Current scope is 50–100 apartments.
Ruling: colocate the small privacy/emergency/assignment UI components in the directory module — avoids extra files for tightly coupled forms; split if those forms grow independently.
Ruling: scope manager registry writes to their building and default new manager-created buildings to that manager — prevents registry operations from undermining directory membership; existing cross-building manager writes now return 403.
Ruling: keep changes reviewable in the current working tree; no branch switch, push or deployment.

Tasks 1–3: schema, resident hydration, assignment persistence, building access, security assignments and admin manager association implemented.
Task 4: directory/preferences/emergency DTOs and endpoints implemented; global no-store headers.
Task 5: apartment contact redaction (including mutation responses), manager user-list redaction and assigned-security registry reads implemented.
Task 6: public registration restricted to residents; existing privileged accounts retained.
Task 7: client API exports, parsed retry responses, cancellation/session protection and shared refresh implemented.
Tasks 8–9: directory route/navigation, search, privacy controls, emergency read/edit, security assignments and admin manager association UI implemented.

Verification: backend suite, isolated SQLite migration checks, controller/security integration flows, Node transport suite, client build, and mocked-API headless Chrome smoke checks. See `docs/verification/feature-04-resident-directory.md` for exact commands, scope and remaining manual device checks.

Final review: fresh agent reviewed the policies, alternate response paths, registration, migration and UI lifecycle. One important issue found: concurrent token refresh cancelled a valid parallel request. Added failing regression test, shared refresh promise and separate session revision; test now passes. No other important findings confirmed.

No claim of production readiness or full live browser/backend end-to-end coverage. Original plan checkbox steps remain as the teaching sequence; this ledger records the implementation actually performed.

Final evidence: 17 backend tests passed (0 failures/errors/skips); 5 Node transport tests passed; Vite production build passed; headless Chrome smoke passed after resetting the disposable profile's origin storage. Browser smoke script is saved at `Client/scripts/verify-directory-browser.mjs`. No live browser-to-backend walkthrough or actual phone dialing was claimed.
