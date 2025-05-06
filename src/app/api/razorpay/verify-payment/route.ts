
import Razorpay from 'razorpay';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Razorpay key ID and secret from environment variables
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
if (!keyId) {
    throw new Error("RAZORPAY_KEY_ID must be defined in the environment variables");
}

if (!keySecret || typeof keySecret !== 'string') {
  throw new Error("RAZORPAY_KEY_SECRET must be defined and be a string in the environment variables");

}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        console.error('Missing Razorpay payment details in request body:', body);
        return NextResponse.json({ error: 'Missing Razorpay payment details.' }, { status: 400 });
    }

    const signatureBody = razorpay_order_id + "|" + razorpay_payment_id;

      const expectedSignature = crypto
      .createHmac("sha256", keySecret as string)
      .update(signatureBody.toString())
      .digest("hex");

    console.log('Received Signature:', razorpay_signature);
    console.log('Expected Signature:', expectedSignature);

    if (expectedSignature === razorpay_signature) {
      // Payment is valid
      console.log('Payment signature is valid.');

      // You might want to update your database here to mark the order as paid/verified.
      // This endpoint's main job is just to confirm the signature validity.
      // The frontend will handle saving data upon receiving this confirmation.
      return NextResponse.json({ message: 'Payment signature is valid.' }, { status: 200 });
    } else {
      // Payment is invalid
      console.error('Payment signature verification failed.');
      return NextResponse.json({ error: 'Payment signature verification failed.' }, { status: 400 });
    }
  } catch (error: any) {
      console.error('Error verifying payment:', error);
      return NextResponse.json({ error: 'Internal server error during payment verification.' }, { status: 500 });
  }
}

    