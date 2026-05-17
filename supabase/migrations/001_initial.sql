-- Atomberg Goal Portal — initial schema
-- Run in Supabase SQL Editor or: supabase db push

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT NOT NULL CHECK (role IN ('employee', 'manager', 'admin')),
  department TEXT,
  avatar TEXT,
  manager_id TEXT REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  thrust_area TEXT NOT NULL,
  unit_of_measurement TEXT NOT NULL,
  uom_type TEXT NOT NULL CHECK (uom_type IN ('min', 'max', 'timeline', 'zero')),
  target_value DOUBLE PRECISION NOT NULL,
  current_value DOUBLE PRECISION NOT NULL DEFAULT 0,
  weightage INTEGER NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  performance_status TEXT NOT NULL DEFAULT 'not_started',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  is_shared BOOLEAN DEFAULT FALSE,
  shared_by TEXT,
  parent_goal_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  goal_title TEXT NOT NULL,
  goal_description TEXT DEFAULT '',
  submitted_by TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  comments TEXT DEFAULT '',
  history JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL,
  period TEXT NOT NULL,
  progress_value DOUBLE PRECISION NOT NULL,
  notes TEXT DEFAULT '',
  submitted_at TIMESTAMPTZ NOT NULL,
  manager_comment TEXT,
  commented_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  changes JSONB,
  after_lock BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS escalation_rules (
  id TEXT PRIMARY KEY,
  trigger TEXT NOT NULL,
  threshold_days INTEGER NOT NULL,
  notify_roles TEXT[] NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS escalation_logs (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL,
  trigger TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  escalated_to TEXT[] NOT NULL,
  message TEXT NOT NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed demo users (password: password123)
INSERT INTO profiles (id, name, email, password, role, department, avatar, manager_id) VALUES
  ('emp-001', 'Alex Johnson', 'employee@company.com', 'password123', 'employee', 'Engineering', '👨‍💼', 'mgr-001'),
  ('mgr-001', 'Sarah Chen', 'manager@company.com', 'password123', 'manager', 'Engineering', '👩‍💼', NULL),
  ('admin-001', 'Michael Roberts', 'admin@company.com', 'password123', 'admin', 'HR', '👨‍💻', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO escalation_rules (id, trigger, threshold_days, notify_roles, active) VALUES
  ('rule-1', 'goal_not_submitted', 7, ARRAY['manager','admin'], true),
  ('rule-2', 'goal_not_approved', 5, ARRAY['manager','admin'], true),
  ('rule-3', 'checkin_not_completed', 10, ARRAY['manager','admin'], true)
ON CONFLICT (id) DO NOTHING;
