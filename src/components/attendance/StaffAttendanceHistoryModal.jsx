'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
    Calendar, Search, CheckCircle, XCircle, Clock, AlertCircle, Download, RefreshCw, X
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

export default function StaffAttendanceHistoryModal({ isOpen, onClose, defaultBranchId, isBranchAdmin }) {
    const [historyModalFilters, setHistoryModalFilters] = useState(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return {
            fromDate: today,
            toDate: today,
            status: '',
            role: ''
        };
    });
    const [historyModalRecords, setHistoryModalRecords] = useState([]);
    const [historyModalLoading, setHistoryModalLoading] = useState(false);
    const [historyModalFetched, setHistoryModalFetched] = useState(false);

    // Fetch history
    const fetchHistoryModal = async (overrideFilters) => {
        try {
            setHistoryModalLoading(true);
            setHistoryModalFetched(false);
            const activeFilters = overrideFilters || historyModalFilters;
            const params = new URLSearchParams();
            if (activeFilters.fromDate) params.append('date_from', activeFilters.fromDate);
            if (activeFilters.toDate) params.append('date_to', activeFilters.toDate);
            if (activeFilters.status) params.append('status', activeFilters.status);
            
            const branchId = defaultBranchId;
            if (branchId) params.append('branch_id', branchId);
            
            params.append('limit', '1000'); // Fetch enough records for history view and export

            const response = await apiClient.get(`/api/staff-attendance?${params.toString()}`);
            
            if (response.success && response.data?.attendances) {
                let records = response.data.attendances || [];
                if (activeFilters.role) {
                    records = records.filter(r => r.staff?.role === activeFilters.role);
                }
                setHistoryModalRecords(records);
            } else {
                setHistoryModalRecords([]);
            }
            setHistoryModalFetched(true);
        } catch (error) {
            console.error('Failed to fetch staff attendance history:', error);
            toast.error('Failed to fetch attendance history');
            setHistoryModalRecords([]);
            setHistoryModalFetched(true);
        } finally {
            setHistoryModalLoading(false);
        }
    };

    // Auto-fetch today's records on mount
    useEffect(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayFilters = { fromDate: today, toDate: today, status: '', role: '' };
        const timer = setTimeout(() => {
            fetchHistoryModal(todayFilters);
        }, 0);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const exportStaffAttendancePDF = async () => {
        if (!historyModalRecords.length) {
            toast.error('No records to export');
            return;
        }
        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');

            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();

            // ── HEADER BACKGROUND ──────────────────────────────────────────
            doc.setFillColor(109, 40, 217); // violet-700
            doc.rect(0, 0, pageWidth, 38, 'F');

            // Logo
            try {
                const img = new Image();
                img.src = '/logo.png';
                await new Promise((res) => { img.onload = res; img.onerror = res; });
                doc.addImage(img, 'PNG', 8, 4, 28, 28);
            } catch (_) {}

            // Title
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text('Adamjee Coaching Center', 42, 14);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Campus 12 — Staff & Teacher Attendance Report', 42, 21);

            // Date generated
            doc.setFontSize(7.5);
            doc.setTextColor(220, 200, 255);
            doc.text(`Generated: ${new Date().toLocaleString('en-PK')}`, 42, 27);

            // ── FILTER INFO BOX ─────────────────────────────────────────────
            doc.setFillColor(245, 243, 255); // very light violet
            doc.setDrawColor(200, 185, 255);
            doc.roundedRect(8, 42, pageWidth - 16, 18, 3, 3, 'FD');

            doc.setTextColor(80, 40, 160);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);

            const fromLabel = historyModalFilters.fromDate
                ? format(new Date(historyModalFilters.fromDate), 'dd-MMM-yyyy')
                : 'All';
            const toLabel = historyModalFilters.toDate
                ? format(new Date(historyModalFilters.toDate), 'dd-MMM-yyyy')
                : 'All';
            const statusLabel = historyModalFilters.status
                ? historyModalFilters.status.charAt(0) + historyModalFilters.status.slice(1).toLowerCase()
                : 'All';
            const roleLabel = historyModalFilters.role
                ? historyModalFilters.role.charAt(0) + historyModalFilters.role.slice(1).toLowerCase()
                : 'All';

            doc.text(`Date Range:  ${fromLabel}  →  ${toLabel}`, 14, 51);
            doc.text(`Role: ${roleLabel}   |   Status Filter:  ${statusLabel}`, 14, 57);
            doc.setTextColor(109, 40, 217);
            doc.setFont('helvetica', 'bold');
            const totalTxt = `Total Records: ${historyModalRecords.length}`;
            doc.text(totalTxt, pageWidth - 14, 51, { align: 'right' });

            // Count stats
            const presentCount = historyModalRecords.filter(r => r.status === 'PRESENT').length;
            const absentCount = historyModalRecords.filter(r => r.status === 'ABSENT').length;
            const lateCount = historyModalRecords.filter(r => r.status === 'LATE').length;
            const leaveCount = historyModalRecords.filter(r => r.status === 'LEAVE').length;
            
            doc.setFontSize(7.5);
            doc.setTextColor(22, 163, 74);
            doc.text(`Present: ${presentCount}   |   Absent: ${absentCount}   |   Late: ${lateCount}   |   Leave: ${leaveCount}`, pageWidth - 14, 57, { align: 'right' });

            // ── TABLE ────────────────────────────────────────────────────────
            const tableData = historyModalRecords.map((record, idx) => {
                const staff = record.staff;
                const name = staff ? `${staff.first_name || ''} ${staff.last_name || ''}`.trim() : '—';
                const role = staff?.role || '—';
                const date = record.date ? format(new Date(record.date), 'dd-MMM-yyyy') : '—';
                const checkIn = record.check_in ? format(new Date(record.check_in), 'hh:mm a') : '—';
                const checkOut = record.check_out ? format(new Date(record.check_out), 'hh:mm a') : '—';
                const status = record.status ? record.status.charAt(0) + record.status.slice(1).toLowerCase() : '—';
                const remarks = record.remarks || '';
                return [idx + 1, date, name, role, status, checkIn, checkOut, remarks];
            });

            autoTable(doc, {
                startY: 64,
                head: [['#', 'Date', 'Staff/Teacher Name', 'Role', 'Status', 'Check In', 'Check Out', 'Remarks']],
                body: tableData,
                styles: {
                    fontSize: 8,
                    cellPadding: 3,
                    font: 'helvetica',
                    textColor: [30, 30, 50],
                    lineColor: [220, 215, 255],
                    lineWidth: 0.2,
                },
                headStyles: {
                    fillColor: [109, 40, 217],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8.5,
                    halign: 'center',
                },
                alternateRowStyles: { fillColor: [248, 245, 255] },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 8 },
                    1: { cellWidth: 22 },
                    2: { cellWidth: 40 },
                    3: { halign: 'center', cellWidth: 20 },
                    4: { halign: 'center', cellWidth: 18 },
                    5: { halign: 'center', cellWidth: 18 },
                    6: { halign: 'center', cellWidth: 18 },
                    7: { cellWidth: 46 },
                },
                didDrawCell: (data) => {
                    if (data.column.index === 4 && data.section === 'body') {
                        const status = data.cell.raw;
                        if (status === 'Present') {
                            doc.setTextColor(22, 163, 74);
                        } else if (status === 'Absent') {
                            doc.setTextColor(220, 38, 38);
                        } else if (status === 'Late') {
                            doc.setTextColor(234, 179, 8);
                        } else if (status === 'Leave') {
                            doc.setTextColor(59, 130, 246);
                        } else {
                            doc.setTextColor(30, 30, 50);
                        }
                    }
                },
                margin: { left: 8, right: 8 },
                tableLineColor: [200, 185, 255],
                tableLineWidth: 0.3,
            });

            // ── FOOTER ───────────────────────────────────────────────────────
            const finalY = doc.lastAutoTable.finalY + 6;
            doc.setDrawColor(200, 185, 255);
            doc.line(8, finalY, pageWidth - 8, finalY);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(150, 130, 200);
            doc.text('Adamjee Coaching Center — Confidential Staff Attendance Record', pageWidth / 2, finalY + 5, { align: 'center' });

            // Page numbers
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(7);
                doc.setTextColor(170, 150, 220);
                doc.text(`Page ${i} of ${pageCount}`, pageWidth - 10, doc.internal.pageSize.getHeight() - 5, { align: 'right' });
            }

            const fileName = `staff_attendance_${historyModalFilters.fromDate || 'all'}_${roleLabel.toLowerCase()}_${statusLabel.toLowerCase()}.pdf`;
            doc.save(fileName);
            toast.success('PDF exported successfully!');
        } catch (err) {
            console.error('PDF export error:', err);
            toast.error('Failed to export PDF');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-800 overflow-hidden text-left">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-violet-600 to-indigo-600 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">Staff Attendance History</h2>
                            <p className="text-violet-200 text-xs mt-0.5">View past staff & teacher attendance records</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Filters Row */}
                <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-1.5 flex-1 min-w-[160px]">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">From Date</label>
                            <input
                                type="date"
                                value={historyModalFilters.fromDate}
                                onChange={(e) => setHistoryModalFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-255 dark:border-slate-700 dark:bg-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 dark:text-gray-105"
                            />
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-[160px]">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">To Date</label>
                            <input
                                type="date"
                                value={historyModalFilters.toDate}
                                onChange={(e) => setHistoryModalFilters(prev => ({ ...prev, toDate: e.target.value }))}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-255 dark:border-slate-700 dark:bg-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 dark:text-gray-105"
                            />
                        </div>
                        
                        <div className="space-y-1.5 flex-1 min-w-[120px]">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Role</label>
                            <select
                                value={historyModalFilters.role}
                                onChange={(e) => {
                                    const newFilters = { ...historyModalFilters, role: e.target.value };
                                    setHistoryModalFilters(newFilters);
                                    fetchHistoryModal(newFilters);
                                }}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-255 dark:border-slate-700 dark:bg-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-850 dark:text-gray-105"
                            >
                                <option value="">All Roles</option>
                                <option value="TEACHER">Teachers</option>
                                <option value="STAFF">Staff</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Status</label>
                            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                                {[
                                    { value: '', label: 'All', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>, activeClass: 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-600' },
                                    { value: 'PRESENT', label: 'Present', icon: <CheckCircle className="h-4 w-4" />, activeClass: 'bg-emerald-500 text-white shadow-sm shadow-emerald-200' },
                                    { value: 'ABSENT', label: 'Absent', icon: <XCircle className="h-4 w-4" />, activeClass: 'bg-red-500 text-white shadow-sm shadow-red-200' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            const newFilters = { ...historyModalFilters, status: opt.value };
                                            setHistoryModalFilters(newFilters);
                                            fetchHistoryModal(newFilters);
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            historyModalFilters.status === opt.value
                                                ? opt.activeClass
                                                : 'text-slate-450 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        {opt.icon}
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => fetchHistoryModal()}
                            disabled={historyModalLoading}
                            className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl px-6 py-2.5 gap-2 shadow-lg shadow-violet-200 dark:shadow-none flex items-center justify-center disabled:opacity-50 text-sm"
                        >
                            {historyModalLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            Fetch
                        </button>
                        <button
                            onClick={() => {
                                const today = format(new Date(), 'yyyy-MM-dd');
                                const todayFilters = { fromDate: today, toDate: today, status: '', role: '' };
                                setHistoryModalFilters(todayFilters);
                                fetchHistoryModal(todayFilters);
                            }}
                            className="border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-xl px-4 py-2 gap-2 flex items-center text-sm"
                        >
                            <Clock className="h-4 w-4" />
                            Today
                        </button>
                    </div>
                </div>

                {/* Records Table */}
                <div className="flex-1 overflow-y-auto">
                    {historyModalLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="h-12 w-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-slate-500 font-medium">Loading attendance records...</p>
                        </div>
                    ) : historyModalFetched && historyModalRecords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="p-5 bg-slate-100 dark:bg-slate-800 rounded-full">
                                <Calendar className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-550">No Records Found</h3>
                            <p className="text-sm text-slate-400">No attendance records found for the selected range.</p>
                        </div>
                    ) : !historyModalFetched ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-450 dark:text-slate-500">
                            <Calendar className="h-10 w-10" />
                            <p className="text-sm font-medium">Select dates and click &quot;Fetch&quot;</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 text-slate-650 dark:text-slate-350">
                                        <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">#</th>
                                        <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Date</th>
                                        <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Staff Member</th>
                                        <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Role</th>
                                        <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Check In</th>
                                        <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Check Out</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyModalRecords.map((record, idx) => {
                                        const staff = record.staff;
                                        const name = staff
                                            ? `${staff.first_name || ''} ${staff.last_name || ''}`.trim()
                                            : '—';
                                        const role = staff?.role || '—';
                                        
                                        const dateStr = record.date
                                            ? format(new Date(record.date), 'MMM dd, yyyy')
                                            : '—';
                                        const checkIn = record.check_in
                                            ? format(new Date(record.check_in), 'hh:mm a')
                                            : '—';
                                        const checkOut = record.check_out
                                            ? format(new Date(record.check_out), 'hh:mm a')
                                            : '—';

                                        const statusColors = {
                                            PRESENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                                            ABSENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                                            LATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                                            LEAVE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                                            HOLIDAY: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
                                            HALF_DAY: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                                        };
                                        const statusLabel = record.status
                                            ? record.status.charAt(0) + record.status.slice(1).toLowerCase().replace('_', ' ')
                                            : '—';

                                        return (
                                            <tr
                                                key={record.id || idx}
                                                className="border-b border-slate-50 dark:border-slate-800 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors"
                                            >
                                                <td className="px-6 py-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                        <span className="font-medium text-slate-700 dark:text-slate-200">{dateStr}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 text-xs font-bold shrink-0">
                                                            {name.charAt(0) || 'S'}
                                                        </div>
                                                        <span className="font-semibold text-slate-800 dark:text-slate-100">{name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                                                        {role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[record.status] || 'bg-gray-100 text-gray-650'}`}>
                                                        {statusLabel}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-slate-650 dark:text-slate-400 font-medium">{checkIn}</td>
                                                <td className="px-6 py-3 text-slate-650 dark:text-slate-400 font-medium">{checkOut}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0 flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">
                        {historyModalFetched
                            ? `${historyModalRecords.length} record${historyModalRecords.length !== 1 ? 's' : ''} found`
                            : 'Select date range to view records'}
                    </span>
                    <div className="flex items-center gap-3">
                        {historyModalRecords.length > 0 && (
                            <button
                                onClick={exportStaffAttendancePDF}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-2 shadow-md shadow-emerald-200 dark:shadow-none transition-all active:scale-95 flex items-center px-4 py-2 text-sm"
                            >
                                <Download className="h-4 w-4" />
                                Export PDF
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="font-bold border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl px-4 py-2 text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
