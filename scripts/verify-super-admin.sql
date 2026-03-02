-- Verify and Fix Super Admin User
-- Run this in Supabase SQL Editor

-- Step 1: Check if super admin user exists
SELECT 
  id, 
  name, 
  phone, 
  email, 
  role, 
  "tenantId",
  status,
  "createdAt"
FROM "User" 
WHERE phone = '9999999999';

-- Step 2: If user exists but role is wrong, update it
UPDATE "User" 
SET role = 'super_admin'
WHERE phone = '9999999999'
AND role != 'super_admin';

-- Step 3: Verify the update
SELECT 
  id, 
  name, 
  phone, 
  role,
  CASE 
    WHEN role = 'super_admin' THEN '✅ Correct'
    ELSE '❌ Wrong role'
  END as status
FROM "User" 
WHERE phone = '9999999999';

-- Step 4: If no user found, check all users
SELECT 
  id,
  name,
  phone,
  email,
  role
FROM "User"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Step 5: Check if any super admin exists
SELECT 
  COUNT(*) as super_admin_count,
  string_agg(name || ' (' || phone || ')', ', ') as super_admins
FROM "User"
WHERE role = 'super_admin';
