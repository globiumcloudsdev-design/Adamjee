import React from 'react';
import { Search as SearchIcon } from 'lucide-react';

// Reusable Input component
// Props: label, value, onChange, placeholder, type, className, icon, fullWidth
export default function Input({
  label = null,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  className = '',
  icon = null,
  fullWidth = true,
  ...props
}) {
  const hasIcon = icon !== null && icon !== false;
  const Icon = hasIcon ? icon : null;

  return (
    <div className={`flex flex-col ${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && <label className="text-sm text-gray-600 mb-1">{label}</label>}
      <div className="relative">
        <input
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          className={[
            'w-full py-2 border border-gray-300 rounded-lg',
            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'text-gray-900 bg-white',
            // Only add left padding for icon if icon is present
            hasIcon ? 'pl-10 pr-3' : 'px-4',
            // Don't truncate number inputs — text must be fully visible
            type === 'number' ? '' : '',
          ].join(' ')}
          {...props}
        />
        {hasIcon && Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
}

// Named export for backward compatibility
export { Input };
