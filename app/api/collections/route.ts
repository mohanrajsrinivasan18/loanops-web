import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

export async function GET(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);
  try {
    const id = request.nextUrl.searchParams.get('id');
    const tenantId = request.nextUrl.searchParams.get('tenantId');
    const agentId = request.nextUrl.searchParams.get('agentId');
    const customerId = request.nextUrl.searchParams.get('customerId');
    const loanId = request.nextUrl.searchParams.get('loanId');
    const status = request.nextUrl.searchParams.get('status');
    const date = request.nextUrl.searchParams.get('date');
    const method = request.nextUrl.searchParams.get('method');
    const frequency = request.nextUrl.searchParams.get('frequency');
    const search = request.nextUrl.searchParams.get('search');
    const dateFrom = request.nextUrl.searchParams.get('dateFrom');
    const dateTo = request.nextUrl.searchParams.get('dateTo');
    const sort = request.nextUrl.searchParams.get('sort') || 'dueDate';
    const order = request.nextUrl.searchParams.get('order') || 'desc';
    const cursor = request.nextUrl.searchParams.get('cursor');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');

    if (id) {
      const collection = await prisma.collection.findUnique({
        where: { id },
        include: {
          Customer: true,
          Loan: true,
          Agent: true,
          Tenant: true,
        },
      });

      if (!collection) {
        return respond(NextResponse.json({ error: 'Collection not found' }, { status: 404 }));
      }

      return respond(NextResponse.json(collection));
    }

    // Auto-generate missing collections for today when date filter is used
    if (date && (agentId || tenantId)) {
      await autoGenerateCollections(date, agentId, tenantId);
    }

    // Build filters
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    
    // Agent filter - include collections where:
    // 1. Collection.agentId matches, OR
    // 2. Customer.agentId matches, OR  
    // 3. Customer.Line.agentId matches (customer is in a line assigned to agent)
    if (agentId) {
      where.OR = [
        { agentId: agentId },
        { Customer: { agentId: agentId } },
        { Customer: { Line: { agentId: agentId } } },
      ];
    }
    
    if (customerId) where.customerId = customerId;
    if (loanId) where.loanId = loanId;
    if (status) where.status = status;
    if (method) where.method = method;
    if (frequency) {
      where.Loan = {
        ...(where.Loan || {}),
        loanType: frequency,
      };
    }

    // Single date filter
    if (date) {
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');
      where.dueDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.dueDate = where.dueDate || {};
      if (dateFrom) where.dueDate.gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        where.dueDate.lte = to;
      }
    }

    // Search across customer name, customer phone, agent name, notes
    if (search) {
      const searchOr = [
        { Customer: { name: { contains: search, mode: 'insensitive' } } },
        { Customer: { phone: { contains: search, mode: 'insensitive' } } },
        { Agent: { name: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
      // Merge with existing OR (agentId) using AND
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOr }];
        delete where.OR;
      } else {
        where.OR = searchOr;
      }
    }

    // Build sort
    const validSortFields = ['amount', 'collectedAmount', 'dueDate', 'collectedDate', 'status', 'method', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sort) ? sort : 'dueDate';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    // Cursor-based pagination
    const paginationArgs: any = {
      take: limit + 1,
    };
    if (cursor) {
      paginationArgs.cursor = { id: cursor };
      paginationArgs.skip = 1;
    }

    const total = await prisma.collection.count({ where });

    const collections = await prisma.collection.findMany({
      where,
      include: {
        Customer: {
          include: {
            Line: {
              include: {
                Agent: true,
              },
            },
          },
        },
        Loan: true,
        Agent: true,
        Tenant: true,
      },
      orderBy: { [sortField]: sortOrder },
      ...paginationArgs,
    });

    const hasMore = collections.length > limit;
    const data = hasMore ? collections.slice(0, limit) : collections;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    return respond(NextResponse.json({
      data,
      pagination: {
        cursor: nextCursor,
        hasMore,
        total,
        limit,
      },
    }));
  } catch (error) {
    console.error('Error fetching collections:', error);
    return respond(NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 }));
  }
}

/**
 * Auto-generate missing collection records for a given date.
 * Checks active loans and creates pending collections if none exist for that date.
 * Handles daily/weekly/monthly scheduling logic.
 */
async function autoGenerateCollections(dateStr: string, agentId: string | null, tenantId: string | null) {
  try {
    const targetDate = new Date(dateStr + 'T00:00:00.000Z');
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase();
    const dayOfMonth = targetDate.getUTCDate();

    // Find active loans that should have collections for this date
    const loanWhere: any = { status: 'active' };
    if (tenantId) loanWhere.tenantId = tenantId;

    // If agentId, find loans for this agent (direct or via line)
    if (agentId) {
      loanWhere.OR = [
        { agentId },
        { Customer: { agentId } },
        { Customer: { Line: { agentId } } },
      ];
    }

    const activeLoans = await prisma.loan.findMany({
      where: loanWhere,
      include: {
        Customer: {
          include: {
            Line: true,
          },
        },
      },
    });

    const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

    const collectionsToCreate: any[] = [];

    for (const loan of activeLoans) {
      // Check if loan's start date is before or on target date
      const loanStart = new Date(loan.startDate);
      if (loanStart > endOfDay) continue;

      // Check if loan's end date is after or on target date
      if (loan.endDate) {
        const loanEnd = new Date(loan.endDate);
        if (loanEnd < startOfDay) continue;
      }

      // Check scheduling based on loan type
      const loanType = loan.loanType?.toLowerCase();
      let shouldHaveCollection = false;

      if (loanType === 'daily') {
        shouldHaveCollection = true;
      } else if (loanType === 'weekly') {
        // Check if the target day matches the loan's start day of week
        const loanStartDay = new Date(loan.startDate).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase();
        shouldHaveCollection = dayOfWeek === loanStartDay;
      } else if (loanType === 'monthly') {
        // Check if the target day of month matches the loan's start day of month
        const loanStartDayOfMonth = new Date(loan.startDate).getUTCDate();
        shouldHaveCollection = dayOfMonth === loanStartDayOfMonth;
      }

      if (!shouldHaveCollection) continue;

      // Check if collection already exists for this loan on this date
      const existing = await prisma.collection.findFirst({
        where: {
          loanId: loan.id,
          dueDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (!existing) {
        collectionsToCreate.push({
          loanId: loan.id,
          customerId: loan.customerId,
          amount: loan.emi,
          method: 'pending',
          status: 'pending',
          dueDate: startOfDay,
          agentId: loan.agentId || loan.Customer?.Line?.agentId || null,
          tenantId: loan.tenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    if (collectionsToCreate.length > 0) {
      await prisma.collection.createMany({ data: collectionsToCreate });
      console.log(`Auto-generated ${collectionsToCreate.length} collection(s) for ${dateStr}`);
    }
  } catch (error) {
    console.error('Error auto-generating collections:', error);
    // Don't throw — this is a best-effort operation
  }
}

export async function POST(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);
  try {
    const body = await request.json();
    const { tenantId, loanId, customerId, agentId, amount, method, dueDate, status, notes } = body;

    const collection = await prisma.collection.create({
      data: {
        tenantId,
        loanId,
        customerId,
        agentId,
        amount: parseFloat(amount),
        method: method || 'cash',
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        status: status || 'pending',
        notes,
      },
      include: {
        Customer: true,
        Loan: true,
        Agent: true,
        Tenant: true,
      },
    });

    return respond(NextResponse.json(collection));
  } catch (error) {
    console.error('Error creating collection:', error);
    return respond(NextResponse.json({ error: 'Failed to create collection' }, { status: 500 }));
  }
}

export async function PUT(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return respond(NextResponse.json({ error: 'Collection ID required' }, { status: 400 }));
    }

    if (updates.amount) updates.amount = parseFloat(updates.amount);
    if (updates.collectedAmount) updates.collectedAmount = parseFloat(updates.collectedAmount);

    // If marking as collected, set collectedDate
    if (updates.status === 'collected' && !updates.collectedDate) {
      updates.collectedDate = new Date();
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: updates,
      include: {
        Customer: true,
        Loan: true,
        Agent: true,
        Tenant: true,
      },
    });

    // Update loan outstanding if collection is marked as collected
    if (updates.status === 'collected' && updates.collectedAmount) {
      await prisma.loan.update({
        where: { id: collection.loanId },
        data: {
          outstanding: {
            decrement: updates.collectedAmount,
          },
        },
      });
    }

    return respond(NextResponse.json(collection));
  } catch (error) {
    console.error('Error updating collection:', error);
    return respond(NextResponse.json({ error: 'Failed to update collection' }, { status: 500 }));
  }
}

export async function DELETE(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return respond(NextResponse.json({ error: 'Collection ID required' }, { status: 400 }));
    }

    await prisma.collection.delete({
      where: { id },
    });

    return respond(NextResponse.json({ success: true }));
  } catch (error) {
    console.error('Error deleting collection:', error);
    return respond(NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 }));
  }
}

export async function PATCH(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);
  try {
    const body = await request.json();
    const { id, status, collectedAmount, notes } = body;

    if (!id) {
      return respond(NextResponse.json({ error: 'Collection ID required' }, { status: 400 }));
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

    return respond(NextResponse.json(collection));
  } catch (error) {
    console.error('Error updating collection status:', error);
    return respond(NextResponse.json({ error: 'Failed to update collection' }, { status: 500 }));
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request);
}
