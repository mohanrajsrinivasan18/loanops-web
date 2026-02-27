import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId');
    
    if (!tenantId) {
      return addCorsHeaders(NextResponse.json({ error: 'Tenant ID required' }, { status: 400 }));
    }
    
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
      include: {
        Tenant: true,
      },
    });
    
    if (!settings) {
      return addCorsHeaders(NextResponse.json({ error: 'Tenant settings not found' }, { status: 404 }));
    }
    
    return addCorsHeaders(NextResponse.json({
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      companyName: settings.brandName,
      logo: settings.brandLogo || '/logo.svg',
      currency: settings.currency,
      timezone: settings.timezone,
    }));
  } catch (error) {
    console.error('Error fetching branding:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to fetch branding' }, { status: 500 }));
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, primaryColor, secondaryColor, brandName, brandLogo } = body;
    
    if (!tenantId) {
      return addCorsHeaders(NextResponse.json({ error: 'Tenant ID required' }, { status: 400 }));
    }
    
    const settings = await prisma.tenantSettings.update({
      where: { tenantId },
      data: {
        primaryColor,
        secondaryColor,
        brandName,
        brandLogo,
      },
    });
    
    return addCorsHeaders(NextResponse.json(settings));
  } catch (error) {
    console.error('Error updating branding:', error);
    return addCorsHeaders(NextResponse.json({ error: 'Failed to update branding' }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return corsOptions();
}
