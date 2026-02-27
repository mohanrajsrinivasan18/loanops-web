import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);
  
  try {
    const { id } = params;
    const body = await request.json();
    const { amount, method, notes } = body;

    console.log('=== MARK COLLECTION AS PAID ===');
    console.log('Collection ID:', id);
    console.log('Amount:', amount);
    console.log('Method:', method);

    if (!amount || amount <= 0) {
      return respond(NextResponse.json({
        success: false,
        error: 'Valid amount is required',
      }, { status: 400 }));
    }

    if (!method || !['cash', 'upi'].includes(method)) {
      return respond(NextResponse.json({
        success: false,
        error: 'Valid payment method (cash or upi) is required',
      }, { status: 400 }));
    }

    // Get the collection
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        Loan: true,
      },
    });

    if (!collection) {
      return respond(NextResponse.json({
        success: false,
        error: 'Collection not found',
      }, { status: 404 }));
    }

    // Update collection
    const updatedCollection = await prisma.collection.update({
      where: { id },
      data: {
        status: 'collected',
        collectedAmount: parseFloat(amount),
        collectedDate: new Date(),
        method,
        notes: notes || null,
        updatedAt: new Date(),
      },
      include: {
        Customer: true,
        Loan: true,
        Agent: true,
      },
    });

    // Update loan outstanding
    if (collection.Loan) {
      await prisma.loan.update({
        where: { id: collection.loanId },
        data: {
          outstanding: {
            decrement: parseFloat(amount),
          },
          updatedAt: new Date(),
        },
      });
    }

    console.log('Collection marked as paid successfully');

    return respond(NextResponse.json({
      success: true,
      data: updatedCollection,
    }));
  } catch (error: any) {
    console.error('Error marking collection as paid:', error);
    return respond(NextResponse.json({
      success: false,
      error: 'Failed to mark collection as paid',
      details: error.message,
    }, { status: 500 }));
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request);
}
