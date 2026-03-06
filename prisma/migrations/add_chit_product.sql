-- Add Chit Product Models
-- This migration adds support for Chit Fund products

-- Create Chit table
CREATE TABLE "Chit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chitName" TEXT NOT NULL,
    "chitValue" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL,
    "memberCount" INTEGER NOT NULL,
    "monthlyAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "agentId" TEXT,
    "tenantId" TEXT NOT NULL,
    "productType" TEXT NOT NULL DEFAULT 'CHIT',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "Chit_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Chit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create ChitMember table
CREATE TABLE "ChitMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chitId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "memberNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "hasWonAuction" BOOLEAN NOT NULL DEFAULT false,
    "wonAuctionMonth" INTEGER,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "ChitMember_chitId_fkey" FOREIGN KEY ("chitId") REFERENCES "Chit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChitMember_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChitMember_chitId_memberNumber_tenantId_key" UNIQUE ("chitId", "memberNumber", "tenantId")
);

-- Create ChitAuction table
CREATE TABLE "ChitAuction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chitId" TEXT NOT NULL,
    "monthNumber" INTEGER NOT NULL,
    "auctionDate" TIMESTAMP(3) NOT NULL,
    "winnerMemberId" TEXT,
    "bidAmount" DOUBLE PRECISION,
    "dividendAmount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "ChitAuction_chitId_fkey" FOREIGN KEY ("chitId") REFERENCES "Chit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChitAuction_chitId_monthNumber_tenantId_key" UNIQUE ("chitId", "monthNumber", "tenantId")
);

-- Create ChitPayment table
CREATE TABLE "ChitPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chitId" TEXT NOT NULL,
    "chitMemberId" TEXT NOT NULL,
    "monthNumber" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "ChitPayment_chitId_fkey" FOREIGN KEY ("chitId") REFERENCES "Chit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChitPayment_chitMemberId_fkey" FOREIGN KEY ("chitMemberId") REFERENCES "ChitMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create indexes for Chit
CREATE INDEX "Chit_agentId_idx" ON "Chit"("agentId");
CREATE INDEX "Chit_status_idx" ON "Chit"("status");
CREATE INDEX "Chit_tenantId_idx" ON "Chit"("tenantId");
CREATE INDEX "Chit_productType_idx" ON "Chit"("productType");

-- Create indexes for ChitMember
CREATE INDEX "ChitMember_chitId_idx" ON "ChitMember"("chitId");
CREATE INDEX "ChitMember_customerId_idx" ON "ChitMember"("customerId");
CREATE INDEX "ChitMember_tenantId_idx" ON "ChitMember"("tenantId");

-- Create indexes for ChitAuction
CREATE INDEX "ChitAuction_chitId_idx" ON "ChitAuction"("chitId");
CREATE INDEX "ChitAuction_tenantId_idx" ON "ChitAuction"("tenantId");

-- Create indexes for ChitPayment
CREATE INDEX "ChitPayment_chitId_idx" ON "ChitPayment"("chitId");
CREATE INDEX "ChitPayment_chitMemberId_idx" ON "ChitPayment"("chitMemberId");
CREATE INDEX "ChitPayment_tenantId_idx" ON "ChitPayment"("tenantId");
