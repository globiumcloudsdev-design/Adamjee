"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  Loader2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";

const API = {
  CHECK_IN: "/api/staff-attendance/check-in",
  CHECK_OUT: "/api/staff-attendance/check-out",
};

function getTodayISODateOnly() {
  return new Date().toISOString().split("T")[0];
}

export default function TeacherMyAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [todayCheckedOut, setTodayCheckedOut] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [error, setError] = useState(null);

  // NOTE:
  // Your API currently only supports list/mark for admins and self check-in/out.
  // For UI status we will infer status from successful calls in this session.
  // If you add a GET /api/staff-attendance/me/today later, we can wire it.

  const refreshFromServer = async () => {
    // Try best-effort: fetch today records for this staff using existing list endpoint.
    // Endpoint exists for admins; withAuth allows SUPER_ADMIN & BRANCH_ADMIN only.
    // So for self-service roles, this GET likely fails; we keep UI consistent with local state.
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    refreshFromServer().catch((e) => {
      console.error(e);
      setError("Failed to load today status");
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (d) => {
    if (!d) return "N/A";
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const resp = await apiClient.post(API.CHECK_IN, {});
      if (resp.success) {
        setTodayCheckedIn(true);
        setTodayCheckedOut(false);
        const now = new Date();
        setCheckInTime(now.toISOString());
        setCheckOutTime(null);
        toast.success(resp.message || "Checked in successfully!");
      } else {
        toast.error(resp.message || "Check-in failed");
      }
    } catch (e) {
      toast.error(e?.message || "Check-in failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const resp = await apiClient.post(API.CHECK_OUT, {});
      if (resp.success) {
        setTodayCheckedOut(true);
        const now = new Date();
        setCheckOutTime(now.toISOString());
        toast.success(resp.message || "Checked out successfully!");
      } else {
        toast.error(resp.message || "Check-out failed");
      }
    } catch (e) {
      toast.error(e?.message || "Check-out failed");
    } finally {
      setActionLoading(false);
    }
  };

  const hasCompletedToday = todayCheckedOut;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold">My Attendance</h1>
        <p className="text-muted-foreground mt-2">Self check-in & check-out for today</p>
      </div>

      {error && (
        <Card className="p-4 border border-red-200 bg-red-50 flex items-center gap-3">
          <AlertCircle className="text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </Card>
      )}

      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            {todayCheckedIn && !hasCompletedToday ? (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            ) : hasCompletedToday ? (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold">
              {todayCheckedIn && !hasCompletedToday
                ? "Checked In"
                : hasCompletedToday
                  ? "Day Completed"
                  : "Not Checked In"}
            </h2>
            <p className="text-muted-foreground">
              {todayCheckedIn && !hasCompletedToday
                ? `Checked in at ${formatTime(checkInTime)}`
                : hasCompletedToday
                  ? `Completed at ${formatTime(checkOutTime)}`
                  : "Press Check In to start your day"}
            </p>
          </div>

          <Badge
            variant={todayCheckedIn && !hasCompletedToday ? "default" : "secondary"}
            className="text-lg px-4 py-2"
          >
            {todayCheckedIn && !hasCompletedToday ? "Active Session" : hasCompletedToday ? "Completed" : "Inactive"}
          </Badge>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex gap-4 justify-center">
          {!todayCheckedIn ? (
            <Button
              onClick={handleCheckIn}
              disabled={actionLoading}
              size="lg"
              className="px-8"
            >
              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <LogIn className="w-5 h-5 mr-2" />}
              Check In
            </Button>
          ) : hasCompletedToday ? (
            <Button disabled size="lg" className="px-8 opacity-50 cursor-not-allowed">
              <CheckCircle className="w-5 h-5 mr-2" />
              Attendance Completed
            </Button>
          ) : (
            <Button
              onClick={handleCheckOut}
              disabled={actionLoading}
              variant="outline"
              size="lg"
              className="px-8"
            >
              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <LogOut className="w-5 h-5 mr-2" />}
              Check Out
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Today</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <LogIn className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Check-in</span>
            </div>
            <p className="mt-2 text-muted-foreground">{checkInTime ? formatTime(checkInTime) : "—"}</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Check-out</span>
            </div>
            <p className="mt-2 text-muted-foreground">{checkOutTime ? formatTime(checkOutTime) : "—"}</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg border border-border md:col-span-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Working session</span>
            </div>
            <p className="mt-2 text-muted-foreground">
              {hasCompletedToday
                ? "Completed"
                : todayCheckedIn
                  ? "In progress"
                  : "Not started"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

