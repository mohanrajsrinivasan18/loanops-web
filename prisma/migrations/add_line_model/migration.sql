-- CreateTable
CREATE TABLE "Line" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'daily',
    "interestRate" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "agentId" TEXT,
    "tenantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Line_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Line_agentId_idx" ON "Line"("agentId");

-- CreateIndex
CREATE INDEX "Line_tenantId_idx" ON "Line"("tenantId");

-- CreateIndex
CREATE INDEX "Line_area_idx" ON "Line"("area");

-- CreateIndex
CREATE INDEX "Line_status_idx" ON "Line"("status");

-- AddForeignKey
ALTER TABLE "Line" ADD CONSTRAINT "Line_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Line" ADD CONSTRAINT "Line_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add lineId to Customer table
ALTER TABLE "Customer" ADD COLUMN "lineId" TEXT;

-- CreateIndex
CREATE INDEX "Customer_lineId_idx" ON "Customer"("lineId");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("id") ON DELETE SET NULL ON UPDATE CASCADE;
