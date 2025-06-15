
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/services/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, PieChart as PieChartIconLucide, Users, FileText, Eye, Hourglass, CheckCircle, XCircle, LogOut, FilterX } from 'lucide-react'; // Renamed PieChart import
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import type { ChartConfig } from "@/components/ui/chart";

interface ReferralRequest {
  id: string;
  name: string;
  email: string;
  targetCompany: string;
  jobId: string;
  currentCompany?: string;
  resumeUrl?: string;
  status?: 'pending' | 'referred' | 'rejected';
  paymentStatus?: string;
  timestamp?: any;
  viewCount?: number;
}

interface Referrer {
  id: string;
  uid: string;
  email: string;
  companyRegisteredEmail: string;
  company: string;
  isVerified: boolean;
  createdAt?: any;
}

type RequestStatus = 'pending' | 'referred' | 'rejected' | '';
const ALL_STATUSES_SELECT_ITEM_VALUE = "_all_"; // Special value for SelectItem

const AdminDashboardPage = () => {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [referralRequests, setReferralRequests] = useState<ReferralRequest[]>([]);
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterTargetCompany, setFilterTargetCompany] = useState('');
  const [filterStatus, setFilterStatus] = useState<RequestStatus>(''); // '' means all statuses

  useEffect(() => {
    const loggedIn = sessionStorage.getItem('isAdminLoggedIn');
    if (loggedIn !== 'true') {
      router.replace('/admin-login');
    } else {
      setIsAdmin(true);
    }
  }, [router]);

  useEffect(() => {
    if (isAdmin) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const requestsQuery = query(collection(db, 'referralRequests'), orderBy('timestamp', 'desc'));
          const requestsSnapshot = await getDocs(requestsQuery);
          const requestsData = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReferralRequest));
          setReferralRequests(requestsData);

          const referrersQuery = query(collection(db, 'referrers'), orderBy('createdAt', 'desc'));
          const referrersSnapshot = await getDocs(referrersQuery);
          const referrersData = referrersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referrer));
          setReferrers(referrersData);

        } catch (error) {
          console.error("Error fetching admin data:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isAdmin]);

  const totalResumeViews = useMemo(() => {
    return referralRequests.reduce((sum, req) => sum + (req.viewCount || 0), 0);
  }, [referralRequests]);

  const requestsByStatus = useMemo(() => {
    const counts: { pending: number; referred: number; rejected: number; [key: string]: number } = { pending: 0, referred: 0, rejected: 0 };
    referralRequests.forEach(req => {
      if (req.status && counts.hasOwnProperty(req.status)) {
        counts[req.status]++;
      }
    });
    return [
      { name: 'Pending', value: counts.pending, fill: 'hsl(var(--chart-1))' },
      { name: 'Referred', value: counts.referred, fill: 'hsl(var(--chart-2))' },
      { name: 'Rejected', value: counts.rejected, fill: 'hsl(var(--chart-3))' },
    ].filter(item => item.value > 0);
  }, [referralRequests]);

  const chartConfig = {
    pending: { label: "Pending", color: "hsl(var(--chart-1))" },
    referred: { label: "Referred", color: "hsl(var(--chart-2))" },
    rejected: { label: "Rejected", color: "hsl(var(--chart-3))" },
  } satisfies ChartConfig;

  const filteredReferralRequests = useMemo(() => {
    return referralRequests.filter(req => {
      const companyMatch = filterTargetCompany ? req.targetCompany.toLowerCase().includes(filterTargetCompany.toLowerCase()) : true;
      const statusMatch = filterStatus ? req.status === filterStatus : true; // If filterStatus is '', it means all statuses
      return companyMatch && statusMatch;
    });
  }, [referralRequests, filterTargetCompany, filterStatus]);

  const handleLogout = () => {
    sessionStorage.removeItem('isAdminLoggedIn');
    router.replace('/admin-login');
  };

  const clearFilters = () => {
    setFilterTargetCompany('');
    setFilterStatus(''); // Reset to show all
  };

  if (!isAdmin && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-[250px] ml-4" />
      </div>
    );
  }
  if (!isAdmin && !isLoading) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-secondary p-4">
            <p className="text-xl text-foreground mb-4">Redirecting to login...</p>
            <Button onClick={() => router.push('/admin-login')}>Go to Login</Button>
        </div>
    );
  }


  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </header>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
              <CardContent><Skeleton className="h-10 w-1/2" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referral Requests</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{referralRequests.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{referrers.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Resume Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalResumeViews}</div>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Requests by Status</CardTitle>
                <PieChartIconLucide className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex justify-center items-center h-[100px]">
                {requestsByStatus.length > 0 ? (
                <ChartContainer config={chartConfig} className="aspect-square h-full w-full max-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <Pie
                        data={requestsByStatus}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={40}
                        labelLine={false}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return (
                            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="10px">
                                {`${(percent * 100).toFixed(0)}%`}
                            </text>
                            );
                        }}
                        >
                        {requestsByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill as string} />
                        ))}
                    </Pie>
                     <RechartsTooltip content={<ChartTooltipContent hideLabel hideIndicator nameKey="name" />} />
                     <ChartLegend content={<ChartLegendContent nameKey="name"/>} />
                  </ResponsiveContainer>
                </ChartContainer>
                 ) : (
                  <p className="text-sm text-muted-foreground">No requests with status.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>All Referral Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4 items-end">
                <div className="flex-1 min-w-[150px]">
                  <Label htmlFor="filterCompany" className="text-sm">Filter by Target Company</Label>
                  <Input
                    id="filterCompany"
                    placeholder="Enter company name..."
                    value={filterTargetCompany}
                    onChange={(e) => setFilterTargetCompany(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <Label htmlFor="filterStatus" className="text-sm">Filter by Status</Label>
                  <Select
                    value={filterStatus === '' ? ALL_STATUSES_SELECT_ITEM_VALUE : filterStatus}
                    onValueChange={(value) => {
                      setFilterStatus(value === ALL_STATUSES_SELECT_ITEM_VALUE ? '' : value as RequestStatus);
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Filter by Status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_STATUSES_SELECT_ITEM_VALUE}>All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="referred">Referred</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={clearFilters} variant="outline" className="sm:ml-auto">
                  <FilterX className="mr-2 h-4 w-4" /> Clear Filters
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Target Company</TableHead>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferralRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.name}</TableCell>
                      <TableCell>{req.email}</TableCell>
                      <TableCell>{req.targetCompany}</TableCell>
                      <TableCell>{req.jobId}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300' :
                          req.status === 'referred' ? 'bg-green-500/20 text-green-700 dark:bg-green-700/30 dark:text-green-300' :
                          req.status === 'rejected' ? 'bg-red-500/20 text-red-700 dark:bg-red-700/30 dark:text-red-300' :
                          'bg-gray-500/20 text-gray-700 dark:bg-gray-600/30 dark:text-gray-300'
                        }`}>
                          {req.status || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{req.viewCount || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredReferralRequests.length === 0 && <p className="text-center py-4 text-muted-foreground">No referral requests match your filters.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Referrers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personal Email</TableHead>
                    <TableHead>Company Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Verified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrers.map((ref) => (
                    <TableRow key={ref.id}>
                      <TableCell className="font-medium">{ref.email}</TableCell>
                      <TableCell>{ref.companyRegisteredEmail}</TableCell>
                      <TableCell>{ref.company}</TableCell>
                      <TableCell>{ref.isVerified ? <CheckCircle className="text-green-500"/> : <XCircle className="text-red-500"/>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {referrers.length === 0 && <p className="text-center py-4 text-muted-foreground">No referrers found.</p>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
