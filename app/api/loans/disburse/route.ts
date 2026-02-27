import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';
import { v4 as uuidv4 } from 'uuid';
import { generateLoanId } from '@/lib/loanIdGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      amount,
      cuttingAmount,
      loanType,
      interestRate,
      tenure,
      purpose,
      agentId,
      tenantId
    } = body;

    // Validation
    if (!customerId || !amount || !loanType || !interestRate || !tenure) {
      return addCorsHeaders(NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields'
          }
        },
        { status: 400 }
      ));
    }

    // Calculate EMI based on loan type
    let emi = 0;
    const loanAmount = parseFloat(amount);
    const rate = parseFloat(interestRate);
    const cutting = parseFloat(cuttingAmount) || 0;
    const amountGiven = loanAmount - cutting;

    if (loanType === 'daily') {
      emi = (loanAmount * rate) / 100; // Daily interest
    } else if (loanType === 'weekly') {
      emi = (loanAmount * rate) / 100; // Weekly interest
    } else if (loanType === 'monthly') {
      emi = loanAmount / tenure; // Monthly EMI
    }

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (loanType === 'daily') {
      endDate.setDate(endDate.getDate() + tenure);
    } else if (loanType === 'weekly') {
      endDate.setDate(endDate.getDate() + (tenure * 7));
    } else {
      endDate.setMonth(endDate.getMonth() + tenure);
    }

    // Get tenant code for loan ID generation
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId || 'default' },
      select: { code: true }
    });

    if (!tenant) {
      return addCorsHeaders(NextResponse.json(
        {
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant not found'
          }
        },
        { status: 404 }
      ));
    }

    // Generate smart loan ID: TENANT-TYPE-YEAR-SEQUENCE
    const loanId = await generateLoanId(tenant.code, loanType as 'daily' | 'weekly' | 'monthly');

    // Create loan
    const loan = await prisma.loan.create({
      data: {
        id: loanId,
        customerId,
        amount: loanAmount,
        interestRate: rate,
        tenure,
        emi,
        outstanding: loanAmount,
        loanType,
        status: 'active',
        startDate,
        endDate,
        agentId,
        tenantId: tenantId || 'default',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        Customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        Agent: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create collection schedule
    const collections = [];
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < tenure; i++) {
      if (loanType === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (loanType === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      collections.push({
        id: uuidv4(),
        loanId: loan.id,
        customerId,
        amount: emi,
        method: 'pending',
        status: 'pending',
        dueDate: new Date(currentDate),
        agentId,
        tenantId: tenantId || 'default',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Bulk create collections
    await prisma.collection.createMany({
      data: collections
    });

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: {
        ...loan,
        cuttingAmount: cutting,
        amountGiven,
        collectionsCreated: collections.length
      }
    }));

  } catch (error: any) {
    console.error('Loan disbursement error:', error);
    return addCorsHeaders(NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to disburse loan'
        }
      },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptions();
}
