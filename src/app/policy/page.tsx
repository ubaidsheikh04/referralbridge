
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PolicyPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 bg-background text-foreground min-h-screen">
      <div className="max-w-3xl mx-auto">
        <Link href="/" passHref className="mb-6 inline-block">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">ReferralBridge – Terms and Conditions of Use</h1>
        <p className="text-sm text-muted-foreground mb-6">Effective Date: May 2025</p>

        <div className="space-y-6 text-muted-foreground prose prose-sm sm:prose-base prose-neutral dark:prose-invert max-w-none">
          <p>Welcome to ReferralBridge. These Terms and Conditions (“Terms”) constitute a legally binding agreement between you (“User”, “you”, “your”) and ReferralBridge (“ReferralBridge”, “we”, “our”, “us”), a neutral third-party platform designed to connect individuals seeking job referrals (“Requesters”) with professionals offering referrals (“Referrers”).</p>

          <p>By accessing or using ReferralBridge, you acknowledge that you have read, understood, and agree to be bound by these Terms, along with our Privacy Policy and any additional policies published by us. If you do not agree with any part of these Terms, you must immediately discontinue use of the platform.</p>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">1. Purpose and Nature of Service</h2>
            <p>ReferralBridge operates solely as a communication platform. We:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Provide infrastructure for connecting Requesters and Referrers.</li>
              <li>Facilitate resume sharing and basic user interactions.</li>
              <li>Offer a database of publicly visible referral-related requests and profiles.</li>
            </ul>
            <p>We do not operate as a recruitment agency, job board, or employment provider. We do not participate in:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>The review of candidates’ qualifications.</li>
              <li>The actual act of referral by the Referrer.</li>
              <li>Any employment decision-making process of the hiring company.</li>
            </ul>
            <p>Any agreement, referral, or interaction between a Referrer and Requester is entirely at their own risk and discretion.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">2. Strict No-Guarantee Policy</h2>
            <p>ReferralBridge does not guarantee:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>That a Referrer will respond to your request.</li>
              <li>That your profile will be selected for a referral.</li>
              <li>That you will be invited to an interview or hired by any company.</li>
              <li>That Referrers listed are genuine, responsive, or currently employed at the stated companies.</li>
            </ul>
            <p>By using ReferralBridge, you explicitly agree and acknowledge that:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>ReferralBridge, its founder Ubaid, and any affiliates or contributors are not responsible for job-related outcomes.</li>
              <li>No success, interview, or job guarantee is implied, promised, or assured in any form.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">3. Platform Fee and No-Service Fee Disclaimer</h2>
            <p>ReferralBridge may charge a Platform Fee for access to certain features or services. This fee is:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Solely for platform use—to cover hosting, development, operational costs.</li>
              <li>Not a payment for referral, job placement, or employment services.</li>
              <li>Non-refundable, regardless of the outcome of any referral request or user interaction.</li>
            </ul>
            <p>Users must not interpret this fee as a bribe, commission, or offer to secure a job opportunity.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">4. Data Visibility and Public Access</h2>
            <p>ReferralBridge is a publicly accessible platform. By using the platform, you understand and consent to the following:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Your submitted data (name, LinkedIn, resume details, skills, company preferences, etc.) will be publicly viewable to enable the platform’s matching function.</li>
              <li>Referrers, Requesters, and any other site visitors may view your data.</li>
              <li>If you are not comfortable with this, you must not upload your information or use the platform.</li>
            </ul>
            <p>We do not guarantee that third parties will not copy, store, or misuse publicly visible data.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">5. Disclaimer of Data Security and Liability</h2>
            <p>Although we strive to secure your data using reasonable measures:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>We cannot and do not guarantee that your data will remain secure.</li>
              <li>You understand that data breaches, cyberattacks, unauthorized access, or data loss may occur.</li>
              <li>In the event of a security compromise, ReferralBridge, its developer Ubaid, or any affiliated partners will not be held legally or financially liable for any loss, misuse, or damages.</li>
            </ul>
            <p>You use the platform entirely at your own risk. We recommend against uploading highly sensitive or confidential documents or data.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">6. Eligibility and User Obligations</h2>
            <p>By using the platform, you confirm that you:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Are at least 18 years old and legally eligible to enter into binding contracts.</li>
              <li>Will provide accurate, current, and truthful information.</li>
              <li>Are solely responsible for the content you upload, share, or communicate.</li>
              <li>Will not engage in fraud, impersonation, harassment, or abuse on the platform.</li>
            </ul>
            <p>We reserve the right to suspend or terminate your access without notice if we detect any policy violations, misuse, or suspicious activity.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">7. No Affiliation or Endorsement</h2>
            <p>ReferralBridge is not affiliated with, sponsored by, or endorsed by any of the companies that may be mentioned by users (Requesters or Referrers). Any reference to companies, logos, or trademarks is strictly for contextual purposes and does not imply any relationship.</p>
            <p>We do not:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Represent any employer.</li>
              <li>Guarantee that a Referrer is employed by the company they list.</li>
              <li>Verify employment status or authenticity of the Referrer.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">8. Intellectual Property</h2>
            <p>All content and software on the ReferralBridge platform, including logos, branding, layout, and functionality, are protected by applicable copyright, trademark, and intellectual property laws. You may not:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Reproduce, redistribute, or modify any part of the platform.</li>
              <li>Reverse engineer, extract source code, or clone the system.</li>
              <li>Use the platform content for any commercial gain without written permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">9. No Refund Policy</h2>
            <p>All payments made to ReferralBridge, including platform fees, donations, or contributions, are:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Non-refundable under all circumstances.</li>
              <li>Not subject to dispute based on dissatisfaction or unmet expectations.</li>
              <li>Collected strictly for maintaining platform infrastructure.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">10. Indemnification</h2>
            <p>You agree to indemnify, defend, and hold harmless ReferralBridge, Ubaid (Developer), employees, contributors, affiliates, and partners from any claims, damages, losses, liabilities, or expenses (including legal fees) arising out of:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Your use or misuse of the Platform.</li>
              <li>Any breach of these Terms.</li>
              <li>Any dispute between you and another user.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">11. Termination of Service</h2>
            <p>We may suspend, restrict, or terminate your access to all or any part of the platform at any time, with or without cause, with or without notice, and without liability. This includes, but is not limited to:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Suspected violation of these Terms.</li>
              <li>Security or operational concerns.</li>
              <li>Requests by law enforcement or government authorities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">12. Force Majeure</h2>
            <p>ReferralBridge shall not be held liable for any delay or failure in performance resulting from events beyond our reasonable control, including but not limited to:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Natural disasters, power outages, network failures.</li>
              <li>Cyberattacks, data corruption, or server crashes.</li>
              <li>Third-party platform disruptions or legal orders.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">13. Modifications to Terms</h2>
            <p>We may update or change these Terms at any time at our sole discretion. Changes will become effective upon posting. Continued use of the Platform constitutes acceptance of the revised Terms.</p>
            <p>Users are encouraged to regularly review the Terms for updates.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">14. Governing Law and Jurisdiction</h2>
            <p>These Terms are governed by and construed in accordance with the laws of the Republic of India (or your applicable jurisdiction). Any disputes arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the courts located in Kolhapur.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">15. Developer and Affiliate Liability Disclaimer</h2>
            <p>The platform is developed and maintained by Ubaid. You agree and acknowledge that:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Ubaid is not liable for the consequences of any user interaction.</li>
              <li>No affiliate, contributor, advisor, or partner of Ubaid is responsible for platform misuse, user disputes, or data loss.</li>
              <li>You waive any right to bring legal action against Ubaid personally or against any associated third parties for matters arising from platform usage.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">16. Final Agreement</h2>
            <p>By using the ReferralBridge platform, you confirm that:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>You have read, understood, and agreed to all the Terms listed above.</li>
              <li>You are using the platform entirely at your own risk.</li>
              <li>You accept the limitations of liability and public data usage model inherent in the platform’s operation.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PolicyPage;

    