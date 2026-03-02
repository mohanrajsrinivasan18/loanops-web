import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/super-admin/analytics - Get advanced analytics
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    
    if (!auth.user || auth.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const days = parseInt(period);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Revenue trend (last N days)
    const revenueTrend = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE("paidDate") as date,
        SUM("totalAmount") as revenue,
        COUNT(*) as invoices
      FROM "Invoice"
      WHERE status = 'paid' 
        AND "paidDate" >= ${startDate}
      GROUP BY DATE("paidDate")
      ORDER BY date ASC
    `;

    // Tenant growth (last N days)
    const tenantGrowth = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as new_tenants
      FROM "Tenant"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Plan distribution
    const planDistribution = await prisma.$queryRaw<any[]>`
      SELECT 
        p.name as plan_name,
        COUNT(ts.id) as tenant_count,
        SUM(p.price) as total_revenue
      FROM "TenantSubscription" ts
      JOIN "SubscriptionPlan" p ON ts."planId" = p.id
      WHERE ts.status = 'active'
      GROUP BY p.id, p.name, p.price
      ORDER BY tenant_count DESC
    `;

    // Feature adoption
    const featureAdoption = await prisma.$queryRaw<any[]>`
      SELECT 
        "featureName",
        COUNT(*) as enabled_count,
        (COUNT(*) * 100.0 / (SELECT COUNT(DISTINCT "tenantId") FROM "TenantFeature")) as adoption_rate
      FROM "TenantFeature"
      WHERE enabled = true
      GROUP BY "featureName"
      ORDER BY enabled_count DESC
    `;

    // Churn analysis (last 90 days)
    const churnDate = new Date();
    churnDate.setDate(churnDate.getDate() - 90);

    const [totalTenants, churnedTenants] = await Promise.all([
      prisma.tenant.count({
        where: { createdAt: { lt: churnDate } }
      }),
      prisma.tenant.count({
        where: {
          status: { in: ['suspended', 'inactive'] },
          updatedAt: { gte: churnDate }
        }
      })
    ]);

    const churnRate = totalTenants > 0 ? ((churnedTenants / totalTenants) * 100).toFixed(2) : '0';

    // MRR trend (last 12 months)
    const mrrTrend = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE_TRUNC('month', ts."startDate") as month,
        SUM(
          CASE 
            WHEN p."billingCycle" = 'monthly' THEN p.price
            WHEN p."billingCycle" = 'yearly' THEN p.price / 12
            ELSE 0
          END
        ) as mrr
      FROM "TenantSubscription" ts
      JOIN "SubscriptionPlan" p ON ts."planId" = p.id
      WHERE ts.status = 'active'
        AND ts."startDate" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', ts."startDate")
      ORDER BY month ASC
    `;

    // Top tenants by usage
    const topTenants = await prisma.tenant.findMany({
      take: 10,
      orderBy: {
        Loan: {
          _count: 'desc'
        }
      },
      include: {
        _count: {
          select: {
            User: true,
            Customer: true,
            Loan: true,
            Collection: true
          }
        },
        Subscription: {
          where: { status: 'active' },
          include: {
            Plan: {
              select: { name: true, price: true }
            }
          }
        }
      }
    });

    // Payment success rate
    const [totalInvoices, paidInvoices, failedInvoices] = await Promise.all([
      prisma.invoice.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.invoice.count({
        where: {
          status: 'paid',
          createdAt: { gte: startDate }
        }
      }),
      prisma.invoice.count({
        where: {
          status: 'failed',
          createdAt: { gte: startDate }
        }
      })
    ]);

    const paymentSuccessRate = totalInvoices > 0 
      ? ((paidInvoices / totalInvoices) * 100).toFixed(1)
      : '0';

    return NextResponse.json({
      success: true,
      analytics: {
        revenueTrend,
        tenantGrowth,
        planDistribution,
        featureAdoption,
        churnRate: parseFloat(churnRate),
        mrrTrend,
        topTenants,
        paymentStats: {
          total: totalInvoices,
          paid: paidInvoices,
          failed: failedInvoices,
          successRate: parseFloat(paymentSuccessRate)
        }
      }
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
