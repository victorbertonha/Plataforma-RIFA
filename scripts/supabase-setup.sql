-- ============================================================
-- Supabase Setup Script for RIFA Project
-- Execute this in Supabase SQL Editor
-- ============================================================

-- Drop existing objects (use with caution in production)
-- DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP TABLE IF EXISTS profiles;

-- ============================================================
-- 1. Create Profiles Table
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  cpf VARCHAR(14) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. Create Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON profiles(cpf);

-- ============================================================
-- 3. Create Updated At Trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. Enable Row Level Security (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. Create RLS Policies
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for signup" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile during signup
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Allow inserting without auth for public signup
CREATE POLICY "Enable insert for signup"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 6. Optional: Create Admin Role (if you need it)
-- ============================================================

-- Uncomment to create an admin policy
-- CREATE POLICY "Admins can read all profiles"
--   ON profiles FOR SELECT
--   USING (
--     auth.uid() IN (
--       SELECT id FROM profiles 
--       WHERE email IN ('admin@example.com', 'superadmin@example.com')
--     )
--   );

-- ============================================================
-- 7. Create Storage Buckets (Optional)
-- ============================================================

-- Uncomment if you need profile pictures or documents storage

-- insert into storage.buckets (id, name, public)
-- values ('avatars', 'avatars', true);

-- create policy "Avatar images are publicly accessible."
--   on storage.objects for select
--   using (bucket_id = 'avatars');

-- create policy "Anyone can upload an avatar."
--   on storage.objects for insert
--   with check (bucket_id = 'avatars');

-- create policy "Anyone can update their own avatar."
--   on storage.objects for update
--   using (auth.uid()::text = (storage.foldername(name))[1])
--   with check (bucket_id = 'avatars');

-- ============================================================
-- 8. Verify Setup
-- ============================================================

-- Run these queries to verify the setup:

-- Check if table exists
-- SELECT * FROM information_schema.tables WHERE table_name = 'profiles';

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Check indexes
-- SELECT * FROM pg_indexes WHERE tablename = 'profiles';

-- ============================================================
-- End of Setup Script
-- ============================================================
