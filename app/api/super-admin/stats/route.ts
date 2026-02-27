import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

/**
 * GET /api/super-admin/stats
 * Get aggregated statistics for all tenants (Super Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Get all tenants with their statistics
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            Customer: true,
            Loan: true,
            Agent: true,
            User: true,
          },
        },
        Loan: {
          where: {
            status: 'active',
          },
          select: {
            amount: true,
            outstanding: true,
          },
        },
      },
    });

    // Calculate statistics for each tenant
    const tenantStats = tenants.map((tenant) => {
      const totalDisbursed = tenant.Loan.reduce((sum, loan) => sum + loan.amount, 0);
      const totalOutstanding = tenant.Loan.reduce((sum, loan) => sum + loan.outstanding, 0);
      const totalCollected = totalDisbursed - totalOutstanding;

      return {
        id: tenant.id,
        name: tenant.name,
        code: tenant.code,
        status: tenant.status,
        plan: tenant.plan,
        createdAt: tenant.createdAt,
        stats: {
          customers: tenant._count.Customer,
          agents: tenant._count.Agent,
          users: tenant._count.User,
          loans: {
            total: tenant._count.Loan,
            active: tenant.Loan.length,
          },
          financial: {
            totalDisbursed,
            totalOutstanding,
            totalCollected,
          },
        },
      };
    });

    // Calculate overall statistics
    const overallStats = {
      totalTenants: tenants.length,
      activeTenants: tenants.filter((t) => t.status === 'active').length,
      trialTenants: tenants.filter((t) => t.status === 'trial').length,
      suspendedTenants: tenants.filter((t) => t.status === 'suspended').length,
      totalCustomers: tenantStats.reduce((sum, t) => sum + t.stats.customers, 0),
      totalAgents: tenantStats.reduce((sum, t) => sum + t.stats.agents, 0),
      totalUsers: tenantStats.reduce((sum, t) => sum + t.stats.users, 0),
      totalLoans: tenantStats.reduce((sum, t) => sum + t.stats.loans.total, 0),
      activeLoans: tenantStats.reduce((sum, t) => sum + t.stats.loans.active, 0),
      totalDisbursed: tenantStats.reduce((sum, t) => sum + t.stats.financial.totalDisbursed, 0),
      totalOutstanding: tenantStats.reduce((sum, t) => sum + t.stats.financial.totalOutstanding, 0),
      totalCollected: tenantStats.reduce((sum, t) => sum + t.stats.financial.totalCollected, 0),
    };

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: {
        overall: overallStats,
        tenants: tenantStats,
      },
    }));
  } catch (error: any) {
    console.error('Super admin stats error:', error);
    return addCorsHeaders(NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch super admin statistics',
        details: error.message,
      },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptions();
}
