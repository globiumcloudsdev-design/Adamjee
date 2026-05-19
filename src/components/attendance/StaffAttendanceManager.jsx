'use client';

import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
    Briefcase, Calendar, Search, Filter, Save,
    CheckCircle, XCircle, Clock, AlertCircle,
    ChevronLeft, ChevronRight, Download, RefreshCw,
    Users, TrendingUp, UserCheck, Plus, Edit, Trash2, X
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import Tooltip from '@/components/ui/tooltip';
import StaffAttendanceHistoryModal from './StaffAttendanceHistoryModal';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const STATUS_CONFIG = {
    PRESENT: { label: 'Present', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
    ABSENT: { label: 'Absent', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    LATE: { label: 'Late', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
    LEAVE: { label: 'Leave', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: AlertCircle },
    HALF_DAY: { label: 'Half Day', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Clock },
    HOLIDAY: { label: 'Holiday', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Calendar }
};


export default function StaffAttendanceManager({ isBranchAdmin = false, defaultBranchId = null }) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [modalBranchId, setModalBranchId] = useState('');
    const [modalStaffList, setModalStaffList] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [reportSummary, setReportSummary] = useState(null);


    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
    const [holidayForm, setHolidayForm] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        reason: '',
        remarks: '',
        branch_id: defaultBranchId || ''
    });
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'

    const [currentRecord, setCurrentRecord] = useState({
        staff_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'PRESENT',
        check_in: '',
        check_out: '',
        remarks: ''
    });

    const [filters, setFilters] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        branchId: defaultBranchId || '',
        role: '',
        staffId: '',
        searchQuery: '',
    });

    // Standalone History Modal state
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);


    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        fetchStaffList();
    }, [filters.branchId]);

    useEffect(() => {
        if (defaultBranchId && !filters.branchId) {
            setFilters(f => ({ ...f, branchId: defaultBranchId }));
        }
    }, [defaultBranchId]);

    useEffect(() => {
        fetchAttendance();
    }, [filters.date, filters.branchId, filters.role, filters.staffId, filters.searchQuery]);

    useEffect(() => {
        const fetchModalStaff = async () => {
            if (!modalBranchId) {
                setModalStaffList([]);
                return;
            }
            try {
                const params = new URLSearchParams();
                params.append('branch_id', modalBranchId);
                const response = await apiClient.get(`/api/staff-attendance/staff-list?${params.toString()}`);
                if (response.success) {
                    setModalStaffList(response.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch modal staff list:', error);
            }
        };
        fetchModalStaff();
    }, [modalBranchId]);


    const fetchBranches = async () => {
        if (isBranchAdmin) return;
        try {
            const response = await apiClient.get('/api/super-admin/branches');
            if (response.success && response.data && Array.isArray(response.data.branches)) {
                setBranches(response.data.branches);
            } else if (response.success && Array.isArray(response.data)) {
                setBranches(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch branches:', error);
        }
    };

    const fetchStaffList = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.branchId) params.append('branch_id', filters.branchId);
            const response = await apiClient.get(`/api/staff-attendance/staff-list?${params.toString()}`);
            if (response.success) {
                setStaffList(response.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch staff list:', error);
        }
    };

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.staffId) {
                params.append('staff_id', filters.staffId);
            } else if (filters.searchQuery) {
                // Fetch full history without date constraint when searching generally
            } else {
                params.append('date_from', filters.date);
                params.append('date_to', filters.date);
            }
            // Fetch high maximum bound to fetch all history correctly
            params.append('limit', '1000');


            if (filters.branchId) params.append('branch_id', filters.branchId);
            if (filters.role) params.append('role', filters.role);

            const response = await apiClient.get(`/api/staff-attendance?${params.toString()}`);
            if (response.success) {
                setAttendanceRecords(response.data.attendances || []);
                // Update summary from the list
                const summary = {
                    total: response.data.attendances.length,
                    present: response.data.attendances.filter(a => a.status === 'PRESENT').length,
                    absent: response.data.attendances.filter(a => a.status === 'ABSENT').length,
                    late: response.data.attendances.filter(a => a.status === 'LATE').length,
                    leave: response.data.attendances.filter(a => a.status === 'LEAVE').length,
                };
                setReportSummary(summary);
            }
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
            toast.error('Failed to load attendance records');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setModalMode('add');
        setCurrentRecord({
            staff_id: '',
            date: filters.date,
            status: 'PRESENT',
            check_in: '',
            check_out: '',
            remarks: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (record) => {
        setModalMode('edit');
        setCurrentRecord({
            id: record.id,
            staff_id: record.staff_id,
            date: record.date,
            status: record.status,
            check_in: record.check_in ? format(new Date(record.check_in), 'HH:mm') : '',
            check_out: record.check_out ? format(new Date(record.check_out), 'HH:mm') : '',
            remarks: record.remarks || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        try {
            const response = await apiClient.delete(`/api/staff-attendance/${id}`);
            if (response.success) {
                toast.success('Record deleted successfully');
                fetchAttendance();
            }
        } catch (error) {
            toast.error('Failed to delete record');
        }
    };

    const handleModalSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Prepare dates for check-in/out
            const payload = { ...currentRecord };
            if (payload.check_in) {
                payload.check_in = new Date(`${payload.date}T${payload.check_in}`).toISOString();
            }
            if (payload.check_out) {
                payload.check_out = new Date(`${payload.date}T${payload.check_out}`).toISOString();
            }

            // Set branch_id if not present
            if (!payload.branch_id) {
                const staff = staffList.find(s => s.id === payload.staff_id);
                payload.branch_id = staff?.branch_id || filters.branchId;
            }

            let response;
            if (modalMode === 'add') {
                response = await apiClient.post('/api/staff-attendance', payload);
            } else {
                response = await apiClient.put(`/api/staff-attendance/${payload.id}`, payload);
            }

            if (response.success) {
                toast.success(modalMode === 'add' ? 'Attendance marked' : 'Attendance updated');
                setIsModalOpen(false);
                fetchAttendance();
            }
        } catch (error) {
            toast.error(error.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleHolidaySubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await apiClient.post('/api/staff-attendance/holiday', holidayForm);
            if (response.success) {
                toast.success(response.message || 'Holiday successfully marked');
                setIsHolidayModalOpen(false);
                setHolidayForm({
                    date: format(new Date(), 'yyyy-MM-dd'),
                    reason: '',
                    remarks: '',
                    branch_id: defaultBranchId || ''
                });
                fetchAttendance();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to mark holiday');
        } finally {
            setLoading(false);
        }
    };




    const filteredRecords = useMemo(() => {
        return attendanceRecords.filter(record => {
            const staffName = `${record.staff?.first_name} ${record.staff?.last_name}`.toLowerCase();
            const matchesSearch = staffName.includes(filters.searchQuery.toLowerCase()) ||
                record.staff?.email?.toLowerCase().includes(filters.searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [attendanceRecords, filters.searchQuery]);

    if (!mounted) return null;

    return (
        <div className="space-y-5">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border-blue-100 ring-1 ring-blue-50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Records</p>
                            <h3 className="text-2xl font-bold text-gray-900">{attendanceRecords.length}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-green-100 ring-1 ring-green-50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-xl text-green-600">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Present</p>
                            <h3 className="text-2xl font-bold text-gray-900">{reportSummary?.present || 0}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-red-100 ring-1 ring-red-50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-red-100 rounded-xl text-red-600">
                            <XCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Absent</p>
                            <h3 className="text-2xl font-bold text-gray-900">{reportSummary?.absent || 0}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-yellow-100 ring-1 ring-yellow-50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-xl text-yellow-600">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Late / Leave</p>
                            <h3 className="text-2xl font-bold text-gray-900">{(reportSummary?.late || 0) + (reportSummary?.leave || 0)}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Controls Bar ─────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">

                {/* ── Top Row: Filters ── */}
                <div className="flex flex-wrap items-end gap-3 px-5 pt-4 pb-4 border-b border-slate-100 dark:border-slate-800">

                    {/* Date */}
                    <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 pl-0.5">Date</span>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                            <input
                                type="date"
                                disabled={!!filters.staffId || !!filters.searchQuery}
                                value={filters.date}
                                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                                className="pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none w-40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            />
                        </div>
                    </div>

                    {/* Branch (super admin only) */}
                    {!isBranchAdmin && (
                        <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 pl-0.5">Branch</span>
                            <select
                                value={filters.branchId}
                                onChange={(e) => setFilters(prev => ({ ...prev, branchId: e.target.value }))}
                                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none min-w-[155px] cursor-pointer transition-all"
                            >
                                <option value="">All Branches</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Role */}
                    <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 pl-0.5">Role</span>
                        <select
                            value={filters.role}
                            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none min-w-[130px] cursor-pointer transition-all"
                        >
                            <option value="">All Roles</option>
                            <option value="TEACHER">Teachers</option>
                            <option value="STAFF">Staff</option>
                        </select>
                    </div>

                    {/* Staff member */}
                    <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 pl-0.5">Staff Member</span>
                        <select
                            value={filters.staffId}
                            onChange={(e) => setFilters(prev => ({ ...prev, staffId: e.target.value }))}
                            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none min-w-[200px] cursor-pointer transition-all"
                        >
                            <option value="">
                                {filters.branchId && staffList.length === 0
                                    ? `${branches.find(b => b.id === filters.branchId || b._id === filters.branchId)?.name || 'Branch'} — No Staff Found`
                                    : 'All Staff (Single Day)'}
                            </option>
                            {staffList.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.first_name} {s.last_name} ({s.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={fetchAttendance}
                        title="Refresh"
                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl transition-all active:scale-95"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* ── Bottom Row: Search + Actions ── */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-slate-50/60 dark:bg-slate-800/30">

                    {/* Search */}
                    <div className="relative flex-1 min-w-[220px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by name…"
                            value={filters.searchQuery}
                            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                            className="pl-9 pr-4 py-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={() => setIsHistoryModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-violet-500 dark:border-violet-600 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 font-bold rounded-xl transition-all active:scale-95 text-sm bg-white dark:bg-transparent"
                    >
                        <Calendar className="h-4 w-4" />
                        History
                    </button>

                    <button
                        onClick={() => setIsHolidayModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all active:scale-95 shadow-sm font-bold text-sm"
                    >
                        <Calendar className="h-4 w-4" />
                        Mark Holiday
                    </button>

                    <button
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all active:scale-95 shadow-sm font-bold text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Mark Attendance
                    </button>
                    </div>{/* end Action Buttons */}
                </div>{/* end Bottom Row */}
            </div>

            {/* ── Attendance Table ── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">

                {/* Table header bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Attendance Records</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'} found
                        </p>
                    </div>
                    {filters.searchQuery && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-xs font-bold rounded-full border border-violet-200 dark:border-violet-800">
                            <Search className="h-3 w-3" />
                            Filtering: &quot;{filters.searchQuery}&quot;
                        </span>
                    )}
                </div>

                <div className="overflow-x-auto min-h-[420px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[420px] gap-4">
                            <div className="relative">
                                <div className="h-12 w-12 rounded-full border-4 border-violet-100 dark:border-violet-900" />
                                <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
                            </div>
                            <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">Loading records…</p>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[420px] gap-3">
                            <div className="p-5 bg-slate-100 dark:bg-slate-800 rounded-full">
                                <Calendar className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                            </div>
                            <p className="text-base font-bold text-slate-500 dark:text-slate-400">No Records Found</p>
                            <p className="text-sm text-slate-400 dark:text-slate-500">No attendance records match your current filters.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700/60">
                                    <th className="px-6 py-3.5 text-left text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Staff Member</th>
                                    <th className="px-6 py-3.5 text-left text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Role</th>
                                    <th className="px-6 py-3.5 text-center text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Date</th>
                                    <th className="px-6 py-3.5 text-center text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Status</th>
                                    <th className="px-6 py-3.5 text-center text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Check-In</th>
                                    <th className="px-6 py-3.5 text-center text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Check-Out</th>
                                    <th className="px-6 py-3.5 text-right text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {filteredRecords.map((record, idx) => {
                                    const status = record.status;
                                    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PRESENT;
                                    const initials = `${record.staff?.first_name?.[0] || ''}${record.staff?.last_name?.[0] || ''}`;
                                    const avatarColors = [
                                        'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
                                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                                        'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
                                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                                    ];
                                    const avatarColor = avatarColors[idx % avatarColors.length];

                                    return (
                                        <tr key={record.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            {/* Staff Member */}
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${avatarColor}`}>
                                                        {initials || 'S'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p
                                                            className="font-bold text-slate-800 dark:text-slate-100 hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer transition-colors truncate"
                                                            onClick={() => router.push(`${isBranchAdmin ? '/branch-admin' : '/super-admin'}/staff/${record.staff_id || record.staff?.id}/attendance`)}
                                                        >
                                                            {record.staff?.first_name} {record.staff?.last_name}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{record.staff?.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role */}
                                            <td className="px-6 py-3.5">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                                                    {record.staff?.role}
                                                </span>
                                            </td>

                                            {/* Date */}
                                            <td className="px-6 py-3.5 text-center">
                                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                                    {format(new Date(record.date), 'MMM dd, yyyy')}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-3.5 text-center">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${config.color}`}>
                                                    {config.label}
                                                </span>
                                            </td>

                                            {/* Check-In */}
                                            <td className="px-6 py-3.5 text-center">
                                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 font-mono">
                                                    {record.check_in ? format(new Date(record.check_in), 'hh:mm a') : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                                </span>
                                            </td>

                                            {/* Check-Out */}
                                            <td className="px-6 py-3.5 text-center">
                                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 font-mono">
                                                    {record.check_out ? format(new Date(record.check_out), 'hh:mm a') : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-3.5 text-right">
                                                <div className="flex justify-end items-center gap-1.5">
                                                    <Tooltip content="Edit Attendance">
                                                        <button
                                                            onClick={() => handleOpenEditModal(record)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg transition-all"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                    </Tooltip>
                                                    <Tooltip content="Delete Record">
                                                        <button
                                                            onClick={() => handleDelete(record.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg transition-all"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </Tooltip>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Attendance Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden transform transition-all animate-in zoom-in-95">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">{modalMode === 'add' ? 'Mark Attendance' : 'Edit Attendance'}</h3>
                                <p className="text-blue-100 text-xs mt-1">Fill in the details for the staff member</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleModalSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">

                            {!isBranchAdmin && modalMode === 'add' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Branch *</label>
                                    <select
                                        required
                                        value={modalBranchId}
                                        onChange={(e) => setModalBranchId(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map(b => (
                                            <option key={b.id || b._id} value={b.id || b._id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Staff Member *</label>
                                <select
                                    required
                                    disabled={modalMode === 'edit'}
                                    value={currentRecord.staff_id}
                                    onChange={(e) => setCurrentRecord(prev => ({ ...prev, staff_id: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-70"
                                >
                                    <option value="">
                                        {!isBranchAdmin && modalMode === 'add' && !modalBranchId 
                                            ? "Select Branch First" 
                                            : (isBranchAdmin ? staffList : modalStaffList).length === 0
                                                ? "Employees Not Found" 
                                                : "Select Staff Member"}
                                    </option>
                                    {(isBranchAdmin ? staffList : modalStaffList).map(s => (
                                        <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.role})</option>
                                    ))}
                                </select>
                            </div>


                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={currentRecord.date}
                                        onChange={(e) => setCurrentRecord(prev => ({ ...prev, date: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Status</label>
                                    <select
                                        required
                                        value={currentRecord.status}
                                        onChange={(e) => setCurrentRecord(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {Object.keys(STATUS_CONFIG).map(s => (
                                            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Check-In Time</label>
                                    <input
                                        type="time"
                                        value={currentRecord.check_in}
                                        onChange={(e) => setCurrentRecord(prev => ({ ...prev, check_in: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Check-Out Time</label>
                                    <input
                                        type="time"
                                        value={currentRecord.check_out}
                                        onChange={(e) => setCurrentRecord(prev => ({ ...prev, check_out: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Remarks</label>
                                <textarea
                                    value={currentRecord.remarks}
                                    onChange={(e) => setCurrentRecord(prev => ({ ...prev, remarks: e.target.value }))}
                                    placeholder="Add any additional notes..."
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                                >
                                    {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                                    {modalMode === 'add' ? 'Mark Attendance' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Holiday Modal */}
            {isHolidayModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Mark As Holiday</h3>
                            <button 
                                onClick={() => setIsHolidayModalOpen(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleHolidaySubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={holidayForm.date}
                                    onChange={(e) => setHolidayForm(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800"
                                />
                            </div>

                            {!isBranchAdmin && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Branch (Optional)</label>
                                    <select
                                        value={holidayForm.branch_id}
                                        onChange={(e) => setHolidayForm(prev => ({ ...prev, branch_id: e.target.value }))}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800"
                                    >
                                        <option value="">All Branches</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Holiday Reason</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Eid, Independence Day"
                                    value={holidayForm.reason}
                                    onChange={(e) => setHolidayForm(prev => ({ ...prev, reason: e.target.value }))}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Additional Remarks</label>
                                <textarea
                                    placeholder="Remarks..."
                                    value={holidayForm.remarks}
                                    onChange={(e) => setHolidayForm(prev => ({ ...prev, remarks: e.target.value }))}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium resize-none h-20 text-gray-800"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsHolidayModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all font-bold shadow-md flex items-center justify-center gap-2"
                                >
                                    {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                                    Mark Holiday
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============ HISTORY MODAL ============ */}
            <StaffAttendanceHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                defaultBranchId={filters.branchId || defaultBranchId}
                isBranchAdmin={isBranchAdmin}
            />
        </div>
    );
}
