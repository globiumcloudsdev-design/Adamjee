"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { CalendarDays, Clock, MapPin, AlertCircle, ChevronRight, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UpcomingExamsCard({ exams = [] }) {
  const router = useRouter();
  const getExamStatus = (examDate) => {
    const now = new Date();
    const exam = new Date(examDate);
    now.setHours(0, 0, 0, 0);
    const examDay = new Date(exam);
    examDay.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((examDay - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: "Completed", style: "bg-slate-100 text-slate-500 ring-slate-200" };
    if (diffDays === 0) return { label: "Today", style: "bg-rose-50 text-rose-600 ring-rose-200", dot: "bg-rose-500" };
    if (diffDays === 1) return { label: "Tomorrow", style: "bg-amber-50 text-amber-600 ring-amber-200", dot: "bg-amber-500" };
    if (diffDays <= 7) return { label: `In ${diffDays} days`, style: "bg-indigo-50 text-indigo-600 ring-indigo-200" };
    return { label: `In ${diffDays} days`, style: "bg-blue-50 text-blue-600 ring-blue-200" };
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  return (
    <Card className="h-full border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div 
        className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 cursor-pointer group/header hover:bg-slate-50 transition-colors"
        onClick={() => router.push('/teacher/exams')}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover/header:scale-110 transition-transform">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-slate-800 tracking-tight flex items-center gap-2 group-hover/header:text-indigo-600 transition-colors">
              Upcoming Exams
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover/header:translate-x-1 transition-transform" />
            </h2>
            <p className="text-[13px] font-medium text-slate-500">Your scheduled evaluations</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm">
          {exams.length} Exams
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 bg-white">
        {exams.length > 0 ? (
          <div className="space-y-4">
            {exams.map((exam, index) => {
              const status = getExamStatus(exam.date);
              const isToday = status.label === "Today";

              return (
                <motion.div
                  key={exam._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative"
                >
                  {/* Left Accent Line for Today */}
                  {isToday && (
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1 h-12 bg-rose-500 rounded-r-md"></div>
                  )}
                  
                  <div className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border border-transparent hover:bg-slate-50 hover:border-slate-100 hover:shadow-sm cursor-pointer ${isToday ? 'bg-rose-50/30 border-rose-100/50 hover:border-rose-200 hover:bg-rose-50/50' : ''}`}>
                    
                    {/* Date Icon Block */}
                    <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-white border border-slate-200 shadow-sm shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {new Date(exam.date).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-xl font-black text-slate-800 leading-tight">
                        {new Date(exam.date).getDate()}
                      </span>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                            {exam.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-semibold text-slate-500">
                              {exam.classId?.name || "Class"}
                            </span>
                            {exam.subject && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span className="text-xs font-bold text-indigo-500 truncate">
                                  {exam.subject}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className={`shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${status.style}`}>
                          {status.dot && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.dot} opacity-75`}></span>
                              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${status.dot}`}></span>
                            </span>
                          )}
                          {status.label}
                        </div>
                      </div>

                      {/* Details Row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 pt-3 border-t border-slate-100/80">
                        <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatTime(exam.date)}</span>
                        </div>

                        {exam.duration && (
                          <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
                            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span>{exam.duration} mins</span>
                          </div>
                        )}

                        {exam.room && (
                          <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>Room {exam.room}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-700">No Upcoming Exams</h3>
            <p className="text-[13px] text-slate-500 mt-1">There are no exams scheduled for your classes.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
