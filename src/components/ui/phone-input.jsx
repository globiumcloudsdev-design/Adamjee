'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const PhoneInput = ({ value, onChange, className, error, label, required = false, hideDescription = false, ...props }) => {
  const handleChange = (e) => {
    const input = e.target.value;
    // Extract only digits
    const digits = input.replace(/\D/g, '');
    
    // If it starts with 92, remove it to just get the local digits
    let localNumber = digits;
    if (digits.startsWith('92')) {
      localNumber = digits.substring(2);
    }
    
    // Limit to 10 digits
    const limitedNumber = localNumber.substring(0, 10);
    
    // Call parent onChange with +92 format
    onChange(`+92${limitedNumber}`);
  };

  // Display value with space after 3 digits (e.g., 300 1234567)
  const formatDisplay = (val) => {
    if (!val) return '';
    const clean = val.replace('+92', '');
    if (clean.length > 3) {
      return `${clean.slice(0, 3)} ${clean.slice(3)}`;
    }
    return clean;
  };

  const displayValue = formatDisplay(value);

  return (
    <div className="space-y-2 w-full">
      {label && (
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none border-r border-slate-200 dark:border-slate-800 pr-3 my-2 text-slate-500 dark:text-slate-400 font-bold text-sm">
          🇵🇰 +92
        </div>
        <Input
          type="tel"
          value={displayValue}
          onChange={handleChange}
          placeholder="300 1234567"
          className={cn(
            "pl-20 h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium tracking-wider",
            error && "border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs font-medium text-red-500 mt-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
      {!hideDescription && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium px-1">
          Example: 300 1234567 (10 digits)
        </p>
      )}
    </div>
  );
};

export default PhoneInput;
