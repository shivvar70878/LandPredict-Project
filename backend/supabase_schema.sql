-- ============================================================================
-- LandPredict AI: PostgreSQL & Supabase Cloud Database Schema
-- Project ID: kfeicdqlhgrrogjlbitl
-- Target Database: PostgreSQL 15+ (Supabase Cloud)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. TABLE: users
-- Secure user management with Role-Based Access Control (RBAC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    organization VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL DEFAULT 'Revenue Inspector',
    password_hash VARCHAR(255) NOT NULL,
    is_active SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user authentication lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- 3. TABLE: projects
-- Land Acquisition Corridor records (304 national infrastructure corridors)
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL UNIQUE,
    project_name VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(150) NOT NULL,
    district_code VARCHAR(50) NOT NULL,
    project_type VARCHAR(100) NOT NULL,
    land_type VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    land_area_acres NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    affected_families INT NOT NULL DEFAULT 0,
    num_departments_involved INT NOT NULL DEFAULT 1,
    notification_age_days INT NOT NULL DEFAULT 0,
    acquisition_stage VARCHAR(50) NOT NULL DEFAULT 'Section 3D',
    compensation_status VARCHAR(80) NOT NULL DEFAULT 'In Progress',
    compensation_disbursed_pct NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    possession_status VARCHAR(80) NOT NULL DEFAULT 'Partial Possession',
    legal_disputes_count INT NOT NULL DEFAULT 0,
    court_case_pending INT NOT NULL DEFAULT 0,
    rehabilitation_required INT NOT NULL DEFAULT 0,
    rehabilitation_progress_pct NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    stakeholder_responsiveness_score NUMERIC(5, 2) NOT NULL DEFAULT 5.0,
    historical_dept_performance_score NUMERIC(5, 2) NOT NULL DEFAULT 50.0,
    public_objections_count INT NOT NULL DEFAULT 0,
    pending_approvals_count INT NOT NULL DEFAULT 0,
    budget_utilization_pct NUMERIC(6, 2) NOT NULL DEFAULT 50.0,
    monsoon_season_overlap INT NOT NULL DEFAULT 0,
    delay_days INT NOT NULL DEFAULT 0,
    is_delayed INT NOT NULL DEFAULT 0,
    description TEXT,
    risk_score NUMERIC(6, 2) DEFAULT NULL,
    risk_level VARCHAR(20) DEFAULT 'Low',
    prediction_status VARCHAR(50) DEFAULT 'Evaluated',
    source VARCHAR(30) NOT NULL DEFAULT 'Corridor Master',
    owner_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes for projects query filtering
CREATE INDEX IF NOT EXISTS idx_projects_state ON projects(state);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_delayed ON projects(is_delayed);
CREATE INDEX IF NOT EXISTS idx_projects_proj_id ON projects(project_id);

-- ============================================================================
-- 4. TABLE: portal_registry
-- 12 State Land Revenue and Cadastral GIS Portals
-- ============================================================================
CREATE TABLE IF NOT EXISTS portal_registry (
    id VARCHAR(50) PRIMARY KEY,
    state VARCHAR(80) NOT NULL,
    portal_name VARCHAR(150) NOT NULL,
    department VARCHAR(255) NOT NULL,
    portal_url VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ONLINE',
    latency_ms INT NOT NULL DEFAULT 45,
    total_parcels VARCHAR(80),
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. TABLE: automation_sync_logs
-- Inter-agency data synchronization audit trail (Gati Shakti NMP, Bhoomi Rashi)
-- ============================================================================
CREATE TABLE IF NOT EXISTS automation_sync_logs (
    id SERIAL PRIMARY KEY,
    source VARCHAR(100) NOT NULL,
    sync_type VARCHAR(50) NOT NULL,
    records_synced INT NOT NULL DEFAULT 0,
    layers_synced INT NOT NULL DEFAULT 0,
    portals_active INT NOT NULL DEFAULT 12,
    conflicts_detected INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. TABLE: predictions
-- Machine Learning Dual-Engine Inference Prediction Logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(50),
    delay_probability NUMERIC(6, 2),
    predicted_delayed INT,
    risk_level VARCHAR(20),
    estimated_delay VARCHAR(50),
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. ROW-LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
-- Grants full CRUD capabilities to anon & authenticated client roles
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated full access (SELECT, INSERT, UPDATE, DELETE)
DO $$
BEGIN
    -- users policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_all_access') THEN
        CREATE POLICY "users_all_access" ON users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    -- projects policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'projects_all_access') THEN
        CREATE POLICY "projects_all_access" ON projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    -- portal_registry policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'portal_registry' AND policyname = 'portal_registry_all_access') THEN
        CREATE POLICY "portal_registry_all_access" ON portal_registry FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    -- automation_sync_logs policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_sync_logs' AND policyname = 'automation_sync_logs_all_access') THEN
        CREATE POLICY "automation_sync_logs_all_access" ON automation_sync_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    -- predictions policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'predictions' AND policyname = 'predictions_all_access') THEN
        CREATE POLICY "predictions_all_access" ON predictions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ============================================================================
-- 8. DEFAULT SEED DATA
-- Populate default RBAC accounts and 12 State Land Revenue Portals
-- ============================================================================

-- Seed 5 RBAC Users
INSERT INTO users (first_name, last_name, email, organization, role, password_hash, is_active)
VALUES
    ('Admin', 'User', 'admin@landpredict.gov.in', 'Ministry of Road Transport & Highways', 'Administrator', 'e6378e904b77f2ef8bc667107bfefeb4a1936c6a4d70ecce0dff5606d50ffec6', 1),
    ('CALA', 'Director', 'cala.morth@gov.in', 'NHAI CALA Division', 'CALA Project Director', 'f0907d8d266ff85223c72d6ef8d4b31a1961250280eb4c29774620f4c1eb02c7', 1),
    ('Revenue', 'Inspector', 'revenue.officer@gov.in', 'State Revenue Department', 'Revenue Inspector', '67d14d24177d7fae29cbe26dbbfa1bcfae5c3e66bb1df42f1f00880ca51d2f97', 1),
    ('Public', 'Auditor', 'auditor@sih.gov.in', 'Smart India Hackathon Evaluation', 'Public Auditor', '3781559868fb8d59fa9da86f1e292025624778ae9ea4518bf97b539c0ad146e2', 1),
    ('Shiv', 'Verma', 'shivvar70878@gmail.com', 'IIMT / LandPredict', 'Administrator', '71e72e8bc5ee3f3176fa1c3aa4e71958b438ea22f87ee866f272a561168f8045', 1)
ON CONFLICT (email) DO NOTHING;

-- Seed 12 State Revenue Portals
INSERT INTO portal_registry (id, state, portal_name, department, portal_url, status, latency_ms, total_parcels)
VALUES
    ('portal_up', 'Uttar Pradesh', 'UP Bhulekh & BhuNaksha', 'Revenue Board UP', 'https://upbhulekh.gov.in', 'ONLINE', 38, '2.4 Cr'),
    ('portal_mh', 'Maharashtra', 'Mahabhulekh & MahaBhunaksha', 'Revenue & Forest Dept MH', 'https://bhulekh.mahabhumi.gov.in', 'ONLINE', 42, '3.1 Cr'),
    ('portal_gj', 'Gujarat', 'AnyROR Anywhere', 'Revenue Department Gujarat', 'https://anyror.gujarat.gov.in', 'ONLINE', 34, '1.8 Cr'),
    ('portal_ka', 'Karnataka', 'Bhoomi & Dishaank', 'Revenue Department Karnataka', 'https://landrecords.karnataka.gov.in', 'ONLINE', 48, '1.6 Cr'),
    ('portal_br', 'Bihar', 'Bihar Bhumi Dakhil Kharij', 'Dept of Revenue & Land Reforms', 'https://biharbhumi.bihar.gov.in', 'ONLINE', 52, '1.9 Cr'),
    ('portal_wb', 'West Bengal', 'BanglarBhumi', 'Land & Land Reforms Dept WB', 'https://banglarbhumi.gov.in', 'ONLINE', 45, '2.2 Cr'),
    ('portal_mp', 'Madhya Pradesh', 'MP Bhulekh', 'Revenue Dept Madhya Pradesh', 'https://mpbhulekh.gov.in', 'ONLINE', 36, '2.0 Cr'),
    ('portal_rj', 'Rajasthan', 'Apna Khata (E-Dharti)', 'Revenue Board Rajasthan', 'https://apnakhata.rajasthan.gov.in', 'ONLINE', 41, '1.7 Cr'),
    ('portal_ap', 'Andhra Pradesh', 'Meebhoomi Adangal', 'Revenue Department AP', 'https://meebhoomi.ap.gov.in', 'ONLINE', 39, '1.5 Cr'),
    ('portal_tn', 'Tamil Nadu', 'Tamil Nilam Patta Chitta', 'Survey & Settlement Dept TN', 'https://eservices.tn.gov.in', 'ONLINE', 44, '1.4 Cr'),
    ('portal_od', 'Odisha', 'Bhulekh Odisha', 'Revenue & Disaster Management', 'https://bhulekh.ori.nic.in', 'ONLINE', 50, '1.2 Cr'),
    ('portal_ts', 'Telangana', 'Dharani Integrated Land Record', 'Registration & Stamps Dept TS', 'https://dharani.telangana.gov.in', 'ONLINE', 37, '1.3 Cr')
ON CONFLICT (id) DO NOTHING;
