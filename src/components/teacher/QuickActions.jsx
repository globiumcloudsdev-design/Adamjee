"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  Calendar,
  GraduationCap,
  FileText,
  Users,
  BarChart,
  Settings,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      title: "My Classes",
      description: "View and manage classes",
      icon: BookOpen,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-600",
      href: "/teacher/classes",
    },
    {
      title: "Mark Attendance",
      description: "Take student attendance",
      icon: Clock,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-500/10",
      textColor: "text-green-600",
      href: "/teacher/attendance",
    },
    {
      title: "Manage Exams",
      description: "Create and grade exams",
      icon: Calendar,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10",
      textColor: "text-purple-600",
      href: "/teacher/exams",
    },
    {
      title: "View Results",
      description: "Check student results",
      icon: GraduationCap,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-500/10",
      textColor: "text-orange-600",
      href: "/teacher/results",
    },
    {
      title: "Assignments",
      description: "Create and manage assignments",
      icon: FileText,
      color: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-500/10",
      textColor: "text-pink-600",
      href: "/teacher/assignments",
    },
    {
      title: "Students",
      description: "View student profiles",
      icon: Users,
      color: "from-cyan-500 to-cyan-600",
      bgColor: "bg-cyan-500/10",
      textColor: "text-cyan-600",
      href: "/teacher/students",
    },
    {
      title: "Analytics",
      description: "View performance analytics",
      icon: BarChart,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-500/10",
      textColor: "text-indigo-600",
      href: "/teacher/analytics",
    },
    {
      title: "Profile",
      description: "Manage your profile",
      icon: Settings,
      color: "from-gray-500 to-gray-600",
      bgColor: "bg-gray-500/10",
      textColor: "text-gray-600",
      href: "/teacher/profile",
    },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {actions.map((action, index) => (
          <motion.button
            key={action.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(action.href)}
            className="relative p-4 text-left border rounded-xl hover:shadow-lg transition-all duration-300 group overflow-hidden"
          >
            {/* Gradient Background on Hover */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
            />

            <div className="relative z-10">
              <div
                className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
              >
                <action.icon className={`w-6 h-6 ${action.textColor}`} />
              </div>
              <p className="font-semibold mb-1">{action.title}</p>
              <p className="text-sm text-muted-foreground">
                {action.description}
              </p>
            </div>

            {/* Animated Border */}
            <div
              className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${action.color} w-0 group-hover:w-full transition-all duration-300`}
            />
          </motion.button>
        ))}
      </div>
    </Card>
  );
}
