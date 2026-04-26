"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";

export default function DashboardStats({ stats }) {
  const statsCards = [
    {
      title: "My Classes",
      value: stats?.classes?.total || 0,
      icon: BookOpen,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-600",
      change: stats?.classes?.change || 0,
      description: `${stats?.classes?.active || 0} active classes`,
    },
    {
      title: "Total Students",
      value: stats?.students?.total || 0,
      icon: Users,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-500/10",
      textColor: "text-green-600",
      change: stats?.students?.change || 0,
      description: `Across all classes`,
    },
    {
      title: "Attendance Rate",
      value: `${stats?.attendance?.average || 0}%`,
      icon: CheckCircle,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10",
      textColor: "text-purple-600",
      change: stats?.attendance?.change || 0,
      description: "This month",
    },
    {
      title: "Upcoming Exams",
      value: stats?.exams?.total || 0,
      icon: Calendar,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-500/10",
      textColor: "text-orange-600",
      change: stats?.exams?.change || 0,
      description: `${stats?.exams?.thisWeek || 0} this week`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group">
            {/* Gradient Background */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
            />

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>

                {/* Change Indicator */}
                {stat.change !== 0 && (
                  <div
                    className={`flex items-center gap-1 text-xs font-medium ${
                      stat.change > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    <TrendingUp
                      className={`w-3 h-3 ${
                        stat.change < 0 ? "rotate-180" : ""
                      }`}
                    />
                    <span>{Math.abs(stat.change)}%</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold tracking-tight">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </div>

            {/* Animated Border */}
            <div
              className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${stat.color} w-0 group-hover:w-full transition-all duration-300`}
            />
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
