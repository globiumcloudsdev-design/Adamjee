import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// Custom Dropdown component with optional multiple selection
export default function NestedDropdown({ id, name, value, onChange, options = [], placeholder = 'Select an option', className = '', disabled = false, icon = null, multiple = false, ...props }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const Icon = icon || ChevronDown;

  // Determine selected option(s)
  const selectedOptions = multiple
    ? options.filter(opt => Array.isArray(value) && value.includes(opt.value))
    : options.filter(opt => opt.value === value);
  const displayText = selectedOptions && selectedOptions.length > 0
    ? (multiple ? selectedOptions.map(o => o.label).join(', ') : selectedOptions[0].label)
    : placeholder;

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
    if (!onChange) return;
    if (multiple) {
      const current = Array.isArray(value) ? [...value] : [];
      const idx = current.indexOf(opt.value);
      if (idx === -1) current.push(opt.value); else current.splice(idx, 1);
      onChange({ target: { name, value: current } });
    } else {
      onChange({ target: { name, value: opt.value } });
    }
    if (!multiple) setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <select
        id={id}
        name={name}
        value={multiple ? (Array.isArray(value) ? value : []) : (value ?? '')}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        multiple={multiple}
        {...props}
      >
        {!multiple && placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value ?? opt.label} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full appearance-none px-4 py-2 pr-10 border rounded-lg text-left transition-all duration-200 shadow-sm
          ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300' : 'bg-white text-gray-900 border-gray-300 hover:border-gray-400'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          ${selectedOptions.length === 0 ? 'text-gray-500' : ''}
        `}
      >
        <span className="block truncate min-w-0">{displayText}</span>
      </button>

      <div className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${disabled ? 'text-gray-400' : isOpen ? 'text-blue-500 rotate-180' : 'text-gray-500'}`}>
        <Icon className="w-5 h-5" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = multiple ? (Array.isArray(value) && value.includes(opt.value)) : (opt.value === value);
              return (
                <button
                  key={opt.value ?? opt.label}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-4 py-2.5 transition-colors duration-150 flex items-center justify-between ${isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-900 hover:bg-gray-50'}`}>
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
