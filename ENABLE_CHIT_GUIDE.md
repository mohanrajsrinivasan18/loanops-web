# Enable Chit Funds for All Tenants

## What Changed
CHIT product is now enabled by default for all new tenants. For existing tenants, you need to run a SQL script to enable it.

## For New Tenants
✅ CHIT is automatically enabled when creating a new tenant
- No action needed
- All new signups will have CHIT enabled

## For Existing Tenants
You need to run the SQL script to enable CHIT for existing tenants.

### Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `scripts/enable-chit-for-all-tenants.sql`
5. Click "Run" to execute the script

### Option 2: Using Prisma Studio
```bash
cd loanops-web
npx prisma studio
```
Then manually enable CHIT for each tenant in the TenantProduct table.

### Option 3: Using psql Command Line
```bash
# Connect to your database
psql "postgresql://[user]:[password]@[host]:[port]/[database]"

# Run the script
\i scripts/enable-chit-for-all-tenants.sql
```

## Verification
After running the script, you should see:
- "Chit Funds" link in the web admin sidebar
- "Chit Funds" quick action in the mobile app dashboard
- Ability to create and manage chit funds

## Super Admin Control
Super admins can still disable CHIT for specific tenants:
1. Go to Super Admin → Tenants
2. Click on a tenant
3. Click "Manage Products"
4. Toggle CHIT off/on as needed

## What Gets Enabled
When CHIT is enabled, tenants get access to:
- Create and manage chit funds
- Add members to chits
- Conduct auctions
- Track monthly payments
- View chit reports and analytics
