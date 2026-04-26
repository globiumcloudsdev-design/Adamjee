"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LogIn,
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function CheckInOutCard({
  teacherAttendance,
  onCheckIn,
  onCheckOut,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const {
    status = "not_checked_in", // 'not_checked_in', 'checked_in', 'checked_out'
    checkInTime,
    checkOutTime,
    workingHours,
  } = teacherAttendance || {};

  const handleSwipeCheckIn = async () => {
    if (swipeProgress < 90) return;

    setIsLoading(true);
    try {
      await onCheckIn?.();
      toast.success("Checked in successfully!", {
        description: `Time: ${new Date().toLocaleTimeString()}`,
      });
    } catch (error) {
      toast.error("Failed to check in", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
      setSwipeProgress(0);
    }
  };

  const handleSwipeCheckOut = async () => {
    if (swipeProgress < 90) return;

    setIsLoading(true);
    try {
      await onCheckOut?.();
      toast.success("Checked out successfully!", {
        description: `Total hours: ${workingHours || "0h 0m"}`,
      });
    } catch (error) {
      toast.error("Failed to check out", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
      setSwipeProgress(0);
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case "checked_in":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/20",
          label: "Checked In",
          badgeColor: "bg-green-500",
        };
      case "checked_out":
        return {
          icon: XCircle,
          color: "text-gray-600",
          bgColor: "bg-gray-500/10",
          borderColor: "border-gray-500/20",
          label: "Checked Out",
          badgeColor: "bg-gray-500",
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-orange-600",
          bgColor: "bg-orange-500/10",
          borderColor: "border-orange-500/20",
          label: "Not Checked In",
          badgeColor: "bg-orange-500",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Card className={`p-6 border-2 ${statusConfig.borderColor}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Attendance</h2>
        <Badge className={`${statusConfig.badgeColor} text-white`}>
          {statusConfig.label}
        </Badge>
      </div>

      {/* Status Display */}
      <div className={`p-4 rounded-lg ${statusConfig.bgColor} mb-4`}>
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-8 h-8 ${statusConfig.color}`} />
          <div className="flex-1">
            <p className="font-semibold">{statusConfig.label}</p>
            <p className="text-sm text-muted-foreground">
              {status === "checked_in" &&
                checkInTime &&
                `Since ${new Date(checkInTime).toLocaleTimeString()}`}
              {status === "checked_out" &&
                checkOutTime &&
                `At ${new Date(checkOutTime).toLocaleTimeString()}`}
              {status === "not_checked_in" &&
                "Please check in to start your day"}
            </p>
          </div>
        </div>
      </div>

      {/* Time Info */}
      {(checkInTime || checkOutTime) && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {checkInTime && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <LogIn className="w-4 h-4 text-green-600" />
                <span className="text-xs text-muted-foreground">Check In</span>
              </div>
              <p className="font-semibold">
                {new Date(checkInTime).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}

          {checkOutTime && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <LogOut className="w-4 h-4 text-red-600" />
                <span className="text-xs text-muted-foreground">Check Out</span>
              </div>
              <p className="font-semibold">
                {new Date(checkOutTime).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Working Hours */}
      {workingHours && status === "checked_out" && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Total Working Hours:</span>
            <span className="text-sm font-bold text-primary">
              {workingHours}
            </span>
          </div>
        </div>
      )}

      {/* Swipe to Check In/Out */}
      {status !== "checked_out" && (
        <div className="relative">
          <motion.div
            className="relative h-14 bg-muted rounded-full overflow-hidden cursor-pointer"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => {
              setIsDragging(false);
              if (status === "not_checked_in") {
                handleSwipeCheckIn();
              } else {
                handleSwipeCheckOut();
              }
            }}
            onMouseLeave={() => {
              setIsDragging(false);
              setSwipeProgress(0);
            }}
            onMouseMove={(e) => {
              if (isDragging) {
                const rect = e.currentTarget.getBoundingClientRect();
                const progress = Math.min(
                  100,
                  Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)
                );
                setSwipeProgress(progress);
              }
            }}
          >
            {/* Progress Background */}
            <motion.div
              className={`absolute inset-y-0 left-0 ${
                status === "not_checked_in"
                  ? "bg-gradient-to-r from-green-500 to-green-600"
                  : "bg-gradient-to-r from-red-500 to-red-600"
              }`}
              style={{ width: `${swipeProgress}%` }}
            />

            {/* Slider Button */}
            <motion.div
              className="absolute inset-y-1 left-1 w-12 bg-white rounded-full shadow-lg flex items-center justify-center"
              style={{
                x: `${(swipeProgress / 100) * (100 - 14)}%`,
              }}
            >
              {status === "not_checked_in" ? (
                <LogIn className="w-5 h-5 text-green-600" />
              ) : (
                <LogOut className="w-5 h-5 text-red-600" />
              )}
            </motion.div>

            {/* Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-sm font-medium text-muted-foreground">
                {status === "not_checked_in"
                  ? "Swipe to Check In"
                  : "Swipe to Check Out"}
              </p>
            </div>
          </motion.div>

          <p className="text-xs text-center text-muted-foreground mt-2">
            Drag the button to the right to confirm
          </p>
        </div>
      )}

      {/* Already Checked Out Message */}
      {status === "checked_out" && (
        <div className="text-center py-4">
          <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
          <p className="font-medium">You've completed your day</p>
          <p className="text-sm text-muted-foreground mt-1">
            See you tomorrow!
          </p>
        </div>
      )}
    </Card>
  );
}
