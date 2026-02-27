import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        Agent: { select: { id: true, name: true, phone: true, area: true } },
        Tenant: { select: { id: true, name: true } },
      },
    });

    if (!customer) {
      return addCorsHeaders(NextResponse.json({ error: 'Customer not found' }, { status: 404 }));
    }

    // Get all loans with their collection stats
    const loans = await prisma.loan.findMany({
      where: { customerId: id },
      include: {
        Collection: {
          orderBy: { dueDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const activeLoans = loans.filter((l) => l.status === 'active');
    const completedLoans = loans.filter((l) => l.status === 'completed');
    const overdueLoans = loans.filter((l) => l.status === 'overdue');

    const totalBorrowed = loans.reduce((sum, l) => sum + l.amount, 0);
    const totalOutstanding = loans.reduce((sum, l) => sum + l.outstanding, 0);
    const totalPaid = totalBorrowed - totalOutstanding;

    // Get payment history (recent 20)
    const recentPayments = await prisma.collection.findMany({
      where: { customerId: id, status: 'collected' },
      orderBy: { collectedDate: 'desc' },
      take: 20,
      select: {
        id: true,
        amount: true,
        collectedAmount: true,
        method: true,
        collectedDate: true,
        notes: true,
        Loan: { select: { id: true, loanType: true, amount: true } },
      },
    });

    // Get upcoming payments
    const now = new Date();
    const upcomingPayments = await prisma.collection.findMany({
      where: {
        customerId: id,
        status: 'pending',
        dueDate: { gte: now },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        dueDate: true,
        Loan: { select: { id: true, loanType: true } },
      },
    });

    // Get overdue payments
    const overduePayments = await prisma.collection.findMany({
      where: {
        customerId: id,
        status: 'pending',
        dueDate: { lt: now },
      },
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        amount: true,
        dueDate: true,
        Loan: { select: { id: true, loanType: true } },
      },
    });

    // Loan summaries
    const loanSummaries = loans.map((loan) => {
      const totalCollected = loan.Collection
        .filter((c) => c.status === 'collected')
        .reduce((sum, c) => sum + (c.collectedAmount || 0), 0);
      const pendingCollections = loan.Collection.filter((c) => c.status === 'pending').length;
      const completedCollections = loan.Collection.filter((c) => c.status === 'collected').length;
      const progress = loan.amount > 0 ? ((loan.amount - loan.outstanding) / loan.amount) * 100 : 0;

      return {
        id: loan.id,
        amount: loan.amount,
        outstanding: loan.outstanding,
        interestRate: loan.interestRate,
        tenure: loan.tenure,
        emi: loan.emi,
        loanType: loan.loanType,
        status: loan.status,
        startDate: loan.startDate,
        endDate: loan.endDate,
        progress: Math.round(progress * 100) / 100,
        totalCollected,
        pendingCollections,
        completedCollections,
        lastPaymentDate: loan.Collection
          .filter((c) => c.status === 'collected')
          .sort((a, b) => new Date(b.collectedDate!).getTime() - new Date(a.collectedDate!).getTime())[0]
          ?.collectedDate || null,
      };
    });

    return addCorsHeaders(NextResponse.json({
      Customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        aadhaar: customer.aadhaar,
        pan: customer.pan,
        lat: customer.lat,
        lng: customer.lng,
        status: customer.status,
        createdAt: customer.createdAt,
        Agent: customer.Agent,
        Tenant: customer.Tenant,
      },
      financial: {
        totalBorrowed,
        totalOutstanding,
        totalPaid,
        paymentProgress: totalBorrowed > 0 ? Math.round(((totalPaid / totalBorrowed) * 100) * 100) / 100 : 0,
      },
      loans: {
        total: loans.length,
        active: activeLoans.length,
        completed: completedLoans.length,
        overdue: overdueLoans.length,
        details: loanSummaries,
      },
      payments: {
        recent: recentPayments,
        upcoming: upcomingPayments,
        overdue: overduePayments,
      },
    }));
  } catch (error) {
    console.error('Error fetching customer summary:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to fetch customer summary' }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return corsOptions();
}
