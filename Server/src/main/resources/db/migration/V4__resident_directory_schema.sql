ALTER TABLE resident ADD COLUMN share_phone BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE resident ADD COLUMN share_email BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE resident ADD COLUMN share_emergency_contacts BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE resident ADD COLUMN emergency_contact_relationship VARCHAR(50);
ALTER TABLE resident ADD COLUMN physician_name VARCHAR(150);
ALTER TABLE resident ADD COLUMN physician_phone VARCHAR(30);

CREATE TABLE building_security_assignments (
    building_id BIGINT NOT NULL,
    security_user_id BIGINT NOT NULL,
    PRIMARY KEY (building_id, security_user_id),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (security_user_id) REFERENCES security_staff(id) ON DELETE CASCADE
);
CREATE INDEX idx_security_assignments_user ON building_security_assignments(security_user_id);
