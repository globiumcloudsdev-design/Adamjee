'use client';
import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import Dropdown from '@/components/ui/dropdown';
import { Input } from '@/components/ui/input';
import FullPageLoader from '@/components/ui/full-page-loader';
import Skeleton, { CardSkeleton, TableSkeleton } from '@/components/ui/skeleton';
import SuperAdminStudentTrends from '@/components/dashboard/SuperAdminStudentTrends';
import SuperAdminClassWiseStudents from '@/components/dashboard/SuperAdminClassWiseStudents';
import SuperAdminBranchWiseStudents from '@/components/dashboard/SuperAdminBranchWiseStudents';
import SuperAdminStudentAttendance from '@/components/dashboard/SuperAdminStudentAttendance';
import SuperAdminMonthlyFeeCollection from '@/components/dashboard/SuperAdminMonthlyFeeCollection';
import SuperAdminPassFailRatio from '@/components/dashboard/SuperAdminPassFailRatio';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import QuickActions from '@/components/dashboard/QuickActions';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { withAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/roles';
import apiClient from '@/lib/api-client';
import {
  Users,
  Building2,
  BookOpen,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  PieChart,
  RefreshCw,
  Eye,
  Bell,
  GraduationCap,
  UserCheck,
  CreditCard,
  Receipt,
  Target,
  Zap,
  UserPlus,
  CalendarDays,
  FileCheck,
  Wallet,
  Settings,
  Shield,
  Database
} from 'lucide-react';

function SuperAdminDashboard() {
  const [dashboardData, setDashboardData] = useState({
    headerStats: {},
    performanceMetrics: {},
    revenueAnalytics: {},
    studentAnalytics: {
      userRoleDistribution: []
    },
    recentActivities: [],
    systemAlerts: [],
    branchPerformance: [],
    summary: {}
  });
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30days');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const { execute } = useApi();

  // Chart data states
  const [chartsLoading, setChartsLoading] = useState(false);
  const [studentTrendsData, setStudentTrendsData] = useState([]);
  const [classWiseStudentsData, setClassWiseStudentsData] = useState([]);
  const [studentAttendanceData, setStudentAttendanceData] = useState([]);
  const [monthlyFeeCollectionData, setMonthlyFeeCollectionData] = useState([]);
  const [passFailRatioData, setPassFailRatioData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeRange, selectedBranch]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const url = `/api/super-admin/dashboard/stats?timeRange=${selectedTimeRange}&branch=${selectedBranch}`;
      const response = await apiClient.get(url);
      
      if (response?.success && response.data) {
        setDashboardData(prev => ({
          ...prev,
          ...response.data,
          headerStats: { ...prev.headerStats, ...response.data.headerStats },
          performanceMetrics: { ...prev.performanceMetrics, ...response.data.performanceMetrics },
          branchPerformance: response.data.branchPerformance || [],
          studentAnalytics: { ...prev.studentAnalytics, ...response.data.studentAnalytics },
          summary: { ...prev.summary, ...response.data.summary }
        }));
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // toast.error('Failed to refresh dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    // Keeping chart data as mock for now, but adding logic if needed
    console.log('API fetchChartData bypassed');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-PK').format(num);
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4" />;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'scheduled': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading && !dashboardData.headerStats.totalBranches) {
    return (
      <div className="p-4 md:p-6 space-y-6 min-h-screen">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-8">
           <div className="space-y-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-4 w-96" />
           </div>
           <div className="flex gap-3">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
           <Skeleton className="h-32 rounded-2xl" />
           <Skeleton className="h-32 rounded-2xl" />
           <Skeleton className="h-32 rounded-2xl" />
           <Skeleton className="h-32 rounded-2xl" />
           <Skeleton className="h-32 rounded-2xl" />
           <Skeleton className="h-32 rounded-2xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <Skeleton className="h-80 rounded-2xl" />
           <Skeleton className="h-80 rounded-2xl" />
        </div>

        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  // Use real API data or fallback to default values
  const headerStats = dashboardData?.headerStats || {};
  const performanceMetrics = dashboardData?.performanceMetrics || {};
  const revenueAnalytics = dashboardData?.revenueAnalytics || {};
  const studentAnalytics = dashboardData?.studentAnalytics || {};
  const recentActivities = dashboardData?.recentActivities || [];
  const systemAlerts = dashboardData?.systemAlerts || [];
  const branchPerformance = dashboardData?.branchPerformance || [];
  const summary = dashboardData?.summary || {};

  return (
    <div className="p-4 md:p-6 space-y-6  dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 min-h-screen">
      {/* Header */}
      <DashboardHeader 
        title="Super Admin Dashboard"
        subtitle="Comprehensive overview of all branches, users, and system performance"
        onRefresh={loadDashboardData}
      >
        <Dropdown
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value)}
          options={[
            { value: '7days', label: 'Last 7 Days' },
            { value: '30days', label: 'Last 30 Days' },
            { value: '90days', label: 'Last 90 Days' },
            { value: '1year', label: 'Last Year' }
          ]}
          placeholder="Select Time Range"
          className="min-w-[140px]"
        />
        <Dropdown
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          options={[
            { value: 'all', label: 'All Branches' },
            ...branchPerformance.map(branch => ({
              value: branch.id,
              label: branch.name
            }))
          ]}
          placeholder="Select Branch"
          className="min-w-[140px]"
        />
      </DashboardHeader>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Branches"
          value={formatNumber(headerStats.totalBranches || 0)}
          icon={Building2}
          change={headerStats.branchGrowth}
          description={`${headerStats.activeBranches || 0} Active • ${headerStats.inactiveBranches || 0} Inactive`}
          color="blue"
        />
        <StatsCard 
          title="Total Students"
          value={formatNumber(headerStats.totalStudents || 0)}
          icon={GraduationCap}
          change={headerStats.studentGrowth}
          description={`Across ${headerStats.activeBranches || 0} active branches`}
          color="green"
        />
        <StatsCard 
          title="Total Teachers"
          value={formatNumber(headerStats.totalTeachers || 0)}
          icon={UserCheck}
          description="Active faculty members"
          color="purple"
        />
        <StatsCard 
          title="Total Admins"
          value={formatNumber(headerStats.totalAdmins || 0)}
          icon={Users}
          description="Branch administrators"
          color="indigo"
        />
        <StatsCard 
          title="Total Classes"
          value={formatNumber(headerStats.totalClasses || 0)}
          icon={BookOpen}
          description={`${headerStats.activeClasses || 0} Active sections`}
          color="emerald"
        />
        <StatsCard 
          title="Total Revenue"
          value={formatCurrency(headerStats.totalRevenue || 0)}
          icon={DollarSign}
          change={headerStats.revenueChange}
          description={`${headerStats.feeCollectionRate || 0}% collection rate`}
          color="yellow"
        />
        <StatsCard 
          title="Total Attendance"
          value={formatNumber(headerStats.totalAttendance || 0)}
          icon={CheckCircle}
          description="Records processed"
          color="orange"
        />
        <StatsCard 
          title="System Uptime"
          value={`${headerStats.systemUptime || 0}%`}
          icon={Activity}
          description={`${headerStats.activeSessions || 0} active sessions`}
          color="red"
        />
      </div>

      {/* Performance Metrics & System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium">Average Attendance</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{performanceMetrics.avgAttendance || 0}%</div>
                  <div className={`text-xs flex items-center gap-1 ${getChangeColor(performanceMetrics.attendanceChange)}`}>
                    {getChangeIcon(performanceMetrics.attendanceChange)}
                    {Math.abs(performanceMetrics.attendanceChange || 0)}%
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">Pass Percentage</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{performanceMetrics.passPercentage || 0}%</div>
                  <div className={`text-xs flex items-center gap-1 ${getChangeColor(performanceMetrics.passChange)}`}>
                    {getChangeIcon(performanceMetrics.passChange)}
                    {Math.abs(performanceMetrics.passChange || 0)}%
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium">API Response Time</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{performanceMetrics.apiResponseTime || 0}ms</div>
                  <div className={`text-xs flex items-center gap-1 ${getChangeColor(performanceMetrics.responseChange)}`}>
                    {getChangeIcon(performanceMetrics.responseChange)}
                    {Math.abs(performanceMetrics.responseChange || 0)}%
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium">Total Attendance Records</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{formatNumber(performanceMetrics.totalAttendanceRecords || 0)}</div>
                  <div className="text-xs text-gray-500">
                    {performanceMetrics.presentCount || 0} present, {performanceMetrics.absentCount || 0} absent
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.totalUsers || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.totalStaff || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Staff</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary.totalEvents || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Events</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summary.totalExams || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Exams</div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Upcoming Events
                </span>
                <span className="text-lg font-bold">{headerStats.upcomingEvents || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-green-500" />
                  Scheduled Exams
                </span>
                <span className="text-lg font-bold">{headerStats.scheduledExams || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-red-500" />
                  Pending Expenses
                </span>
                <span className="text-lg font-bold">{formatCurrency(headerStats.pendingExpenses || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Bell className="w-4 h-4 text-yellow-500" />
                  Unread Notifications
                </span>
                <span className="text-lg font-bold">{headerStats.unreadNotifications || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branch Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Branch Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Teachers</TableHead>
                  <TableHead className="text-right">Classes</TableHead>
                  <TableHead className="text-right">Attendance Rate</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchPerformance.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell>{branch.code}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(branch.status)}`}>
                        {branch.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(branch.students)}</TableCell>
                    <TableCell className="text-right">{formatNumber(branch.teachers)}</TableCell>
                    <TableCell className="text-right">{formatNumber(branch.classes)}</TableCell>
                    <TableCell className="text-right">{branch.attendanceRate}%</TableCell>
                    <TableCell className="text-right">{formatCurrency(branch.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(branch.expenses)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Role Distribution & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Role Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studentAnalytics.userRoleDistribution?.map((role, index) => (
                <div key={role.role} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      index === 0 ? 'bg-blue-100 text-blue-600' :
                      index === 1 ? 'bg-green-100 text-green-600' :
                      index === 2 ? 'bg-purple-100 text-purple-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {index === 0 ? <GraduationCap className="w-4 h-4" /> :
                       index === 1 ? <UserCheck className="w-4 h-4" /> :
                       index === 2 ? <UserPlus className="w-4 h-4" /> :
                       <Shield className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{role.role}</div>
                      <div className="text-xs text-gray-500">{role.percentage}% of total users</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{formatNumber(role.count)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(headerStats.collectedAmount || 0)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Collected</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(performanceMetrics.outstandingAmount || 0)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Outstanding</div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Expenses</span>
                  <span className="text-lg font-bold">{formatCurrency(headerStats.totalExpenses || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Paid Expenses</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(headerStats.paidExpenses || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Pending Expenses</span>
                  <span className="text-lg font-bold text-red-600">{formatCurrency(headerStats.pendingExpenses || 0)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <QuickActions 
        actions={[
          { title: "Manage Users", icon: Users, color: "text-blue-600" },
          { title: "Branch Settings", icon: Building2, color: "text-green-600" },
          { title: "Reports", icon: FileText, color: "text-purple-600" },
          { title: "Notifications", icon: Bell, color: "text-yellow-600" },
          { title: "Expenses", icon: Receipt, color: "text-red-600" },
          { title: "Events", icon: Calendar, color: "text-indigo-600" },
        ]}
      />

      {/* Analytics Charts */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Analytics Overview</h2>
          <Button
            onClick={fetchChartData}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh Charts</span>
          </Button>
        </div>

        {/* Row 1: Student Trends and Class-wise Students Count */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <SuperAdminStudentTrends selectedBranch={selectedBranch} branchPerformance={branchPerformance} />
          <SuperAdminClassWiseStudents selectedBranch={selectedBranch} branchPerformance={branchPerformance} />
        </div>

        {/* Row 2: Branch-wise Students and Student Attendance Percentage */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <SuperAdminBranchWiseStudents selectedBranch={selectedBranch} branchPerformance={branchPerformance} />
          <SuperAdminStudentAttendance selectedBranch={selectedBranch} branchPerformance={branchPerformance} />
        </div>

        {/* Row 3: Monthly Fee Collection and Pass vs Fail Ratio */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <SuperAdminMonthlyFeeCollection selectedBranch={selectedBranch} branchPerformance={branchPerformance} />
          <SuperAdminPassFailRatio selectedBranch={selectedBranch} branchPerformance={branchPerformance} />
        </div>
      </div>
    </div>
  );
}

const SuperAdminDashboardWithAuth = withAuth(SuperAdminDashboard, { requiredRole: ROLES.SUPER_ADMIN });
export default SuperAdminDashboardWithAuth;


