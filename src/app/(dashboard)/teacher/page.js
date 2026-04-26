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

      // Fetch real my-classes data from API (automatic token handling)
      const classesResponse = await apiClient.get(API_ENDPOINTS.TEACHER.MY_CLASSES.LIST);
      
      const mockData = {
        stats: {
          classes: { 
            total: classesResponse.data?.length || 0, 
            active: classesResponse.data?.filter(c => c.schedule?.length > 0).length || 0, 
            change: 0 
          },
          students: { 
            total: classesResponse.data?.reduce((sum, c) => sum + (c.studentCount || 0), 0) || 0, 
            change: 0 
          },
          attendance: { average: 92, change: 3 },
          exams: { total: 8, thisWeek: 2, change: 1 },
        },
        myClasses: classesResponse.data || [],
        upcomingExams: [
          {
            _id: "1",
            title: "Mid-term Exam - Mathematics",
            date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            classId: { name: "Mathematics 101" },
            duration: 120,
            room: "A101",
            subject: "Mathematics",
          },
          {
            _id: "2",
            title: "Final Exam - Physics",
            date: new Date(Date.now() + 86400000 * 7).toISOString(), // Next week
            classId: { name: "Physics 201" },
            duration: 180,
            room: "B205",
            subject: "Physics",
          },
          {
            _id: "3",
            title: "Quiz - Chemistry",
            date: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days
            classId: { name: "Chemistry 301" },
            duration: 60,
            room: "C102",
            subject: "Chemistry",
          },
        ],
        branchInfo: {
          branchName: "Main Campus",
          branchCode: "MC001",
        },
        todayAttendance: {
          totalClasses: 4,
          completedClasses: 2,
          pendingClasses: 2,
          totalStudents: 120,
          presentStudents: 110,
          absentStudents: 8,
          lateStudents: 2,
          attendanceRate: 92,
        },
        recentActivity: [
          {
            _id: "1",
            type: "attendance",
            title: "Attendance marked",
            description: "Marked attendance for Mathematics 101",
            timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            className: "Mathematics 101",
            status: "completed",
          },
          {
            _id: "2",
            type: "exam",
            title: "Exam scheduled",
            description: "Mid-term exam scheduled for Mathematics 101",
            timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            className: "Mathematics 101",
            status: "pending",
          },
          {
            _id: "3",
            type: "assignment",
            title: "Assignment created",
            description: "New assignment posted for Physics 201",
            timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
            className: "Physics 201",
            status: "completed",
          },
          {
            _id: "4",
            type: "announcement",
            title: "Announcement posted",
            description: "Holiday notice for next week",
            timestamp: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
            status: "completed",
          },
        ],
        teacherAttendance: {
          status: "checked_in",
          checkInTime: new Date(Date.now() - 28800000).toISOString(), // 8 hours ago
          checkOutTime: null,
          workingHours: null,
        },
        attendanceHistory: [
          {
            _id: "1",
            date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            status: "present",
            checkInTime: new Date(
              Date.now() - 86400000 - 28800000
            ).toISOString(),
            checkOutTime: new Date(
              Date.now() - 86400000 - 3600000
            ).toISOString(),
            workingHours: "9h 0m",
          },
          {
            _id: "2",
            date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
            status: "present",
            checkInTime: new Date(
              Date.now() - 86400000 * 2 - 28800000
            ).toISOString(),
            checkOutTime: new Date(
              Date.now() - 86400000 * 2 - 3600000
            ).toISOString(),
            workingHours: "8h 30m",
          },
          {
            _id: "3",
            date: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
            status: "late",
            checkInTime: new Date(
              Date.now() - 86400000 * 3 - 25200000
            ).toISOString(),
            checkOutTime: new Date(
              Date.now() - 86400000 * 3 - 3600000
            ).toISOString(),
            workingHours: "8h 0m",
          },
          {
            _id: "4",
            date: new Date(Date.now() - 86400000 * 4).toISOString(), // 4 days ago
            status: "present",
            checkInTime: new Date(
              Date.now() - 86400000 * 4 - 28800000
            ).toISOString(),
            checkOutTime: new Date(
              Date.now() - 86400000 * 4 - 3600000
            ).toISOString(),
            workingHours: "9h 15m",
          },
          {
            _id: "5",
            date: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
            status: "present",
            checkInTime: new Date(
              Date.now() - 86400000 * 5 - 28800000
            ).toISOString(),
            checkOutTime: new Date(
              Date.now() - 86400000 * 5 - 3600000
            ).toISOString(),
            workingHours: "8h 45m",
          },
        ],
      };

      setDashboardData(mockData);

      // UNCOMMENT THIS WHEN BACKEND IS READY:
      // const response = await apiClient.get(API_ENDPOINTS.TEACHER.DASHBOARD);
      // if (response.success) {
      //   setDashboardData(response.data);
      // } else {
      //   setError(response.message || "Failed to load dashboard");
      // }
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
        dashboardData?.teacherAttendance?.checkInTime
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
