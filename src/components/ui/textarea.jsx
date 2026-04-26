import React from 'react';

export default function Textarea({ label = null, value, onChange, placeholder = '', className = '', fullWidth = true, rows = 4, ...props }) {
  return (
    <div className={`flex flex-col ${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && <label className="text-sm text-gray-600 mb-1">{label}</label>}
      <textarea
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        {...props}
      />
    </div>
  );
}
