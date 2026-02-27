import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

function toDateOnly(value?: string | null) {
  const date = value ? new Date(`${value}T00:00:00`) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function GET(request: NextRequest) {
  const respond = (r: NextResponse) => addCorsHeaders(r, request);
  try {
    const lineId = request.nextUrl.searchParams.get('lineId');
    const tenantId = request.nextUrl.searchParams.get('tenantId');
    const date = toDateOnly(request.nextUrl.searchParams.get('date'));

    if (!lineId || !tenantId) {
      return respond(NextResponse.json({ success: false, error: 'lineId and tenantId required' }, { status: 400 }));
    }

    const finance = await prisma.lineDailyFinance.findUnique({
      where: { lineId_date: { lineId, date } },
    });

    return respond(NextResponse.json({
      success: true,
      data: finance || {
        lineId, tenantId, date,
        collectionAmount: 0, investmentAmount: 0, expenseAmount: 0,
        agentNotes: null, adminNotes: null, notes: null,
        isLocked: false, lockedAt: null, lockedByUserId: null,
      },
    }));
  } catch (error) {
    console.error('Error fetching daily finance:', error);
    return respond(NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 }));
  }
}

export async function PUT(request: NextRequest) {
  const respond = (r: NextResponse) => addCorsHeaders(r, request);
  try {
    const body = await request.json();
    const {
      lineId, tenantId, date,
      collectionAmount, investmentAmount, expenseAmount,
      notes, agentNotes, adminNotes,
      isLocked, lockedByUserId,
      updatedByUserId, updatedByRole,
    } = body || {};

    if (!lineId || !tenantId) {
      return respond(NextResponse.json({ success: false, error: 'lineId and tenantId required' }, { status: 400 }));
    }

    const line = await prisma.line.findFirst({ where: { id: lineId, tenantId }, select: { id: true } });
    if (!line) {
      return respond(NextResponse.json({ success: false, error: 'Line not found' }, { status: 404 }));
    }

    const dateOnly = toDateOnly(date);

    // Check if locked — if caller is agent and day is locked, reject
    if (updatedByRole === 'agent') {
      const existing = await prisma.lineDailyFinance.findUnique({
        where: { lineId_date: { lineId, date: dateOnly } },
        select: { isLocked: true },
      });
      if (existing?.isLocked) {
        return respond(NextResponse.json({ success: false, error: 'This day is locked by admin. Cannot edit.' }, { status: 403 }));
      }
    }

    // Build update data
    const updateData: any = {
      updatedByUserId: updatedByUserId || null,
      updatedByRole: updatedByRole || null,
    };

    // Only update finance amounts if provided
    if (collectionAmount !== undefined) updateData.collectionAmount = Number(collectionAmount) || 0;
    if (investmentAmount !== undefined) updateData.investmentAmount = Number(investmentAmount) || 0;
    if (expenseAmount !== undefined) updateData.expenseAmount = Number(expenseAmount) || 0;
    if (notes !== undefined) updateData.notes = notes ?? null;
    if (agentNotes !== undefined) updateData.agentNotes = agentNotes ?? null;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes ?? null;

    // Lock/unlock — only admin can do this
    if (isLocked !== undefined && updatedByRole !== 'agent') {
      updateData.isLocked = isLocked;
      updateData.lockedAt = isLocked ? new Date() : null;
      updateData.lockedByUserId = isLocked ? (lockedByUserId || updatedByUserId || null) : null;
    }

    const finance = await prisma.lineDailyFinance.upsert({
      where: { lineId_date: { lineId, date: dateOnly } },
      create: {
        Line: { connect: { id: lineId } },
        Tenant: { connect: { id: tenantId } },
        date: dateOnly,
        collectionAmount: Number(collectionAmount) || 0,
        investmentAmount: Number(investmentAmount) || 0,
        expenseAmount: Number(expenseAmount) || 0,
        notes: notes ?? null,
        agentNotes: agentNotes ?? null,
        adminNotes: adminNotes ?? null,
        isLocked: isLocked || false,
        lockedAt: isLocked ? new Date() : null,
        lockedByUserId: isLocked ? (lockedByUserId || updatedByUserId || null) : null,
        updatedByUserId: updatedByUserId || null,
        updatedByRole: updatedByRole || null,
      },
      update: updateData,
    });

    return respond(NextResponse.json({ success: true, data: finance }));
  } catch (error: any) {
    console.error('Error saving daily finance:', error);
    const msg = error?.message || 'Failed to save';
    return respond(NextResponse.json({ success: false, error: msg }, { status: 500 }));
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request);
}
