'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const DashboardHeader = ({ 
  title, 
  subtitle, 
  onRefresh, 
  children 
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-8 mb-8">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        {children}
        {onRefresh && (
          <Button 
            onClick={onRefresh} 
            variant="outline"
            className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-semibold"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
