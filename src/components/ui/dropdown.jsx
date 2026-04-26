
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// Custom Dropdown component with beautiful UI for options
// Props:
// - id, name
// - value, onChange
// - options: Array<{ value, label }>
// - placeholder: string
// - className: extra classes
// - disabled
// - icon: React node (defaults to ChevronDown)
export default function Dropdown({ id, name, value, onChange, options = [], placeholder = 'Select an option', className = '', disabled = false, icon = null, ...props }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const Icon = icon || ChevronDown;

  // Find selected option label
  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (opt) => {
    if (onChange) {
      // Create a synthetic event to match native select behavior
      const syntheticEvent = {
        target: { name, value: opt.value }
      };
      onChange(syntheticEvent);
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Hidden native select for form compatibility */}
      <select
        id={id}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value ?? opt.label} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Custom styled button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full appearance-none px-4 py-2 pr-10 border rounded-lg text-left transition-all duration-200 shadow-sm
          ${disabled 
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300 dark:bg-gray-900 dark:border-gray-700' 
            : 'bg-white text-gray-900 border-gray-300 hover:border-gray-400 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:border-gray-500'
          }
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500 dark:ring-blue-400 dark:border-blue-400' : ''}
          ${!selectedOption ? 'text-gray-500 dark:text-gray-400' : ''}
        `}
      >
        <span className="block truncate min-w-0">{displayText}</span>
      </button>

      {/* Icon */}
      <div
        className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200
          ${disabled ? 'text-gray-400' : isOpen ? 'text-blue-500 rotate-180 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}
        `}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Custom dropdown options */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value ?? opt.label}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-4 py-2.5 transition-colors duration-150 flex items-center justify-between
                    ${isSelected 
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                      : 'text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
