import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!agentId) {
      return addCorsHeaders(NextResponse.json({ error: 'Agent ID required' }, { status: 400 }));
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const collections = await prisma.collection.findMany({
      where: {
        agentId,
        dueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        Customer: true,
        Loan: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    return addCorsHeaders(NextResponse.json(collections));
  } catch (error) {
    console.error('Error fetching agent collections:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loanId, customerId, agentId, tenantId, amount, method, notes, status } = body;

    const collection = await prisma.collection.create({
      data: {
        loanId,
        customerId,
        agentId,
        tenantId,
        amount: parseFloat(amount),
        collectedAmount: status === 'collected' ? parseFloat(amount) : null,
        method,
        notes,
        status: status || 'collected',
        dueDate: new Date(),
        collectedDate: status === 'collected' ? new Date() : null,
      },
      include: {
        Customer: true,
        Loan: true,
      },
    });

    // Update loan outstanding if collected
    if (status === 'collected') {
      await prisma.loan.update({
        where: { id: loanId },
        data: {
          outstanding: {
            decrement: parseFloat(amount),
          },
        },
      });
    }

    return addCorsHeaders(NextResponse.json(collection, { status: 201 }));
  } catch (error) {
    console.error('Error creating collection:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to create collection' }, { status: 500 }));
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, collectedAmount, notes } = body;

    if (!id) {
      return addCorsHeaders(NextResponse.json({ error: 'Collection ID required' }, { status: 400 }));
    }

    const updates: any = { status };
    if (collectedAmount) updates.collectedAmount = parseFloat(collectedAmount);
    if (notes) updates.notes = notes;
    if (status === 'collected') updates.collectedDate = new Date();

    const collection = await prisma.collection.update({
      where: { id },
      data: updates,
      include: {
        Customer: true,
        Loan: true,
      },
    });

    // Update loan outstanding
    if (status === 'collected' && collectedAmount) {
      await prisma.loan.update({
        where: { id: collection.loanId },
        data: {
          outstanding: {
            decrement: parseFloat(collectedAmount),
          },
        },
      });
    }

    return addCorsHeaders(NextResponse.json({
      success: true,
      collection,
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error updating collection:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to update collection' }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return corsOptions();
}
