-- =============================================================================
-- Feature 01: Apartment Registry and Occupancy Management Schema (PostgreSQL)
-- =============================================================================

-- 1. Building details
CREATE TABLE IF NOT EXISTS buildings (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    total_floors INT NOT NULL CHECK (total_floors > 0),
    manager_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_building_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 2. Floor levels and wings
CREATE TABLE IF NOT EXISTS floors (
    id BIGSERIAL PRIMARY KEY,
    building_id BIGINT NOT NULL,
    floor_number INT NOT NULL,
    block_wing VARCHAR(50) NOT NULL DEFAULT 'Main',
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_building_floor_wing UNIQUE (building_id, floor_number, block_wing),
    CONSTRAINT fk_floor_building FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
);

-- 3. Apartment units and occupancy records
CREATE TABLE IF NOT EXISTS apartments (
    id BIGSERIAL PRIMARY KEY,
    building_id BIGINT NOT NULL,
    floor_id BIGINT NOT NULL,
    unit_number VARCHAR(30) NOT NULL,
    size_sqft NUMERIC(10, 2) NOT NULL CHECK (size_sqft > 0),
    net_carpet_sqft NUMERIC(10, 2) CHECK (net_carpet_sqft > 0),
    bhk_type VARCHAR(20) NOT NULL,
    number_of_bedrooms INT NOT NULL DEFAULT 1 CHECK (number_of_bedrooms >= 0),
    number_of_bathrooms INT NOT NULL DEFAULT 1 CHECK (number_of_bathrooms >= 0),
    number_of_balconies INT NOT NULL DEFAULT 0 CHECK (number_of_balconies >= 0),
    parking_slot_number VARCHAR(50),
    utility_meter_number VARCHAR(100),
    occupancy_status VARCHAR(30) NOT NULL DEFAULT 'VACANT',
    owner_id BIGINT,
    current_resident_id BIGINT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_building_unit UNIQUE (building_id, unit_number),
    CONSTRAINT chk_occupancy_status CHECK (occupancy_status IN ('VACANT', 'OWNER_OCCUPIED', 'RENTED')),
    CONSTRAINT fk_apartment_building FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE RESTRICT,
    CONSTRAINT fk_apartment_floor FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE RESTRICT,
    CONSTRAINT fk_apartment_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_apartment_resident FOREIGN KEY (current_resident_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Index for rapid lookups by unit number, occupancy status, and building
CREATE INDEX IF NOT EXISTS idx_apartments_building_id ON apartments(building_id);
CREATE INDEX IF NOT EXISTS idx_apartments_occupancy ON apartments(occupancy_status);
CREATE INDEX IF NOT EXISTS idx_apartments_resident ON apartments(current_resident_id);

-- 4. Occupancy transition audit history
CREATE TABLE IF NOT EXISTS occupancy_history (
    id BIGSERIAL PRIMARY KEY,
    apartment_id BIGINT NOT NULL,
    from_status VARCHAR(30) NOT NULL,
    to_status VARCHAR(30) NOT NULL,
    previous_resident_id BIGINT,
    new_resident_id BIGINT,
    changed_by_user_id BIGINT NOT NULL,
    reason_or_notes TEXT,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_history_from_status CHECK (from_status IN ('INITIAL', 'VACANT', 'OWNER_OCCUPIED', 'RENTED')),
    CONSTRAINT chk_history_to_status CHECK (to_status IN ('VACANT', 'OWNER_OCCUPIED', 'RENTED')),
    CONSTRAINT fk_history_apartment FOREIGN KEY (apartment_id) REFERENCES apartments(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_prev_resident FOREIGN KEY (previous_resident_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_history_new_resident FOREIGN KEY (new_resident_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_history_changed_by FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_history_apartment_id ON occupancy_history(apartment_id);
