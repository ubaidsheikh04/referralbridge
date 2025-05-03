import Razorpay from 'razorpay';
import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

// Razorpay key ID and secret
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be defined in the environment variables");
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});
  
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body.toString())
      .digest("hex")

    if (expectedSignature === razorpay_signature) {
      // Payment is valid
      console.log('Payment signature is valid.');

      // You might want to update your database here to mark the order as paid.
      res.status(200).json({ message: 'Payment signature is valid.' });
    } else {
      // Payment is invalid
      console.error('Payment signature verification failed.');
      res.status(400).json({ error: 'Payment signature verification failed.' });
    }
  } else {
    // Handle any other HTTP method
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}