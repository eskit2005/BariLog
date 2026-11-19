-- =============================================================================
-- Migration V3: Feature 03 - Digital Document Repository Schema (SQLite)
-- Building rules, notices, complaints and maintenance agreements
-- =============================================================================

-- 1. Building rules and bylaws (managers write, everyone reads)
CREATE TABLE IF NOT EXISTS building_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    created_by_user_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rule_creator FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 2. Approved notices (managers publish, everyone reads, optional expiry)
CREATE TABLE IF NOT EXISTS notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(30) NOT NULL DEFAULT 'GENERAL',
    expiry_date DATE,
    created_by_user_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_notice_category CHECK (category IN ('GENERAL', 'URGENT', 'MAINTENANCE', 'EVENT')),
    CONSTRAINT fk_notice_creator FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Complaints (residents file, managers resolve)
CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    resident_id BIGINT NOT NULL,
    resolution_note TEXT,
    resolved_by_user_id BIGINT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_complaint_status CHECK (status IN ('OPEN', 'RESOLVED')),
    CONSTRAINT fk_complaint_resident FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_complaint_resolver FOREIGN KEY (resolved_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Maintenance agreements (residents submit, managers mark as noted, expiry tracked)
CREATE TABLE IF NOT EXISTS maintenance_agreements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    vendor_name VARCHAR(150) NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    submitted_by_user_id BIGINT NOT NULL,
    noted_by_user_id BIGINT,
    noted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_agreement_status CHECK (status IN ('PENDING', 'NOTED')),
    CONSTRAINT chk_agreement_dates CHECK (expiry_date >= start_date),
    CONSTRAINT fk_agreement_submitter FOREIGN KEY (submitted_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_agreement_noter FOREIGN KEY (noted_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notices_expiry ON notices(expiry_date);
CREATE INDEX IF NOT EXISTS idx_complaints_resident ON complaints(resident_id);
CREATE INDEX IF NOT EXISTS idx_agreements_submitter ON maintenance_agreements(submitted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_agreements_expiry ON maintenance_agreements(expiry_date);

-- 5. Seed: 10 standard building rules
INSERT INTO building_rules (title, description, category) VALUES
('Quiet Hours', 'Keep noise to a minimum between 11:00 PM and 7:00 AM. No loud music, drilling or furniture moving during these hours.', 'NOISE'),
('Garbage Disposal', 'Bag all household waste and place it in the ground floor bins before 9:00 AM. Do not leave garbage in corridors or stairwells.', 'HYGIENE'),
('Visitor Entry', 'All visitors must sign in at the security desk. Residents are responsible for the conduct of their guests.', 'SECURITY'),
('Parking', 'Park only in your allotted parking slot. Visitor parking is limited to 4 hours.', 'PARKING'),
('Pets', 'Pets must be leashed in all common areas. Owners must clean up after their pets immediately.', 'GENERAL'),
('Lift Usage', 'Children under 10 must be accompanied in the lift. Use the service lift for furniture and heavy goods.', 'SAFETY'),
('Renovation Work', 'Inform the building manager at least 3 days before any renovation. Work is allowed only from 9:00 AM to 6:00 PM on weekdays.', 'GENERAL'),
('Fire Safety', 'Do not block fire exits, stairwells or fire extinguishers. Smoking is not allowed in common areas.', 'SAFETY'),
('Service Charge Payment', 'Monthly service charges must be paid by the 10th of each month. A late fee applies after the due date.', 'FINANCE'),
('Water Conservation', 'Report leaks to the management immediately. Do not wash cars with the building water supply.', 'GENERAL');
