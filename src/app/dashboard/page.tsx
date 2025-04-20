"use client";

import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import { useEffect, useState } from 'react';
// Import necessary Firebase modules
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { firebaseApp } from '@/services/firebase';

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
        const db = getFirestore(firebaseApp);
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
          {referralRequests.length > 0 ? (
            <ul>
              {referralRequests.map(request => (
                <li key={request.id}>
                  <p>Name: {request.name}</p>
                  <p>Email: {request.email}</p>
                  <p>Company: {request.targetCompany}</p>
                  <p>Job ID: {request.jobId}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No referral requests available for {company}.</p>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardPage;
