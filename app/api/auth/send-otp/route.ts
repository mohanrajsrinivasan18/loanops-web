import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addCorsHeaders, corsOptions } from '@/lib/apiCors';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone || phone.length < 10) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Valid phone number required' }, { status: 400 }),
        request
      );
    }

    // Clean phone: remove +91, spaces, dashes
    const cleanPhone = phone.replace(/[\s\-\+]/g, '').replace(/^91/, '');

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete old OTPs for this phone
    await prisma.otp.deleteMany({ where: { phone: cleanPhone } });

    // Save new OTP
    await prisma.otp.create({
      data: { phone: cleanPhone, code, expiresAt },
    });

    // Check if phone is already registered (User or Agent)
    const existingUser = await prisma.user.findFirst({ where: { phone: cleanPhone } });
    const existingAgent = await prisma.agent.findFirst({ where: { phone: cleanPhone, status: 'active' } });
    const isRegistered = !!(existingUser || existingAgent);

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        message: 'OTP sent successfully',
        isRegistered,
        otp: code, // Return always for now since SMS is not integrated
      }),
      request
    );
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return addCorsHeaders(
      NextResponse.json({ error: 'Failed to send OTP', details: error.message }, { status: 500 }),
      request
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsOptions(request);
}
