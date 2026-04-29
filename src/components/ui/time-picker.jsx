"use client";

import React, { useState, useEffect, useRef } from "react";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";

const TimePicker = ({ value, onChange, label, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse 24h time string (HH:mm)
  const parseTime = (timeStr) => {
    if (!timeStr) return { hours: 4, minutes: 0, ampm: "PM" };
    const [h, m] = timeStr.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hours = h % 12 || 12;
    return { hours, minutes: m, ampm };
  };

  const { hours, minutes, ampm } = parseTime(value);

  const updateTime = (newH, newM, newAmpm) => {
    let h24 = newAmpm === "PM" ? (newH % 12) + 12 : newH % 12;
    const timeStr = `${String(h24).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
    onChange(timeStr);
  };

  const handleHourChange = (delta) => {
    let newH = hours + delta;
    if (newH > 12) newH = 1;
    if (newH < 1) newH = 12;
    updateTime(newH, minutes, ampm);
  };

  const handleMinuteChange = (delta) => {
    let newM = minutes + delta;
    if (newM >= 60) newM = 0;
    if (newM < 0) newM = 55; // Jump by 5s if they want? Or just 1. Let's do 5 for convenience.
    updateTime(hours, newM, ampm);
  };

  const toggleAmpm = () => {
    updateTime(hours, minutes, ampm === "AM" ? "PM" : "AM");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer hover:border-blue-400 transition-all shadow-sm group"
      >
        <Clock className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
        <span className="text-sm font-semibold tabular-nums">
          {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")} {ampm}
        </span>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl flex gap-4 animate-in fade-in zoom-in duration-200 origin-top">
          {/* Hours */}
          <div className="flex flex-col items-center gap-1">
            <button type="button" onClick={() => handleHourChange(1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
              <ChevronUp className="h-4 w-4" />
            </button>
            <span className="text-lg font-bold w-8 text-center">{String(hours).padStart(2, "0")}</span>
            <button type="button" onClick={() => handleHourChange(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <span className="text-lg font-bold self-center">:</span>

          {/* Minutes */}
          <div className="flex flex-col items-center gap-1">
            <button type="button" onClick={() => handleMinuteChange(5)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
              <ChevronUp className="h-4 w-4" />
            </button>
            <span className="text-lg font-bold w-8 text-center">{String(minutes).padStart(2, "0")}</span>
            <button type="button" onClick={() => handleMinuteChange(-5)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* AM/PM */}
          <div className="flex flex-col justify-center">
            <button 
              type="button"
              onClick={toggleAmpm}
              className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black rounded uppercase tracking-tighter hover:bg-blue-100 transition-colors"
            >
              {ampm}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker;
