"use client";

import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import { useEffect, useState } from 'react';
// Import Firebase functions
import { collection, getDocs, query, where } from "firebase/firestore";
import ReferralRequestTile from "@/components/ReferralRequestTile";
import { db } from "@/services/firebase";

const DashboardPage = () => {
  const [referralRequests, setReferralRequests] = useState([]);
  const [company, setCompany] = useState('');

  useEffect(() => {
    const storedCompany = sessionStorage.getItem('company');
    if (storedCompany) {
      setCompany(storedCompany);
    }
  }, []);

  useEffect(() => {
    if (company) {
      const fetchReferralRequests = async () => {
        const referralCollection = collection(db, 'referralRequests');

        // Create a query to filter by company
        const q = query(referralCollection, where("targetCompany", "==", company));

        try {
          const querySnapshot = await getDocs(q);
          const requests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setReferralRequests(requests);
        } catch (error) {
          console.error("Error fetching referral requests:", error);
        }
      };

      fetchReferralRequests();
    }
  }, [company]);

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
        <div className="flex-1 p-4">
          <h1 className="text-2xl font-bold mb-4">Referrer Dashboard</h1>
          {company && <h2 className="text-xl mb-2">Company: {company}</h2>}
          {referralRequests.length > 0 ? ( // Use a grid layout for the tiles
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {referralRequests.map((request) => (
                <ReferralRequestTile key={request.id} request={request} />
              ))}
            </div>
          ) : ( // Retain the message for when no requests are available
            <p>No referral requests available for {company}.</p>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardPage;
