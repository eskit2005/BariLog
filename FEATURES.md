# BariLog — Comprehensive Project Feature Specification

BariLog is an all-in-one smart residential building management platform designed for medium-to-large apartment communities (typically 50–100+ apartments). It eliminates fragmented communication (WhatsApp groups, ad-hoc spreadsheets, paper registers) and provides an integrated, transparent, role-based platform.

---

## User Roles & Responsibilities

1. **Residents and Tenants (`ROLE_RESIDENT`)**:
   - Report issues, track maintenance tickets.
   - View monthly service charge bills, make or record payments, and download receipts.
   - Access building notices, community polls, and community decisions.
   - Pre-approve visitors, view incoming delivery/parcel logs.
   - Book shared facilities (e.g., rooftop, community hall).
   - View financial transparency reports and audit summaries.

2. **Building Managers / Committee Members (`ROLE_MANAGER`)**:
   - Maintain building, floor, apartment, resident, and tenancy records.
   - Configure billing rules and generate automated monthly service charges.
   - Track shared expenses, budgets, vendor invoices, and financial reports.
   - Assign maintenance complaints to staff/vendors, monitor SLAs, and handle escalations.
   - Schedule preventive maintenance tasks.
   - Publish notices, conduct polls, record official community decisions.
   - Review audit trails and resolve resident billing or maintenance disputes.

3. **Maintenance Staff & Service Providers (`ROLE_STAFF`)**:
   - Receive assigned maintenance and repair jobs.
   - Update job progress/status (In Progress, Blocked, Resolved).
   - Upload repair evidence (photos, notes, materials used).
   - Submit quotations, invoices, and warranty details.

4. **Security Personnel (`ROLE_SECURITY`)**:
   - Manage physical building access, verify pre-approved visitors, log visitor check-in/check-out.
   - Log incoming parcel and courier deliveries, notify residents, and record collection proof.
   - Report immediate on-premise security or facility emergency incidents.

5. **System Administrator (`ROLE_ADMIN`)** *(Platform level)*:
   - User account provisioning, role and permission management, system configuration, and audit log inspection.

---

## 20 Core Feature Areas

### A. Apartment and Resident Management (Features 1–4)

* **01. Apartment Registry and Occupancy Management** `[Assigned: Ibrahim]`
  * Managers maintain building structure (towers, floors, unit numbers, unit sizes/sqft, BHK specs).
  * Real-time occupancy state tracking: Vacant, Rented, or Owner-Occupied.
  * History log of occupancy changes per unit.

* **02. Resident and Tenancy Management**
  * Resident profiles, family/occupant details, identity verification documents.
  * Tenancy contracts, lease agreements, start/end dates, move-in and move-out checklists and clearance certificates.
  * Dynamic apartment-to-resident assignments.

* **03. Digital Document Repository**
  * Centralized digital storage for building bylaws, deed/title deeds, tenancy contracts, fire certificates, vendor contracts, and meeting minutes.
  * Granular role-based view/download permissions (public, resident-only, committee-only).
  * Document expiration tracking and alert reminders (e.g., lift license renewal, fire inspection expiry).

* **04. Resident Directory and Emergency Contacts** `[Assigned: Ilham]`
  * Controlled, privacy-conscious resident phonebook (opt-in phone/email visibility).
  * Emergency contacts register (blood group, emergency next-of-kin, physician).
  * One-click emergency contact access for building managers and security personnel.

---

### B. Finance and Transparency (Features 5–8)

* **05. Automated Monthly Service-Charge Generation**
  * Rule-driven bill generator (fixed monthly fee, area-based sqft rate, split utility allocation, or consumption-based).
  * Automated batch generation on the 1st of every month using scheduled background tasks.
  * Late fee penalties and early payment discount rules.

* **06. Bill Payment and Receipt Management**
  * Digital ledger of monthly dues, breakdown of costs (water, generator, security, elevator maintenance, sinking fund).
  * Online payment simulation/gateway integration, manual payment slip uploads, manager verification.
  * Automated receipt generation (PDF) with unique invoice numbers and payment tracking.

* **07. Expense and Budget Tracking**
  * Categorized expenditure tracking (cleaning, security staff payroll, diesel for generator, lift repairs, gardening).
  * Monthly and annual budget setting per category with variance analysis (actual vs. budgeted).
  * Expense approval workflows with attached receipts, vendor bills, and vouchers.

* **08. Financial Transparency Dashboard**
  * Read-only financial portal for residents to view approved monthly income vs. expenditure.
  * Sinking fund balance and building reserve fund visibility.
  * List of aggregate outstanding dues (without undue public shaming or with privacy controls).
  * Downloadable monthly and annual financial statements (PDF/Excel).

---

### C. Maintenance and Shared Resources (Features 9–13)

* **09. Maintenance Complaint and Ticketing System**
  * Resident-facing ticket creation for personal flat or common areas (plumbing, electrical, elevator, masonry, pests).
  * Photo attachments, location tagging (flat vs. 3rd-floor corridor), priority tags (Low, Medium, High, Emergency).
  * Ticket status lifecycle: Open -> Assigned -> In Progress -> Resolved -> Closed -> Reopened.

* **10. Work Assignment and SLA Tracking**
  * Manager dispatch interface to assign tickets to in-house technicians or external vendors.
  * Service Level Agreement (SLA) timers based on priority (e.g., water leaks: 4 hrs, bulb replacement: 24 hrs).
  * Automatic escalation alerts to committee members for overdue tickets.

* **11. Preventive Maintenance Scheduler**
  * Recurring task scheduler for building assets (generator check every 2 weeks, water tank cleaning every 6 months, elevator service every month, fire extinguisher audit annually).
  * Checklists, service vendor logs, and historical maintenance track record.

* **12. Repair Vendor and Quotation Management**
  * Vendor database (electricians, plumbers, lift manufacturers, painters) with rating and contact history.
  * Multi-quotation submission and comparison workflow for major repair projects.
  * Storage of vendor contracts, warranty certificates, and work completion sign-offs.

* **13. Shared Facility Booking**
  * Reservation engine for shared resources: rooftop garden, community hall, BBQ patio, guest parking slots.
  * Slot availability calendar, capacity caps, booking rules (e.g., max 1 weekend booking per month), and cleaning fee charges.
  * Instant or manager-approved booking workflow preventing double bookings.

---

### D. Security and Community Coordination (Features 14–17)

* **14. Visitor Pre-Approval and Entry Logs**
  * Resident pre-authorization of guests/cabs/services with a digital pass / 4-digit OTP / QR code.
  * Gatekeeper/Security tablet UI to record walk-in visitors, take photos, capture purpose, verify approval, and log departure time.
  * Real-time entry notification push/SMS to the respective resident.

* **15. Parcel and Delivery Register**
  * Security checkpoint logs parcels from couriers (Amazon, courier services, food delivery).
  * Automated notification to resident with locker/security desk reference code.
  * Digital signature or OTP verification when resident collects their parcel.

* **16. Notices, Polls, and Community Decisions**
  * Digital noticeboard with category tags (Urgent, General, AGM, Social) and read-receipt confirmations.
  * Democratic polling module for community decisions (e.g., painting color choice, festival budget approval).
  * Official archiving of Annual General Meeting (AGM) minutes and binding resolutions.

* **17. Incident and Emergency Reporting**
  * Panic/SOS or urgent incident report trigger (fire alarm, lift stuck, severe pipe burst, trespasser).
  * Instant multi-channel broadcast (Push/SMS/Email/In-app) to security, managers, and affected residents.
  * Post-incident investigation logs and preventive action documentation.

---

### E. Intelligence, Reporting, and Accountability (Features 18–20)

* **18. Smart Notifications and Reminders**
  * Central notification dispatcher: email, in-app bell notification, and SMS.
  * Configurable triggers: bill generation, due date approaching, overdue payment, visitor arrival, parcel received, ticket status change, AGM notice.
  * User-level notification preference center (opt-in / mute non-critical alerts).

* **19. Building Performance Analytics**
  * Manager and committee executive dashboards.
  * Metrics: Mean Time to Resolution (MTTR) for complaints, recurring issue clusters, monthly cash flow, collection efficiency %, occupancy rates, and facility utilization rates.

* **20. Audit Trail and Dispute Resolution**
  * Immutable event logging: captures who modified bills, who changed complaint status, who authorized expenses, and timestamps.
  * Formal dispute filing mechanism for residents (disputing a service charge or dissatisfaction with a closed maintenance ticket).
  * Manager adjudication portal with dispute resolution notes and audit history.
