"use client";

import React, { useMemo } from "react";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, User, MapPin, Printer, Info, GraduationCap, Building2 } from "lucide-react";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Internal Component for the Grid
const SimpleTimetableView = ({ timetable, teachers = [], subjects = [] }) => {
  if (!timetable || !timetable.periods) return null;

  // Optimization: Group periods by day and periodNumber for O(1) lookup
  const groupedPeriods = useMemo(() => {
    const groups = {};
    timetable.periods.forEach((p) => {
      const key = `${p.day}-${p.periodNumber}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [timetable.periods]);

  // Optimization: Get unique sorted period numbers
  const periodNumbers = useMemo(() => {
    return Array.from(new Set(timetable.periods.map((p) => p.periodNumber)))
      .sort((a, b) => a - b);
  }, [timetable.periods]);

  // Helper to get formatted time
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hours = h % 12 || 12;
    return `${String(hours).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  // Helper to get teacher name with multiple fallbacks
  const getTeacherName = (period) => {
    if (!period) return "No Teacher";
    
    // Check teacherId object (populated)
    const tId = period.teacherId;
    if (tId && typeof tId === 'object') {
      if (tId.first_name) return `${tId.first_name} ${tId.last_name || ""}`.trim();
      if (tId.name) return tId.name;
      if (tId.full_name) return tId.full_name;
    }

    // Lookup in teachers array if it's an ID string
    if (tId && typeof tId === 'string' && teachers.length > 0) {
      const found = teachers.find(t => String(t.id || t._id) === String(tId));
      if (found) {
        if (found.first_name) return `${found.first_name} ${found.last_name || ""}`.trim();
        if (found.name) return found.name;
        if (found.full_name) return found.full_name;
      }
    }

    // Check teacher object (sometimes used instead of teacherId)
    const t = period.teacher;
    if (t && typeof t === 'object') {
      if (t.first_name) return `${t.first_name} ${t.last_name || ""}`.trim();
      if (t.name) return t.name;
      if (t.full_name) return t.full_name;
    }

    // If it's just a string ID or missing
    return tId && typeof tId === 'string' ? "Teacher Assigned" : "No Teacher";
  };

  // Helper to get subject name
  const getSubjectName = (period) => {
    if (!period) return "Subject";
    const sId = period.subjectId;
    
    if (sId && typeof sId === 'object') return sId.name || sId.title || "Subject";
    
    if (sId && typeof sId === 'string' && subjects.length > 0) {
      const found = subjects.find(s => String(s.id || s._id) === String(sId));
      if (found) return found.name || found.title || "Subject";
    }

    return sId || "Subject";
  };

  const campusName = timetable.branchId?.name || timetable.branch?.name || "Campus-12";

  return (
    <div id="printable-timetable" className="print:p-0">
      <style jsx global>{`
        @media print {
          @page { size: landscape; margin: 1cm; }
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-shadow-none { box-shadow: none !important; }
          .print-border { border: 1px solid #e2e8f0 !important; }
          .print-bg-white { background-color: white !important; }
          .print-text-black { color: black !important; }
        }
      `}</style>

      <Card className="border-none shadow-none print:shadow-none print:bg-white">
        <CardHeader className="px-0 pt-0 pb-6 border-b mb-6 print:pb-4 print:mb-4 print:border-slate-300">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 print:text-indigo-700">
                <GraduationCap className="h-6 w-6" />
                <span className="text-sm font-black uppercase tracking-[0.2em]">Adamjee Coaching Centre</span>
              </div>
              <CardTitle className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight print:text-2xl print:text-black">
                {timetable.name || "Class Schedule"}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground print:text-black">
                <Badge variant="secondary" className="rounded-md font-bold bg-slate-100 text-slate-700 print:bg-white print:border-slate-300 print:text-black">
                  <Building2 className="h-3 w-3 mr-1.5" />
                  {campusName}
                </Badge>
                <span className="text-slate-300 print:text-slate-400">•</span>
                <Badge variant="secondary" className="rounded-md font-bold bg-indigo-50 text-indigo-700 print:bg-white print:border-slate-300 print:text-black">
                  {timetable.class?.name || timetable.classId?.name || "Class"}
                </Badge>
                <span className="text-slate-300 print:text-slate-400">•</span>
                <Badge variant="outline" className="rounded-md font-bold bg-blue-50/50 text-blue-600 border-blue-100 print:bg-white print:border-slate-300 print:text-black">
                  Section: {timetable.section?.name || timetable.section || "All"}
                </Badge>
                <span className="text-slate-300 print:text-slate-400">•</span>
                <span className="flex items-center gap-1 font-bold text-slate-600 print:text-black">
                  <Info className="h-3 w-3" />
                  {timetable.academicYear?.name || "Academic Year"}
                </span>
              </div>
            </div>
            
            <div className="hidden print:block text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Generated</p>
              <p className="text-sm font-black text-slate-900">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-0">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-950 print:border-slate-400 print:rounded-none">
            <div className="overflow-x-auto">
              <Table className="print:table-fixed w-full">
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 print:bg-slate-100 print:border-slate-400">
                    <TableHead className="w-[100px] font-black text-slate-500 uppercase text-[10px] tracking-widest text-center border-r border-slate-200 dark:border-slate-800 print:border-slate-400 print:text-slate-700">
                      Period
                    </TableHead>
                    {DAYS.map((day) => (
                      <TableHead key={day} className="text-center font-black text-slate-700 dark:text-slate-200 uppercase text-[11px] tracking-widest border-r border-slate-200 dark:border-slate-800 last:border-r-0 min-w-[140px] py-4 print:border-slate-400 print:text-black print:py-2">
                        {day}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periodNumbers.map((periodNum) => (
                    <TableRow key={periodNum} className="hover:bg-transparent group border-b border-slate-100 dark:border-slate-800 last:border-0 print:border-slate-300">
                      <TableCell className="font-medium bg-slate-50/30 dark:bg-slate-900/10 text-center border-r border-slate-200 dark:border-slate-800 print:border-slate-400 print:bg-white">
                        <div className="flex flex-col items-center py-2 print:py-1">
                          <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1 print:text-slate-500">Slot</span>
                          <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm print:shadow-none print:border-slate-400 print:h-8 print:w-8">
                            <span className="text-lg font-black text-slate-900 dark:text-white print:text-sm">{periodNum}</span>
                          </div>
                        </div>
                      </TableCell>
                      {DAYS.map((day) => {
                        const key = `${day}-${periodNum}`;
                        const cellPeriods = groupedPeriods[key] || [];

                        return (
                          <TableCell key={day} className="p-3 h-32 align-top border-r border-slate-100 dark:border-slate-800 last:border-r-0 transition-colors group-hover:bg-slate-50/50 dark:group-hover:bg-slate-900/20 print:border-slate-300 print:p-1.5 print:h-auto print:min-h-[80px]">
                            <div className="space-y-4 print:space-y-2">
                              {cellPeriods.map((period, idx) => (
                                <div 
                                  key={idx} 
                                  className={`p-2.5 rounded-lg border flex flex-col gap-1.5 transition-all print:p-1.5 print:rounded-md print:border-slate-300
                                    ${period.periodType === 'break' || period.periodType === 'lunch'
                                      ? 'bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30 print:bg-slate-50'
                                      : 'bg-indigo-50/30 border-indigo-100/50 dark:bg-indigo-900/5 dark:border-indigo-900/20 print:bg-white'
                                    }`}
                                >
                                  <div className="flex items-center justify-between print:hidden">
                                    <Badge 
                                      className={`text-[8px] h-4 px-1.5 font-black uppercase tracking-tight rounded-md
                                        ${period.periodType === 'break' || period.periodType === 'lunch'
                                          ? 'bg-amber-500 hover:bg-amber-500 text-white border-none'
                                          : 'bg-indigo-600 hover:bg-indigo-600 text-white border-none'
                                        }`}
                                    >
                                      {period.periodType || "Lecture"}
                                    </Badge>
                                    <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                                      #{idx + 1}
                                    </span>
                                  </div>

                                  <p className="text-[12px] font-black leading-snug text-slate-900 dark:text-slate-100 uppercase tracking-tight print:text-[10px] print:text-black print:leading-tight">
                                    {getSubjectName(period)}
                                  </p>

                                  <div className="space-y-1 mt-1 print:mt-0.5 print:space-y-0.5">
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold print:text-[8px] print:text-slate-700">
                                      <User className="h-3 w-3 text-slate-400 print:h-2 print:w-2" />
                                      <span className="truncate">
                                        {getTeacherName(period)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold print:text-[8px] print:text-slate-700">
                                      <Clock className="h-3 w-3 text-slate-400 print:h-2 print:w-2" />
                                      <span className="tabular-nums font-bold">
                                        {formatTime(period.startTime)} - {formatTime(period.endTime)}
                                      </span>
                                    </div>
                                    {period.roomNumber && (
                                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-tighter pt-0.5 print:text-[8px] print:pt-0">
                                        <MapPin className="h-3 w-3 print:h-2 print:w-2" />
                                        <span>Room: {period.roomNumber}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {cellPeriods.length === 0 && (
                                <div className="h-full flex items-center justify-center py-8 print:py-4">
                                  <div className="h-1.5 w-1.5 rounded-full bg-slate-100 dark:bg-slate-800 print:bg-slate-300" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="mt-8 hidden print:flex justify-between items-end border-t pt-4 border-slate-200">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authorized Signature</p>
              <div className="h-10 w-48 border-b border-slate-300" />
            </div>
            <p className="text-[9px] text-slate-400 italic font-medium">
              This is a computer-generated timetable. Adamjee Coaching Centre © {new Date().getFullYear()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Exported Modal Component
const SimpleTimetableViewModal = ({ isOpen, onClose, timetable, teachers = [], subjects = [] }) => {
  if (!timetable) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-500" />
          <span>Timetable Overview</span>
        </div>
      }
      footer={
        <div className="flex justify-between items-center w-full no-print">
          <p className="text-[10px] text-muted-foreground italic font-medium hidden sm:block">
            * Schedules are subject to change by administration.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <Printer className="h-4 w-4 mr-2" />
              Print PDF
            </Button>
            <Button onClick={onClose} variant="default" className="font-bold px-6">Close</Button>
          </div>
        </div>
      }
    >
      <div className="p-1 sm:p-2">
        <SimpleTimetableView timetable={timetable} teachers={teachers} subjects={subjects} />
      </div>
    </Modal>
  );
};

export default SimpleTimetableViewModal;
