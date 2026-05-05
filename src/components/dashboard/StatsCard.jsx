'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  description, 
  color = "blue",
  loading = false 
}) => {
  const getChangeIcon = (val) => {
    if (val > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (val < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  const getChangeColor = (val) => {
    if (val > 0) return 'text-green-600';
    if (val < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const colorVariants = {
    blue: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
    green: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
    purple: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
    indigo: "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400",
    yellow: "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400",
    emerald: "bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400",
    orange: "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400",
    red: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400",
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-none bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl ring-1 ring-slate-200 dark:ring-slate-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {value}
              </h3>
              {change !== undefined && (
                <div className="flex items-center">
                  {getChangeIcon(change)}
                  <span className={cn("text-xs font-semibold ml-1", getChangeColor(change))}>
                    {Math.abs(change)}%
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className={cn("p-3 rounded-2xl shadow-sm", colorVariants[color] || colorVariants.blue)}>
            {Icon && <Icon className="w-6 h-6" />}
          </div>
        </div>
        {description && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
              {description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
