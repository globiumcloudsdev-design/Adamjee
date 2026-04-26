import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

/**
 * MultiSelectDropdown
 * Allows searching and selecting multiple options.
 * 
 * Props:
 * - value: Array of selected values (e.g. ['id1', 'id2'])
 * - onChange: (newValues) => void
 * - options: Array<{ value, label, subLabel? }>
 * - placeholder
 * - label
 * - icon
 */
export default function MultiSelectDropdown({ 
  value = [], 
  onChange, 
  options = [], 
  placeholder = 'Select options...', 
  label,
  icon: Icon,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (opt.subLabel && opt.subLabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (optionValue) => {
    const newValues = value.includes(optionValue)
      ? value.filter(v => v !== optionValue) // Remove
      : [...value, optionValue]; // Add
    
    onChange({ target: { name: 'multi-select', value: newValues } });
  };

  const handleRemove = (e, optionValue) => {
    e.stopPropagation();
    handleSelect(optionValue);
  };

  return (
    <div className="w-full relative" ref={dropdownRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      
      <div 
        className={`bg-white border text-sm rounded-lg shadow-sm min-h-[42px] relative flex flex-wrap gap-1 p-1 pr-8 items-center cursor-pointer transition-all
          ${disabled ? 'bg-gray-100 cursor-not-allowed border-gray-300' : 'border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500'}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {Icon && (
          <div className="absolute left-3 text-gray-400 pointer-events-none">
            <Icon size={16} />
          </div>
        )}

        <div className={`flex flex-wrap gap-1 flex-1 ${Icon ? 'ml-8' : ''}`}>
          {value.length === 0 ? (
            <span className="text-gray-500 px-2 py-1">{placeholder}</span>
          ) : (
            value.map(val => {
              const opt = options.find(o => o.value === val);
              if (!opt) return null;
              return (
                <span key={val} className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm">
                  {opt.label}
                  <button 
                    type="button"
                    onClick={(e) => handleRemove(e, val)}
                    className="hover:text-blue-100 rounded-full p-0.5 hover:bg-blue-700 transition-colors"
                    title="Remove"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                </span>
              );
            })
          )}
        </div>

        <div className="absolute right-3 text-gray-400">
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          
          {/* Search Bar */}
          <div className="p-2 border-b bg-gray-50">
            <input
              type="text"
              placeholder="Search..."
              className="w-full text-sm px-3 py-1.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1 p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = value.includes(opt.value);
                return (
                  <div 
                    key={opt.value} 
                    className={`flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-all
                      ${isSelected ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}
                    `}
                    onClick={() => handleSelect(opt.value)}
                  >
                    <div className="flex flex-col">
                      <span className={`font-medium ${isSelected ? 'font-semibold' : ''}`}>{opt.label}</span>
                      {opt.subLabel && <span className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>{opt.subLabel}</span>}
                    </div>
                    {isSelected && <Check size={18} strokeWidth={3} className="text-white" />}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">No options found</div>
            )}
          </div>
          
          {/* Footer Actions */}
          <div className="p-2 border-t bg-gray-50 flex justify-between">
            <button 
              type="button"
              className="text-xs text-gray-600 hover:text-gray-900 font-medium px-2 py-1"
              onClick={(e) => {
                e.stopPropagation();
                onChange({ target: { name: 'multi-select', value: options.map(o => o.value) } });
              }}
            >
              Select All
            </button>
            <button 
              type="button"
              className="text-xs text-red-600 hover:text-red-900 font-medium px-2 py-1"
              onClick={(e) => {
                e.stopPropagation();
                onChange({ target: { name: 'multi-select', value: [] } });
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
