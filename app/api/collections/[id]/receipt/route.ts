import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        Customer: { select: { id: true, name: true, phone: true, address: true } },
        Loan: { select: { id: true, amount: true, outstanding: true, loanType: true, emi: true, interestRate: true, tenure: true } },
        Agent: { select: { id: true, name: true, phone: true } },
        Tenant: {
          include: {
            TenantSettings: { select: { brandName: true, brandLogo: true, currency: true, dateFormat: true } },
          },
        },
      },
    });

    if (!collection) {
      return addCorsHeaders(NextResponse.json({ error: 'Collection not found' }, { status: 404 }));
    }

    if (collection.status !== 'collected') {
      return addCorsHeaders(NextResponse.json({ error: 'Receipt only available for collected payments' }, { status: 400 }));
    }

    // Calculate remaining balance after this payment
    const remainingBalance = collection.Loan.outstanding;

    // Generate receipt number
    const receiptNumber = `RCP-${collection.createdAt.getFullYear()}-${String(collection.createdAt.getMonth() + 1).padStart(2, '0')}-${collection.id.slice(-6).toUpperCase()}`;

    const receipt = {
      receiptNumber,
      date: collection.collectedDate || collection.updatedAt,
      company: {
        name: collection.Tenant.TenantSettings?.brandName || collection.Tenant.name,
        logo: collection.Tenant.TenantSettings?.brandLogo || null,
      },
      Customer: {
        name: collection.Customer.name,
        phone: collection.Customer.phone,
        address: collection.Customer.address,
      },
      Agent: {
        name: collection.Agent?.name || 'N/A',
        phone: collection.Agent?.phone || 'N/A',
      },
      payment: {
        amount: collection.collectedAmount || collection.amount,
        method: collection.method,
        currency: collection.Tenant.TenantSettings?.currency || 'INR',
        notes: collection.notes,
      },
      Loan: {
        id: collection.Loan.id,
        type: collection.Loan.loanType,
        totalAmount: collection.Loan.amount,
        emi: collection.Loan.emi,
        remainingBalance,
      },
    };

    return addCorsHeaders(NextResponse.json(receipt));
  } catch (error) {
    console.error('Error generating receipt:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to generate receipt' }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return corsOptions();
}
