"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import apiClient from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// Import all the new components
import DashboardGreeting from "@/components/teacher/DashboardGreeting";
import DashboardStats from "@/components/teacher/DashboardStats";
import QuickActions from "@/components/teacher/QuickActions";
import MyClassesCard from "@/components/teacher/MyClassesCard";
import UpcomingExamsCard from "@/components/teacher/UpcomingExamsCard";
import TodayAttendanceCard from "@/components/teacher/TodayAttendanceCard";
import RecentActivityFeed from "@/components/teacher/RecentActivityFeed";
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

      // UNCOMMENT WHEN BACKEND IS READY:
      // const response = await apiClient.post(API_ENDPOINTS.TEACHER.CHECK_IN);
      // if (response.success) {
      //   fetchDashboardData();
      // }
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

      // UNCOMMENT WHEN BACKEND IS READY:
      // const response = await apiClient.post(API_ENDPOINTS.TEACHER.CHECK_OUT);
      // if (response.success) {
      //   fetchDashboardData();
      // }
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
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">
              Error Loading Dashboard
            </h2>
            <p className="text-muted-foreground">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
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
    recentActivity,
    teacherAttendance,
    attendanceHistory,
  } = dashboardData;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Greeting Section */}
      <DashboardGreeting user={user} branchInfo={branchInfo} />

      {/* Stats Grid */}
      <DashboardStats stats={stats} />

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
      <QuickActions />
    </div>
  );
}
