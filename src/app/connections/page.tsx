
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2 } from 'lucide-react';

const companies = [
  "Accenture",
  "Tata Consultancy Services (TCS)",
  "Infosys",
  "Capgemini",
  "Wipro",
  "Cognizant",
  "Tech Mahindra",
  "Amdocs",
  "Nice",
  "Fujitsu",
  "Deloitte",
  "HCL",
  "Microsoft",
  "Oracle",
  "DXC",
  "Mercedes",
  "Salesforce",
  "PwC"
];

const ConnectionsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 bg-background text-foreground min-h-screen">
      <div className="max-w-3xl mx-auto">
        <Link href="/" passHref className="mb-8 inline-block">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-6 text-center">
          <Building2 className="inline-block h-8 w-8 mr-3 text-primary" />
          Our Connections
        </h1>
        <p className="text-lg text-center text-muted-foreground mb-10">
          Our referral connections work at the companies listed below.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
          {companies.map((company, index) => (
            <div key={index} className="bg-card p-4 rounded-lg shadow-md border border-border hover:border-primary transition-colors duration-200">
              <p className="text-card-foreground text-center font-medium">{company}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConnectionsPage;
