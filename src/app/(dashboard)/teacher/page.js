"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import apiClient from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// Import all the new components
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import QuickActions from "@/components/dashboard/QuickActions";
import { BookOpen, Users, CheckCircle, Calendar } from "lucide-react";

// Import teacher-specific components
import MyClassesCard from "@/components/teacher/MyClassesCard";
import UpcomingExamsCard from "@/components/teacher/UpcomingExamsCard";
import TodayAttendanceCard from "@/components/teacher/TodayAttendanceCard";
import CheckInOutCard from "@/components/teacher/CheckInOutCard";
import AttendanceHistoryCard from "@/components/teacher/AttendanceHistoryCard";
import DashboardSkeleton from "@/components/teacher/DashboardSkeleton";

export default function TeacherDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check authentication and role
    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      if (user.role?.toUpperCase() !== "TEACHER") {
        router.push("/login");
        return;
      }
      fetchDashboardData();
    }
  }, [authLoading, user, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(API_ENDPOINTS.TEACHER.DASHBOARD);
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError(response.message || "Failed to load dashboard");
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      // MOCK CHECK-IN - Remove when backend is ready
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update the teacherAttendance status
      setDashboardData((prev) => ({
        ...prev,
        teacherAttendance: {
          status: "checked_in",
          checkInTime: new Date().toISOString(),
          checkOutTime: null,
          workingHours: null,
        },
      }));

    } catch (error) {
      console.error("Check-in error:", error);
      throw error;
    }
  };

  const handleCheckOut = async () => {
    try {
      // MOCK CHECK-OUT - Remove when backend is ready
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Calculate working hours
      const checkInTime = new Date(
        dashboardData?.teacherAttendance?.checkInTime,
      );
      const checkOutTime = new Date();
      const diffMs = checkOutTime - checkInTime;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const workingHours = `${hours}h ${minutes}m`;

      // Update the teacherAttendance status
      setDashboardData((prev) => ({
        ...prev,
        teacherAttendance: {
          status: "checked_out",
          checkInTime: prev.teacherAttendance.checkInTime,
          checkOutTime: checkOutTime.toISOString(),
          workingHours,
        },
      }));

    } catch (error) {
      console.error("Check-out error:", error);
      throw error;
    }
  };

  if (authLoading || loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="p-8 max-w-md border-red-100 bg-red-50/30">
          <div className="text-center space-y-4">
             <h2 className="text-xl font-bold text-slate-900">Error Loading Dashboard</h2>
             <p className="text-slate-600">{error}</p>
             <Button onClick={fetchDashboardData} className="w-full">Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const {
    stats,
    myClasses,
    upcomingExams,
    branchInfo,
    todayAttendance,
    teacherAttendance,
    attendanceHistory,
  } = dashboardData;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto min-h-screen">
      {/* Header & Greeting Section */}
      <DashboardHeader 
        title={`Welcome, ${user?.first_name || ''} ${user?.last_name || 'Teacher'}!`}
        subtitle={`Here's what's happening at ${branchInfo?.branchName || 'your branch'} today.`}
        onRefresh={fetchDashboardData}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="My Classes"
          value={stats?.classes?.total || 0}
          icon={BookOpen}
          description={`${stats?.classes?.active || 0} active classes`}
          color="blue"
        />
        <StatsCard 
          title="Total Students"
          value={stats?.students?.total || 0}
          icon={Users}
          description="Across all assigned classes"
          color="green"
        />
        <StatsCard 
          title="Attendance Rate"
          value={`${stats?.attendance?.average || 0}%`}
          icon={CheckCircle}
          description="Average this month"
          color="purple"
        />
        <StatsCard 
          title="Upcoming Exams"
          value={stats?.exams?.total || 0}
          icon={Calendar}
          description={`${stats?.exams?.thisWeek || 0} exams this week`}
          color="orange"
        />
      </div>

      {/* Check-In/Out & Attendance History */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CheckInOutCard
          teacherAttendance={teacherAttendance}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
        />
        <AttendanceHistoryCard attendanceHistory={attendanceHistory} />
      </div>

      {/* Classes and Exams */}
      <div className="grid gap-6 md:grid-cols-2">
        <MyClassesCard classes={myClasses} />
        <UpcomingExamsCard exams={upcomingExams} />
      </div>

      {/* Today's Attendance */}
      <TodayAttendanceCard attendanceData={todayAttendance} />

      {/* Quick Actions */}
      <QuickActions 
        actions={[
          { title: "My Profile", icon: Users, color: "text-blue-600", onClick: () => router.push('/profile') },
          { title: "Attendance", icon: CheckCircle, color: "text-green-600", onClick: () => router.push('/teacher/attendance') },
          { title: "Syllabus", icon: BookOpen, color: "text-purple-600" },
          { title: "Exams", icon: Calendar, color: "text-orange-600", onClick: () => router.push('/teacher/exams') },
          { title: "Leaves", icon: Users, color: "text-red-600" },
          { title: "Resources", icon: BookOpen, color: "text-indigo-600" },
        ]}
      />
    </div>
  );
}
