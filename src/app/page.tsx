import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-4">ReferralConnect</h1>
      <p className="text-gray-100 mb-4">Welcome to ReferralConnect, your platform for seamless referrals.</p>
      <div className="flex space-x-4">
        <Link href="/request-referral" className="bg-primary text-primary-foreground hover:bg-primary/80 px-4 py-2 rounded-md font-medium">
          Request a Referral
        </Link>
        <Link href="/referrer-signup" className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium">
          Referrer Signup
        </Link>
      </div>
    </div>
  );
}
