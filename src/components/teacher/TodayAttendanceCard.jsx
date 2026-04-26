"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
} from "lucide-react";

export default function TodayAttendanceCard({ attendanceData }) {
  const {
    totalClasses = 0,
    completedClasses = 0,
    pendingClasses = 0,
    totalStudents = 0,
    presentStudents = 0,
    absentStudents = 0,
    lateStudents = 0,
    attendanceRate = 0,
  } = attendanceData || {};

  const stats = [
    {
      label: "Present",
      value: presentStudents,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Absent",
      value: absentStudents,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-500/10",
    },
    {
      label: "Late",
      value: lateStudents,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-500/10",
    },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Today's Attendance</h2>
        <Badge variant="outline">
          <Calendar className="w-3 h-3 mr-1" />
          {new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </Badge>
      </div>

      {/* Overall Stats */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Overall Attendance Rate
          </span>
          <span className="text-sm font-semibold">{attendanceRate}%</span>
        </div>
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${attendanceRate}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`absolute top-0 left-0 h-full rounded-full ${
              attendanceRate >= 90
                ? "bg-green-500"
                : attendanceRate >= 75
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>
            {presentStudents} / {totalStudents} students
          </span>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>+5% from yesterday</span>
          </div>
        </div>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`p-3 rounded-lg ${stat.bgColor} border border-border/50`}
          >
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">
                {stat.label}
              </span>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Classes Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Classes Progress</span>
          <span className="font-medium">
            {completedClasses} / {totalClasses}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Completed</span>
            </div>
            <span className="font-medium">{completedClasses}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Pending</span>
            </div>
            <span className="font-medium">{pendingClasses}</span>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      {pendingClasses > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" />
            <p className="text-sm text-primary font-medium">
              {pendingClasses} {pendingClasses === 1 ? "class" : "classes"}{" "}
              pending attendance
            </p>
          </div>
        </motion.div>
      )}
    </Card>
  );
}
