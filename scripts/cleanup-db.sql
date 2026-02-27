-- Cleanup script to remove unwanted tables from loanops_db
-- Keep only: Agent, AuditLog, Collection, Customer, Loan, Tenant, TenantSettings, User, _prisma_migrations

-- Drop unwanted tables
DROP TABLE IF EXISTS "Area" CASCADE;
DROP TABLE IF EXISTS "CustomerOrder" CASCADE;
DROP TABLE IF EXISTS "DailyBalance" CASCADE;
DROP TABLE IF EXISTS "Expense" CASCADE;
DROP TABLE IF EXISTS "ExpenseType" CASCADE;
DROP TABLE IF EXISTS "GoldItem" CASCADE;
DROP TABLE IF EXISTS "ImportHistory" CASCADE;
DROP TABLE IF EXISTS "Investment" CASCADE;
DROP TABLE IF EXISTS "InvestmentType" CASCADE;
DROP TABLE IF EXISTS "License" CASCADE;
DROP TABLE IF EXISTS "Line" CASCADE;
DROP TABLE IF EXISTS "Permission" CASCADE;
DROP TABLE IF EXISTS "SMSLog" CASCADE;
DROP TABLE IF EXISTS "SMSTemplate" CASCADE;
DROP TABLE IF EXISTS "Site" CASCADE;

-- Verify remaining tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
