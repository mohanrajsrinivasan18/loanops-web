import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Set the current tenant/business context for RLS.
 * Call at the start of every API request before any queries.
 */
export async function setTenantContext(tenantId: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    `SET app.current_tenant_id = '${tenantId.replace(/'/g, "''")}'`
  );
}

export default prisma;
