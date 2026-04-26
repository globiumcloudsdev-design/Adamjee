"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, AlertCircle } from "lucide-react";

export default function UpcomingExamsCard({ exams = [] }) {
  const getExamStatus = (examDate) => {
    const now = new Date();
    const exam = new Date(examDate);
    const diffDays = Math.ceil((exam - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: "Completed", color: "bg-gray-500" };
    if (diffDays === 0) return { label: "Today", color: "bg-red-500" };
    if (diffDays === 1) return { label: "Tomorrow", color: "bg-orange-500" };
    if (diffDays <= 7)
      return { label: `In ${diffDays} days`, color: "bg-yellow-500" };
    return { label: `In ${diffDays} days`, color: "bg-blue-500" };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Upcoming Exams</h2>
        <Badge variant="outline">{exams.length} Scheduled</Badge>
      </div>

      {exams.length > 0 ? (
        <div className="space-y-3">
          {exams.map((exam, index) => {
            const status = getExamStatus(exam.date);

            return (
              <motion.div
                key={exam._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg hover:shadow-md transition-all duration-300 border border-border/50 group cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  {/* Date Badge */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex flex-col items-center justify-center text-white shadow-lg">
                      <span className="text-xs font-medium">
                        {new Date(exam.date).toLocaleDateString("en-US", {
                          month: "short",
                        })}
                      </span>
                      <span className="text-2xl font-bold">
                        {new Date(exam.date).getDate()}
                      </span>
                    </div>
                  </div>

                  {/* Exam Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-lg leading-tight">
                          {exam.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {exam.classId?.name || "Class Name"}
                        </p>
                      </div>
                      <Badge
                        className={`${status.color} text-white flex-shrink-0`}
                      >
                        {status.label}
                      </Badge>
                    </div>

                    {/* Exam Info */}
                    <div className="flex flex-wrap gap-3 mt-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(exam.date)}</span>
                      </div>

                      {exam.duration && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <AlertCircle className="w-3 h-3" />
                          <span>{exam.duration} mins</span>
                        </div>
                      )}

                      {exam.room && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>Room {exam.room}</span>
                        </div>
                      )}
                    </div>

                    {/* Subject/Type */}
                    {exam.subject && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          {exam.subject}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover Effect Border */}
                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-primary/60 w-0 group-hover:w-full transition-all duration-300 rounded-b-lg" />
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground font-medium">No upcoming exams</p>
          <p className="text-sm text-muted-foreground mt-1">
            Scheduled exams will appear here
          </p>
        </div>
      )}
    </Card>
  );
}
