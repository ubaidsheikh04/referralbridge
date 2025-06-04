
"use client";

import Link from 'next/link';
import { Rocket, FileText, Users, Info, Mail } from 'lucide-react'; // Added Info, Mail
import { useEffect, useState } from 'react';

export default function Home() {
  const [showText, setShowText] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);

  return (
    <div className="relative bg-secondary min-h-screen flex flex-col items-center justify-center pt-16 pb-8">
      <div className="container mx-auto text-center py-10">
        <h1 className="text-5xl font-bold text-primary mb-8">
          <span className="inline-block mr-2">
            <Rocket className="inline-block h-10 w-10 text-primary" />
          </span>
          ReferralBridge
        </h1>
        <p className="text-foreground text-lg mb-10 px-4 md:px-0">
          Welcome to ReferralBridge, your platform for seamless referrals.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <Link
            href="/request-referral"
            className="bg-accent text-accent-foreground hover:bg-accent/80 px-6 py-3 rounded-full font-medium transition-colors duration-300 shadow-md transform hover:-translate-y-1"
          >
            I want a referral
          </Link>
          <Link
            href="/referrer-signup"
            className="bg-accent text-accent-foreground hover:bg-accent/80 px-6 py-3 rounded-full font-medium transition-colors duration-300 shadow-md transform hover:-translate-y-1"
          >
            I want to refer someone
          </Link>
        </div>
        <div className="mt-8 mb-12">
          <Link
            href="/connections"
            className="text-primary hover:text-primary/80 font-medium transition-colors duration-300 flex items-center justify-center group"
          >
            <Users className="h-5 w-5 mr-2 group-hover:animate-button-pop" />
            Our Connections
          </Link>
        </div>

        {/* About ReferralBridge Section */}
        <section className="mt-16 mb-10 text-left max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-primary mb-4 flex items-center">
            <Info className="h-7 w-7 mr-3 text-primary" />
            About ReferralBridge
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            Connecting Talent to Opportunities — One Referral at a Time
          </p>
          <p className="text-foreground mb-4">
            ReferralBridge is a modern, secure, and efficient job referral platform that connects job seekers with employees at top companies who are open to providing genuine referrals. Our mission is simple yet powerful: to break down barriers to employment by making referrals more accessible, trusted, and trackable.
          </p>

          <h3 className="text-2xl font-semibold text-primary mt-8 mb-3">🌟 Why ReferralBridge?</h3>
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

          <h3 className="text-2xl font-semibold text-primary mt-8 mb-3">🛠️ How It Works</h3>
          <h4 className="text-xl font-medium text-foreground mt-4 mb-2">Request a Referral</h4>
          <p className="text-foreground mb-4">
            Fill out a smart form with your details, job role, and resume.
          </p>
          <h4 className="text-xl font-medium text-foreground mt-4 mb-2">Verify Your Identity</h4>
          <p className="text-foreground mb-4">
            We use OTP email verification and other methods to ensure only real people use our platform.
          </p>
          <h4 className="text-xl font-medium text-foreground mt-4 mb-2">Get Matched with Referrers</h4>
          <p className="text-foreground mb-4">
            We connect you with verified employees at your dream companies.
          </p>
          <h4 className="text-xl font-medium text-foreground mt-4 mb-2">Track Your Referral Status</h4>
          <p className="text-foreground mb-4">
            Stay updated throughout the referral lifecycle — no guessing, no ghosting.
          </p>

          <h3 className="text-2xl font-semibold text-primary mt-8 mb-3">🔒 Security and Trust First</h3>
          <p className="text-foreground mb-4">
            At ReferralBridge, we take your privacy seriously. All data is securely stored, and referrers retain full control over whom they choose to help. We never sell your data or share your profile without your consent.
          </p>

          <h3 className="text-2xl font-semibold text-primary mt-8 mb-3">💡 Our Vision</h3>
          <p className="text-foreground mb-4">
            We envision a future where referrals are democratized — not based on who you know, but what you know. Whether you're a fresh graduate, a career switcher, or an experienced professional, you deserve access to a transparent referral process.
          </p>

          <h3 className="text-2xl font-semibold text-primary mt-8 mb-3">🤝 Join the Referral Revolution</h3>
          <p className="text-foreground mb-4">
            Be part of a growing community that believes in equal opportunity and professional support.
            👉 <Link href="/request-referral" className="text-accent hover:underline">Request a Referral</Link> or <Link href="/referrer-signup" className="text-accent hover:underline">Become a Referrer</Link> today.
          </p>

          <p className="text-foreground mt-8 flex items-center">
            <Mail className="h-5 w-5 mr-2 text-primary" />
            For partnerships, collaborations, or support, contact us: <a href="mailto:referrals.bridge@gmail.com" className="text-accent hover:underline ml-1">referrals.bridge@gmail.com</a>
          </p>
        </section>
        
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-secondary to-transparent"></div>
      </div>
      <footer className="absolute bottom-4 text-center w-full">
        <Link href="/policy" passHref>
          <span className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center justify-center">
            <FileText className="h-4 w-4 mr-1" />
            Terms & Conditions
          </span>
        </Link>
      </footer>
    </div>
  );
}
