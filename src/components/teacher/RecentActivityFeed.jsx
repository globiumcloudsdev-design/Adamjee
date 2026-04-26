"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  MessageSquare,
  Bell,
} from "lucide-react";

export default function RecentActivityFeed({ activities = [] }) {
  const getActivityIcon = (type) => {
    const icons = {
      attendance: CheckCircle,
      exam: Calendar,
      assignment: FileText,
      announcement: Bell,
      message: MessageSquare,
      default: Clock,
    };
    return icons[type] || icons.default;
  };

  const getActivityColor = (type) => {
    const colors = {
      attendance: "text-green-600 bg-green-500/10",
      exam: "text-purple-600 bg-purple-500/10",
      assignment: "text-blue-600 bg-blue-500/10",
      announcement: "text-orange-600 bg-orange-500/10",
      message: "text-pink-600 bg-pink-500/10",
      default: "text-gray-600 bg-gray-500/10",
    };
    return colors[type] || colors.default;
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Recent Activity</h2>
        <Badge variant="outline">Last 24 hours</Badge>
      </div>

      {activities.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);

            return (
              <motion.div
                key={activity._id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                {/* Icon */}
                <div
                  className={`p-2 rounded-lg ${colorClass} flex-shrink-0 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">
                    {activity.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {activity.description}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                    {activity.className && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {activity.className}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                {activity.status && (
                  <Badge
                    variant={
                      activity.status === "completed" ? "default" : "outline"
                    }
                    className="flex-shrink-0 text-xs"
                  >
                    {activity.status}
                  </Badge>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground font-medium">
            No recent activity
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Your recent actions will appear here
          </p>
        </div>
      )}

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
