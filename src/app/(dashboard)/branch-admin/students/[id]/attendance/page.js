'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Dropdown from '@/components/ui/dropdown';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, CheckCircle, XCircle, Clock, User, Edit, CalendarDays } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import FullPageLoader from '@/components/ui/full-page-loader';
import Modal from '@/components/ui/modal';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'excused', label: 'Excused' },
  { value: 'leave', label: 'Leave' }
];

export default function StudentAttendanceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const studentId = params.id;
  const returnPath = searchParams.get('return') || '/branch-admin/attendance';
  
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [editingRecord, setEditingRecord] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [updating, setUpdating] = useState(false);
  
  useEffect(() => {
    if (studentId) {
      fetchAttendanceHistory();
    }
  }, [studentId, pagination.page]);
  
  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.GET.replace(':id', studentId) + '/attendance', {
        params: { page: pagination.page, limit: pagination.limit }
      });
      
      if (response.success) {
        setStudent(response.data.student);
        setAttendance(response.data.attendance);
        setStats(response.data.stats);
        setPagination(response.data.pagination);
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
    setEditRemarks(record.remarks || '');
    setEditModalOpen(true);
  };
  
  const handleSaveStatus = async () => {
    try {
      setUpdating(true);
      await apiClient.put(API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.GET.replace(':id', studentId) + '/attendance', {
        attendanceId: editingRecord._id,
        status: editStatus,
        remarks: editRemarks
      });
      
      toast.success('Attendance status updated successfully');
      setEditModalOpen(false);
      fetchAttendanceHistory();
    } catch (error) {
      toast.error(error.message || 'Failed to update attendance');
    } finally {
      setUpdating(false);
    }
  };
  
  const getStatusBadge = (status) => {
    const badges = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800',
      half_day: 'bg-blue-100 text-blue-800',
      excused: 'bg-purple-100 text-purple-800',
      leave: 'bg-orange-100 text-orange-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'late':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'leave':
        return <CalendarDays className="w-4 h-4 text-orange-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };
  
  if (loading && !student) {
    return <FullPageLoader message="Loading attendance history..." />;
  }
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(returnPath)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Attendance
        </Button>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{student?.fullName || 'Student'}</CardTitle>
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  {student?.registrationNumber && (
                    <span>Reg: {student.registrationNumber}</span>
                  )}
                  {student?.rollNumber && (
                    <span>Roll: {student.rollNumber}</span>
                  )}
                  {student?.section && (
                    <span>Section: {student.section}</span>
                  )}
                  {student?.email && (
                    <span>Email: {student.email}</span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
      
      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total Days</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-green-600">Present</div>
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-red-600">Absent</div>
              <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-yellow-600">Late</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-purple-600">Excused</div>
              <div className="text-2xl font-bold text-purple-600">{stats.excused}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-orange-600">Leave</div>
              <div className="text-2xl font-bold text-orange-600">{stats.leave || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Percentage</div>
              <div className="text-2xl font-bold">{stats.percentage}%</div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Attendance History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject/Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Marked By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-gray-500">
                    No attendance records found
                  </TableCell>
                </TableRow>
              ) : (
                attendance.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        {new Date(record.date).toLocaleDateString('en-PK', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {record.attendanceType}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.branchId?.name || '—'}</TableCell>
                    <TableCell>{record.classId?.name || '—'}</TableCell>
                    <TableCell>
                      {record.attendanceType === 'subject' && record.subjectId?.name}
                      {record.attendanceType === 'event' && record.eventId?.title}
                      {record.attendanceType === 'daily' && '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        <Badge className={getStatusBadge(record.status)}>
                          {record.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.checkInTime
                        ? new Date(record.checkInTime).toLocaleTimeString('en-PK', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '—'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {record.remarks || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{record.markedBy?.fullName || '—'}</div>
                        <div className="text-xs text-gray-500">
                          {record.markedBy?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStatus(record)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Status Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Attendance Status"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStatus} disabled={updating}>
              {updating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <div className="text-sm text-gray-600">
              {editingRecord && new Date(editingRecord.date).toLocaleDateString('en-PK', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status *</label>
            <Dropdown
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              options={STATUS_OPTIONS}
              placeholder="Select status"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
