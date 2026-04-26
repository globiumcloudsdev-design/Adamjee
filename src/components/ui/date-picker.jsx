import React from 'react';
import { Calendar } from 'lucide-react';

export default function DatePicker({
  label = null,
  value,
  onChange,
  className = '',
  fullWidth = true,
  required = false,
  error = null,
  min,
  max,
  ...props
}) {
  return (
    <div className={`flex flex-col ${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label className="text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 pointer-events-none transition-colors">
          <Calendar className="w-4 h-4" />
        </div>
        <input
          type="date"
          value={value ?? ''}
          onChange={onChange}
          min={min}
          max={max}
          className={`w-full pl-10 pr-4 py-2 bg-white border ${
            error ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
          } rounded-lg text-slate-700 focus:ring-2 focus:border-transparent outline-none transition-all shadow-sm hover:border-slate-300`}
          // Some browsers display native calendar picker icons which might conflict with our custom left icon.
          // This specific class helps style the input cleanly.
          style={{ minHeight: "42px" }}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>}
    </div>
  );
}
