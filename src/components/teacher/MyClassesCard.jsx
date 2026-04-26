"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Clock, TrendingUp } from "lucide-react";
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
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Upcoming Classes</h2>
        <Badge variant="outline">{classes.length} Total</Badge>
      </div>

      {classes.length > 0 ? (
        <div className="space-y-3">
          {classes.map((classItem, index) => {
            const isLive = isClassRunning(classItem);

            return (
              <motion.div
                key={classItem._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => router.push(`/teacher/classes/${classItem._id}`)}
                className="relative p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg hover:shadow-md cursor-pointer transition-all duration-300 border border-border/50 group"
              >
                {/* Live Indicator */}
                {isLive && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-red-500 text-white animate-pulse">
                      <span className="relative flex h-2 w-2 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                      LIVE
                    </Badge>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">
                          {classItem.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Code: {classItem.code}
                        </p>
                      </div>
                    </div>

                    {/* Class Stats */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {classItem.studentCount}
                        </span>
                        <span className="text-muted-foreground">students</span>
                      </div>

                      {classItem.attendanceRate && (
                        <div className="flex items-center gap-1 text-sm">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-600">
                            {classItem.attendanceRate}%
                          </span>
                          <span className="text-muted-foreground">
                            attendance
                          </span>
                        </div>
                      )}
                      
                      {classItem.schedule && classItem.schedule.length > 0 && (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-600">
                            {classItem.schedule.length}
                          </span>
                          <span className="text-muted-foreground">
                            periods/week
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Schedule Days */}
                    {classItem.schedule && classItem.schedule.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {[...new Set(classItem.schedule.map(s => s.day))].map((day) => (
                          <Badge 
                            key={day} 
                            variant="outline" 
                            className="text-xs py-0 px-2"
                          >
                            {day.substring(0, 3)}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Next Class Time */}
                    {classItem.nextClass && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Next: {classItem.nextClass}</span>
                      </div>
                    )}
                  </div>

                  {/* Student Count Badge */}
                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                      {classItem.studentCount}
                    </div>
                    <p className="text-xs text-muted-foreground">Students</p>
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
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground font-medium">
            No classes assigned
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Classes will appear here once assigned
          </p>
        </div>
      )}
    </Card>
  );
}
