'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Calendar,
  Clock,
  UserCheck,
  UserX,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Users,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import Tabs, { TabPanel } from '@/components/ui/tabs';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ButtonLoader from '@/components/ui/button-loader';
import FullPageLoader from '@/components/ui/full-page-loader';
import { toast } from 'sonner';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Check if check-out is early
const isEarlyCheckOut = (checkOutTime, workEndTime = '17:00') => {
  const [endHour, endMin] = workEndTime.split(':').map(Number);
  const endThreshold = new Date(checkOutTime);
  endThreshold.setHours(endHour, endMin, 0, 0);
  return checkOutTime < endThreshold;
};

// Get checkout status for display
const getCheckOutStatus = (checkOutTime) => {
  if (!checkOutTime) return null;
  return isEarlyCheckOut(new Date(checkOutTime)) ? 'early' : 'on-time';
};

export default function SuperAdminEmployeeAttendancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Tabs
  const [activeTab, setActiveTab] = useState('list');
  
  // Filters
  const currentDate = new Date();
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Data
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Modal states
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    userId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    leaveType: '',
    leaveReason: '',
    remarks: '',
    checkInTime: '',
    checkOutTime: '',
  });

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setCurrentPage(1); // Reset to page 1 when filters change
      fetchAttendanceRecords();
      fetchStats();
    }
  }, [selectedBranch, selectedMonth, selectedYear, selectedStatus]);

  useEffect(() => {
    if (user) {
      fetchAttendanceRecords();
    }
  }, [currentPage, pageSize]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchBranches(), fetchUsers(), fetchStats()]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST);
      if (response.success) {
        setBranches(response.data.branches || []);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Failed to load branches');
    }
  };

  const fetchUsers = async () => {
    try {
      const params = {};
      if (selectedBranch !== 'all') {
        params.branchId = selectedBranch;
      }
      
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.USERS.LIST, params);
      if (response.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load employees');
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const params = {
        month: selectedMonth,
        year: selectedYear,
        page: currentPage,
        limit: pageSize,
      };

      if (selectedBranch !== 'all') {
        params.branchId = selectedBranch;
      }

      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.EMPLOYEE_ATTENDANCE.LIST, params);

      if (response.success) {
        setAttendanceRecords(response.data || []);
        setTotalRecords(response.pagination?.total || 0);
        setTotalPages(response.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = {
        month: selectedMonth,
        year: selectedYear,
      };

      if (selectedBranch !== 'all') {
        params.branchId = selectedBranch;
      }

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.EMPLOYEE_ATTENDANCE.SUMMARY, params);

      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleMarkAttendance = async () => {
    if (!formData.userId || !formData.date) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setProcessing(true);
      
      const attendanceData = {
        userId: formData.userId,
        date: formData.date,
        status: formData.status,
        remarks: formData.remarks,
      };

      if (formData.status === 'leave') {
        attendanceData.leaveType = formData.leaveType;
        attendanceData.leaveReason = formData.leaveReason;
      }

      if (formData.checkInTime) {
        attendanceData.checkInTime = formData.checkInTime;
      }

      if (formData.checkOutTime) {
        attendanceData.checkOutTime = formData.checkOutTime;
      }

      const response = await apiClient.post(
        API_ENDPOINTS.EMPLOYEE_ATTENDANCE.MARK,
        attendanceData
      );

      if (response.success) {
        toast.success('Attendance marked successfully');
        setShowMarkModal(false);
        fetchAttendanceRecords();
        fetchStats();
        resetForm();
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error(error.message || 'Failed to mark attendance');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditAttendance = async () => {
    if (!selectedRecord) return;

    try {
      setProcessing(true);
      
      const updateData = {
        status: formData.status,
        remarks: formData.remarks,
      };

      if (formData.status === 'leave') {
        updateData.leaveType = formData.leaveType;
        updateData.leaveReason = formData.leaveReason;
      }

      if (formData.checkInTime) {
        updateData.checkInTime = formData.checkInTime;
      }

      if (formData.checkOutTime) {
        updateData.checkOutTime = formData.checkOutTime;
      }

      const response = await apiClient.put(
        `${API_ENDPOINTS.EMPLOYEE_ATTENDANCE.UPDATE}/${selectedRecord._id}`,
        updateData
      );

      if (response.success) {
        toast.success('Attendance updated successfully');
        setShowEditModal(false);
        fetchAttendanceRecords();
        fetchStats();
        resetForm();
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error(error.message || 'Failed to update attendance');
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (record) => {
    setSelectedRecord(record);
    setFormData({
      userId: record.userId._id,
      date: new Date(record.date).toISOString().split('T')[0],
      status: record.status,
      leaveType: record.leaveType || '',
      leaveReason: record.leaveReason || '',
      remarks: record.remarks || '',
      checkInTime: record.checkIn?.time ? new Date(record.checkIn.time).toTimeString().slice(0, 5) : '',
      checkOutTime: record.checkOut?.time ? new Date(record.checkOut.time).toTimeString().slice(0, 5) : '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      leaveType: '',
      leaveReason: '',
      remarks: '',
      checkInTime: '',
      checkOutTime: '',
    });
    setSelectedRecord(null);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      present: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      absent: { color: 'bg-red-100 text-red-800', icon: XCircle },
      late: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'half-day': { color: 'bg-blue-100 text-blue-800', icon: Clock },
      leave: { color: 'bg-purple-100 text-purple-800', icon: Calendar },
      excused: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.present;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </Badge>
    );
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const searchLower = searchQuery.toLowerCase();
    return (
      record.userId?.firstName?.toLowerCase().includes(searchLower) ||
      record.userId?.lastName?.toLowerCase().includes(searchLower) ||
      record.userId?.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleExport = () => {
    toast.success('Export functionality will be implemented');
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded ${
            currentPage === i
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {pages}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Dropdown
          value={pageSize.toString()}
          onChange={(e) => {
            setPageSize(parseInt(e.target.value));
            setCurrentPage(1);
          }}
          options={[
            { value: '10', label: '10 per page' },
            { value: '25', label: '25 per page' },
            { value: '50', label: '50 per page' },
            { value: '100', label: '100 per page' },
          ]}
          className="w-40"
        />
      </div>
    );
  };

  if (loading && attendanceRecords.length === 0) {
    return <FullPageLoader message="Loading employee attendance..." />;
  }

  const tabs = [
    { id: 'list', label: 'Attendance List', icon: <Users className="h-5 w-5" />, badge: totalRecords },
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Employee Attendance Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track and manage employee attendance across all branches
            </p>
          </div>
          <Button onClick={() => setShowMarkModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Mark Attendance
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{stats.totalEmployees || 0}</p>
              <p className="text-sm text-gray-600">Total Employees</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{stats.presentCount || 0}</p>
              <p className="text-sm text-gray-600">Present</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-2xl font-bold">{stats.absentCount || 0}</p>
              <p className="text-sm text-gray-600">Absent</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold">{stats.lateCount || 0}</p>
              <p className="text-sm text-gray-600">Late</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">{stats.attendanceRate || 0}%</p>
              <p className="text-sm text-gray-600">Attendance Rate</p>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <TabPanel value="list" activeTab={activeTab}>
          {/* Filters */}
          <Card className="p-4 mb-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Dropdown
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                options={[
                  { value: 'all', label: 'All Branches' },
                  ...branches.map((branch) => ({
                    value: branch._id,
                    label: branch.name,
                  })),
                ]}
                className="w-48"
              />
              <Dropdown
                value={selectedMonth.toString()}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                options={monthNames.map((name, index) => ({
                  value: (index + 1).toString(),
                  label: name,
                }))}
                className="w-40"
              />
              <Dropdown
                value={selectedYear.toString()}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                options={[2024, 2025, 2026].map((year) => ({
                  value: year.toString(),
                  label: year.toString(),
                }))}
                className="w-32"
              />
              <Dropdown
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'present', label: 'Present' },
                  { value: 'absent', label: 'Absent' },
                  { value: 'late', label: 'Late' },
                  { value: 'half-day', label: 'Half Day' },
                  { value: 'leave', label: 'Leave' },
                ]}
                className="w-40"
              />
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </Card>

          {/* Table */}
          <Card className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Check-out Status</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Working Hours</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan="9" className="text-center py-8">
                        <ButtonLoader />
                      </TableCell>
                    </TableRow>
                  ) : filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan="9" className="text-center py-8 text-gray-500">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-300">
                              {record.userId?.firstName?.charAt(0)}{record.userId?.lastName?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">
                                {record.userId?.firstName} {record.userId?.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{record.userId?.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800">
                            {record.branchId?.name || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(record.date).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>
                          {record.checkIn?.time ? (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              {new Date(record.checkIn.time).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {record.checkOut?.time ? (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              {new Date(record.checkOut.time).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {record.workingHours ? `${record.workingHours.toFixed(2)} hrs` : '-'}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{record.remarks || '-'}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/super-admin/salary-management/employee-attendance/${record.userId._id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(record)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && renderPagination()}
          </Card>
        </TabPanel>

        <TabPanel value="overview" activeTab={activeTab}>
          <Card className="p-6">
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Overview Charts</h3>
              <p className="text-gray-600 mb-4">
                Detailed charts and analytics for all branches will be displayed here
              </p>
            </div>
          </Card>
        </TabPanel>
      </div>

      {/* Mark Attendance Modal */}
      <Modal
        isOpen={showMarkModal}
        onClose={() => {
          setShowMarkModal(false);
          resetForm();
        }}
        title="Mark Attendance"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Employee *</label>
            <Dropdown
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              options={[
                { value: '', label: 'Select Employee' },
                ...users.map((user) => ({
                  value: user._id,
                  label: `${user.firstName} ${user.lastName} (${user.branchId?.name || 'N/A'})`,
                })),
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date *</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status *</label>
            <Dropdown
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'present', label: 'Present' },
                { value: 'absent', label: 'Absent' },
                { value: 'late', label: 'Late' },
                { value: 'half-day', label: 'Half Day' },
                { value: 'leave', label: 'Leave' },
              ]}
            />
          </div>

          {formData.status === 'leave' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Leave Type</label>
                <Dropdown
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  options={[
                    { value: 'sick', label: 'Sick Leave' },
                    { value: 'casual', label: 'Casual Leave' },
                    { value: 'annual', label: 'Annual Leave' },
                    { value: 'unpaid', label: 'Unpaid Leave' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Leave Reason</label>
                <textarea
                  value={formData.leaveReason}
                  onChange={(e) => setFormData({ ...formData, leaveReason: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows="3"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Check-In Time</label>
              <Input
                type="time"
                value={formData.checkInTime}
                onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Check-Out Time</label>
              <Input
                type="time"
                value={formData.checkOutTime}
                onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              rows="3"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowMarkModal(false);
                resetForm();
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleMarkAttendance} disabled={processing}>
              {processing ? <ButtonLoader /> : 'Mark Attendance'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Attendance Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Edit Attendance"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <Input
              type="text"
              value={new Date(formData.date).toLocaleDateString()}
              disabled
              className="bg-gray-100 dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status *</label>
            <Dropdown
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'present', label: 'Present' },
                { value: 'absent', label: 'Absent' },
                { value: 'late', label: 'Late' },
                { value: 'half-day', label: 'Half Day' },
                { value: 'leave', label: 'Leave' },
              ]}
            />
          </div>

          {formData.status === 'leave' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Leave Type</label>
                <Dropdown
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  options={[
                    { value: 'sick', label: 'Sick Leave' },
                    { value: 'casual', label: 'Casual Leave' },
                    { value: 'annual', label: 'Annual Leave' },
                    { value: 'unpaid', label: 'Unpaid Leave' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Leave Reason</label>
                <textarea
                  value={formData.leaveReason}
                  onChange={(e) => setFormData({ ...formData, leaveReason: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows="3"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Check-In Time</label>
              <Input
                type="time"
                value={formData.checkInTime}
                onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Check-Out Time</label>
              <Input
                type="time"
                value={formData.checkOutTime}
                onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              rows="3"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleEditAttendance} disabled={processing}>
              {processing ? <ButtonLoader /> : 'Update Attendance'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
