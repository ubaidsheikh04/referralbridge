
"use client";

import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import ReferralRequestTile from "@/components/ReferralRequestTile";
import { toast } from "@/hooks/use-toast";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HomeIcon } from 'lucide-react';

interface ReferralRequestData {
  id: string;
  name: string;
  email: string;
  targetCompany: string;
  jobId: string;
  resumeUrl?: string;
  status?: 'pending' | 'referred' | 'rejected';
  paymentStatus?: string;
}

type ActiveView = 'companyReferrals' | 'mySubmitted';

const DashboardPage = () => {
  const [companyReferrals, setCompanyReferrals] = useState<ReferralRequestData[]>([]);
  const [mySubmittedRequests, setMySubmittedRequests] = useState<ReferralRequestData[]>([]);
  const [company, setCompany] = useState('');
  const [referrerEmail, setReferrerEmail] = useState('');
  const [isLoadingCompanyReferrals, setIsLoadingCompanyReferrals] = useState(true);
  const [isLoadingMyRequests, setIsLoadingMyRequests] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>('companyReferrals');

  useEffect(() => {
    const storedCompany = sessionStorage.getItem('company');
    const storedEmail = sessionStorage.getItem('referrerEmail');
    if (storedCompany) {
      setCompany(storedCompany);
    }
    if (storedEmail) {
      setReferrerEmail(storedEmail);
    }
    if (!storedCompany && !storedEmail) {
        setIsLoadingCompanyReferrals(false);
        setIsLoadingMyRequests(false);
    }
  }, []);

  // Fetch company referrals
  useEffect(() => {
    if (company) {
      const fetchCompanyReferrals = async () => {
        setIsLoadingCompanyReferrals(true);
        const referralCollectionRef = collection(db, 'referralRequests');
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
  }, [company]);

  // Fetch my submitted requests
  useEffect(() => {
    if (referrerEmail) {
      const fetchMySubmittedRequests = async () => {
        setIsLoadingMyRequests(true);
        const referralCollectionRef = collection(db, 'referralRequests');
        const q = query(referralCollectionRef, where("email", "==", referrerEmail), where("paymentStatus", "==", "paid"));
        try {
          const querySnapshot = await getDocs(q);
          const requests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReferralRequestData));
          setMySubmittedRequests(requests);
        } catch (error) {
          console.error("Error fetching my submitted requests:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch your submitted requests.",
          });
        } finally {
          setIsLoadingMyRequests(false);
        }
      };
      fetchMySubmittedRequests();
    } else {
        setMySubmittedRequests([]);
        setIsLoadingMyRequests(false);
    }
  }, [referrerEmail]);

  const handleRefer = async (requestId: string) => {
    const requestRef = doc(db, 'referralRequests', requestId);
    try {
      await updateDoc(requestRef, { status: 'referred' });
      setCompanyReferrals(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId ? { ...req, status: 'referred' } : req
        )
      );
      toast({
        title: "Success",
        description: "Candidate marked as referred.",
      });
    } catch (error) {
      console.error("Error updating referral status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update referral status.",
      });
    }
  };

  const renderContent = () => {
    if (activeView === 'companyReferrals') {
      if (isLoadingCompanyReferrals) return <p className="text-foreground">Loading company referrals...</p>;
      if (!company) return <p className="text-foreground">Sign up as a referrer to view company referrals.</p>;
      if (companyReferrals.length === 0) return <p className="text-foreground">No referral requests available for {company}.</p>;
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companyReferrals.map((request) => (
            <ReferralRequestTile
              key={request.id}
              request={request}
              onRefer={handleRefer}
              viewMode="referrer"
            />
          ))}
        </div>
      );
    } else { // activeView === 'mySubmitted'
      if (isLoadingMyRequests) return <p className="text-foreground">Loading your submitted requests...</p>;
      if (!referrerEmail) return <p className="text-foreground">Log in to view your submitted requests.</p>;
      if (mySubmittedRequests.length === 0) return <p className="text-foreground">You have not submitted any referral requests.</p>;
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mySubmittedRequests.map((request) => (
            <ReferralRequestTile
              key={request.id}
              request={request}
              viewMode="candidate"
            />
          ))}
        </div>
      );
    }
  };
  
  const getPageTitle = () => {
    if (activeView === 'companyReferrals') {
        return `Referral Requests for ${company || 'your company'}`;
    }
    return "My Submitted Requests";
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
                  <SidebarMenuButton onClick={() => setActiveView('companyReferrals')} 
                    className={activeView === 'companyReferrals' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
                  >
                    Company Referrals
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setActiveView('mySubmitted')}
                    className={activeView === 'mySubmitted' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
                  >
                    My Submitted Requests
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
