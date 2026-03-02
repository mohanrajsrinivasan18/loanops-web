import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/super-admin/billing - Get billing stats and invoices
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) where.status = status;

    // Get invoices
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Tenant: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          Subscription: {
            include: {
              Plan: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }),
      prisma.invoice.count({ where })
    ]);

    // Calculate stats
    const [
      totalRevenue,
      monthlyRevenue,
      pendingAmount,
      paidInvoices,
      pendingInvoices,
      failedInvoices
    ] = await Promise.all([
      // Total revenue (all paid invoices)
      prisma.invoice.aggregate({
        where: { status: 'paid' },
        _sum: { totalAmount: true }
      }),
      
      // This month's revenue
      prisma.invoice.aggregate({
        where: {
          status: 'paid',
          paidDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { totalAmount: true }
      }),
      
      // Pending amount
      prisma.invoice.aggregate({
        where: { status: 'pending' },
        _sum: { totalAmount: true }
      }),
      
      // Count by status
      prisma.invoice.count({ where: { status: 'paid' } }),
      prisma.invoice.count({ where: { status: 'pending' } }),
      prisma.invoice.count({ where: { status: 'failed' } })
    ]);

    const stats = {
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
      pendingAmount: pendingAmount._sum.totalAmount || 0,
      paidInvoices,
      pendingInvoices,
      failedInvoices
    };

    return NextResponse.json({
      success: true,
      stats,
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Billing API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch billing data' },
      { status: 500 }
    );
  }
}
