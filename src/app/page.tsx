"use client";

import Link from 'next/link';
import { Rocket } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const [showText, setShowText] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);

  return (
    <div className="relative bg-secondary min-h-screen flex items-center justify-center">
      <div className="container mx-auto text-center py-20">
        <h1 className="text-5xl font-bold text-primary mb-8">
          <span className="inline-block mr-2">
            <Rocket className="inline-block h-10 w-10 text-primary" />
          </span>
          ReferralBridge
        </h1>
        <p className="text-near-white text-lg mb-10">
          Welcome to ReferralBridge, your platform for seamless referrals.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link
            href="/request-referral"
            className="bg-accent text-accent-foreground hover:bg-accent/80 px-6 py-3 rounded-full font-medium transition-colors duration-300 shadow-md transform hover:-translate-y-1"
          >
            Request a Referral
          </Link>
          <Link
            href="/referrer-signup"
            className="bg-accent text-accent-foreground hover:bg-accent/80 px-6 py-3 rounded-full font-medium transition-colors duration-300 shadow-md transform hover:-translate-y-1"
          >
            Referrer Signup
          </Link>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-secondary to-transparent"></div>
      </div>
    </div>
  );
}
