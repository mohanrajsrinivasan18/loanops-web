import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// POST /api/super-admin/payment/webhook - Razorpay webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Razorpay webhook secret not configured');
      return NextResponse.json(
        { success: false, error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Parse webhook payload
    const payload = JSON.parse(body);
    const event = payload.event;
    const paymentData = payload.payload.payment.entity;

    console.log('Razorpay webhook event:', event);

    // Handle payment success
    if (event === 'payment.captured') {
      const orderId = paymentData.order_id;
      const paymentId = paymentData.id;
      const amount = paymentData.amount / 100; // Convert from paise

      // Find invoice by payment ID (order ID)
      const invoice = await prisma.invoice.findFirst({
        where: { paymentId: orderId }
      });

      if (!invoice) {
        console.error('Invoice not found for order:', orderId);
        return NextResponse.json(
          { success: false, error: 'Invoice not found' },
          { status: 404 }
        );
      }

      // Update invoice status
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'paid',
          paidDate: new Date(),
          paymentId: paymentId
        }
      });

      // Update subscription if linked
      if (invoice.subscriptionId) {
        await prisma.tenantSubscription.update({
          where: { id: invoice.subscriptionId },
          data: { status: 'active' }
        });
      }

      console.log('Payment processed successfully:', paymentId);
    }

    // Handle payment failure
    if (event === 'payment.failed') {
      const orderId = paymentData.order_id;

      const invoice = await prisma.invoice.findFirst({
        where: { paymentId: orderId }
      });

      if (invoice) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: 'failed' }
        });
      }

      console.log('Payment failed:', orderId);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
