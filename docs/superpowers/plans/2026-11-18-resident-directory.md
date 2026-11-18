# Feature 04: Resident Directory and Emergency Contacts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Teach Ilham to build a building-scoped resident directory with resident-controlled sharing, manager-maintained emergency records, and assigned-security access.

**Architecture:** Reuse `Resident`, `Building.manager`, and current apartment occupancy; add only the missing profile fields and security assignments. Enforce building access and contact visibility in shared backend services, return purpose-specific DTOs, and build a React directory page using the existing authenticated fetch helper and application shell. Apply the same privacy rules to existing apartment/user responses.

**Tech Stack:** React 19, Vite 6, JavaScript/JSX, React Router 7; Spring Boot 4.0.4, Java 17, Spring Security, JPA, SQLite, Flyway, MapStruct, Jakarta validation, JUnit/Mockito.

**Spec:** [2026-11-18-resident-directory-design.md](../specs/2026-11-18-resident-directory-design.md). Ilham approved its behavior in conversation; its original status line still says proposed. Read both documents before future implementation.

## Global Constraints

- The requested deliverable is a plan only. Do not write product code, install dependencies, or execute the plan.
- All instructions and commands below are for a later implementation session; no implementation tests were run while writing this plan.
- All three sharing flags default to false for existing and new residents.
- Hiding emergency contacts applies to other residents. Managers and security retain emergency access.
- Security personnel are the existing `SECURITY` role. They must be assigned to the buildings where they work and can access only those buildings' contacts and information.
- Never edit V1–V3. Choose the next unused migration version at execution time; this plan uses V4 because V1–V3 exist today.
- Names: max 150 characters. Phone strings: max 30 characters. Relationship: max 50 characters. Blank optional values become null.
- Blood group: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`, or null. Both name and phone are required when supplying a next-of-kin or physician.
- Use existing `DESIGN.md` tokens and components. Do not add a client test framework solely for this feature.
- No family/lease records, emergency SMS/push, SOS workflow, medical advice, file uploads, export, live transport, audit subsystem, or dependency upgrades.
- No contacts in localStorage, frontend-only privacy checks, automatic opt-in, treating nonresident ownership as residency, or security access based only on role without assignment.

## Review Focus

1. Alternate endpoints: apartment list/detail/mutation and manager user-list JSON must not bypass consent; pinned in Task 5.
2. Changed membership: occupancy removal and security revocation must deny subsequent requests, including requests using an existing JWT; pinned in Tasks 2–4.
3. Stale browser state: responses for a previous building/resident/session must never display after selection changes; pinned in Tasks 7–9.
4. Existing data: migration must preserve recorded emergency contacts and load all inherited profile fields; pinned in Task 1.
5. Privilege escalation: a public registration payload must not create a manager, security, staff, or admin account; pinned in Task 6.

---

## How to learn with this plan

Work in order. For each task, read the named existing files, explain the checkpoint in your own words, write the test, observe the expected failure, implement, then verify. A DTO is the data contract sent across the API; an entity is the database model; a repository reads/writes entities; a service decides business rules; a controller connects HTTP to that service. React consumes DTOs, never JPA entities.

The complete request path is `React → api.js → controller → service/access policy → repository → SQLite`. Begin with persistence so the API has real data to operate on. Build the interface only after backend access rules work.

At execution time, first inspect `git status --short`, applicable `AGENTS.md` files, and the current migrations; preserve existing changes and choose an isolated worktree if appropriate. Run the existing baseline checks before making implementation changes. Do not reset `Server/barilog.db`. Each commit instruction means stage only the files changed for that task, never `git add .` over someone else's work.

## File map and ownership

| Area | Files and responsibility |
| --- | --- |
| Persistence | New `V4__resident_directory_schema.sql`; extend `Resident`; new `BuildingSecurityAssignment` and its embedded ID/repository; correct `ResidentRepository`; add scoped occupancy queries to `ApartmentRepository` |
| Authorization | New `DirectoryAccessService`: current active actor, building membership, manager checks, eligible target residents |
| Assignments | New `BuildingSecurityAssignmentService` and controller; add admin manager-assignment operation to existing building service/controller |
| Directory | New `ResidentDirectoryService` and controller, request/response DTOs and `ResidentDirectoryMapper` |
| Shared privacy | New `ContactVisibilityService`; integrate into `ApartmentService` and `UserService`; restrict security reads in `BuildingService`/`ApartmentService` |
| Registration | Existing `RegisterRequest`, `UserService`, and `Register.jsx`: resident-only public registration |
| Client transport | Existing `Client/src/services/api.js`: consistent refresh parsing and directory/assignment functions |
| UI | New `Client/src/pages/ResidentDirectory/` page, CSS, privacy form, emergency panel and assignment panel; integrate existing routes, shell, sidebar, overview |
| Tests/docs | Backend tests under existing `Server/src/test/java/com/barilog/`; small dependency-free transport tests under `Client/src/services/`; a manual verification guide; README and feature/context status updates |

Keep existing authentication and registry architecture. Do not introduce a second user table, generic permissions framework, global state library, or separate family-members subsystem.

## Shared contracts

These names are fixed by this plan so later tasks connect without guessing. All IDs are Java `Long` / JSON numbers. Use DTO classes with Lombok as the repository does; the notation below describes their fields, not new language syntax.

| Contract | Fields / meaning |
| --- | --- |
| `DirectoryPreferencesRequest` / `DirectoryPreferencesResponse` | `sharePhone`, `shareEmail`, `shareEmergencyContacts`; request uses boxed `Boolean` with `@NotNull` for all three; response uses booleans |
| `EmergencyContactRequest` | `bloodGroup`, `emergencyContactName`, `emergencyContactRelationship`, `emergencyContactPhone`, `physicianName`, `physicianPhone`; nullable strings only, no consent or identity fields |
| `EmergencyContactResponse` | Those six fields plus `residentId` and `visibility`: `VISIBLE`, `HIDDEN`, or `NOT_PROVIDED` |
| `DirectoryUnitResponse` | `apartmentId`, `unitNumber`, `floorNumber`, `blockWing` |
| `DirectoryResidentResponse` | `residentId`, `name`, `units: List<DirectoryUnitResponse>`, `phoneNumber`, `email`, `phoneVisibility`, `emailVisibility`; no emergency fields or JPA objects |
| `ContactVisibility` | New enum in `dtos/response/ContactVisibility.java`: `VISIBLE`, `HIDDEN`, `NOT_PROVIDED`. Hidden values are null; do not reveal whether a hidden value exists |
| `SecurityAssignmentResponse` | `buildingId`, `securityUserId`, `securityName`; no phone/email |
| `AssignManagerRequest` | Required positive `managerId` |

For an authorized viewer, a missing optional value is `NOT_PROVIDED`; for a peer without consent it is always `HIDDEN`. A visible emergency profile can contain missing individual fields; mark the entire profile `NOT_PROVIDED` only if all six values are null. Self and authorized management/security bypass sharing flags. Emergency details must be fetched separately when opened.

## Task 1: Persist preferences and security assignments without losing existing data

**Learn:** A migration changes stored data; a Java entity only describes it. Adding a field to Java does not safely upgrade an existing SQLite database.

**Files**

- Create: `Server/src/main/resources/db/migration/V4__resident_directory_schema.sql`
- Modify: `Server/src/main/java/com/barilog/entities/Resident.java`
- Create: `Server/src/main/java/com/barilog/entities/BuildingSecurityAssignment.java`
- Create: `Server/src/main/java/com/barilog/entities/BuildingSecurityAssignmentId.java`
- Create: `Server/src/main/java/com/barilog/repositories/BuildingSecurityAssignmentRepository.java`
- Modify: `Server/src/main/java/com/barilog/repositories/ResidentRepository.java`
- Modify: `Server/src/main/java/com/barilog/repositories/ApartmentRepository.java`
- Test: `Server/src/test/java/com/barilog/ResidentDirectoryPersistenceTest.java`

**Interfaces**

- `Resident`: add boolean `sharePhone`, `shareEmail`, `shareEmergencyContacts` initialized false; nullable `emergencyContactRelationship`, `physicianName`, `physicianPhone`. Reuse current emergency name/phone and blood group.
- Embedded ID: `BuildingSecurityAssignmentId(Long buildingId, Long securityUserId)`; serializable, no-arg constructor, equality/hash code. Entity uses `@EmbeddedId`, `@MapsId` associations to `Building` and `SecurityStaff`.
- Assignment repository: `boolean existsByIdBuildingIdAndIdSecurityUserId(Long buildingId, Long securityUserId)`, `List<BuildingSecurityAssignment> findByIdBuildingId(Long buildingId)`, `List<BuildingSecurityAssignment> findByIdSecurityUserId(Long securityUserId)`. Inherit save/find/delete by embedded ID.
- Apartment repository: `List<Apartment> findEligibleDirectoryApartments(Long buildingId)` and `List<Apartment> findEligibleDirectoryApartmentsForResident(Long residentId)`. Use JPQL with fetched current resident/building/floor, requiring active apartment, non-vacant status, active current resident of role `RESIDENT`. Ownership alone is excluded.

- [ ] **Step 1: Write persistence tests against a temporary SQLite file.** Use JUnit `@TempDir`, standard JDBC, and Flyway's programmatic API already on the classpath. Migrate to target V3, insert an existing resident with blood group `O+` and a next-of-kin, migrate to latest, and assert:

```java
assertEquals("O+", row.getString("blood_group"));
assertEquals("Parent", row.getString("emergency_contact_name"));
assertEquals(0, row.getInt("share_phone"));
assertEquals(0, row.getInt("share_email"));
assertEquals(0, row.getInt("share_emergency_contacts"));
assertThrows(SQLException.class, () -> insertDuplicateAssignment(connection));
```

Also assert cascading assignment deletion when a building/security user is deleted, `PRAGMA foreign_key_check` returns no rows, and migrating twice produces no extra migration. Include a JPA round-trip test that saves/loads all profile fields and verifies eligible queries exclude inactive/vacant/nonresident records. Initialize isolated Spring test contexts with a temporary SQLite URL, foreign keys enabled, and a test-only JWT secret; never use the application's normal database.
- [ ] **Step 2: Run** `./mvnw -Dtest=ResidentDirectoryPersistenceTest test` from `Server/`. Expected first failure: missing V4 columns or new model/query symbols.
- [ ] **Step 3: Add the migration.** Add the six missing resident columns, false defaults, and composite-key assignment table with cascading foreign keys. Use `security_staff(id)` for the security-user foreign key, plus an index starting with `security_user_id` for reverse lookup. Do not rebuild or reseed the resident table.
- [ ] **Step 4: Add the entity fields, assignment entity/ID/repository, and eligible occupancy queries.** Remove `ResidentRepository`'s custom native `findById`/`findAll`: they select only some inherited fields and omit resident columns. Inherit normal JPA implementations instead. Fetch enough relationships inside service transactions to avoid lazy-loading errors without global eager loading.
- [ ] **Step 5: Repeat the command from Step 2.** Expected: all persistence tests pass, preserved legacy contact values, no foreign-key errors. Include a fresh database migration as well as the V3-upgrade case.
- [ ] **Step 6: Checkpoint and commit.** Explain why the unique key prevents duplicate assignments and why flags need defaults both in SQL and Java. Commit the task's explicit files with `feat: persist resident directory preferences and security assignments`.

## Task 2: Enforce building access with one policy

**Learn:** A role answers “what kind of user?”; membership answers “which building?” Both must match. The browser's selected building is input, not proof of permission.

**Files**

- Create: `Server/src/main/java/com/barilog/services/DirectoryAccessService.java`
- Test: `Server/src/test/java/com/barilog/DirectoryAccessServiceTest.java`

**Interfaces**

- Consumes Task 1 repositories, existing `BuildingRepository.findByManagerId`, and `AuthService.getLoggedUser()`.
- Produces `User currentActor()`, `boolean canReadBuilding(User actor, Building building)`, `boolean canManageBuilding(User actor, Building building)`, `Building requireReadAccess(User actor, Long buildingId)`, `Building requireManagementAccess(User actor, Long buildingId)`, `Resident requireCurrentResident(User actor, Long buildingId, Long residentId)`, and `List<Building> accessibleBuildings(User actor)`.
- `currentActor()` checks the database user's active flag and role. `requireCurrentResident` authorizes the building first, then resolves a currently eligible target in that building. Denials use Spring `AccessDeniedException`; authorized-but-absent targets use existing `ResourceNotFoundException`.

- [ ] **Step 1: Write policy tests using Mockito and fixture users with actual `Role` strings and active flags.** Create buildings A/B, manager A/B, resident A/B, guard assigned to A, admin and technician. Assertions include:

```java
assertTrue(access.canReadBuilding(guardA, buildingA));
assertFalse(access.canReadBuilding(guardA, buildingB));
assertFalse(access.canReadBuilding(managerA, buildingB));
assertFalse(access.canReadBuilding(technician, buildingA));
assertThrows(AccessDeniedException.class,
    () -> access.requireReadAccess(guardA, buildingB.getId()));
```

Add tests for admin access, unassigned manager/building, inactive actor, owner without occupancy, two-unit deduplication of accessible buildings, residence in two buildings, removal of the last qualifying occupancy, and a deleted assignment between successive requests. Assert inaccessible-building lookup fails before loading target resident details.
- [ ] **Step 2: Run** `./mvnw -Dtest=DirectoryAccessServiceTest test`. Expected first failure: missing policy class/methods.
- [ ] **Step 3: Implement the policy interfaces.** Derive resident access from Task 1's eligible occupancy definition; manager access from the actual manager ID; security access from assignment existence on each request; admin access after active-user validation. Do not cache assignments or copy permissions into JWT claims. A known inaccessible building is 403; a nonexistent building is 404.
- [ ] **Step 4: Repeat Step 2.** Expected: all role/building cases pass; revocation and moving out affect the next check without token replacement.
- [ ] **Step 5: Checkpoint and commit.** Explain why `hasRole('SECURITY')` alone cannot protect `/buildings/123/...`. Commit as `feat: enforce directory building membership`.

## Task 3: Let managers assign security and admins associate a building manager

**Learn:** Security membership is real stored data, created by an authorized manager. An assignment creates no new account and changes no user's role.

**Files**

- Create: `Server/src/main/java/com/barilog/services/BuildingSecurityAssignmentService.java`
- Create: `Server/src/main/java/com/barilog/controllers/BuildingSecurityAssignmentController.java`
- Create: `Server/src/main/java/com/barilog/dtos/response/SecurityAssignmentResponse.java`
- Create: `Server/src/main/java/com/barilog/dtos/request/AssignManagerRequest.java`
- Modify: `Server/src/main/java/com/barilog/controllers/BuildingController.java`
- Modify: `Server/src/main/java/com/barilog/services/BuildingService.java`
- Test: `Server/src/test/java/com/barilog/BuildingSecurityAssignmentServiceTest.java`
- Modify/test: `Server/src/test/java/com/barilog/BuildingServiceTest.java`

**Interfaces**

- Assignment service: `List<SecurityAssignmentResponse> list(Long buildingId)`, `SecurityAssignmentResponse assign(Long buildingId, Long securityUserId)`, `void revoke(Long buildingId, Long securityUserId)`; get actor internally, require management access, use transactions for writes.
- Routes: `GET /api/buildings/{buildingId}/security-assignments` → 200 array; `PUT .../security-assignments/{securityUserId}` → 200 DTO; `DELETE .../security-assignments/{securityUserId}` → 204, including repeated authorized deletion.
- Building service: `BuildingResponse assignManager(Long buildingId, Long managerId)`; `PUT /api/buildings/{buildingId}/manager` → 200; admin only. Controller uses `AssignManagerRequest`.

- [ ] **Step 1: Write tests** `assign_sameGuardTwice_returnsOneAssignment`, `assign_foreignBuilding_isForbidden`, `assign_inactiveOrNonSecurityUser_isBadRequest`, `revoke_removesAccessImmediately`, `assignManager_adminOnly_acceptsActiveManager`, and `assignManager_missingUser_isNotFound`. Assert list fields contain only ID/name/building and a guard can be assigned to A and B independently. Mock/construct real assignment IDs; assert repository state/count rather than only invocation count.
- [ ] **Step 2: Run** `./mvnw -Dtest=BuildingSecurityAssignmentServiceTest,BuildingServiceTest test`. Expected first failure: missing assignment and manager-association operations.
- [ ] **Step 3: Implement assignment operations and HTTP mappings.** Use manager/admin method annotations plus the shared per-building policy. Require positive IDs; nonexistent account → 404; wrong role/inactive → 400. Use the composite key for idempotency: an existing assignment returns the same successful DTO instead of creating a duplicate. Keep this a small assignment operation, without a generic membership framework.
- [ ] **Step 4: Add admin manager association.** Reuse the existing building entity; reject a manager caller even for an unassigned building. Return the existing safe `BuildingResponse`. Update existing unit-test constructor setup when dependencies change.
- [ ] **Step 5: Repeat Step 2.** Expected: assignment and manager association tests pass; regular building tests remain passing.
- [ ] **Step 6: Checkpoint and commit.** Explain how revoking A leaves an assignment to B intact. Commit as `feat: manage building security assignments`.

## Task 4: Build the directory, sharing settings, and emergency APIs

**Learn:** Send each screen only the data it needs. Redact hidden values before serialization; hiding a React element does not protect API data.

**Files**

- Create: `Server/src/main/java/com/barilog/services/ResidentDirectoryService.java`
- Create: `Server/src/main/java/com/barilog/services/ContactVisibilityService.java`
- Create: `Server/src/main/java/com/barilog/controllers/ResidentDirectoryController.java`
- Create: `Server/src/main/java/com/barilog/mappers/ResidentDirectoryMapper.java`
- Create request DTOs: `Server/src/main/java/com/barilog/dtos/request/DirectoryPreferencesRequest.java`, `EmergencyContactRequest.java` in that same directory
- Create response DTOs: `Server/src/main/java/com/barilog/dtos/response/DirectoryPreferencesResponse.java`, `DirectoryUnitResponse.java`, `DirectoryResidentResponse.java`, `EmergencyContactResponse.java`, `ContactVisibility.java` in that same directory
- Test: `Server/src/test/java/com/barilog/ResidentDirectoryServiceTest.java`
- Test: `Server/src/test/java/com/barilog/ResidentDirectoryApiTest.java`

**Interfaces**

- Directory service: `List<BuildingResponse> buildings()`, `List<DirectoryResidentResponse> directory(Long buildingId)`, `DirectoryPreferencesResponse preferences()`, `DirectoryPreferencesResponse updatePreferences(DirectoryPreferencesRequest request)`, `EmergencyContactResponse emergency(Long buildingId, Long residentId)`, `EmergencyContactResponse updateEmergency(Long buildingId, Long residentId, EmergencyContactRequest request)`.
- Visibility service: `boolean maySeePhone(User actor, Building building, Resident subject)`, `boolean maySeeEmail(User actor, Building building, Resident subject)`, `boolean maySeeEmergency(User actor, Building building, Resident subject)`. Return false for unrelated viewers even if a subject shares. Self access is allowed; other access requires building eligibility and the relevant flag or a management/security exception. This is the only place interpreting sharing flags.
- Mapper: `DirectoryUnitResponse toUnit(Apartment apartment)`, `DirectoryPreferencesResponse toPreferences(Resident resident)`, `EmergencyContactResponse toEmergency(Resident resident)`; service applies redaction after mapping. Mapper does not determine permission.
- Routes: exactly the directory/preferences/emergency paths in the spec. Successful GET/PUT return 200 JSON. Use `Cache-Control: no-store` for directory/contact/preferences responses, including the later legacy contact responses.

- [ ] **Step 1: Write service tests.** Use a subject with phone `+8801700112233`, email `resident@example.com`, blood group `O+`, and flags initially false. Pin these assertions:

```java
assertNull(peerRow.getPhoneNumber());
assertEquals(ContactVisibility.HIDDEN, peerRow.getPhoneVisibility());
assertNull(peerEmergency.getEmergencyContactPhone());
assertEquals(ContactVisibility.HIDDEN, peerEmergency.getVisibility());
assertEquals("O+", guardEmergency.getBloodGroup());
assertEquals("+8801700112233", selfRow.getPhoneNumber());
```

Add `sharePhone_doesNotShareEmailOrEmergency`, `sharedEmergency_isVisibleOnlyToBuildingPeers`, `missingEmergency_isNotProvidedForAuthorizedViewer`, `residentCannotEditEmergency`, `managerCannotEditPreferences`, `unassignedResidentCanStillEditOwnPreferences`, `directory_deduplicatesResidentAndListsBothUnits`, `movedOutResident_isNotFoundForManager`, and `foreignBuilding_isForbiddenBeforeResidentLookup`. Assert all emergency fields are null when hidden, not just phone. Both endpoints must preserve the other data category when writing.
- [ ] **Step 2: Run** `./mvnw -Dtest=ResidentDirectoryServiceTest test`. Expected first failure: missing service/DTO interfaces.
- [ ] **Step 3: Implement DTOs, mapping, visibility and service methods.** Group eligible apartments by resident ID; sort residents by name then ID, unit labels deterministically. Preferences affect the authenticated resident globally; no `residentId` input is accepted for those writes. Use read-only transactions for queries and write transactions for updates. DTO validation enforces lengths, required booleans, exact blood-group values, and positive path IDs; service trims optional strings and checks paired contact name/phone fields after trimming. A relationship alone is invalid without a next-of-kin pair. An all-null emergency PUT clears the profile. Emergency PUT never copies unknown consent fields into the entity.
- [ ] **Step 4: Add the controller and HTTP tests.** Use `@SpringBootTest(webEnvironment = MOCK)` against an isolated temporary SQLite database. Build MockMvc with `MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build()`; use existing `JwtService` to mint Bearer tokens for test users seeded through repositories. Do not use default `@WithMockUser`, whose principal is not the `Long` expected by `AuthService`. Create test fixture users of all roles directly through repositories, not public registration. Seed two buildings, assigned/unassigned guards, two residents, and an occupied apartment per building. Test anonymous 401, staff 403, wrong building 403, missing eligible target 404, valid manager PUT 200, resident/guard emergency PUT 403, manager preference PUT 403, omitted/null preferences 400, invalid group `C+` 400, overlong fields 400, incomplete pairs 400, and optional blank normalization. Assert emergency data never appears in list JSON and all contact responses have `no-store`. Include HTTP assignment/manager operations from Task 3 and foreign-building access using the same unmodified guard token after assignment revocation.
- [ ] **Step 5: Run** `./mvnw -Dtest=ResidentDirectoryServiceTest,ResidentDirectoryApiTest test`. Expected: tests pass through the actual security filters/controllers, not just mocked service decisions.
- [ ] **Step 6: Checkpoint and commit.** Explain why a hidden emergency profile must not be sent to the browser and why three independent sharing flags need independent tests. Commit as `feat: add private resident directory and emergency APIs`.

## Task 5: Close privacy bypasses in existing registry endpoints

**Learn:** A new private endpoint is ineffective if an old endpoint returns the same hidden data. Follow the data through every existing response path.

**Files**

- Modify: `Server/src/main/java/com/barilog/services/ContactVisibilityService.java`
- Modify: `Server/src/main/java/com/barilog/services/ApartmentService.java`
- Modify: `Server/src/main/java/com/barilog/services/BuildingService.java`
- Modify: `Server/src/main/java/com/barilog/services/UserService.java`
- Modify: `Server/src/main/java/com/barilog/controllers/ApartmentController.java`, `BuildingController.java`, `UserController.java` only where response/cache integration requires it
- Modify: `Server/src/main/java/com/barilog/exceptions/GlobalExceptionHandler.java` to use neutral access-denied copy suitable for all roles
- Modify/test: `Server/src/test/java/com/barilog/ApartmentServiceTest.java`, `BuildingServiceTest.java`, `ResidentDirectoryApiTest.java`
- Test: `Server/src/test/java/com/barilog/ContactVisibilityServiceTest.java`

**Interfaces**

- Add `ApartmentResponse redactApartment(User actor, Apartment apartment, ApartmentResponse response)` to `ContactVisibilityService`; reuse Task 4's field checks. It changes response fields only, never persistent entity contacts.
- Keep existing apartment/building method signatures and filters. Their return values become actor-aware. Resolve the actor once per request/service call, not once per row.
- Keep `/api/users` returning `List<UserResponse>` to avoid an unnecessary frontend contract change. Admin gets full DTOs; manager gets a fresh DTO per user with only `id`, `name`, `role` populated. Do not alter `/api/auth/me` or registration's own-user response.

- [ ] **Step 1: Write regression tests before changes.** Add raw JSON assertions to Task 4's HTTP fixtures for apartment GET list/detail, POST, PUT and occupancy PATCH. With all flags false, unrelated users and peers receive null contact values; a linked resident's independent flags expose only the corresponding current account values. A manually entered owner contact without a linked consenting account stays hidden from peers. Self can see their own contacts. Assigned guard/own manager/admin can see operational contacts. Assert entity phone/email values remain stored after redaction.
- [ ] **Step 2: Add scope tests for security registry reads.** A guard assigned only to A must see only A in `/api/buildings` and unfiltered `/api/apartments`. Direct building B detail/floors/statistics/apartment/history are 403. Explicit filters resolving to B are 403; unfiltered/status/owner/resident filters must intersect the guard's assignments. Validate building/floor conflicts instead of letting existing ordered filter branches skip scope checks. An unassigned guard receives empty global lists and 403 for known building details. Repeat with a token issued before revocation. Assert `/api/users` is forbidden to guard and manager responses omit phone/email while admin/self stay complete.
- [ ] **Step 3: Run** `./mvnw -Dtest=ContactVisibilityServiceTest,ApartmentServiceTest,BuildingServiceTest,ResidentDirectoryApiTest test`. Expected first failure: exposed contact fields or cross-building results.
- [ ] **Step 4: Integrate one redaction path into all apartment response returns.** Apply after MapStruct mapping for create, list, detail, specification update, and occupancy update. For peers, never reveal stale manually entered owner snapshots based on a different account's consent: use the linked eligible resident's own account contact only when its flag permits. Otherwise null the contact. Full privileged operational access remains building-scoped; ownership-only self access is limited to their own contact fields.
- [ ] **Step 5: Restrict security registry reads and user-list responses.** Add assigned-building intersections for global queries and explicit scope checks before fetching dependent records. Add `no-store` headers to legacy contact-bearing responses. Update the existing tests' constructor wiring and authenticated actor stubs. Change the global 403 message to `You do not have permission to perform this action.` Do not rewrite unrelated Documents authorization or loosen role checks to preserve old fixtures.
- [ ] **Step 6: Repeat Step 3.** Expected: all legacy and privacy tests pass. Manually inspect every `.map(apartmentMapper::toResponse)`/`apartmentMapper.toResponse(...)` return path to confirm it cannot bypass redaction.
- [ ] **Step 7: Checkpoint and commit.** Explain why changing `UnitSlideOver.jsx` alone would leave the data public to API callers. Commit as `fix: enforce contact privacy across registry responses`.

## Task 6: Prevent public creation of privileged roles

**Learn:** Contact access is not secure when anyone can create an administrator account. This is a prerequisite specified in the approved design, not a new account-management subsystem.

**Files**

- Modify: `Server/src/main/java/com/barilog/dtos/request/RegisterRequest.java`
- Modify: `Server/src/main/java/com/barilog/services/UserService.java`
- Modify: `Client/src/pages/Auth/Register.jsx`
- Test: `Server/src/test/java/com/barilog/UserRegistrationTest.java`
- Modify/test: `Server/src/test/java/com/barilog/ResidentDirectoryApiTest.java`

**Interfaces**

- Preserve `POST /api/users/register`, its existing payload keys and own-user `UserResponse`. Only `role: "RESIDENT"` is accepted. Reject other roles with 400 before persistence, even if the service is called directly.
- Existing privileged accounts and JWT login remain intact. Automated test fixtures create other role subclasses through repositories, not `register()`.

- [ ] **Step 1: Add a parameterized service/API test.** For each of `ADMIN`, `MANAGER`, `SECURITY`, `STAFF`, assert registration fails with 400/no saved user. Assert `RESIDENT` succeeds with 201 and the stored subclass/role is resident; a missing role remains invalid. Preserve duplicate-email and password-hashing behavior.
- [ ] **Step 2: Run** `./mvnw -Dtest=UserRegistrationTest,ResidentDirectoryApiTest test`. Expected first failure: privileged registration succeeds.
- [ ] **Step 3: Restrict request validation and service registration.** Replace the public role-switch behavior with resident creation and an explicit service guard. Do not change login or introduce privileged self-registration through another route.
- [ ] **Step 4: Update the registration screen.** Default and submit `RESIDENT`, remove the role selector and unused icon import, and explain that this form creates a resident account. This feature adds no admin account-provisioning screen.
- [ ] **Step 5: Repeat Step 2 and run** `npm run build` from `Client/`. Expected: rejected escalation, normal resident registration/login, existing privileged login, successful client compilation.
- [ ] **Step 6: Checkpoint and commit.** Explain why removing the role selector without a backend guard would not fix escalation. Commit as `fix: restrict public registration to residents`.

## Task 7: Connect the client to the new API and preserve refresh/error behavior

**Learn:** A fetch helper must return the same kind of result before and after a token refresh. Existing `apiFetch` returns a raw `Response` on a successful refresh retry, which would break directory rendering.

**Files**

- Modify: `Client/src/services/api.js`
- Test: `Client/src/services/api.test.js`

**Interfaces**

Add these named exports, using the existing `apiFetch`:

```text
getDirectoryBuildings(options = {}) -> Promise<BuildingResponse[]>
getResidentDirectory(buildingId, options = {}) -> Promise<DirectoryResidentResponse[]>
getResidentEmergency(buildingId, residentId, options = {}) -> Promise<EmergencyContactResponse>
updateResidentEmergency(buildingId, residentId, payload, options = {}) -> Promise<EmergencyContactResponse>
getDirectoryPreferences(options = {}) -> Promise<DirectoryPreferencesResponse>
updateDirectoryPreferences(payload, options = {}) -> Promise<DirectoryPreferencesResponse>
getSecurityAssignments(buildingId, options = {}) -> Promise<SecurityAssignmentResponse[]>
assignBuildingSecurity(buildingId, securityUserId, options = {}) -> Promise<SecurityAssignmentResponse>
revokeBuildingSecurity(buildingId, securityUserId, options = {}) -> Promise<null>
assignBuildingManager(buildingId, managerId, options = {}) -> Promise<BuildingResponse>
```

`options` supports `signal`; URL IDs must be positive integers. Encode IDs through that validation, stringify JSON bodies, preserve credentials and Bearer headers. Map functions to the exact Task 3/4 routes. Preferences use no user ID.

- [ ] **Step 1: Add dependency-free Node tests** using `node:test`, `node:assert/strict`, mocked global `fetch` and in-memory `localStorage` established before dynamic import of `api.js`. Test the actual helper, not a copied implementation. Pin:

```javascript
assert.deepEqual(await getResidentDirectory(10), expectedRows);
assert.equal(retryHeaders.Authorization, 'Bearer renewed-token');
assert.equal(await revokeBuildingSecurity(10, 7), null);
await assert.rejects(getResidentEmergency(20, 4), e => e.status === 403);
```

Also assert 401 → refresh → JSON array, retry 403/400 becomes the normal structured error, retry 204 becomes null, only one refresh attempt, validation-error arrays survive, and an aborted request is not refreshed/retried after logout or a selection change.
- [ ] **Step 2: Run** `node --test src/services/api.test.js` from `Client/`. Expected first failure: missing exports or retry returns a `Response` instead of parsed JSON.
- [ ] **Step 3: Fix the shared helper's retry branch.** Assign the retry result to the response processed by the normal error/204/JSON handling. Keep the retry bounded to one attempt and forward the caller's abort signal. If the original request was cancelled during refresh, do not store its renewed token or retry it; test that a delayed refresh cannot restore that request's session after logout. Do not recursively refresh an already retried request.
- [ ] **Step 4: Add the named API functions with the exact routes/contracts.** Keep directory and emergency data in caller memory only; do not add storage keys. Existing token storage remains unchanged.
- [ ] **Step 5: Repeat Step 2, then run** `npm run build`. Expected: actual helper tests pass and client builds. No new npm dependencies or test framework are needed.
- [ ] **Step 6: Checkpoint and commit.** Explain why `fetch()` returning successfully does not imply HTTP 200. Commit as `feat: connect resident directory client APIs`.

## Task 8: Build the resident directory and privacy controls

**Learn:** The API owns permission decisions; React presents the safe response and manages loading, selection, and forms. Render hidden and missing values differently so users understand what happened.

**Files**

- Create: `Client/src/pages/ResidentDirectory/ResidentDirectory.jsx`
- Create: `Client/src/pages/ResidentDirectory/ResidentDirectory.css`
- Create: `Client/src/pages/ResidentDirectory/PrivacyPreferencesForm.jsx`
- Create: `Client/src/pages/ResidentDirectory/EmergencyContactPanel.jsx`
- Create: `docs/verification/feature-04-resident-directory.md`
- Modify: `Client/src/App.jsx`
- Modify: `Client/src/components/layout/AppLayout.jsx`
- Modify: `Client/src/components/layout/Sidebar.jsx`
- Modify: `Client/src/pages/Overview/Overview.jsx`

**Interfaces**

- `ResidentDirectory()` consumes `AuthContext` plus `useOutletContext()`'s selected building. Render authorized resident summaries and a privacy form for `RESIDENT`; `STAFF` gets a denied state. An unassigned resident can still edit preferences while seeing an empty directory-building list.
- `PrivacyPreferencesForm({ preferences, onSave, saving, error })`; `onSave(payload)` submits exactly three booleans and resolves to the persisted response. Failed saves preserve edited fields and show an error; don't claim success or silently restore hidden defaults before loading.
- `EmergencyContactPanel({ resident, profile, loading, error, onClose })`: read-only panel initially; use the API visibility states, `tel:` links for provided visible phone values, and no call link for hidden/null values.
- While pathname is `/directory`, `AppLayout.refreshBuildings()` uses `getDirectoryBuildings()` for the shared Header selector. On other paths it keeps `getBuildings()`. On source/session changes clear the prior list/selection and ignore old fetch results. Preserve valid previous selection only if the new authorized list contains it. Do not overwrite other pages' current behavior.

- [ ] **Step 1: Start `docs/verification/feature-04-resident-directory.md` with the browser checks below.** Before implementing, observe `/directory` has no route/page. This is a manual failing acceptance check, not an automated test claim. Task 9 extends the same guide with management and direct-API checks.
- [ ] **Step 2: Add the route, permitted-role navigation, page and CSS.** Add an active Feature 04 card to Overview, keep Feature 01's registry path, and use plain “Resident Directory” naming to distinguish them. Use accessible labels, native form controls, visible keyboard focus, and `DESIGN.md` tokens. Show building name, resident name/unit labels, authorized phone/email, name/unit text search, and “Emergency contacts” action; emergency details load only on that action.
- [ ] **Step 3: Implement the privacy form.** Load actual saved settings; disable save until loaded. Separate controls labeled `Share my phone number`, `Share my email`, `Share my emergency details`. Explain: `These settings control what other residents can see. Building managers and assigned security staff can still access your details.` Display the saved response after success and invalidate/refetch the relevant directory/detail data; do not let a manager edit these flags.
- [ ] **Step 4: Protect asynchronous state.** Key display state by authenticated user, building ID and selected resident ID; derive visible details only when that key matches the current selection. Clear details/errors before every new fetch, abort/ignore old responses on cleanup, and guard both success and error handlers against stale keys. A denied response clears contact data. After preference save, close/refetch the profile. Re-fetch on panel reopen and window focus so revocation/consent updates are checked without introducing live transport. Unmount/clear on logout. No persistent caching; already-viewed data in another browser cannot be retroactively erased by this polling-free feature.
- [ ] **Step 5: Run** `npm run build`, then the browser checks: resident sees only eligible buildings; all three fields initially hidden to peers; toggling phone doesn't reveal email; opting into emergency sharing permits same-building peers; self can inspect their own record; search matches mixed-case names/unit labels; vacant/inactive occupants are absent; multiple units remain one row; missing optional values show `Not provided`, withheld values show `Hidden`; no-building and no-search-results are distinct states. Use DevTools delayed responses to switch A → B and resident X → Y rapidly; old contacts must never flash or reappear. Sign out during a pending request and confirm the next session sees no old data. Expected: all checks pass and build succeeds.
- [ ] **Step 6: Checkpoint and commit.** Explain the difference between clearing state and ignoring a response that arrives after clearing. Commit as `feat: add resident directory and privacy controls`.

## Task 9: Complete manager operations and document a reproducible feature demonstration

**Learn:** Complete the workflows for the people who maintain and use the data, then verify the same rules through direct API requests as through the UI.

**Files**

- Modify: `Client/src/pages/ResidentDirectory/ResidentDirectory.jsx`
- Modify: `Client/src/pages/ResidentDirectory/EmergencyContactPanel.jsx`
- Create: `Client/src/pages/ResidentDirectory/EmergencyContactForm.jsx`
- Create: `Client/src/pages/ResidentDirectory/SecurityAssignmentsPanel.jsx`
- Create: `Client/src/pages/ResidentDirectory/ManagerAssignmentForm.jsx`
- Modify: `docs/verification/feature-04-resident-directory.md`
- Modify: `README.md`, `FEATURES.md`, `CONTEXT.md` after verification, accurately reflecting implemented scope

**Interfaces**

- `EmergencyContactForm({ profile, onSave, saving, error })` submits Task 4's six-field replacement payload; display only for manager/admin and only after loading the selected resident's current profile. Residents/guards see read-only details.
- `SecurityAssignmentsPanel({ buildingId })` lists/assigns/revokes through Task 7 exports; existing security ID input, no contact-bearing user picker. Render only for manager/admin.
- `ManagerAssignmentForm({ buildingId, onAssigned })` accepts existing manager ID; admin-only. On success refresh authorized buildings. It enables an admin to associate an existing unassigned building without database editing.

- [ ] **Step 1: Record failing workflow checks before implementation.** Manager has no emergency edit form/assignment panel yet; admin cannot associate a manager in the UI. Add the acceptance cases below to `docs/verification/feature-04-resident-directory.md` as unchecked future checks.
- [ ] **Step 2: Add emergency editing.** Display blood group plus optional next-of-kin name/relationship/phone and physician name/phone. Enforce the exact length/group/pair rules in the form while displaying server validation errors too. Explain that next-of-kin means the resident's chosen emergency contact. Allow all-blank profile removal, show save errors without losing inputs, and disable duplicate saves. On success replace the panel with the server response and refresh any displayed summaries.
- [ ] **Step 3: Add security and manager assignment UI.** Enter existing account IDs, show current assignments, and support idempotent assign/revoke. Clear forms/state on building change; don't let stale save results populate a new building's panel. After assigning a manager, refresh building metadata. Do not add account provisioning. Explain how to use existing local demo accounts; backend tests provision deterministic fixtures separately. If no privileged account exists, document that a separate provisioning task is needed before a browser demo, rather than restoring public privileged registration.
- [ ] **Step 4: Run backend and client checks.** From `Server/`: `./mvnw test`; from `Client/`: `node --test src/services/api.test.js` then `npm run build`. Expected: successful test summaries and a successful Vite build. Capture actual results in the verification guide only when run during implementation; don't pre-fill passing claims.
- [ ] **Step 5: Execute and record this browser/API matrix** against two buildings using separate sessions and real Bearer tokens. Setup uses current occupied resident accounts, manager A/B, guard A, admin, and staff; use fictional data only.

| Check | Expected result |
| --- | --- |
| Resident first visit | Three switches false; own details visible; peer contacts hidden |
| Resident enables phone only | Peer's next fetch shows phone, not email/emergency |
| Resident enables emergency, then disables it | Peer read changes from visible to hidden; manager/assigned guard retain access |
| Manager A edits A's emergency details | Persists; resident sees updated own record; preference flags unchanged |
| Resident/guard attempts emergency PUT directly | 403; stored values unchanged |
| Manager attempts another resident's preference write | No such targeted route; own resident-only route returns 403 |
| Manager A assigns existing guard to A twice | One row, 200 each time; guard sees A |
| Manager A targets B assignment/contact endpoint | 403; no write occurs |
| Manager A revokes guard A; guard reuses old JWT | Next directory/emergency and direct A registry detail request returns 403 |
| Guard assigned to A and B; A revoked | B remains accessible; A absent from lists and denied directly |
| Direct registry building/floor/stats/apartment/history access for B | Guard A is denied; global/filter lists contain only authorized buildings |
| Direct apartment/user API calls | Hidden contacts absent/null; safe assignment IDs/names still usable |
| Admin associates manager to unassigned building | Manager then sees it; other managers cannot claim it |
| Resident's final occupied apartment is vacated | Removed from directory and loses that building's directory access |
| Empty/partial emergency record | `Not provided` or validation feedback, with no fabricated medical values |
| Token expires while opening emergency panel | One refresh and a parsed safe DTO, or a handled login/error state |
| Delayed request + building/resident/session switch | Old details/errors never overwrite current screen |
| Public registration submits ADMIN/MANAGER/STAFF/SECURITY | 400; no privileged account created |
| STAFF or anonymous requests directory | 403 or 401 respectively; UI provides no privileged controls |

For direct API checks use an API client or `curl` against the exact route table, with locally supplied tokens; never paste real tokens into committed documentation. Inspect network JSON and browser storage, not just visible text. Verify guard call links resolve to `tel:` values and no alerts/calls are initiated merely by opening the panel. Check keyboard operation and a narrow mobile viewport.
- [ ] **Step 6: Update feature documentation and commit.** Describe actual routes, flags, defaults, manager/security scope, role provisioning limitation, optional medical fields, and the absence of live updates/alerts. Update the old README instructions that encourage privileged public registration. Mark Feature 04 implemented only after the recorded checks pass; keep remaining Feature 02/17/18 scope separate. Commit as `feat: complete directory management workflows and usage guide`.

## Completion criteria and planning review

The feature is complete only after persistence, service/policy tests, HTTP authorization/JSON checks, transport tests, build, and the browser/API matrix pass. Re-run affected tests after fixes; don't repeatedly broaden testing after a clean final run without a new reason. Preserve accounts/data and keep secrets out of Git.

Planning self-review: the spec's persistence and legacy-data requirements map to Task 1; building access, revocation and assignments to Tasks 2–3; directory/preferences/emergency/validation/status codes to Task 4; alternate API privacy and security registry scoping to Task 5; public registration to Task 6; refresh and abort behavior to Task 7; directory/consent UI and stale responses to Task 8; management workflows, admin association, documentation, and end-to-end evidence to Task 9. All five Review Focus items have owning checks. Shared DTO names and service/client signatures above are the contracts for every task.

**Stop here for this request.** This document is the implementation/teaching plan. No task above has been executed. Ilham can implement it himself with guidance; any later agent execution requires a new instruction to start.
