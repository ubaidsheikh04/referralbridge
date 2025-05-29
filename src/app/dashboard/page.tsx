
"use client";

import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, increment, getDoc } from "firebase/firestore"; // Added increment and getDoc
import { db } from "@/services/firebase";
import ReferralRequestTile from "@/components/ReferralRequestTile";
import { toast } from "@/hooks/use-toast";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HomeIcon, Briefcase } from 'lucide-react';

interface ReferralRequestData {
  id: string;
  name: string;
  email: string;
  targetCompany: string;
  jobId: string;
  resumeUrl?: string;
  status?: 'pending' | 'referred' | 'rejected'; // Status is still relevant for candidate view
  paymentStatus?: string;
  viewCount?: number; // Added viewCount
}

const DashboardPage = () => {
  const [companyReferrals, setCompanyReferrals] = useState<ReferralRequestData[]>([]);
  const [company, setCompany] = useState('');
  const [referrerEmail, setReferrerEmail] = useState('');
  const [isLoadingCompanyReferrals, setIsLoadingCompanyReferrals] = useState(true);

  useEffect(() => {
    const storedCompany = sessionStorage.getItem('company');
    const storedReferrerEmail = sessionStorage.getItem('referrerEmail');

    if (storedCompany) {
      setCompany(storedCompany);
    }
    if (storedReferrerEmail) {
      setReferrerEmail(storedReferrerEmail);
    }

    if (!storedCompany || !storedReferrerEmail) {
        setIsLoadingCompanyReferrals(false);
    }
  }, []);

  useEffect(() => {
    if (company && referrerEmail) {
      const fetchCompanyReferrals = async () => {
        setIsLoadingCompanyReferrals(true);
        const referralCollectionRef = collection(db, 'referralRequests');
        // We still only fetch paid requests
        const q = query(referralCollectionRef, where("targetCompany", "==", company), where("paymentStatus", "==", "paid"));
        try {
          const querySnapshot = await getDocs(q);
          const requests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReferralRequestData));
          setCompanyReferrals(requests);
        } catch (error) {
          console.error("Error fetching company referral requests:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch company referral requests.",
          });
        } finally {
          setIsLoadingCompanyReferrals(false);
        }
      };
      fetchCompanyReferrals();
    } else {
        setCompanyReferrals([]);
        setIsLoadingCompanyReferrals(false);
    }
  }, [company, referrerEmail]);

  const handleViewResumeAction = async (requestId: string) => {
    const requestRef = doc(db, 'referralRequests', requestId);
    try {
      // Increment viewCount in Firestore
      await updateDoc(requestRef, {
        viewCount: increment(1)
      });

      // Update local state to reflect the new view count
      setCompanyReferrals(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId ? { ...req, viewCount: (req.viewCount || 0) + 1 } : req
        )
      );
      // We are no longer setting status to 'referred' here.
      // The "resume viewed" email is sent from the tile itself.
      toast({
        title: "Action Logged",
        description: "Resume view has been recorded.",
      });
    } catch (error) {
      console.error("Error updating view count:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update view count.",
      });
    }
  };

  const renderContent = () => {
    if (isLoadingCompanyReferrals) return <p className="text-foreground">Loading company referrals...</p>;
    if (!referrerEmail) return <p className="text-foreground">Please sign up or log in as a referrer to view company referrals.</p>;
    if (!company && referrerEmail) return <p className="text-foreground">Company information not found. Please ensure you signed up with a company.</p>;
    if (companyReferrals.length === 0) return <p className="text-foreground">No referral requests currently available for {company}.</p>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companyReferrals.map((request) => (
          <ReferralRequestTile
            key={request.id}
            request={request}
            onViewAction={handleViewResumeAction} // Changed prop name for clarity
            viewMode="referrer"
          />
        ))}
      </div>
    );
  };

  const getPageTitle = () => {
    if (!referrerEmail) return "Referrer Dashboard";
    return company ? `Referral Requests for ${company}` : "Company Referrals (Company not specified)";
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className={'bg-sidebar-accent text-sidebar-accent-foreground'}
                    disabled={!referrerEmail}
                  >
                    <Briefcase className="mr-2 h-4 w-4" /> Company Referrals
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-primary">{getPageTitle()}</h1>
            <Link href="/" passHref>
              <Button variant="outline" size="icon" aria-label="Go to Homepage">
                <HomeIcon className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          {renderContent()}
        </div>
      </div>
    </SidebarProvider>
  );
};
export default DashboardPage;
