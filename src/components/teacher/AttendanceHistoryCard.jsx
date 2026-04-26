"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export default function AttendanceHistoryCard({ attendanceHistory = [] }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const filteredHistory = attendanceHistory.filter((record) => {
    const date = new Date(record.date);
    return (
      date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    );
  });

  const stats = {
    present: filteredHistory.filter((r) => r.status === "present").length,
    absent: filteredHistory.filter((r) => r.status === "absent").length,
    late: filteredHistory.filter((r) => r.status === "late").length,
    totalDays: filteredHistory.length,
    attendanceRate:
      filteredHistory.length > 0
        ? Math.round(
            (filteredHistory.filter((r) => r.status === "present").length /
              filteredHistory.length) *
              100
          )
        : 0,
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const now = new Date();
    if (
      selectedYear === now.getFullYear() &&
      selectedMonth === now.getMonth()
    ) {
      return; // Don't go beyond current month
    }

    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "present":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-500/10",
          label: "Present",
        };
      case "absent":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-500/10",
          label: "Absent",
        };
      case "late":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-500/10",
          label: "Late",
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-600",
          bgColor: "bg-gray-500/10",
          label: "Unknown",
        };
    }
  };

  return (
    <Card className="p-6">
      {/* Header with Month Selector */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Attendance History</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {months[selectedMonth]} {selectedYear}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            disabled={
              selectedYear === new Date().getFullYear() &&
              selectedMonth === new Date().getMonth()
            }
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
          <p className="text-xs text-muted-foreground mb-1">Present</p>
          <p className="text-2xl font-bold text-green-600">{stats.present}</p>
        </div>
        <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <p className="text-xs text-muted-foreground mb-1">Absent</p>
          <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
        </div>
        <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <p className="text-xs text-muted-foreground mb-1">Late</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
        </div>
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">Rate</p>
          <p className="text-2xl font-bold text-primary">
            {stats.attendanceRate}%
          </p>
        </div>
      </div>

      {/* Attendance List */}
      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((record, index) => {
            const config = getStatusConfig(record.status);
            const StatusIcon = config.icon;

            return (
              <motion.div
                key={record._id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-3 rounded-lg ${config.bgColor} border border-border/50`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`w-5 h-5 ${config.color}`} />
                    <div>
                      <p className="font-medium">
                        {new Date(record.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {record.checkInTime && (
                          <span className="text-xs text-muted-foreground">
                            In:{" "}
                            {new Date(record.checkInTime).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        )}
                        {record.checkOutTime && (
                          <>
                            <span className="text-xs text-muted-foreground">
                              •
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Out:{" "}
                              {new Date(record.checkOutTime).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={config.color}>{config.label}</Badge>
                    {record.workingHours && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {record.workingHours}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">
              No attendance records
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Records for {months[selectedMonth]} {selectedYear} will appear
              here
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
    </Card>
  );
}
