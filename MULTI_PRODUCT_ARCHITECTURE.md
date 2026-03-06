# Multi-Product Architecture Guide

## Current State
Your platform currently handles only **Loans** with a `loanType` field. To support multiple financial products (Chit, Gold Loan, Personal Loan, etc.), you need proper product differentiation.

## Recommended Architecture

### Option 1: Product-Based Models (Recommended)

Create separate models for each product type with shared base functionality.

```prisma
// ============================================================
// BASE PRODUCT (Abstract)
// ============================================================

// Common fields for all products
enum ProductType {
  LOAN
  CHIT
  GOLD_LOAN
  PERSONAL_LOAN
  BUSINESS_LOAN
}

// ============================================================
// LOAN PRODUCT
// ============================================================

model Loan {
  id           String       @id @default(cuid())
  customerId   String
  amount       Float
  interestRate Float
  tenure       Int
  emi          Float
  outstanding  Float
  loanType     String       @default("monthly")  // daily, weekly, monthly
  status       String       @default("active")
  startDate    DateTime
  endDate      DateTime?
  agentId      String?
  tenantId     String
  productType  String       @default("LOAN")
  metadata     Json?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  
  Collection   Collection[]
  Agent        Agent?       @relation(fields: [agentId], references: [id])
  Customer     Customer     @relation(fields: [customerId], references: [id])
  Tenant       Tenant       @relation(fields: [tenantId], references: [id])

  @@index([agentId])
  @@index([customerId])
  @@index([status])
  @@index([tenantId])
  @@index([productType])
}

// ============================================================
// CHIT PRODUCT
// ============================================================

model Chit {
  id              String       @id @default(cuid())
  chitName        String       // e.g., "Chit Group A"
  chitValue       Float        // Total chit value
  duration        Int          // Duration in months
  memberCount     Int          // Number of members
  monthlyAmount   Float        // Monthly contribution per member
  status          String       @default("active")
  startDate       DateTime
  endDate         DateTime?
  agentId         String?
  tenantId        String
  productType     String       @default("CHIT")
  metadata        Json?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  ChitMembers     ChitMember[]
  ChitAuctions    ChitAuction[]
  Agent           Agent?       @relation(fields: [agentId], references: [id])
  Tenant          Tenant       @relation(fields: [tenantId], references: [id])

  @@index([agentId])
  @@index([status])
  @@index([tenantId])
  @@index([productType])
}

model ChitMember {
  id              String       @id @default(cuid())
  chitId          String
  customerId      String
  memberNumber    Int          // Member position in chit
  status          String       @default("active")
  hasWonAuction   Boolean      @default(false)
  wonAuctionMonth Int?
  tenantId        String
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  Chit            Chit         @relation(fields: [chitId], references: [id])
  Customer        Customer     @relation(fields: [customerId], references: [id])
  Payments        ChitPayment[]

  @@unique([chitId, memberNumber, tenantId])
  @@index([chitId])
  @@index([customerId])
  @@index([tenantId])
}

model ChitAuction {
  id              String       @id @default(cuid())
  chitId          String
  monthNumber     Int
  auctionDate     DateTime
  winnerMemberId  String?
  bidAmount       Float?
  dividendAmount  Float?       // Amount distributed to other members
  status          String       @default("pending")
  tenantId        String
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  Chit            Chit         @relation(fields: [chitId], references: [id])

  @@unique([chitId, monthNumber, tenantId])
  @@index([chitId])
  @@index([tenantId])
}

model ChitPayment {
  id              String       @id @default(cuid())
  chitMemberId    String
  monthNumber     Int
  amount          Float
  paymentDate     DateTime?
  status          String       @default("pending")
  tenantId        String
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  ChitMember      ChitMember   @relation(fields: [chitMemberId], references: [id])

  @@index([chitMemberId])
  @@index([tenantId])
}

// ============================================================
// GOLD LOAN PRODUCT
// ============================================================

model GoldLoan {
  id              String       @id @default(cuid())
  customerId      String
  goldWeight      Float        // in grams
  goldPurity      String       // 22K, 24K, etc.
  goldValue       Float        // Market value
  loanAmount      Float        // Loan given (usually 75% of gold value)
  interestRate    Float
  tenure          Int
  outstanding     Float
  status          String       @default("active")
  pledgeDate      DateTime
  releaseDate     DateTime?
  agentId         String?
  tenantId        String
  productType     String       @default("GOLD_LOAN")
  metadata        Json?        // Store gold item details, photos, etc.
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  Collection      Collection[]
  Agent           Agent?       @relation(fields: [agentId], references: [id])
  Customer        Customer     @relation(fields: [customerId], references: [id])
  Tenant          Tenant       @relation(fields: [tenantId], references: [id])

  @@index([agentId])
  @@index([customerId])
  @@index([status])
  @@index([tenantId])
  @@index([productType])
}
```

### Option 2: Single Product Model with Type Discrimination

Use a single `Product` model with type-specific JSON metadata.

```prisma
model Product {
  id              String       @id @default(cuid())
  productType     ProductType  // LOAN, CHIT, GOLD_LOAN, etc.
  customerId      String?      // Nullable for chits (multiple customers)
  amount          Float
  status          String       @default("active")
  startDate       DateTime
  endDate         DateTime?
  agentId         String?
  tenantId        String
  
  // Type-specific data stored as JSON
  loanData        Json?        // For LOAN type
  chitData        Json?        // For CHIT type
  goldLoanData    Json?        // For GOLD_LOAN type
  
  metadata        Json?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  Collection      Collection[]
  Agent           Agent?       @relation(fields: [agentId], references: [id])
  Customer        Customer?    @relation(fields: [customerId], references: [id])
  Tenant          Tenant       @relation(fields: [tenantId], references: [id])

  @@index([productType])
  @@index([agentId])
  @@index([customerId])
  @@index([status])
  @@index([tenantId])
}
```

## Recommended: Option 1 (Separate Models)

**Why?**
1. ✅ Type safety - Each product has specific fields
2. ✅ Better queries - No need to filter by type
3. ✅ Easier validation - Product-specific rules
4. ✅ Clearer code - Separate services for each product
5. ✅ Scalable - Easy to add new products

## Code Organization

### Backend Structure

```
loanops-web/
├── app/
│   └── api/
│       ├── loans/              # Loan product APIs
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   └── calculate/route.ts
│       ├── chits/              # Chit product APIs
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   ├── auctions/route.ts
│       │   └── members/route.ts
│       ├── gold-loans/         # Gold loan APIs
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       └── products/           # Common product APIs
│           └── route.ts
├── lib/
│   ├── services/
│   │   ├── loanService.ts      # Loan business logic
│   │   ├── chitService.ts      # Chit business logic
│   │   ├── goldLoanService.ts  # Gold loan business logic
│   │   └── productService.ts   # Common product logic
│   └── validators/
│       ├── loanValidator.ts
│       ├── chitValidator.ts
│       └── goldLoanValidator.ts
```

### Frontend Structure

```
loanops-web/
├── app/
│   └── (dashboard)/
│       ├── loans/              # Loan management
│       │   ├── page.tsx
│       │   ├── [id]/page.tsx
│       │   └── create/page.tsx
│       ├── chits/              # Chit management
│       │   ├── page.tsx
│       │   ├── [id]/page.tsx
│       │   ├── create/page.tsx
│       │   └── auctions/page.tsx
│       ├── gold-loans/         # Gold loan management
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       └── products/           # All products view
│           └── page.tsx
├── components/
│   ├── loans/                  # Loan components
│   │   ├── LoanCard.tsx
│   │   ├── LoanForm.tsx
│   │   └── LoanList.tsx
│   ├── chits/                  # Chit components
│   │   ├── ChitCard.tsx
│   │   ├── ChitForm.tsx
│   │   ├── ChitAuction.tsx
│   │   └── ChitMemberList.tsx
│   └── gold-loans/             # Gold loan components
│       ├── GoldLoanCard.tsx
│       └── GoldLoanForm.tsx
```

### Mobile App Structure

```
mobile-app/
├── src/
│   ├── products/
│   │   ├── loans/              # Loan screens
│   │   │   ├── LoanList.tsx
│   │   │   ├── LoanDetails.tsx
│   │   │   └── CreateLoan.tsx
│   │   ├── chits/              # Chit screens
│   │   │   ├── ChitList.tsx
│   │   │   ├── ChitDetails.tsx
│   │   │   ├── ChitAuction.tsx
│   │   │   └── CreateChit.tsx
│   │   └── gold-loans/         # Gold loan screens
│   │       ├── GoldLoanList.tsx
│   │       └── CreateGoldLoan.tsx
│   └── services/
│       ├── loanService.ts
│       ├── chitService.ts
│       └── goldLoanService.ts
```

## Navigation Structure

### Web Admin

```
Dashboard
├── Products (Overview)
│   ├── All Products
│   ├── Loans
│   ├── Chits
│   └── Gold Loans
├── Loans
│   ├── Active Loans
│   ├── Create Loan
│   └── Loan Reports
├── Chits
│   ├── Active Chits
│   ├── Create Chit
│   ├── Auctions
│   └── Chit Reports
└── Gold Loans
    ├── Active Gold Loans
    ├── Create Gold Loan
    └── Gold Loan Reports
```

### Mobile App

```
Home
├── Products Tab
│   ├── Loans
│   ├── Chits
│   └── Gold Loans
├── Collections Tab
│   ├── Loan Collections
│   ├── Chit Payments
│   └── Gold Loan Collections
└── Customers Tab
    └── Customer Products
```

## Implementation Steps

### Phase 1: Add Chit Model (Week 1)
1. ✅ Add Chit, ChitMember, ChitAuction, ChitPayment models
2. ✅ Create migration
3. ✅ Update Tenant relations
4. ✅ Update Customer relations

### Phase 2: Backend APIs (Week 2)
1. ✅ Create chit CRUD APIs
2. ✅ Create chit member APIs
3. ✅ Create auction APIs
4. ✅ Create payment tracking APIs

### Phase 3: Frontend (Week 3)
1. ✅ Create chit management pages
2. ✅ Create chit forms
3. ✅ Create auction interface
4. ✅ Create member management

### Phase 4: Mobile App (Week 4)
1. ✅ Add chit screens
2. ✅ Add chit payment collection
3. ✅ Add auction participation
4. ✅ Update navigation

## Benefits of This Architecture

### Scalability
- Easy to add new products (Insurance, Savings, etc.)
- Each product is independent
- No breaking changes when adding products

### Maintainability
- Clear separation of concerns
- Product-specific logic isolated
- Easy to debug and test

### Performance
- Optimized queries per product
- No unnecessary joins
- Better indexing

### User Experience
- Product-specific workflows
- Tailored UI for each product
- Better reporting per product

## Future Products

With this architecture, you can easily add:

1. **Personal Loans** - Unsecured loans
2. **Business Loans** - For businesses
3. **Insurance Products** - Life, health insurance
4. **Savings Schemes** - Recurring deposits
5. **Investment Products** - Mutual funds, etc.

Each product gets its own:
- Database model
- API routes
- Service layer
- UI components
- Mobile screens

## Migration Path

### Step 1: Keep Current Loans
```sql
-- No changes to existing Loan model
-- It continues to work as-is
```

### Step 2: Add New Products
```sql
-- Add Chit model alongside Loan
-- Add GoldLoan model alongside Loan
```

### Step 3: Unified Product View (Optional)
```typescript
// Create a unified product service
export const productService = {
  getAllProducts: async (tenantId: string) => {
    const loans = await prisma.loan.findMany({ where: { tenantId } });
    const chits = await prisma.chit.findMany({ where: { tenantId } });
    const goldLoans = await prisma.goldLoan.findMany({ where: { tenantId } });
    
    return {
      loans,
      chits,
      goldLoans,
      total: loans.length + chits.length + goldLoans.length,
    };
  },
};
```

## Conclusion

**Recommendation**: Implement Option 1 (Separate Models) with the code organization structure above.

This gives you:
- ✅ Clear product differentiation
- ✅ Easy to add new products
- ✅ Type-safe code
- ✅ Better performance
- ✅ Scalable architecture

Start by adding the Chit model, then expand to other products as needed.
