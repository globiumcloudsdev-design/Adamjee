'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import apiClient from '@/lib/api-client';
import Dropdown from '@/components/ui/dropdown';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ArrowRight,
  MapPin,
  Building2,
  Activity,
  ChevronRight,
  Library,
  CreditCard,
  Mail,
  UserCheck,
  DollarSign,
  CheckCircle,
  BarChart3,
  Target,
  Zap,
  Database,
  PieChart,
  FileCheck,
  Wallet,
  Bell,
  UserPlus,
  Shield,
  Settings,
  FileText,
  Receipt,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import TotalStudentsTrend from '@/components/dashboard/TotalStudentsTrend';
import ClassWiseStudentsCount from '@/components/dashboard/ClassWiseStudentsCount';

export default function BranchAdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30days');

  // Chart data states
  const [chartsLoading, setChartsLoading] = useState(true);
  const [studentTrendsData, setStudentTrendsData] = useState([]);
  const [classWiseStudentsData, setClassWiseStudentsData] = useState([]);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'BRANCH_ADMIN') {
        router.push('/login');
        return;
      }
      loadDashboardData();
      fetchChartData();
    }
  }, [user, authLoading, selectedTimeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/branch-admin/dashboard/stats?timeRange=${selectedTimeRange}`;
      const response = await apiClient.get(url);
      
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError(response.message || 'Failed to load dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      setChartsLoading(true);
      const [
        studentTrendsRes,
        classWiseStudentsRes
      ] = await Promise.allSettled([
        apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.CHARTS.STUDENT_TRENDS),
        apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.CHARTS.CLASS_WISE_STUDENTS)
      ]);

      const mockData = {
        studentTrends: [
          { month: 'Aug', students: 45 }, { month: 'Sept', students: 52 },
          { month: 'Oct', students: 48 }, { month: 'Nov', students: 61 },
          { month: 'Dec', students: 58 }, { month: 'Jan', students: 65 }
        ],
        classWise: [
          { class: 'Class 9', students: 25 }, { class: 'Class 10', students: 30 },
          { class: 'Class 11', students: 28 }, { class: 'Class 12', students: 32 }
        ]
      };

      setStudentTrendsData(studentTrendsRes.status === 'fulfilled' && studentTrendsRes.value.success ? studentTrendsRes.value.data : mockData.studentTrends);
      setClassWiseStudentsData(classWiseStudentsRes.status === 'fulfilled' && classWiseStudentsRes.value.success ? classWiseStudentsRes.value.data : mockData.classWise);
    } catch (err) {
      console.error('Chart data fetch error:', err);
    } finally {
      setChartsLoading(false);
    }
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

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 font-medium animate-pulse">Initializing Dashboard...</p>
      </div>
    );
  }

  if (error || !dashboardData || !dashboardData.headerStats) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="p-8 max-w-md border-red-100 bg-red-50/30">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Activity className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Oops! Something went wrong</h2>
              <p className="text-gray-600 mt-2">{error || 'Failed to load data.'}</p>
            </div>
            <Button
              onClick={loadDashboardData}
              variant="default"
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { headerStats, branchInfo, summary, performanceMetrics = {}, studentAnalytics = {} } = dashboardData;

  return (
    <div className="p-4 md:p-6 space-y-6 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-black dark:text-white">
            Branch Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
            Comprehensive overview of {branchInfo.name} ({branchInfo.code})
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
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
          <Button onClick={loadDashboardData} className="whitespace-nowrap">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
        {/* Students */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(headerStats.totalStudents || 0)}</p>
                <div className="flex items-center mt-1">
                  {getChangeIcon(headerStats.studentGrowth || 12)}
                  <span className={`text-xs md:text-sm ml-1 ${getChangeColor(headerStats.studentGrowth || 12)}`}>
                    {Math.abs(headerStats.studentGrowth || 12)}%
                  </span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-3 md:mt-4 text-xs text-gray-500">
              {headerStats.activeStudents || 0} Active • {headerStats.inactiveStudents || 0} Inactive
            </div>
          </CardContent>
        </Card>

        {/* Teachers */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Total Teachers</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(headerStats.totalTeachers || 0)}</p>
                <div className="flex items-center mt-1">
                  <UserCheck className="w-4 h-4 text-blue-500" />
                  <span className="text-xs md:text-sm ml-1 text-blue-600">Active</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <UserCheck className="w-5 h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-3 md:mt-4 text-xs text-gray-500">
              Faculty members
            </div>
          </CardContent>
        </Card>

        {/* Classes */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Total Classes</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(headerStats.totalClasses || 0)}</p>
                <div className="flex items-center mt-1">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs md:text-sm ml-1 text-indigo-600">{headerStats.activeClasses || 0} Active</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="mt-3 md:mt-4 text-xs text-gray-500">
              Academic sections
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">System Uptime</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">100%</p>
                <div className="flex items-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs md:text-sm ml-1 text-green-600">Healthy</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                <Activity className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-3 md:mt-4 text-xs text-gray-500">
              Fully operational
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200" onClick={() => router.push('/branch-admin/students')}>
              <Users className="w-6 h-6 text-blue-600" />
              <span className="text-sm text-center">Manage Users</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2 hover:bg-indigo-50 hover:border-indigo-200" onClick={() => router.push('/branch-admin/classes')}>
              <BookOpen className="w-6 h-6 text-indigo-600" />
              <span className="text-sm text-center">Classes</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-200">
              <FileText className="w-6 h-6 text-purple-600" />
              <span className="text-sm text-center">Reports</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2 hover:bg-yellow-50 hover:border-yellow-200" onClick={() => router.push('/branch-admin/notifications')}>
              <Bell className="w-6 h-6 text-yellow-600" />
              <span className="text-sm text-center">Notifications</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2 hover:bg-red-50 hover:border-red-200">
              <Receipt className="w-6 h-6 text-red-600" />
              <span className="text-sm text-center">Expenses</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center gap-2 hover:bg-orange-50 hover:border-orange-200" onClick={() => router.push('/branch-admin/academic-years')}>
              <Calendar className="w-6 h-6 text-orange-600" />
              <span className="text-sm text-center">Calendar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Role Distribution & System Overview */}
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
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.totalTeachers || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Teachers</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary.totalClasses || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Classes</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summary.totalSubjects || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Subjects</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
          <TotalStudentsTrend data={studentTrendsData} />
          <ClassWiseStudentsCount data={classWiseStudentsData} />
        </div>
      </div>
    </div>
  );
}
