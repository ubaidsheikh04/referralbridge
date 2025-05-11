
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, htmlBody } = await request.json();

    if (!to || !subject || !htmlBody) {
      return NextResponse.json({ error: 'Missing required email parameters (to, subject, htmlBody).' }, { status: 400 });
    }

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL, SMTP_SECURE } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM_EMAIL) {
      console.error('SMTP configuration is missing in environment variables.');
      return NextResponse.json({ error: 'Server configuration error for sending email.' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const mailOptions = {
      from: SMTP_FROM_EMAIL,
      to: to,
      subject: subject,
      html: htmlBody, // Use html for richer email content
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP Email sent to ${to}`);
    return NextResponse.json({ message: 'OTP Email sent successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error sending OTP email:', error);
    return NextResponse.json({ error: error.message || 'Failed to send OTP email.' }, { status: 500 });
  }
}
