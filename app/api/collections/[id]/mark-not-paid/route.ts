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
    const { reason } = body;

    console.log('=== MARK COLLECTION AS NOT PAID ===');
    console.log('Collection ID:', id);
    console.log('Reason:', reason);

    // Get the collection
    const collection = await prisma.collection.findUnique({
      where: { id },
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
        status: 'not_paid',
        notes: reason || 'Customer not available',
        updatedAt: new Date(),
      },
      include: {
        Customer: true,
        Loan: true,
        Agent: true,
      },
    });

    console.log('Collection marked as not paid successfully');

    return respond(NextResponse.json({
      success: true,
      data: updatedCollection,
    }));
  } catch (error: any) {
    console.error('Error marking collection as not paid:', error);
    return respond(NextResponse.json({
      success: false,
      error: 'Failed to mark collection as not paid',
      details: error.message,
    }, { status: 500 }));
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request);
}
