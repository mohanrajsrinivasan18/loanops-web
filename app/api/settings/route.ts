import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

const DEFAULT_AGENT_VISIBILITY = {
  showLoanSummary: true,
  showActiveLoans: true,
  showDocuments: false,
  showLocationMap: false,
  showPreviousLoans: false,
  showQuickActions: true,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'default';

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId }
    });

    if (!settings) {
      return addCorsHeaders(NextResponse.json({
        success: true,
        data: {
          interestRates: {
            daily: 2.5,
            weekly: 10,
            monthly: 20
          },
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          minLoanAmount: 5000,
          maxLoanAmount: 500000,
          defaultInterestRate: 12,
          defaultTenure: 12,
          agentVisibility: DEFAULT_AGENT_VISIBILITY,
        }
      }));
    }

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: {
        interestRates: {
          daily: 2.5,
          weekly: 10,
          monthly: 20
        },
        currency: settings.currency,
        timezone: settings.timezone,
        minLoanAmount: settings.minLoanAmount,
        maxLoanAmount: settings.maxLoanAmount,
        defaultInterestRate: settings.defaultInterestRate,
        defaultTenure: settings.defaultTenure,
        agentVisibility: (settings.agentVisibility as any) || DEFAULT_AGENT_VISIBILITY,
      }
    }));

  } catch (error: any) {
    console.error('Get settings error:', error);
    return addCorsHeaders(NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch settings'
        }
      },
      { status: 500 }
    ));
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId = 'default', interestRates, agentVisibility, ...otherSettings } = body;

    const updateData: any = {
      ...otherSettings,
      updatedAt: new Date(),
    };

    // If agentVisibility is provided, include it
    if (agentVisibility !== undefined) {
      updateData.agentVisibility = agentVisibility;
    }

    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: updateData,
      create: {
        id: `settings_${tenantId}`,
        tenantId,
        ...updateData,
        createdAt: new Date(),
      }
    });

    return addCorsHeaders(NextResponse.json({
      success: true,
      data: {
        ...settings,
        agentVisibility: (settings.agentVisibility as any) || DEFAULT_AGENT_VISIBILITY,
      }
    }));

  } catch (error: any) {
    console.error('Update settings error:', error);
    return addCorsHeaders(NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update settings'
        }
      },
      { status: 500 }
    ));
  }
}

export async function OPTIONS() {
  return corsOptions();
}
