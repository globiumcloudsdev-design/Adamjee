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
  RefreshCw,
  Filter,
  X
} from 'lucide-react';
import Skeleton from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import QuickActions from '@/components/dashboard/QuickActions';
import TotalStudentsTrend from '@/components/dashboard/TotalStudentsTrend';
import ClassWiseStudentsCount from '@/components/dashboard/ClassWiseStudentsCount';

export default function BranchAdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30days');
  const [academicYears, setAcademicYears] = useState([]);
  const [allClasses, setAllClasses] = useState([]); // تمام classes store کرتا ہے
  const [classes, setClasses] = useState([]); // filtered classes (year کے مطابق)
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Chart data states
  const [chartsLoading, setChartsLoading] = useState(true);
  const [studentTrendsData, setStudentTrendsData] = useState([]);
  const [classWiseStudentsData, setClassWiseStudentsData] = useState([]);

  useEffect(() => {
    fetchFilters();
  }, []);

  // جب academic year بدلے تو classes filter کریں اور selected class reset کریں
  useEffect(() => {
    if (allClasses.length > 0) {
      if (selectedAcademicYear) {
        setClasses(allClasses.filter(c => String(c.academicYearId) === String(selectedAcademicYear)));
      } else {
        setClasses([]); // Year select نہ ہونے پر classes خالی کر دیں
      }
      // class reset کریں کیونکہ پچھلی class نئے year میں نہیں ہوگی
      setSelectedClass('');
    }
  }, [selectedAcademicYear, allClasses]);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'BRANCH_ADMIN') {
        router.push('/login');
        return;
      }
      loadDashboardData();
      fetchChartData();
    }
  }, [user, authLoading, selectedTimeRange, selectedAcademicYear, selectedClass]);

  const fetchFilters = async () => {
    try {
      const [ayRes, classRes] = await Promise.all([
        apiClient.get('/api/academic-years'),
        apiClient.get('/api/classes')
      ]);

      // Academic years API returns: { academic_years: [...] }
      let currentYearId = '';
      const yearsArray = ayRes?.academic_years || [];
      if (yearsArray.length > 0) {
        setAcademicYears(yearsArray.map(ay => ({ value: ay.id, label: ay.name })));
        const currentYear = yearsArray.find(ay => ay.is_current);
        if (currentYear) {
          currentYearId = currentYear.id;
          setSelectedAcademicYear(currentYear.id);
        }
      }

      // Classes API returns: [...] directly (array)
      const classesArray = Array.isArray(classRes) ? classRes : (classRes?.data || []);
      if (classesArray.length > 0) {
        const mapped = classesArray.map(c => ({
          value: c.id,
          label: c.name,
          academicYearId: c.academic_year_id || c.academic_year?.id || null
        }));
        setAllClasses(mapped);
        // اگر current year ہے تو صرف اس کی classes دکھائیں
        if (currentYearId) {
          setClasses(mapped.filter(c => String(c.academicYearId) === String(currentYearId)));
        } else {
          setClasses([]); // Year select نہ ہونے پر classes خالی کر دیں
        }
      }
    } catch (err) {
      console.error('Failed to fetch filters:', err);
    }
  };

  const handleRefresh = () => {
    // If filters are already default, just refresh data
    if (!selectedAcademicYear && !selectedClass && selectedTimeRange === '30days') {
      loadDashboardData();
      fetchChartData();
    } else {
      // Reset filters, the useEffect will trigger data loading
      setSelectedAcademicYear('');
      setSelectedClass('');
      setSelectedTimeRange('30days');
    }
  };

  const loadDashboardData = async () => {
    try {
      if (!dashboardData) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      
      let url = `${API_ENDPOINTS.BRANCH_ADMIN.DASHBOARD_STATS}?timeRange=${selectedTimeRange}`;
      if (selectedAcademicYear) url += `&academicYearId=${selectedAcademicYear}`;
      if (selectedClass) url += `&classId=${selectedClass}`;
      
      const response = await apiClient.get(url);
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError(response.message || 'Failed to load dashboard');
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(err.message || 'An error occurred while loading dashboard data.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
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

      setStudentTrendsData(studentTrendsRes.status === 'fulfilled' && studentTrendsRes.value.success ? studentTrendsRes.value.data : []);
      setClassWiseStudentsData(classWiseStudentsRes.status === 'fulfilled' && classWiseStudentsRes.value.success ? classWiseStudentsRes.value.data : []);
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
      <div className="p-4 md:p-6 space-y-6 min-h-screen">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-8">
           <div className="space-y-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-4 w-96" />
           </div>
           <div className="flex gap-3">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <Skeleton className="h-32 rounded-2xl" />
           <Skeleton className="h-32 rounded-2xl" />
           <Skeleton className="h-32 rounded-2xl" />
           <Skeleton className="h-32 rounded-2xl" />
        </div>

        <Skeleton className="h-40 rounded-2xl" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <Skeleton className="h-80 rounded-2xl" />
           <Skeleton className="h-80 rounded-2xl" />
        </div>
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
    <div className={`p-4 md:p-6 space-y-6 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 min-h-screen transition-opacity duration-200 ${isRefreshing ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* Header */}
      <DashboardHeader 
        title="Branch Admin Dashboard"
        subtitle={`Comprehensive overview of ${branchInfo.name} (${branchInfo.code})`}
        onRefresh={handleRefresh}
      >
        <div className="relative">
          <Button 
            onClick={() => setIsFilterOpen(!isFilterOpen)} 
            variant="outline" 
            className={`flex items-center gap-2 rounded-xl border-slate-200 dark:border-slate-800 transition-all ${isFilterOpen ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline font-semibold">Filters</span>
            {(selectedAcademicYear || selectedClass || selectedTimeRange !== '30days') && (
              <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
            )}
          </Button>

          {isFilterOpen && (
            <>
              {/* Overlay to close when clicking outside */}
              <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)}></div>
              
              <div className="absolute right-0 sm:left-auto sm:right-0 top-full mt-2 w-[280px] sm:w-[320px] bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 z-50 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Dashboard Filters</h3>
                  <button onClick={() => setIsFilterOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Academic Year</label>
                    <Dropdown
                      value={selectedAcademicYear}
                      onChange={(e) => setSelectedAcademicYear(e.target.value)}
                      options={[{ value: '', label: 'All Years' }, ...academicYears]}
                      placeholder="Academic Year"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Class</label>
                    <Dropdown
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      options={
                        classes.length > 0
                          ? [{ value: '', label: `All Classes (${classes.length})` }, ...classes]
                          : [{ value: '', label: selectedAcademicYear ? 'No classes found' : 'Select year first' }]
                      }
                      placeholder="Select Class"
                      className="w-full"
                      disabled={classes.length === 0}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Range</label>
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
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DashboardHeader>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Students"
          value={formatNumber(headerStats.totalStudents || 0)}
          icon={GraduationCap}
          change={headerStats.studentGrowth}
          description={`${headerStats.activeStudents || 0} Active • ${headerStats.inactiveStudents || 0} Inactive`}
          color="blue"
        />
        <StatsCard 
          title="Total Teachers"
          value={formatNumber(headerStats.totalTeachers || 0)}
          icon={UserCheck}
          description={`${headerStats.activeTeachers || 0} Active faculty`}
          color="purple"
        />
        <StatsCard 
          title="Fee Collection"
          value={`${performanceMetrics.feeCollection || 0}%`}
          icon={Wallet}
          change={performanceMetrics.feeChange}
          description={`${formatCurrency(performanceMetrics.totalPaid || 0)} / ${formatCurrency(performanceMetrics.totalDue || 0)}`}
          color="emerald"
        />
        <StatsCard 
          title="Avg. Attendance"
          value={`${performanceMetrics.avgAttendance || 0}%`}
          icon={Activity}
          change={performanceMetrics.attendanceChange}
          description="Average daily attendance"
          color="indigo"
        />
      </div>

      {/* Quick Actions */}
      <QuickActions 
        actions={[
          { title: "Manage Users", icon: Users, color: "text-blue-600", onClick: () => router.push('/branch-admin/students') },
          { title: "Classes", icon: BookOpen, color: "text-indigo-600", onClick: () => router.push('/branch-admin/classes') },
          { title: "Assignments", icon: FileText, color: "text-violet-600", onClick: () => router.push('/branch-admin/assignments') },
          { title: "Notifications", icon: Bell, color: "text-yellow-600", onClick: () => router.push('/branch-admin/notifications') },
          { title: "Expenses", icon: Receipt, color: "text-red-600" },
          { title: "Calendar", icon: Calendar, color: "text-orange-600", onClick: () => router.push('/branch-admin/academic-years') },
        ]}
      />

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
            onClick={handleRefresh}
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
          <TotalStudentsTrend filters={{ academicYearId: selectedAcademicYear, classId: selectedClass }} />
          <ClassWiseStudentsCount data={dashboardData?.charts?.classDistribution || classWiseStudentsData} />
        </div>
      </div>
    </div>
  );
}
