
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, Mail } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 bg-background text-foreground min-h-screen">
      <div className="max-w-3xl mx-auto">
        <Link href="/" passHref className="mb-8 inline-block">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <section className="text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4 flex items-center">
            <Info className="h-8 w-8 mr-3 text-primary" />
            About ReferralBridge
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Connecting Talent to Opportunities — One Referral at a Time
          </p>
          <p className="text-foreground mb-4">
            ReferralBridge is a modern, secure, and efficient job referral platform that connects job seekers with employees at top companies who are open to providing genuine referrals. Our mission is simple yet powerful: to break down barriers to employment by making referrals more accessible, trusted, and trackable.
          </p>

          <h2 className="text-2xl font-semibold text-primary mt-8 mb-3">🌟 Why ReferralBridge?</h2>
          <p className="text-foreground mb-4">
            In today’s competitive job market, a referral can make the difference between landing an interview or being overlooked. Yet, for most applicants, finding a reliable referrer is a frustrating and uncertain process.
          </p>
          <p className="text-foreground mb-4">
            ReferralBridge solves this by creating a trusted ecosystem where:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2 text-foreground mb-4">
            <li>Qualified candidates can request referrals with confidence.</li>
            <li>Employees can offer referrals with ease and transparency.</li>
            <li>Recruiters get access to verified, motivated talent.</li>
          </ul>
          <p className="text-foreground mb-4">
            Whether you're a software engineer, designer, analyst, or marketer, ReferralBridge helps you get referred to top companies like Google, Amazon, Microsoft, Meta, and hundreds more.
          </p>

          <h2 className="text-2xl font-semibold text-primary mt-8 mb-3">🛠️ How It Works</h2>
          <h3 className="text-xl font-medium text-foreground mt-4 mb-2">Request a Referral</h3>
          <p className="text-foreground mb-4">
            Fill out a smart form with your details, job role, and resume.
          </p>
          <h3 className="text-xl font-medium text-foreground mt-4 mb-2">Verify Your Identity</h3>
          <p className="text-foreground mb-4">
            We use OTP email verification and other methods to ensure only real people use our platform.
          </p>
          <h3 className="text-xl font-medium text-foreground mt-4 mb-2">Get Matched with Referrers</h3>
          <p className="text-foreground mb-4">
            We connect you with verified employees at your dream companies.
          </p>
          <h3 className="text-xl font-medium text-foreground mt-4 mb-2">Track Your Referral Status</h3>
          <p className="text-foreground mb-4">
            Stay updated throughout the referral lifecycle — no guessing, no ghosting.
          </p>

          <h2 className="text-2xl font-semibold text-primary mt-8 mb-3">🔒 Security and Trust First</h2>
          <p className="text-foreground mb-4">
            At ReferralBridge, we take your privacy seriously. All data is securely stored, and referrers retain full control over whom they choose to help. We never sell your data or share your profile without your consent.
          </p>

          <h2 className="text-2xl font-semibold text-primary mt-8 mb-3">💡 Our Vision</h2>
          <p className="text-foreground mb-4">
            We envision a future where referrals are democratized — not based on who you know, but what you know. Whether you're a fresh graduate, a career switcher, or an experienced professional, you deserve access to a transparent referral process.
          </p>

          <h2 className="text-2xl font-semibold text-primary mt-8 mb-3">🤝 Join the Referral Revolution</h2>
          <p className="text-foreground mb-4">
            Be part of a growing community that believes in equal opportunity and professional support.
            👉 <Link href="/request-referral" className="text-accent hover:underline">Request a Referral</Link> or <Link href="/referrer-signup" className="text-accent hover:underline">Become a Referrer</Link> today.
          </p>

          <p className="text-foreground mt-8 flex items-center">
            <Mail className="h-5 w-5 mr-2 text-primary" />
            For partnerships, collaborations, or support, contact us: <a href="mailto:referrals.bridge@gmail.com" className="text-accent hover:underline ml-1">referrals.bridge@gmail.com</a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
