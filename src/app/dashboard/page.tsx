
"use client";

import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import React, { useEffect, useState } from 'react';
// Import Firebase functions
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import ReferralRequestTile from "@/components/ReferralRequestTile";
import { toast } from "@/hooks/use-toast";

// Define the shape of a referral request
interface ReferralRequestData {
  id: string;
  name: string;
  email: string;
  targetCompany: string;
  jobId: string;
  resumeUrl?: string;
  status?: 'pending' | 'referred' | 'rejected'; // Add status field
}

const DashboardPage = () => {
  const [referralRequests, setReferralRequests] = useState<ReferralRequestData[]>([]);
  const [company, setCompany] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  useEffect(() => {
    const storedCompany = sessionStorage.getItem('company');
    if (storedCompany) {
      setCompany(storedCompany);
    } else {
      setIsLoading(false); // No company stored, stop loading
    }
  }, []);

  useEffect(() => {
    if (company) {
      const fetchReferralRequests = async () => {
        setIsLoading(true); // Start loading when fetching
        const referralCollection = collection(db, 'referralRequests')

        // Create a query to filter by company and status (optional: show only pending)
        // const q = query(referralCollection, where("targetCompany", "==", company), where("status", "==", "pending"));
        const q = query(referralCollection, where("targetCompany", "==", company)); // Fetch all for the company for now

        try {
          const querySnapshot = await getDocs(q);
          const requests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReferralRequestData));
          setReferralRequests(requests);
        } catch (error) {
          console.error("Error fetching referral requests:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch referral requests.",
          });
        } finally {
          setIsLoading(false); // Stop loading after fetch attempt
        }
      };

      fetchReferralRequests();
    }
  }, [company]);

  // Function to handle marking a request as referred
  const handleRefer = async (requestId: string) => {
    console.log("Attempting to mark request as referred:", requestId);
    const requestRef = doc(db, 'referralRequests', requestId);
    try {
      await updateDoc(requestRef, {
        status: 'referred'
      });
      // Update the local state to reflect the change immediately
      setReferralRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId ? { ...req, status: 'referred' } : req
        )
      );
      toast({
        title: "Success",
        description: "Candidate marked as referred.",
      });
      console.log("Request marked as referred successfully:", requestId);
    } catch (error) {
      console.error("Error updating referral status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update referral status.",
      });
    }
  };


  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>Dashboard</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>Referral Requests</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex-1 p-4 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-4 text-primary">Referrer Dashboard</h1>
          {company && <h2 className="text-xl mb-2 text-foreground">Company: {company}</h2>}
          {isLoading ? (
            <p className="text-foreground">Loading referral requests...</p>
          ) : referralRequests.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {referralRequests.map((request) => (
                <ReferralRequestTile
                  key={request.id}
                  request={request}
                  onRefer={handleRefer} // Pass the handleRefer function here
                />
              ))}
            </div>
          ) : (
            <p className="text-foreground">No referral requests available for {company}.</p>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};
export default DashboardPage;
