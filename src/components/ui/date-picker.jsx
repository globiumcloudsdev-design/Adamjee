'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday,
  parseISO
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function DatePicker({
  label = null,
  value,
  onChange,
  className = '',
  fullWidth = true,
  required = false,
  error = null,
  placeholder = 'Select date',
  min,
  max,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef(null);

  // Parse value to Date object
  const selectedDate = value ? (typeof value === 'string' ? parseISO(value) : value) : null;

  useEffect(() => {
    if (selectedDate && isFinite(selectedDate)) {
      setCurrentMonth(selectedDate);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateClick = (day) => {
    if (onChange) {
      // Create a synthetic event to match native input behavior
      const dateStr = format(day, 'yyyy-MM-dd');
      onChange({ target: { value: dateStr, name: props.name } });
    }
    setIsOpen(false);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderHeader = () => (
    <div className="flex items-center justify-between px-4 py-2 border-b">
      <button 
        type="button" 
        onClick={prevMonth} 
        className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h2 className="text-sm font-bold text-slate-700">
        {format(currentMonth, 'MMMM yyyy')}
      </h2>
      <button 
        type="button" 
        onClick={nextMonth} 
        className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return (
      <div className="grid grid-cols-7 gap-1 p-2">
        {calendarDays.map((day, i) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isTodayDate = isToday(day);

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDateClick(day)}
              className={`
                h-8 w-8 flex items-center justify-center rounded-lg text-sm transition-all
                ${!isCurrentMonth ? 'text-slate-300' : 'text-slate-600 font-medium'}
                ${isSelected ? 'bg-indigo-600 text-white shadow-md scale-110 z-10' : 'hover:bg-slate-100'}
                ${isTodayDate && !isSelected ? 'text-indigo-600 font-bold border border-indigo-200 bg-indigo-50/50' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`flex flex-col ${fullWidth ? 'w-full' : ''} ${className}`} ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full flex items-center gap-3 px-4 py-2 bg-white border rounded-lg text-left transition-all shadow-sm
            ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'}
            ${error ? 'border-red-300 ring-red-100' : ''}
            min-h-[42px]
          `}
        >
          <CalendarIcon className={`w-4 h-4 transition-colors ${isOpen ? 'text-indigo-500' : 'text-slate-400'}`} />
          <span className={`flex-1 truncate ${!selectedDate ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
            {selectedDate ? format(selectedDate, 'PPP') : placeholder}
          </span>
          {selectedDate && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onChange({ target: { value: '', name: props.name } });
              }}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-3 h-3 text-slate-400" />
            </div>
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 5, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute z-[100] mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden min-w-[280px]"
              style={{ left: 0 }}
            >
              {renderHeader()}
              <div className="p-2">
                {renderDays()}
                {renderCells()}
              </div>
              <div className="p-3 bg-slate-50 border-t flex justify-between items-center">
                <button 
                  type="button"
                  onClick={() => handleDateClick(new Date())}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wider"
                >
                  Today
                </button>
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-wider"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>}
    </div>
  );
}
