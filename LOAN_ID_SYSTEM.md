# Smart Loan ID System

## Overview
The loan ID system generates unique, human-readable identifiers for each loan based on tenant, loan type, and sequence.

## Format
```
{TENANT_CODE}-{TYPE}-{YEAR}-{SEQUENCE}
```

### Components:
- **TENANT_CODE**: 3-4 character tenant identifier (e.g., "ABC", "MUM", "DEL")
- **TYPE**: Loan type prefix
  - `D` = Daily loans
  - `W` = Weekly loans
  - `M` = Monthly loans
- **YEAR**: 4-digit year (e.g., 2024, 2025)
- **SEQUENCE**: 3-digit sequential number (001, 002, 003...)

## Examples

### Daily Loans
```
ABC-D-2024-001  → First daily loan for tenant ABC in 2024
ABC-D-2024-002  → Second daily loan for tenant ABC in 2024
MUM-D-2024-015  → 15th daily loan for tenant MUM in 2024
```

### Weekly Loans
```
ABC-W-2024-001  → First weekly loan for tenant ABC in 2024
DEL-W-2024-050  → 50th weekly loan for tenant DEL in 2024
```

### Monthly Loans
```
ABC-M-2024-001  → First monthly loan for tenant ABC in 2024
XYZ-M-2024-123  → 123rd monthly loan for tenant XYZ in 2024
```

## Multi-Tenant Architecture

### How It Works:
1. **Customer Signup**: Any customer can sign up and create their business/tenant
2. **Tenant Creation**: System creates a unique tenant with a code (e.g., "ABC")
3. **Data Isolation**: All data (loans, customers, agents, collections) is isolated per tenant
4. **Agent Assignment**: Business owner assigns agents who login with mobile number
5. **Loan Creation**: When creating a loan, system generates ID based on tenant code + loan type

### Database Structure:
Every table has `tenantId` for complete data isolation:
- ✅ Loans → `tenantId`
- ✅ Customers → `tenantId`
- ✅ Agents → `tenantId`
- ✅ Collections → `tenantId`
- ✅ Lines → `tenantId`

## Benefits

### 1. Human-Readable
- Easy to communicate over phone: "ABC-D-2024-001"
- Clear loan type identification at a glance
- Year-based organization

### 2. Tenant Isolation
- Each tenant has their own sequence
- No ID conflicts between tenants
- Easy to identify which business a loan belongs to

### 3. Searchable & Sortable
- Can search by tenant: "ABC-*"
- Can filter by type: "*-D-*" (all daily loans)
- Can filter by year: "*-2024-*"
- Sequential numbers maintain chronological order

### 4. Scalable
- Supports unlimited tenants
- Supports unlimited loans per tenant
- Sequence resets each year for clean organization

## API Usage

### Creating a Loan
```typescript
POST /api/loans/disburse
{
  "customerId": "cust_123",
  "amount": 50000,
  "loanType": "daily",  // or "weekly" or "monthly"
  "interestRate": 2.5,
  "tenure": 30,
  "tenantId": "tenant_abc"
}

// Response:
{
  "success": true,
  "data": {
    "id": "ABC-D-2024-001",  // Auto-generated
    "amount": 50000,
    "loanType": "daily",
    ...
  }
}
```

### Querying Loans
```typescript
// Get all daily loans for a tenant
GET /api/loans?tenantId=tenant_abc&loanType=daily

// Search by loan ID
GET /api/loans?id=ABC-D-2024-001
```

## Implementation Details

### Generator Function
Located in: `loanops-web/lib/loanIdGenerator.ts`

```typescript
import { generateLoanId } from '@/lib/loanIdGenerator';

// Generate next loan ID
const loanId = await generateLoanId('ABC', 'daily');
// Returns: "ABC-D-2024-001"
```

### Validation
```typescript
import { isValidLoanId, parseLoanId } from '@/lib/loanIdGenerator';

// Validate format
isValidLoanId('ABC-D-2024-001'); // true
isValidLoanId('invalid-id');      // false

// Parse loan ID
const parsed = parseLoanId('ABC-D-2024-001');
// Returns: {
//   tenantCode: 'ABC',
//   loanType: 'daily',
//   year: 2024,
//   sequence: 1
// }
```

## Migration Notes

### Existing Loans
- Old loan IDs (UUID format) will continue to work
- New loans will use the new format
- No migration required for existing data

### Tenant Code Setup
Ensure all tenants have a unique code:
```sql
-- Check tenants without codes
SELECT * FROM "Tenant" WHERE code IS NULL;

-- Update tenant codes if needed
UPDATE "Tenant" SET code = 'ABC' WHERE id = 'tenant_id';
```

## Future Enhancements

### Possible Additions:
1. **Branch/Location Code**: `ABC-MUM-D-2024-001` (tenant-branch-type-year-seq)
2. **Product Code**: `ABC-D-GOLD-2024-001` (for gold loans, vehicle loans, etc.)
3. **Custom Prefixes**: Allow tenants to customize their prefix

## Testing

### Test Scenarios:
1. ✅ Create first loan for new tenant
2. ✅ Create multiple loans of same type (sequence increments)
3. ✅ Create loans of different types (separate sequences)
4. ✅ Create loans in new year (sequence resets)
5. ✅ Multiple tenants creating loans simultaneously (no conflicts)

### Example Test:
```typescript
// Tenant ABC creates loans
const loan1 = await generateLoanId('ABC', 'daily');   // ABC-D-2024-001
const loan2 = await generateLoanId('ABC', 'daily');   // ABC-D-2024-002
const loan3 = await generateLoanId('ABC', 'weekly');  // ABC-W-2024-001
const loan4 = await generateLoanId('ABC', 'monthly'); // ABC-M-2024-001

// Tenant XYZ creates loans (independent sequence)
const loan5 = await generateLoanId('XYZ', 'daily');   // XYZ-D-2024-001
```

## Support

For questions or issues with the loan ID system:
1. Check this documentation
2. Review `loanops-web/lib/loanIdGenerator.ts`
3. Check API endpoints: `/api/loans/route.ts` and `/api/loans/disburse/route.ts`
