-- =============================================================================
-- Migration V4: Feature 05 - Automated Monthly Service Charge Generation (PostgreSQL)
-- =============================================================================

-- 1. Configurable charge rules per building
CREATE TABLE IF NOT EXISTS charge_rules (
    id BIGSERIAL PRIMARY KEY,
    building_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    rule_type VARCHAR(30) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    apply_to_vacant BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_charge_rule_type CHECK (rule_type IN ('FIXED', 'PER_SQFT', 'SHARED_UTILITY')),
    CONSTRAINT fk_charge_rule_building FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_charge_rules_building_id ON charge_rules(building_id);

-- 2. One monthly bill per apartment (unique per month = safe to re-run generation)
CREATE TABLE IF NOT EXISTS service_charges (
    id BIGSERIAL PRIMARY KEY,
    apartment_id BIGINT NOT NULL,
    billing_month DATE NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_charge_apartment_month UNIQUE (apartment_id, billing_month),
    CONSTRAINT chk_service_charge_status CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
    CONSTRAINT fk_service_charge_apartment FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_service_charges_billing_month ON service_charges(billing_month);

-- 3. Per-rule breakdown of each bill (rule name is copied so old bills stay readable)
CREATE TABLE IF NOT EXISTS service_charge_items (
    id BIGSERIAL PRIMARY KEY,
    service_charge_id BIGINT NOT NULL,
    rule_name VARCHAR(150) NOT NULL,
    rule_type VARCHAR(30) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    CONSTRAINT fk_charge_item_charge FOREIGN KEY (service_charge_id) REFERENCES service_charges(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_charge_items_charge_id ON service_charge_items(service_charge_id);
