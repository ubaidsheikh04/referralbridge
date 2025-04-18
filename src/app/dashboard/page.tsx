"use client";

import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";

const DashboardPage = () => {
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
          <p>List of pending referral requests will be displayed here.</p>
          {/* Add table or list of referral requests here */}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardPage;
