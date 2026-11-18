# Feature 04: Resident Directory and Emergency Contacts

Status: proposed design for Ilham to review; implementation is not authorized by this planning request.

## Intent

Teach Ilham to implement his assigned Feature 04 in BariLog, using a sequence of small lessons that explain the database, authorization, API, and React UI. The requested deliverable is a plan only. Do not write product code, install dependencies, or execute the plan.

## Confirmed decisions

- Managers enter and update residents' emergency contact records.
- Residents control separate phone, email, and emergency-contact visibility preferences.
- Hiding emergency contacts applies to other residents. Managers and security retain emergency access.
- Security personnel are the existing `SECURITY` role. They must be assigned to the buildings where they work and can access only those buildings' contacts and information.
- Directory and emergency access must be scoped to a building, with authorization enforced on the server.

## Existing implementation

- React 19, Vite 6, JavaScript/JSX, React Router 7, shared CSS tokens; Spring Boot 4.0.4, Java 17, JPA, SQLite, Flyway, Jakarta validation, MapStruct, JUnit/Mockito and Spring Security test support.
- `Resident extends User` already stores `bloodGroup`, `emergencyContactName`, and `emergencyContactPhone`. Reuse those fields; do not introduce duplicate storage.
- `User` stores phone and email. `Building.manager` identifies the manager. `Apartment.currentResident` links an occupant; `Apartment.owner` alone does not prove residency.
- No security-to-building relationship exists. Current building creation permits a missing manager, so unassigned buildings must fail closed for manager access until an administrator assigns their manager.
- Apartment list/detail responses currently expose raw owner and occupant contacts. `/api/users` exposes user contacts to all manager accounts. Both are alternate paths that need attention for a meaningful privacy guarantee.
- Public registration currently accepts all roles, including `ADMIN`. This is an existing authorization bypass; production privacy cannot be claimed while users can self-register privileged roles.
- Existing migrations are V1–V3; the client has a build script but no automated UI test runner.

## Approaches

1. **Building-scoped feature, selected:** reuse manager/occupant relationships; add a small security assignment table and server access checks. More work than a global directory, but matches the user's explicit building boundary.
2. **Global prototype, rejected:** allow all managers/security to access all contacts. Simpler but contradicts that boundary.

## Proposed implementation defaults

These are the planner's proposals, not decisions attributed to Ilham.

- First version covers registered users of role `RESIDENT` who are active current occupants of active, non-vacant apartments. Family members, unregistered owners, and tenancy management remain outside Feature 04.
- A resident linked to multiple apartments appears once per building, with all unit labels. Directory membership is computed from current occupancy rather than copied into another membership table.
- All three sharing flags default to false for existing and new residents. Preferences apply across all buildings where the resident currently lives.
- Phone/email flags govern peer visibility. The resident themself and authorized building management/security can view those fields for operational contact purposes.
- The emergency-sharing flag covers the whole emergency profile: blood group, next-of-kin name/relationship/phone, and physician name/phone. The UI must explicitly explain that managers/security retain access.
- Residents may read their own emergency profile but cannot edit it. They can change only their own sharing preferences through this feature; account phone/email editing is outside this feature.
- A single next-of-kin and a single physician are optional. Blank fields are stored as null. Blood group allows `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`, or null. Do not infer a blood group.
- Phone fields are strings, max 30 characters, and permit normal international formatting. Name fields are max 150 characters; next-of-kin relationship is max 50 characters. An entered next-of-kin or physician requires both their name and phone; clear both to remove that contact.
- Managers can assign/revoke existing active security accounts only for buildings they manage. Admins can do this for any building. Security can work at multiple buildings; duplicate assignments are idempotent. Revocation takes effect on the next API request.
- Admins can assign a manager to an unassigned building. Only active `MANAGER` accounts qualify; managers cannot claim arbitrary buildings.
- Admins have platform-wide directory access and manager-equivalent emergency edit capabilities. `STAFF` has no directory or emergency access.

## Data changes

Add a new migration using the next unused Flyway version (V4 if still available at implementation time). Never edit V1–V3.

- Extend `resident`: `share_phone`, `share_email`, `share_emergency_contacts` as non-null booleans default false; `emergency_contact_relationship`; `physician_name`; `physician_phone`.
- Add `building_security_assignments(building_id, security_user_id)` with foreign keys and a composite unique key. Delete assignments when either associated record is deleted; validate the user's active `SECURITY` role in the service.
- Reuse existing emergency-contact and blood-group columns without copying data.

## Access rules

| Viewer | Directory scope | Other residents' contacts | Emergency writes | Preference writes |
| --- | --- | --- | --- | --- |
| Resident | Buildings where currently resident | Each field obeys its sharing flag | None | Own only |
| Manager | Buildings whose manager is the viewer | Full operational/emergency contacts | In own buildings | None |
| Security | Assigned buildings | Full operational/emergency contacts | None | None |
| Admin | All buildings | Full operational/emergency contacts | All buildings | None |
| Staff / anonymous | None | None | None | None |

Identify the actor from the existing authenticated session, never from a request-supplied actor ID. Authenticate first, authorize the building second, then resolve the target resident within that building. Return 401 unauthenticated, 403 for inaccessible buildings or forbidden actions, 404 for a target absent from an authorized building, and 400 for invalid input. Inactive users get no feature access even if they still have a token.

## API and UI shape

- `GET /api/directory/buildings`: only buildings the viewer may access; use it to populate the building selector while on the directory page.
- `GET /api/buildings/{buildingId}/directory`: safe resident summaries; search names/unit labels in the returned authorized list. Do not bulk include emergency profiles.
- `GET /api/buildings/{buildingId}/directory/{residentId}/emergency`: a dedicated, freshly authorized emergency read; peers receive redacted profile fields when sharing is off. Managers/security receive full details.
- `PUT /api/buildings/{buildingId}/directory/{residentId}/emergency`: full replacement of the optional emergency profile, manager/admin only. This request cannot change preferences or resident phone/email.
- `GET` and `PUT /api/directory/me/preferences`: read/replace all three sharing booleans, resident only. Use required booleans so omitted values fail validation rather than silently resetting consent.
- `GET`, `PUT /{securityUserId}`, and `DELETE /{securityUserId}` under `/api/buildings/{buildingId}/security-assignments`: scoped list/assign/revoke for manager/admin. Assignment UI accepts an existing security account ID; do not expose all users just to populate a picker.
- `PUT /api/buildings/{buildingId}/manager`: admin-only manager association using an existing active manager ID, to make existing unassigned buildings usable without direct SQL edits.
- Add `/directory` navigation and a page with building selector, name/unit search, resident summaries, a manager edit form, a resident privacy form, and a manager/admin security-assignment panel. Managers/security open emergency details with one action. Phone numbers are `tel:` links; access does not send alerts or place calls automatically.
- Clear emergency details immediately when building, resident, login session, or visibility changes. Cancel/ignore stale responses and avoid persistent browser storage for directory/emergency data. Explain hidden versus unrecorded values and handle loading, empty, error, and denied states.
- Use existing `DESIGN.md` tokens and components. Exact layout is left to the plan author; mockups are unnecessary for the current access-rule review.

## Existing API privacy integration

Apply a shared field-visibility policy before every apartment response is returned, including mutation responses. Raw MapStruct contact mapping is not an authorization boundary. Self may see their own contacts. Authorized managers/security may see building contacts. Peers see linked residents' phone/email only when sharing permits it; contacts of owners without a linked consenting resident account are hidden from peers. Unrelated users get no contact fields.

For security, restrict the existing building list/detail, floors, occupancy statistics, apartments (including unfiltered/filter requests), and occupancy history to assigned buildings, rather than relying on the new page alone. For manager `/api/users` reads, return only safe IDs/names/roles needed for assignments; remove other users' raw phone/email from that response. Keep the admin response and self `/api/auth/me` complete. Verify the apartment assignment UI still works with redacted fields.

Required prerequisite for credible access control: public registration must create only `RESIDENT` accounts; retain privileged demo accounts already provisioned in a disposable development database. Broader account provisioning is outside scope and must be documented as a follow-up, rather than reintroducing public privileged registration. Do not expand this feature into a wholesale authorization rewrite of Documents or other roadmap modules.

## Teaching and verification requirements

The eventual plan must explain each layer's purpose and exact files/interfaces, with bite-sized checkbox steps and a learner exercise/checkpoint per task. Use backend tests for policy decisions and endpoint authorization; include an isolated SQLite migration check, not a production database reset. Include direct API checks for privacy bypasses and cross-building IDs, rather than testing only hidden UI controls.

Cover defaults, independent sharing flags, manager-only edits, self-only preferences, missing profiles, invalid input, stale UI responses, revoked security assignment, multiple-building residency, occupancy removal, unassigned buildings, existing apartment/user contact responses, and refusal of public privileged registration. Use `./mvnw test` from `Server/` and `npm run build` from `Client/`; the plan must label tests as future work, not tests run during planning. Do not add a client test framework solely for this feature; include a concrete manual browser matrix for UI behavior.

## Non-goals and failure conditions

No family/lease records, emergency SMS/push, SOS workflow, medical advice, file uploads, export, live transport, audit subsystem, or dependency upgrades. No contacts in localStorage, frontend-only privacy checks, automatic opt-in, treating nonresident ownership as residency, or security access based only on role without assignment. Existing role-provisioning and unrelated module access limitations must be stated honestly.
