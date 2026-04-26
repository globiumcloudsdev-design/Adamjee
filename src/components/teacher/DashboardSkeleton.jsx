"use client";

import { motion } from "framer-motion";

export default function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Greeting Skeleton */}
      <div className="space-y-3">
        <div className="h-10 w-96 bg-muted/80 dark:bg-muted rounded-lg animate-pulse" />
        <div className="h-5 w-64 bg-muted/80 dark:bg-muted rounded-lg animate-pulse" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-card border border-border rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-muted/80 dark:bg-muted rounded-full animate-pulse" />
              <div className="w-16 h-6 bg-muted/80 dark:bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted/80 dark:bg-muted rounded animate-pulse" />
              <div className="h-8 w-16 bg-muted/80 dark:bg-muted rounded animate-pulse" />
              <div className="h-3 w-32 bg-muted/80 dark:bg-muted rounded animate-pulse" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Classes and Exams Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-6 bg-card border border-border rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-32 bg-muted/80 dark:bg-muted rounded animate-pulse" />
              <div className="h-5 w-16 bg-muted/80 dark:bg-muted rounded-full animate-pulse" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="p-4 bg-muted/30 dark:bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted/80 dark:bg-muted rounded-lg animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-48 bg-muted/80 dark:bg-muted rounded animate-pulse" />
                      <div className="h-4 w-32 bg-muted/80 dark:bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Today's Attendance Skeleton */}
      <div className="p-6 bg-card border border-border rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-48 bg-muted/80 dark:bg-muted rounded animate-pulse" />
          <div className="h-5 w-24 bg-muted/80 dark:bg-muted rounded-full animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-3 w-full bg-muted/80 dark:bg-muted rounded-full animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3 bg-muted/30 dark:bg-muted/50 rounded-lg"
              >
                <div className="h-4 w-16 bg-muted/80 dark:bg-muted rounded animate-pulse mb-2" />
                <div className="h-8 w-12 bg-muted/80 dark:bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="p-6 bg-card border border-border rounded-lg shadow-sm">
        <div className="h-6 w-32 bg-muted/80 dark:bg-muted rounded animate-pulse mb-4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="p-4 border border-border rounded-lg">
              <div className="w-12 h-12 bg-muted/80 dark:bg-muted rounded-lg animate-pulse mb-3" />
              <div className="h-5 w-24 bg-muted/80 dark:bg-muted rounded animate-pulse mb-2" />
              <div className="h-4 w-32 bg-muted/80 dark:bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
