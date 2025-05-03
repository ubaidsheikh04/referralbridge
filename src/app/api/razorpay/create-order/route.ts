import Razorpay from "razorpay";
import { NextResponse } from "next/server";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error(
    "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be defined in the environment variables"
  );
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export async function POST(request: Request) {
  const { amount } = await request.json();

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount provided." }, { status: 400 });
  }

  const options = {
    amount: amount,
    currency: "INR",
    receipt: `receipt_order_${Date.now()}`, // Generate a unique receipt ID
    payment_capture: 1,
  };

  try {
    const response = await razorpay.orders.create(options);
    console.log("Razorpay Order Created:", response);
    return NextResponse.json({
      orderId: response.id,
      keyId: keyId,
      amount: response.amount,
      currency: response.currency,
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json({ error: error.message || "Failed to create Razorpay order" }, { status: 500 });
  }
}
