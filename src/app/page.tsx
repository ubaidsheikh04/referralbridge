
"use client";

import Link from 'next/link';
import { Rocket, FileText, Users, Info, ShieldAlert } from 'lucide-react'; // Removed Mail, kept Info for footer, Added ShieldAlert
import { useEffect, useState } from 'react';

export default function Home() {
  const [showText, setShowText] = useState(true); // This state seems unused
  const [isLaunching, setIsLaunching] = useState(false); // This state seems unused

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

        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-secondary to-transparent"></div>
      </div>
      <footer className="absolute bottom-4 text-center w-full z-10">
        <div className="flex justify-center items-center space-x-6">
          <Link href="/policy" passHref>
            <span className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center justify-center">
              <FileText className="h-4 w-4 mr-1" />
              Terms & Conditions
            </span>
          </Link>
          <Link href="/about" passHref>
            <span className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center justify-center">
              <Info className="h-4 w-4 mr-1" />
              About Us
            </span>
          </Link>
        </div>
      </footer>

      {/* Hidden Admin Panel Button */}
      <Link
        href="/admin-login"
        className="fixed bottom-4 right-4 opacity-0 hover:opacity-100 transition-opacity duration-300 p-2 bg-transparent rounded-full z-50"
        title="Admin Panel"
      >
        <ShieldAlert className="h-6 w-6 text-muted-foreground hover:text-primary" />
      </Link>
    </div>
  );
}
