import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';
import { generateLoanId } from '@/lib/loanIdGenerator';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    const tenantId = request.nextUrl.searchParams.get('tenantId');
    const customerId = request.nextUrl.searchParams.get('customerId');
    const agentId = request.nextUrl.searchParams.get('agentId');
    const status = request.nextUrl.searchParams.get('status');
    const loanType = request.nextUrl.searchParams.get('loanType');
    const search = request.nextUrl.searchParams.get('search');
    const sort = request.nextUrl.searchParams.get('sort') || 'createdAt';
    const order = request.nextUrl.searchParams.get('order') || 'desc';
    const cursor = request.nextUrl.searchParams.get('cursor');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const minAmount = request.nextUrl.searchParams.get('minAmount');
    const maxAmount = request.nextUrl.searchParams.get('maxAmount');

    if (id) {
      const loan = await prisma.loan.findUnique({
        where: { id },
        include: {
          Customer: true,
          Agent: true,
          Tenant: true,
          Collection: true,
        },
      });

      if (!loan) {
        return addCorsHeaders(NextResponse.json({ 
          success: false,
          error: 'Loan not found' 
        }, { status: 404 }));
      }

      return addCorsHeaders(NextResponse.json({
        success: true,
        data: loan,
      }));
    }

    // Build filters
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (customerId) where.customerId = customerId;
    if (agentId) where.agentId = agentId;
    if (status) where.status = status;
    if (loanType) where.loanType = loanType;

    // Amount range filter
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = parseFloat(minAmount);
      if (maxAmount) where.amount.lte = parseFloat(maxAmount);
    }

    // Search across customer name, customer phone
    if (search) {
      where.OR = [
        { Customer: { name: { contains: search, mode: 'insensitive' } } },
        { Customer: { phone: { contains: search, mode: 'insensitive' } } },
        { Agent: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Build sort
    const validSortFields = ['amount', 'outstanding', 'emi', 'interestRate', 'tenure', 'status', 'loanType', 'startDate', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sort) ? sort : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    // Cursor-based pagination
    const paginationArgs: any = {
      take: limit + 1,
    };
    if (cursor) {
      paginationArgs.cursor = { id: cursor };
      paginationArgs.skip = 1;
    }

    const total = await prisma.loan.count({ where });

    const loans = await prisma.loan.findMany({
      where,
      include: {
        Customer: true,
        Agent: true,
        Tenant: true,
      },
      orderBy: { [sortField]: sortOrder },
      ...paginationArgs,
    });

    const hasMore = loans.length > limit;
    const data = hasMore ? loans.slice(0, limit) : loans;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    return addCorsHeaders(NextResponse.json({
      success: true,
      data,
      pagination: {
        page: 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }));
  } catch (error) {
    console.error('Error fetching loans:', error);
    return addCorsHeaders(NextResponse.json({ 
      success: false,
      error: 'Failed to fetch loans',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, customerId, agentId, amount, interestRate, tenure, loanType, startDate } = body;

    // Validate required fields
    if (!tenantId || !customerId || !amount || !interestRate || !tenure) {
      return addCorsHeaders(NextResponse.json({ 
        success: false,
        error: 'Missing required fields' 
      }, { status: 400 }));
    }

    // Get tenant code for loan ID generation
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { code: true }
    });

    if (!tenant) {
      return addCorsHeaders(NextResponse.json({ 
        success: false,
        error: 'Tenant not found' 
      }, { status: 404 }));
    }

    // Calculate EMI
    const principal = parseFloat(amount);
    const rate = parseFloat(interestRate);
    const months = parseInt(tenure);
    const emi = (principal * (1 + rate / 100)) / months;

    // Generate smart loan ID
    const loanId = await generateLoanId(tenant.code, (loanType || 'monthly') as 'daily' | 'weekly' | 'monthly');

    const loan = await prisma.loan.create({
      data: {
        id: loanId,
        tenantId,
        customerId,
        agentId,
        amount: principal,
        interestRate: rate,
        tenure: months,
        emi: Math.round(emi),
        outstanding: principal,
        loanType: loanType || 'monthly',
        status: 'active',
        startDate: startDate ? new Date(startDate) : new Date(),
        updatedAt: new Date(),
      },
      include: {
        Customer: true,
        Agent: true,
        Tenant: true,
      },
    });

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: loan,
    }));
  } catch (error) {
    console.error('Error creating loan:', error);
    return addCorsHeaders(NextResponse.json({ 
      success: false,
      error: 'Failed to create loan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 }));
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Updating loan with data:', body);

    const { id, ...updates } = body;

    if (!id) {
      return addCorsHeaders(NextResponse.json({ error: 'Loan ID required' }, { status: 400 }));
    }

    // Convert numeric fields
    if (updates.amount) updates.amount = parseFloat(updates.amount);
    if (updates.interestRate) updates.interestRate = parseFloat(updates.interestRate);
    if (updates.tenure) updates.tenure = parseInt(updates.tenure);
    if (updates.outstanding) updates.outstanding = parseFloat(updates.outstanding);
    if (updates.emi) updates.emi = parseFloat(updates.emi);

    // Recalculate EMI if needed
    if (updates.amount || updates.interestRate || updates.tenure) {
      const loan = await prisma.loan.findUnique({ where: { id } });
      if (loan) {
        const amount = updates.amount || loan.amount;
        const rate = updates.interestRate || loan.interestRate;
        const months = updates.tenure || loan.tenure;
        updates.emi = Math.round((amount * (1 + rate / 100)) / months);
      }
    }

    const loan = await prisma.loan.update({
      where: { id },
      data: updates,
      include: {
        Customer: true,
        Agent: true,
        Tenant: true,
      },
    });

    console.log('Loan updated successfully:', loan);
    return addCorsHeaders(NextResponse.json({
      success: true,
      data: loan,
    }));
  } catch (error: any) {
    console.error('Error updating loan:', error);
    return addCorsHeaders(NextResponse.json({
      success: false,
      error: 'Failed to update loan',
      details: error.message,
      code: error.code
    }, { status: 500 }));
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return addCorsHeaders(NextResponse.json({ error: 'Loan ID required' }, { status: 400 }));
    }

    await prisma.loan.delete({
      where: { id },
    });

    return addCorsHeaders(NextResponse.json({ success: true }));
  } catch (error) {
    console.error('Error deleting loan:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to delete loan' }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return corsOptions();
}
