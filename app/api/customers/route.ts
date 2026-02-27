import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

export async function GET(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);

  try {
    const id = request.nextUrl.searchParams.get('id');
    const tenantId = request.nextUrl.searchParams.get('tenantId');
    const agentId = request.nextUrl.searchParams.get('agentId');
    const lineId = request.nextUrl.searchParams.get('lineId');
    const search = request.nextUrl.searchParams.get('search');
    const status = request.nextUrl.searchParams.get('status');
    const sort = request.nextUrl.searchParams.get('sort') || 'createdAt';
    const order = request.nextUrl.searchParams.get('order') || 'desc';
    const cursor = request.nextUrl.searchParams.get('cursor');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    // Single record fetch
    if (id) {
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          Agent: true,
          Line: {
            include: {
              Agent: true,
            },
          },
          Tenant: true,
          Loan: true,
          Collection: true,
        },
      });

      if (!customer) {
        return respond(NextResponse.json({ 
          success: false,
          error: 'Customer not found' 
        }, { status: 404 }));
      }

      return respond(NextResponse.json({
        success: true,
        data: customer,
      }));
    }

    // Build filters
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (agentId) where.agentId = agentId;
    if (lineId) where.lineId = lineId;
    if (status) where.status = status;

    // Search across name, phone, email, address
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build sort
    const validSortFields = ['name', 'phone', 'status', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sort) ? sort : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    // Cursor-based pagination
    const paginationArgs: any = {
      take: limit + 1, // Fetch one extra to determine hasMore
    };
    if (cursor) {
      paginationArgs.cursor = { id: cursor };
      paginationArgs.skip = 1; // Skip the cursor record itself
    }

    // Get total count for metadata
    const total = await prisma.customer.count({ where });

    const customers = await prisma.customer.findMany({
      where,
      include: {
        Agent: true,
        Line: {
          include: {
            Agent: true,
          },
        },
        Tenant: true,
        Loan: {
          where: { status: 'active' },
        },
      },
      orderBy: { [sortField]: sortOrder },
      ...paginationArgs,
    });

    // Determine if there are more records
    const hasMore = customers.length > limit;
    const data = hasMore ? customers.slice(0, limit) : customers;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    return respond(NextResponse.json({
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
    console.error('Error fetching customers:', error);
    return respond(NextResponse.json({ 
      success: false,
      error: 'Failed to fetch customers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);

  try {
    const body = await request.json();
    console.log('=== CREATE CUSTOMER API ===');
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { tenantId, name, phone, email, address, area, aadhaar, pan, lat, lng, agentId, lineId, status } = body;

    // Validate required fields
    if (!name) {
      console.error('Missing name');
      return respond(NextResponse.json({ success: false, error: 'Name is required', details: 'name is missing' }, { status: 400 }));
    }
    if (!phone) {
      console.error('Missing phone');
      return respond(NextResponse.json({ success: false, error: 'Phone is required', details: 'phone is missing' }, { status: 400 }));
    }
    if (!address) {
      console.error('Missing address');
      return respond(NextResponse.json({ success: false, error: 'Address is required', details: 'address is missing' }, { status: 400 }));
    }

    // Use provided tenantId or get first tenant as default
    let finalTenantId = tenantId;
    if (!finalTenantId) {
      const firstTenant = await prisma.tenant.findFirst();
      if (!firstTenant) {
        return respond(NextResponse.json({ 
          success: false,
          error: 'No tenant found. Please create a tenant first.' 
        }, { status: 400 }));
      }
      finalTenantId = firstTenant.id;
      console.log('Using default tenant:', finalTenantId);
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: finalTenantId },
      select: { id: true },
    });
    if (!tenant) {
      const fallbackTenant = await prisma.tenant.findFirst({ select: { id: true } });
      if (!fallbackTenant) {
        return respond(NextResponse.json({
          success: false,
          error: 'Invalid tenant and no fallback tenant available',
        }, { status: 400 }));
      }
      finalTenantId = fallbackTenant.id;
    }

    let validAgentId: string | null = null;
    if (agentId) {
      const agent = await prisma.agent.findFirst({
        where: { id: agentId, tenantId: finalTenantId },
        select: { id: true },
      });
      if (!agent) {
        return respond(NextResponse.json({
          success: false,
          error: 'Invalid agent selected for this tenant',
        }, { status: 400 }));
      }
      validAgentId = agent.id;
    }

    let validLineId: string | null = null;
    if (lineId) {
      const line = await prisma.line.findFirst({
        where: { id: lineId, tenantId: finalTenantId },
        select: { id: true, agentId: true, area: true },
      });
      if (!line) {
        return respond(NextResponse.json({
          success: false,
          error: 'Invalid line selected for this tenant',
        }, { status: 400 }));
      }
      validLineId = line.id;
      if (!validAgentId && line.agentId) {
        validAgentId = line.agentId;
      }
    }

    const customerData = {
      id: `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId: finalTenantId,
      name,
      phone,
      email: email || null,
      address,
      area: area || null,
      aadhaar: aadhaar || null,
      pan: pan || null,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      agentId: validAgentId,
      lineId: validLineId,
      status: status || 'active',
      updatedAt: new Date(),
    };

    console.log('Creating customer with data:', JSON.stringify(customerData, null, 2));

    const customer = await prisma.customer.create({
      data: customerData,
      include: {
        Agent: true,
        Line: true,
        Tenant: true,
      },
    });

    console.log('Customer created successfully:', customer.id);
    return respond(NextResponse.json({
      success: true,
      data: customer,
    }));
  } catch (error: any) {
    console.error('=== CREATE CUSTOMER ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.code) console.error('Error code:', error.code);
    if (error.meta) console.error('Error meta:', error.meta);

    return respond(NextResponse.json({
      success: false,
      error: 'Failed to create customer',
      details: error.message,
      code: error.code
    }, { status: 500 }));
  }
}

export async function PUT(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);

  try {
    const body = await request.json();
    console.log('=== UPDATE CUSTOMER API ===');
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { id, ...updates } = body;

    if (!id) {
      console.error('Missing customer ID');
      return respond(NextResponse.json({ error: 'Customer ID required', details: 'id is missing' }, { status: 400 }));
    }

    // Clean up the updates object
    const cleanUpdates: any = {};
    if (updates.name !== undefined) cleanUpdates.name = updates.name;
    if (updates.phone !== undefined) cleanUpdates.phone = updates.phone;
    if (updates.email !== undefined) cleanUpdates.email = updates.email || null;
    if (updates.address !== undefined) cleanUpdates.address = updates.address;
    if (updates.aadhaar !== undefined) cleanUpdates.aadhaar = updates.aadhaar || null;
    if (updates.pan !== undefined) cleanUpdates.pan = updates.pan || null;
    if (updates.lat !== undefined) cleanUpdates.lat = updates.lat ? parseFloat(updates.lat) : null;
    if (updates.lng !== undefined) cleanUpdates.lng = updates.lng ? parseFloat(updates.lng) : null;
    if (updates.agentId !== undefined) cleanUpdates.agentId = updates.agentId || null;
    if (updates.lineId !== undefined) cleanUpdates.lineId = updates.lineId || null;
    if (updates.status !== undefined) cleanUpdates.status = updates.status;

    console.log('Updating customer with data:', JSON.stringify(cleanUpdates, null, 2));

    const customer = await prisma.customer.update({
      where: { id },
      data: cleanUpdates,
      include: {
        Agent: true,
        Line: true,
        Tenant: true,
      },
    });

    console.log('Customer updated successfully:', customer.id);
    return respond(NextResponse.json({
      success: true,
      data: customer,
    }));
  } catch (error: any) {
    console.error('=== UPDATE CUSTOMER ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.code) console.error('Error code:', error.code);
    if (error.meta) console.error('Error meta:', error.meta);

    return respond(NextResponse.json({
      success: false,
      error: 'Failed to update customer',
      details: error.message,
      code: error.code
    }, { status: 500 }));
  }
}

export async function DELETE(request: NextRequest) {
  const respond = (response: NextResponse) => addCorsHeaders(response, request);

  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return respond(NextResponse.json({ success: false, error: 'Customer ID required' }, { status: 400 }));
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        Loan: { where: { status: 'active' } },
        Collection: true,
      },
    });

    if (!customer) {
      return respond(NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 }));
    }

    // Block delete if customer has active loans
    if (customer.Loan && customer.Loan.length > 0) {
      return respond(NextResponse.json({
        success: false,
        error: `Cannot delete customer with ${customer.Loan.length} active loan(s). Close all loans first.`,
      }, { status: 400 }));
    }

    // Delete in transaction: collections, completed loans, then customer
    await prisma.$transaction(async (tx) => {
      // Delete collections linked to this customer
      await tx.collection.deleteMany({ where: { customerId: id } });

      // Delete all completed/closed loans
      await tx.loan.deleteMany({ where: { customerId: id } });

      // Delete the customer
      await tx.customer.delete({ where: { id } });
    });

    return respond(NextResponse.json({ success: true, message: 'Customer deleted successfully' }));
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return respond(NextResponse.json({ success: false, error: error.message || 'Failed to delete customer' }, { status: 500 }));
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request);
}
