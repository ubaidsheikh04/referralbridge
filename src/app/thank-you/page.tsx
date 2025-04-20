"use client";

import Link from 'next/link';

const ThankYouPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary">
      <h1 className="text-4xl font-bold text-primary mb-4">Thank You!</h1>
      <p className="text-lg text-foreground mb-8">Your referral request has been submitted successfully.</p>
      <Link href="/" className="bg-accent text-accent-foreground hover:bg-accent/80 px-6 py-3 rounded-full font-medium transition-colors duration-300 shadow-md transform hover:-translate-y-1">
        Back to Home
      </Link>
    </div>
  );
};

export default ThankYouPage;
