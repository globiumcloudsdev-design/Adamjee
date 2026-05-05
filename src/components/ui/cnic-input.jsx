'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const CNICInput = ({ value, onChange, className, error, label, required = false, hideDescription = false, ...props }) => {
  const handleChange = (e) => {
    const input = e.target.value;
    // Extract only digits
    const digits = input.replace(/\D/g, '').substring(0, 13);
    
    // Format: XXXXX-XXXXXXX-X
    let formatted = digits;
    if (digits.length > 5 && digits.length <= 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
    } else if (digits.length > 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
    }
    
    // Call parent onChange with the formatted value or raw digits depending on your backend needs
    // Usually backend stores it with dashes or without. I'll send formatted for display consistency.
    onChange(formatted);
  };

  return (
    <div className="space-y-2 w-full">
      {label && (
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}
      <Input
        type="text"
        value={value || ''}
        onChange={handleChange}
        placeholder="XXXXX-XXXXXXX-X"
        className={cn(
          "h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium tracking-widest",
          error && "border-red-500 focus:ring-red-500/20",
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs font-medium text-red-500 mt-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
      {!hideDescription && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium px-1 uppercase tracking-tight">
          Format: 12345-1234567-1 (13 Digits)
        </p>
      )}
    </div>
  );
};

export default CNICInput;
