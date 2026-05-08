
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Custom Dropdown component with beautiful UI for options
// Props:
// - id, name
// - value, onChange
// - options: Array<{ value, label }>
// - placeholder: string
// - className: extra classes
// - disabled
// - icon: React node (defaults to ChevronDown)
export default function Dropdown({ id, name, value, onChange, options = [], placeholder = 'Select an option', className = '', buttonClassName = '', disabled = false, icon = null, label = null, required = false, ...props }) {
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
    <div className={`flex flex-col w-full ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-sm text-gray-600 mb-1 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}
      <div className="relative">
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
        className={`w-full appearance-none px-4 py-1.5 pr-10 border rounded-xl text-left transition-all duration-200 shadow-sm font-medium
          ${disabled 
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200 dark:bg-gray-900/50 dark:border-gray-800' 
            : 'bg-white text-gray-900 border-gray-300 hover:border-gray-400 dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:border-gray-600'
          }
          ${isOpen ? 'ring-4 ring-blue-500/10 border-blue-500 dark:ring-blue-400/10 dark:border-blue-400' : ''}
          ${!selectedOption ? 'text-gray-400' : ''}
          ${buttonClassName}
        `}
      >
        <span className="block truncate">{displayText}</span>
      </button>

      {/* Icon */}
      <div
        className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-200
          ${disabled ? 'text-gray-300' : isOpen ? 'text-blue-500 rotate-180' : 'text-gray-400'}
        `}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Custom dropdown options */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden origin-top"
          >
            <div className="max-h-60 overflow-y-auto py-1">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                const isDisabled = opt.disabled;
  
                return (
                  <button
                    key={opt.value ?? opt.label}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => !isDisabled && handleSelect(opt)}
                    className={`w-full text-left px-4 py-2.5 transition-colors duration-150 flex items-center justify-between
                      ${isSelected 
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                        : isDisabled
                          ? 'opacity-50 cursor-not-allowed bg-gray-50/50 dark:bg-gray-900/20 text-gray-400'
                          : 'text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <span className={`flex-1 w-full ${isDisabled ? 'line-through decoration-gray-300' : ''}`}>
                      {opt.label}
                    </span>
                    {isSelected && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
