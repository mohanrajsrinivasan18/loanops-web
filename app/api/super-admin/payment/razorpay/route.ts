import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// POST /api/super-admin/payment/razorpay - Create Razorpay order
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    
    if (!auth.user || auth.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { tenantId, subscriptionId, amount, currency = 'INR' } = body;

    if (!tenantId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if Razorpay is configured
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json(
        { success: false, error: 'Razorpay not configured' },
        { status: 500 }
      );
    }

    // Create Razorpay order
    const orderData = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: `rcpt_${Date.now()}`,
      notes: {
        tenantId,
        subscriptionId: subscriptionId || ''
      }
    };

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64')}`
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      throw new Error('Failed to create Razorpay order');
    }

    const order = await response.json();

    // Create invoice
    const invoiceNumber = `INV-${Date.now()}`;
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        subscriptionId,
        invoiceNumber,
        amount,
        tax: amount * 0.18, // 18% GST
        totalAmount: amount * 1.18,
        status: 'pending',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        paymentMethod: 'razorpay',
        paymentId: order.id
      }
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber
      },
      razorpayKeyId
    });

  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
