import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    
    if (!auth.user || auth.user.role !== 'super_admin') {
      console.error('Super admin stats 403:', {
        hasUser: !!auth.user,
        role: auth.user?.role,
        authError: auth.error,
        hasAuthHeader: !!request.headers.get('authorization'),
      });
      return NextResponse.json(
        { success: false, error: 'Unauthorized', debug: { authError: auth.error, hasUser: !!auth.user, role: auth.user?.role } },
        { status: 403 }
      );
    }

    // Get tenant statistics
    const [
      totalTenants,
      activeTenants,
      trialTenants,
      expiredTenants,
      suspendedTenants,
      totalUsers,
      totalCustomers,
      totalLoans,
      totalCollections,
      recentTenants,
      subscriptions,
      invoices
    ] = await Promise.all([
      // Total tenants
      prisma.tenant.count(),
      
      // Active tenants
      prisma.tenant.count({ where: { status: 'active' } }),
      
      // Trial tenants
      prisma.tenantSubscription.count({ where: { status: 'trial' } }),
      
      // Expired tenants
      prisma.tenantSubscription.count({ where: { status: 'expired' } }),
      
      // Suspended tenants
      prisma.tenant.count({ where: { status: 'suspended' } }),
      
      // Total users across all tenants
      prisma.user.count(),
      
      // Total customers
      prisma.customer.count(),
      
      // Total loans
      prisma.loan.count(),
      
      // Total collections amount
      prisma.collection.aggregate({
        where: { status: 'collected' },
        _sum: { collectedAmount: true }
      }),
      
      // Recent tenants (last 5)
      prisma.tenant.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          plan: true,
          createdAt: true,
          ownerName: true,
          ownerPhone: true
        }
      }),
      
      // Active subscriptions for revenue calculation
      prisma.tenantSubscription.findMany({
        where: { status: 'active' },
        include: {
          Plan: {
            select: {
              price: true,
              billingCycle: true
            }
          }
        }
      }),
      
      // Recent invoices
      prisma.invoice.findMany({
        where: { status: 'paid' },
        orderBy: { paidDate: 'desc' },
        take: 10,
        select: {
          totalAmount: true,
          paidDate: true
        }
      })
    ]);

    // Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0;
    subscriptions.forEach(sub => {
      if (sub.Plan.billingCycle === 'monthly') {
        mrr += sub.Plan.price;
      } else if (sub.Plan.billingCycle === 'yearly') {
        mrr += sub.Plan.price / 12;
      }
    });

    // Calculate ARR (Annual Recurring Revenue)
    const arr = mrr * 12;

    // Calculate total revenue from paid invoices
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Get limit alerts (tenants near their limits)
    const tenantsWithLimits = await prisma.tenant.findMany({
      where: { status: 'active' },
      include: {
        Limits: true,
        _count: {
          select: {
            User: true,
            Customer: true,
            Loan: true
          }
        }
      }
    });

    const limitAlerts = tenantsWithLimits
      .map(tenant => {
        if (!tenant.Limits) return null;
        
        const alerts = [];
        
        // Check users limit
        if (tenant._count.User >= tenant.Limits.maxUsers * 0.8) {
          alerts.push({
            tenantId: tenant.id,
            tenantName: tenant.name,
            type: 'users',
            message: `Users: ${tenant._count.User}/${tenant.Limits.maxUsers}`,
            percentage: Math.round((tenant._count.User / tenant.Limits.maxUsers) * 100)
          });
        }
        
        // Check customers limit
        if (tenant._count.Customer >= tenant.Limits.maxCustomers * 0.8) {
          alerts.push({
            tenantId: tenant.id,
            tenantName: tenant.name,
            type: 'customers',
            message: `Customers: ${tenant._count.Customer}/${tenant.Limits.maxCustomers}`,
            percentage: Math.round((tenant._count.Customer / tenant.Limits.maxCustomers) * 100)
          });
        }
        
        return alerts;
      })
      .filter(Boolean)
      .flat()
      .slice(0, 5);

    // Calculate growth rate (simplified - comparing last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [recentTenantsCount, previousTenantsCount] = await Promise.all([
      prisma.tenant.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      prisma.tenant.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      })
    ]);

    const growthRate = previousTenantsCount > 0
      ? Math.round(((recentTenantsCount - previousTenantsCount) / previousTenantsCount) * 100)
      : 0;

    // Calculate churn rate (tenants that became inactive in last 30 days)
    const churnedTenants = await prisma.tenant.count({
      where: {
        status: { in: ['suspended', 'inactive'] },
        updatedAt: { gte: thirtyDaysAgo }
      }
    });
    const churnRate = totalTenants > 0 ? ((churnedTenants / totalTenants) * 100).toFixed(1) : '0';

    const stats = {
      totalTenants,
      activeTenants,
      trialTenants,
      expiredTenants,
      suspendedTenants,
      totalRevenue: Math.round(totalRevenue),
      mrr: Math.round(mrr),
      arr: Math.round(arr),
      totalUsers,
      totalCustomers,
      totalLoans,
      totalCollections: totalCollections._sum.collectedAmount || 0,
      growthRate,
      churnRate: parseFloat(churnRate),
      recentTenants,
      limitAlerts
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
