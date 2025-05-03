
import Razorpay from 'razorpay';
import { NextApiRequest, NextApiResponse } from 'next';

// Replace with your actual key ID and secret, preferably from environment variables
const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_51TABBJcBdp6DS';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '2Dg1SED1eabs24JaaBOXAoxI';

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { amount } = req.body; // Amount should be in paise

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount provided.' });
    }

    const options = {
      amount: amount, // amount in the smallest currency unit (paise for INR)
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`, // Generate a unique receipt ID
      payment_capture: 1 // Auto capture payment
    };

    try {
      const response = await razorpay.orders.create(options);
      console.log('Razorpay Order Created:', response); // Server-side log
      res.status(200).json({
        orderId: response.id,
        keyId: keyId, // Send key_id back to frontend
        amount: response.amount,
        currency: response.currency,
      });
    } catch (error: any) {
      console.error('Error creating Razorpay order:', error);
      // Ensure a JSON error response is sent
      res.status(500).json({ error: error.message || 'Failed to create Razorpay order' });
    }
  } else {
    // Handle any other HTTP method
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

    