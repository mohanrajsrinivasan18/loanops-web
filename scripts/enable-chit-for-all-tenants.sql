-- Enable CHIT product for all existing tenants
-- Run this script to enable chit funds for all tenants in the database

-- First, insert CHIT product for tenants that don't have it yet
INSERT INTO "TenantProduct" ("id", "tenantId", "productType", "enabled", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  t.id,
  'CHIT',
  true,
  NOW(),
  NOW()
FROM "Tenant" t
WHERE NOT EXISTS (
  SELECT 1 FROM "TenantProduct" tp 
  WHERE tp."tenantId" = t.id AND tp."productType" = 'CHIT'
);

-- Update existing CHIT products to enabled
UPDATE "TenantProduct"
SET "enabled" = true, "updatedAt" = NOW()
WHERE "productType" = 'CHIT' AND "enabled" = false;

-- Verify the changes
SELECT 
  t.name as tenant_name,
  t.code as tenant_code,
  tp."productType",
  tp.enabled
FROM "Tenant" t
LEFT JOIN "TenantProduct" tp ON t.id = tp."tenantId"
WHERE tp."productType" = 'CHIT'
ORDER BY t.name;
