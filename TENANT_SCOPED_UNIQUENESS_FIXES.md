# Tenant-Scoped Uniqueness Fixes

## Issue
Uniqueness checks were being performed across the entire database instead of being scoped to individual tenants. This prevented different tenants from using the same names/phone numbers for their own data.

## Fixed APIs

### 1. Lines API (`/app/api/lines/route.ts`)
**Fixed**: Line name uniqueness check
- **Before**: Checked if line name exists globally
- **After**: Checks if line name exists within the same tenant AND is active
- **Code**: Added `tenantId` and `status: 'active'` to the where clause

```typescript
const existingLine = await prisma.line.findFirst({
  where: {
    name,
    tenantId,
    status: 'active', // Only check active lines
  },
});
```

### 2. Agents API (`/app/api/agents/route.ts`)
**Fixed**: Agent phone number uniqueness check
- **Before**: Checked if phone exists globally
- **After**: Checks if phone exists within the same tenant
- **Code**: Added `tenantId` to the where clause

```typescript
const existingByPhone = await prisma.user.findFirst({ 
  where: { 
    phone,
    tenantId: finalTenantId,
  } 
});
```

### 3. Agents Register API (`/app/api/agents/register/route.ts`)
**Fixed**: Agent phone number uniqueness check during registration
- **Before**: Checked if phone exists globally
- **After**: Checks if phone exists within the same tenant
- **Code**: Added `tenantId` to the where clause

```typescript
const existingByPhone = await prisma.user.findFirst({ 
  where: { 
    phone,
    tenantId,
  } 
});
```

## Not Changed (Intentionally)

### 1. Tenant Codes (`/app/api/super-admin/tenants/route.ts`)
**Status**: Remains globally unique
**Reason**: Tenant codes must be unique across all tenants as they serve as global identifiers

### 2. Customer Phone Numbers (`/app/api/customers/route.ts`)
**Status**: No uniqueness check
**Reason**: 
- Customers can legitimately share phone numbers (family members)
- Different tenants can have customers with the same phone number
- If needed in the future, can add optional tenant-scoped check

## Impact

### Before Fix
- Tenant A creates a line called "North Route" ✅
- Tenant B tries to create "North Route" ❌ (Error: already exists)
- Tenant A creates agent with phone "9876543210" ✅
- Tenant B tries to create agent with phone "9876543210" ❌ (Error: already exists)

### After Fix
- Tenant A creates a line called "North Route" ✅
- Tenant B creates "North Route" ✅ (Different tenant, allowed)
- Tenant A creates agent with phone "9876543210" ✅
- Tenant B creates agent with phone "9876543210" ✅ (Different tenant, allowed)
- Tenant A tries to create another line "North Route" ❌ (Same tenant, not allowed)

## Error Messages Updated
- Lines: "Line with this name already exists for your organization"
- Agents: "Phone number already registered in your organization"

## Testing Recommendations
1. Create lines with same name in different tenants ✅
2. Create agents with same phone in different tenants ✅
3. Try to create duplicate line name in same tenant ❌
4. Try to create duplicate agent phone in same tenant ❌
5. Verify inactive lines don't block new line creation ✅
