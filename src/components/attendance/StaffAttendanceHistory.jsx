'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, CheckCircle, XCircle, Clock, User, Edit, CalendarDays, Trash2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import FullPageLoader from '@/components/ui/full-page-loader';
import Modal from '@/components/ui/modal';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_CONFIG = {
    PRESENT: { label: 'Present', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    ABSENT: { label: 'Absent', color: 'bg-red-100 text-red-800', icon: XCircle },
    LATE: { label: 'Late', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    LEAVE: { label: 'Leave', color: 'bg-blue-100 text-blue-800', icon: CalendarDays },
    HALF_DAY: { label: 'Half Day', color: 'bg-purple-100 text-purple-800', icon: Clock },
    HOLIDAY: { label: 'Holiday', color: 'bg-gray-100 text-gray-800', icon: CalendarDays }
};

export default function StaffAttendanceHistory({ staffId, isBranchAdmin = false }) {
  const router = useRouter();
  const returnPath = isBranchAdmin ? '/branch-admin/staff-attendance' : '/super-admin/staff-attendance';
  
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [editingRecord, setEditingRecord] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  const [editStatus, setEditStatus] = useState('PRESENT');
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [updating, setUpdating] = useState(false);
  
  useEffect(() => {
    if (staffId) {
      fetchStaffProfile();
    }
  }, [staffId]);

  useEffect(() => {
    if (staffId) {
      fetchAttendanceHistory();
    }
  }, [staffId, pagination.page]);

  const fetchStaffProfile = async () => {
    try {
      const response = await apiClient.get(`/api/users/staff/${staffId}`);
      if (response.success) {
        setStaff(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch staff details', error);
    } finally {
      setLoading(false);
    }
  };


  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/staff-attendance', {
        staff_id: staffId,
        page: pagination.page,
        limit: pagination.limit
      });
      
      if (response.success) {
        setAttendance(response.data.attendances || []);
        if (response.data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.data.pagination.total || 0,
            pages: response.data.pagination.totalPages || 0
          }));
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditStatus = (record) => {
    setEditingRecord(record);
    setEditStatus(record.status);
    setEditCheckIn(record.check_in ? format(new Date(record.check_in), 'HH:mm') : '');
    setEditCheckOut(record.check_out ? format(new Date(record.check_out), 'HH:mm') : '');
    setEditRemarks(record.remarks || '');
    setEditModalOpen(true);
  };
  
  const handleSaveStatus = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      
      let payload = {
        status: editStatus,
        remarks: editRemarks
      };
      
      if (editCheckIn) {
        payload.check_in = new Date(`${editingRecord.date}T${editCheckIn}`).toISOString();
      }
      if (editCheckOut) {
        payload.check_out = new Date(`${editingRecord.date}T${editCheckOut}`).toISOString();
      }

      await apiClient.put(`/api/staff-attendance/${editingRecord.id}`, payload);

      toast.success('Attendance status updated successfully');
      setEditModalOpen(false);
      fetchAttendanceHistory();
    } catch (error) {
      toast.error(error.message || 'Failed to update attendance');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const response = await apiClient.delete(`/api/staff-attendance/${id}`);
      if (response.success) {
        toast.success('Attendance record deleted successfully');
        fetchAttendanceHistory();
      }
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };
  
  if (loading && !staff) {
    return <FullPageLoader message="Loading attendance history..." />;
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(returnPath)}
          className="flex items-center gap-2 border-gray-200 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Staff Attendance
        </Button>
      </div>

      {/* Profile Card */}
      <Card className="bg-white shadow-sm border border-gray-200 overflow-hidden rounded-xl">
        <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="h-20 w-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl shadow-inner ring-4 ring-blue-50">
            {staff?.first_name?.[0]}{staff?.last_name?.[0]}
          </div>
          <div className="flex-1 text-center md:text-left space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">{staff?.first_name} {staff?.last_name}</h2>
            <p className="text-gray-500 font-medium">{staff?.email}</p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50">{staff?.role}</Badge>
              {staff?.branch?.name && (
                <Badge variant="outline" className="border-gray-200">{staff.branch.name} Branch</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white shadow-md border-0 overflow-hidden rounded-xl">
        <CardHeader className="border-b border-gray-100 p-6">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Attendance History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {attendance.length === 0 ? (
            <div className="text-center py-12 text-gray-500 italic">
              No attendance records found for this staff member.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-6 py-4">Date</TableHead>
                    <TableHead className="px-6 py-4 text-center">Status</TableHead>
                    <TableHead className="px-6 py-4 text-center">Check-In</TableHead>
                    <TableHead className="px-6 py-4 text-center">Check-Out</TableHead>
                    <TableHead className="px-6 py-4 text-left">Remarks</TableHead>
                    <TableHead className="px-6 py-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 text-sm">
                  {attendance.map((record) => {
                    const config = STATUS_CONFIG[record.status] || STATUS_CONFIG.PRESENT;
                    const Icon = config.icon;

                    return (
                      <TableRow key={record.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="px-6 py-4 font-medium text-gray-900">
                          {format(new Date(record.date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {config.label}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center text-gray-500 font-medium">
                          {record.check_in ? format(new Date(record.check_in), 'hh:mm a') : '—'}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center text-gray-500 font-medium">
                          {record.check_out ? format(new Date(record.check_out), 'hh:mm a') : '—'}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-left text-gray-500 max-w-xs truncate">
                          {record.remarks || '—'}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditStatus(record)}
                              className="text-blue-600 hover:bg-blue-50 h-8 w-8"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRecord(record.id)}
                              className="text-red-600 hover:bg-red-50 h-8 w-8"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between p-6 border-t border-gray-100 text-sm">
              <span className="text-gray-500">
                Page {pagination.page} of {pagination.pages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editModalOpen && (
        <Modal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit Attendance Record"
          size="md"
        >
          <form onSubmit={handleSaveStatus} className="space-y-4 p-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                <select
                  required
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {Object.keys(STATUS_CONFIG).map(s => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                <input
                  type="text"
                  disabled
                  value={editingRecord?.date || ''}
                  className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl outline-none opacity-70"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Check-In</label>
                <input
                  type="time"
                  value={editCheckIn}
                  onChange={(e) => setEditCheckIn(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Check-Out</label>
                <input
                  type="time"
                  value={editCheckOut}
                  onChange={(e) => setEditCheckOut(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Remarks</label>
              <textarea
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updating}>
                {updating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
