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
import apiClient from '@/lib/api-client';
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const STATUS_CONFIG = {
    PRESENT: { label: 'Present', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
    ABSENT: { label: 'Absent', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    LATE: { label: 'Late', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
    LEAVE: { label: 'Leave', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: AlertCircle },
    HALF_DAY: { label: 'Half Day', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Clock }
};

export default function StaffAttendanceManager({ isBranchAdmin = false, defaultBranchId = null }) {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [reportSummary, setReportSummary] = useState(null);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
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
        searchQuery: '',
    });

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
    }, [filters.date, filters.branchId, filters.role]);

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
            const params = new URLSearchParams({
                date_from: filters.date,
                date_to: filters.date,
            });
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
        <div className="space-y-6">
            {/* Stats Header */}
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

            {/* Controls */}
            <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm items-start lg:items-center justify-between">
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                            className="pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-44"
                        />
                    </div>

                    {!isBranchAdmin && (
                        <select
                            value={filters.branchId}
                            onChange={(e) => setFilters(prev => ({ ...prev, branchId: e.target.value }))}
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[150px]"
                        >
                            <option value="">All Branches</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    )}

                    <select
                        value={filters.role}
                        onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">All Roles</option>
                        <option value="TEACHER">Teachers</option>
                        <option value="STAFF">Staff</option>
                    </select>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={filters.searchQuery}
                            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                            className="pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleOpenAddModal}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md font-bold text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Mark Attendance
                    </button>
                    <button
                        onClick={fetchAttendance}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all shadow-sm"
                    >
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[400px] gap-3">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
                            <p className="text-gray-500 font-medium">Loading attendance data...</p>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] text-gray-500 italic">
                            <Calendar className="h-12 w-12 text-gray-300 mb-2" />
                            No attendance records found for this date.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 uppercase tracking-wider text-[11px] font-bold text-gray-500">
                                <tr>
                                    <th className="px-6 py-4 text-left">Staff Member</th>
                                    <th className="px-6 py-4 text-left">Role</th>
                                    <th className="px-6 py-4 text-center">Date</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Check-In</th>
                                    <th className="px-6 py-4 text-center">Check-Out</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRecords.map(record => {
                                    const status = record.status;
                                    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PRESENT;

                                    return (
                                        <tr key={record.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                                        {record.staff?.first_name?.[0]}{record.staff?.last_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{record.staff?.first_name} {record.staff?.last_name}</p>
                                                        <p className="text-[10px] text-gray-500">{record.staff?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                                    {record.staff?.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-medium text-gray-600">
                                                {format(new Date(record.date), 'MMM dd, yyyy')}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${config.color}`}>
                                                    {config.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-500 font-medium">
                                                {record.check_in ? format(new Date(record.check_in), 'hh:mm a') : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-500 font-medium">
                                                {record.check_out ? format(new Date(record.check_out), 'hh:mm a') : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleOpenEditModal(record)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(record.id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
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
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">{modalMode === 'add' ? 'Mark Attendance' : 'Edit Attendance'}</h3>
                                <p className="text-blue-100 text-xs mt-1">Fill in the details for the staff member</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Staff Member</label>
                                <select
                                    required
                                    disabled={modalMode === 'edit'}
                                    value={currentRecord.staff_id}
                                    onChange={(e) => setCurrentRecord(prev => ({ ...prev, staff_id: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-70"
                                >
                                    <option value="">Select Staff Member</option>
                                    {staffList.map(s => (
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
        </div>
    );
}
