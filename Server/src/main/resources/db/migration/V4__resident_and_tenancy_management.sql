-- =============================================================================
-- Migration V4: Feature 02 - Tenancy Agreement and Inspection Management Schema
-- Manages tenancy contracts, lease lifecycles, and move-in/move-out inspections
-- =============================================================================

-- 1. Tenancy agreements table (tracks leases, financial terms, and lifecycle)
CREATE TABLE IF NOT EXISTS tenancy_agreements (
    id BIGSERIAL PRIMARY KEY,
    agreement_number VARCHAR(50) NOT NULL UNIQUE,
    apartment_id BIGINT NOT NULL,
    resident_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rent_amount NUMERIC(12, 2) NOT NULL CHECK (rent_amount >= 0),
    deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (deposit_amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    payment_frequency VARCHAR(30) DEFAULT 'MONTHLY',
    terms TEXT,
    notes TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    document_reference_id VARCHAR(100), -- Optional integration hook for Feature 03 Document Repository
    created_by_user_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tenancy_status CHECK (status IN ('UPCOMING', 'ACTIVE', 'EXPIRED', 'TERMINATED')),
    CONSTRAINT chk_tenancy_dates CHECK (end_date >= start_date),
    CONSTRAINT fk_tenancy_apartment FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tenancy_resident FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tenancy_creator FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tenancy_apartment ON tenancy_agreements(apartment_id);
CREATE INDEX IF NOT EXISTS idx_tenancy_resident ON tenancy_agreements(resident_id);
CREATE INDEX IF NOT EXISTS idx_tenancy_status ON tenancy_agreements(status);
CREATE INDEX IF NOT EXISTS idx_tenancy_archived ON tenancy_agreements(is_archived);
CREATE INDEX IF NOT EXISTS idx_tenancy_dates ON tenancy_agreements(start_date, end_date);

-- 2. Move-in and Move-out inspections table
CREATE TABLE IF NOT EXISTS tenancy_inspections (
    id BIGSERIAL PRIMARY KEY,
    tenancy_agreement_id BIGINT,
    apartment_id BIGINT NOT NULL,
    resident_id BIGINT NOT NULL,
    inspection_type VARCHAR(30) NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time VARCHAR(20),
    inspector_name VARCHAR(150),
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    notes TEXT,
    condition_report TEXT,
    keys_handed_over BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_inspection_type CHECK (inspection_type IN ('MOVE_IN', 'MOVE_OUT')),
    CONSTRAINT chk_inspection_status CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT fk_inspection_tenancy FOREIGN KEY (tenancy_agreement_id) REFERENCES tenancy_agreements(id) ON DELETE SET NULL,
    CONSTRAINT fk_inspection_apartment FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inspection_resident FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_inspection_apartment ON tenancy_inspections(apartment_id);
CREATE INDEX IF NOT EXISTS idx_inspection_resident ON tenancy_inspections(resident_id);
CREATE INDEX IF NOT EXISTS idx_inspection_status ON tenancy_inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspection_type ON tenancy_inspections(inspection_type);
