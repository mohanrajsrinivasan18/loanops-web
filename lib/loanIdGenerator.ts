/**
 * Loan ID Generator
 * Generates unique loan IDs with format: {TENANT_CODE}-{TYPE}-{YEAR}-{SEQUENCE}
 * Examples: ABC-D-2024-001, XYZ-W-2024-015, MUM-M-2024-123
 */

import { prisma } from '@/lib/prisma';

export type LoanType = 'daily' | 'weekly' | 'monthly';

/**
 * Get loan type prefix
 * D = Daily, W = Weekly, M = Monthly
 */
function getLoanTypePrefix(loanType: LoanType): string {
  const prefixMap: Record<LoanType, string> = {
    daily: 'D',
    weekly: 'W',
    monthly: 'M',
  };
  return prefixMap[loanType] || 'M';
}

/**
 * Generate next loan ID for a tenant
 * @param tenantCode - Tenant code (e.g., "ABC", "MUM")
 * @param loanType - Type of loan (daily, weekly, monthly)
 * @returns Promise<string> - Generated loan ID
 */
export async function generateLoanId(
  tenantCode: string,
  loanType: LoanType
): Promise<string> {
  const year = new Date().getFullYear();
  const typePrefix = getLoanTypePrefix(loanType);
  const pattern = `${tenantCode}-${typePrefix}-${year}-%`;

  // Find the last loan with this pattern
  const lastLoan = await prisma.loan.findFirst({
    where: {
      id: {
        startsWith: `${tenantCode}-${typePrefix}-${year}-`,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
    },
  });

  let nextSequence = 1;

  if (lastLoan) {
    // Extract sequence number from last loan ID
    // Format: ABC-D-2024-001
    const parts = lastLoan.id.split('-');
    if (parts.length === 4) {
      const lastSequence = parseInt(parts[3], 10);
      if (!isNaN(lastSequence)) {
        nextSequence = lastSequence + 1;
      }
    }
  }

  // Format sequence with leading zeros (3 digits)
  const sequenceStr = String(nextSequence).padStart(3, '0');

  return `${tenantCode}-${typePrefix}-${year}-${sequenceStr}`;
}

/**
 * Validate loan ID format
 * @param loanId - Loan ID to validate
 * @returns boolean - True if valid format
 */
export function isValidLoanId(loanId: string): boolean {
  // Format: ABC-D-2024-001
  const pattern = /^[A-Z0-9]+-[DWM]-\d{4}-\d{3,}$/;
  return pattern.test(loanId);
}

/**
 * Parse loan ID to extract components
 * @param loanId - Loan ID to parse
 * @returns Object with tenant code, type, year, sequence
 */
export function parseLoanId(loanId: string): {
  tenantCode: string;
  loanType: string;
  year: number;
  sequence: number;
} | null {
  if (!isValidLoanId(loanId)) {
    return null;
  }

  const parts = loanId.split('-');
  const typeMap: Record<string, string> = {
    D: 'daily',
    W: 'weekly',
    M: 'monthly',
  };

  return {
    tenantCode: parts[0],
    loanType: typeMap[parts[1]] || 'monthly',
    year: parseInt(parts[2], 10),
    sequence: parseInt(parts[3], 10),
  };
}
