-- ============================================================
-- SUPABASE RLS SETUP — Run AFTER: npx prisma migrate deploy
-- Paste this in Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- Helper: get current business from session variable
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS TEXT AS $$
  SELECT COALESCE(current_setting('app.current_tenant_id', true), '');
$$ LANGUAGE sql STABLE;

-- Enable RLS on all tables
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Agent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Loan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Collection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Line" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LineDailyFinance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Expense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Tenant: only see your own business
CREATE POLICY "tenant_all" ON "Tenant" FOR ALL USING ("id" = current_tenant_id()) WITH CHECK ("id" = current_tenant_id());

-- TenantSettings
CREATE POLICY "settings_all" ON "TenantSettings" FOR ALL USING ("tenantId" = current_tenant_id()) WITH CHECK ("tenantId" = current_tenant_id());

-- User (tenantId nullable for super_admins)
CREATE POLICY "user_all" ON "User" FOR ALL USING ("tenantId" = current_tenant_id() OR "tenantId" IS NULL) WITH CHECK ("tenantId" = current_tenant_id() OR "tenantId" IS NULL);

-- Agent
CREATE POLICY "agent_all" ON "Agent" FOR ALL USING ("tenantId" = current_tenant_id()) WITH CHECK ("tenantId" = current_tenant_id());

-- Customer
CREATE POLICY "customer_all" ON "Customer" FOR ALL USING ("tenantId" = current_tenant_id()) WITH CHECK ("tenantId" = current_tenant_id());

-- Loan
CREATE POLICY "loan_all" ON "Loan" FOR ALL USING ("tenantId" = current_tenant_id()) WITH CHECK ("tenantId" = current_tenant_id());

-- Collection
CREATE POLICY "collection_all" ON "Collection" FOR ALL USING ("tenantId" = current_tenant_id()) WITH CHECK ("tenantId" = current_tenant_id());

-- Line
CREATE POLICY "line_all" ON "Line" FOR ALL USING ("tenantId" = current_tenant_id()) WITH CHECK ("tenantId" = current_tenant_id());

-- LineDailyFinance
CREATE POLICY "ldf_all" ON "LineDailyFinance" FOR ALL USING ("tenantId" = current_tenant_id()) WITH CHECK ("tenantId" = current_tenant_id());

-- Expense
CREATE POLICY "expense_all" ON "Expense" FOR ALL USING ("tenantId" = current_tenant_id()) WITH CHECK ("tenantId" = current_tenant_id());

-- Transaction
CREATE POLICY "transaction_all" ON "Transaction" FOR ALL USING ("tenantId" = current_tenant_id()) WITH CHECK ("tenantId" = current_tenant_id());

-- AuditLog (tenantId nullable)
CREATE POLICY "audit_all" ON "AuditLog" FOR ALL USING ("tenantId" = current_tenant_id() OR "tenantId" IS NULL) WITH CHECK ("tenantId" = current_tenant_id() OR "tenantId" IS NULL);
