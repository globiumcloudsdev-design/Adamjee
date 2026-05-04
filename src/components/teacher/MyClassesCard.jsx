"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Clock, TrendingUp, ChevronRight, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MyClassesCard({ classes = [] }) {
  const router = useRouter();

  // Check if a class is currently running
  const isClassRunning = (classItem) => {
    if (!classItem.schedule) return false;

    const now = new Date();
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return classItem.schedule.some((schedule) => {
      if (schedule.day !== currentDay) return false;

      const [startHour, startMin] = schedule.startTime.split(":").map(Number);
      const [endHour, endMin] = schedule.endTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      return currentTime >= startMinutes && currentTime <= endMinutes;
    });
  };

  return (
    <Card className="p-0 overflow-hidden border-none shadow-2xl shadow-indigo-100/50 bg-white/80 backdrop-blur-xl relative">
      <div className="absolute top-0 right-0 p-32 bg-indigo-50/50 rounded-full blur-3xl -z-10 mix-blend-multiply opacity-70"></div>
      <div className="p-6">
        <div 
          className="flex items-center justify-between mb-6 cursor-pointer group/header"
          onClick={() => router.push('/teacher/classes')}
        >
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-indigo-900 bg-clip-text text-transparent group-hover/header:text-indigo-600 transition-colors flex items-center gap-2">
              Upcoming Classes
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover/header:text-indigo-600 group-hover/header:translate-x-1 transition-all" />
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Your daily teaching schedule</p>
          </div>
          <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60 shadow-sm px-3 py-1 rounded-full font-semibold">
            {classes.length} Total
          </Badge>
        </div>

        {classes.length > 0 ? (
          <div className="space-y-4">
            {classes.map((classItem, index) => {
              const isLive = isClassRunning(classItem);

              return (
                <motion.div
                  key={classItem._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
                  whileHover={{ scale: 1.015, y: -2 }}
                  onClick={() => router.push(`/teacher/classes/${classItem._id}`)}
                  className="relative group cursor-pointer bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/40 transition-all duration-300 overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${isLive ? 'bg-gradient-to-b from-red-500 to-rose-600' : 'bg-gradient-to-b from-indigo-500 to-blue-600'}`}></div>

                  <div className="p-5 flex items-center justify-between pl-6">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl flex items-center justify-center shadow-inner ${isLive ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {isLive ? <Clock className="w-5 h-5 animate-pulse" /> : <GraduationCap className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors text-lg tracking-tight">
                              {classItem.name}
                            </h3>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                              {classItem.code}
                            </p>
                          </div>
                        </div>

                        {/* Live Indicator inside row */}
                        {isLive && (
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                            <span className="text-xs font-bold text-red-600 tracking-wider">LIVE</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Students</span>
                          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                            {classItem.studentCount}
                          </div>
                        </div>

                        {classItem.attendanceRate && (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance</span>
                            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                              <TrendingUp className="w-3.5 h-3.5" />
                              {classItem.attendanceRate}%
                            </div>
                          </div>
                        )}

                        {classItem.schedule && classItem.schedule.length > 0 && (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Schedule</span>
                            <div className="flex flex-wrap gap-1">
                              {[...new Set(classItem.schedule.map(s => s.day))].slice(0, 3).map((day) => (
                                <span key={day} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                                  {day.substring(0, 3)}
                                </span>
                              ))}
                              {classItem.schedule.length > 3 && (
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">+{classItem.schedule.length - 3}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-6 pl-6 border-l border-slate-100 flex flex-col items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-5">
              <BookOpen className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No classes assigned</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't been assigned to any active classes or sections yet. Check back later or contact administration.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
