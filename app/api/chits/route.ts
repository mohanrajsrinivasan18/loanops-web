import { NextRequest, NextResponse } from 'next/server';
import { chitService } from '@/lib/services/chitService';

/**
 * GET /api/chits
 * Get all chits for a tenant
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId');
    const status = request.nextUrl.searchParams.get('status');
    const agentId = request.nextUrl.searchParams.get('agentId');
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      );
    }

    const chits = await chitService.getAll(tenantId, {
      status: status || undefined,
      agentId: agentId || undefined,
    });

    return NextResponse.json({
      success: true,
      data: chits,
    });
  } catch (error: any) {
    console.error('Error fetching chits:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chits
 * Create a new chit
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      chitName,
      chitValue,
      duration,
      memberCount,
      monthlyAmount,
      startDate,
      agentId,
      tenantId,
    } = body;

    // Validation
    if (!chitName || !chitValue || !duration || !memberCount || !monthlyAmount || !startDate || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const chit = await chitService.create({
      chitName,
      chitValue: parseFloat(chitValue),
      duration: parseInt(duration),
      memberCount: parseInt(memberCount),
      monthlyAmount: parseFloat(monthlyAmount),
      startDate: new Date(startDate),
      agentId,
      tenantId,
    });

    return NextResponse.json({
      success: true,
      data: chit,
      message: 'Chit created successfully',
    });
  } catch (error: any) {
    console.error('Error creating chit:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
