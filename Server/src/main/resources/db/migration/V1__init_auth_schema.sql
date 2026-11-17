-- =============================================================================
-- Migration V1: Authentication, Users & Role Subclasses (PostgreSQL)
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(30),
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin (
    id BIGINT PRIMARY KEY,
    CONSTRAINT fk_admin_user FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS manager (
    id BIGINT PRIMARY KEY,
    committee_designation VARCHAR(100) DEFAULT 'Building Manager',
    office_room_number VARCHAR(50),
    CONSTRAINT fk_manager_user FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resident (
    id BIGINT PRIMARY KEY,
    resident_type VARCHAR(30) DEFAULT 'TENANT', -- 'OWNER_RESIDENT' or 'TENANT'
    nid_passport_number VARCHAR(50),
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(30),
    blood_group VARCHAR(10),
    occupation VARCHAR(100),
    CONSTRAINT fk_resident_user FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS staff (
    id BIGINT PRIMARY KEY,
    specialization VARCHAR(100), -- 'Electrician', 'Plumber', 'Lift Tech', etc.
    CONSTRAINT fk_staff_user FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS security_staff (
    id BIGINT PRIMARY KEY,
    shift_timing VARCHAR(50),    -- 'Day', 'Night'
    gate_station VARCHAR(50),    -- 'Main Gate', 'Basement'
    CONSTRAINT fk_security_staff_user FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    token VARCHAR(255) PRIMARY KEY,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expiry TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
