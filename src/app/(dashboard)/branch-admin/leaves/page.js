'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Dropdown from '@/components/ui/dropdown';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, UserPlus, Calendar } from 'lucide-react';
import ButtonLoader from '@/components/ui/button-loader';

export default function BranchAdminLeavesPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states for new leave
  const [userType, setUserType] = useState('student');
  const [formStudent, setFormStudent] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formReason, setFormReason] = useState('');

  useEffect(() => {
    if (user?.branch_id || user?.branchId) {
      fetchLeaves();
      fetchUsersByType(userType);
    }
  }, [user, userType]);

  useEffect(() => {
    filterLeavesData();
  }, [leaves, statusFilter]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/leave-requests');
      if (response.success) {
        setLeaves(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersByType = async (type) => {
    try {
      if (type === 'student') {
        const response = await apiClient.get('/api/users/students');
        setStudents(response.data?.students || response.data || response || []);
      } else {
        const response = await apiClient.get('/api/users/staff', { allStaff: 'true' });
        setStudents(response.data?.staff || response.data || response || []);
      }

    } catch (error) {
      toast.error(`Failed to load ${type}s`);
    }
  };


  const filterLeavesData = () => {
    let updated = [...leaves];
    if (statusFilter !== 'ALL') {
      updated = updated.filter(leave => leave.status === statusFilter);
    }
    setFilteredLeaves(updated);
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const response = await apiClient.patch(`/api/leave-requests/${id}`, { status: newStatus });
      if (response.success) {
        toast.success(`Leave request ${newStatus.toLowerCase()} successfully`);
        fetchLeaves();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleCreateLeave = async (e) => {
    e.preventDefault();
    if (!formStudent || !formStartDate || !formEndDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        student_id: formStudent,
        start_date: formStartDate,
        end_date: formEndDate,
        reason: formReason,
      };

      const response = await apiClient.post('/api/leave-requests', payload);
      if (response.success) {
        toast.success('Leave request submitted');
        setIsModalOpen(false);
        // Clear form
        setFormStudent('');
        setFormStartDate('');
        setFormEndDate('');
        setFormReason('');
        fetchLeaves();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Student Leave Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Manage leave requests and record bulk student leaves safely.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="shadow-md">
          <UserPlus className="h-4 w-4 mr-2" />
          Manual Mark Leave
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-1">
            <Label>Status</Label>
            <Dropdown
              name="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="shadow-md border-0 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center">
              <ButtonLoader />
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No leave requests found matching the filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                  <TableRow>
                    <TableHead>Name</TableHead>

                    <TableHead>Reg No.</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaves.map((leave) => (
                    <TableRow key={leave.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20">
                      <TableCell className="font-medium">
                        {leave.student ? `${leave.student.first_name} ${leave.student.last_name}` : 'Unknown Student'}
                      </TableCell>
                      <TableCell>{leave.student?.registration_no || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>{leave.start_date} to {leave.end_date}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{leave.reason || 'No reason provided'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(leave.status)}
                          {getStatusBadge(leave.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {leave.status === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                              onClick={() => handleStatusUpdate(leave.id, 'APPROVED')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              onClick={() => handleStatusUpdate(leave.id, 'REJECTED')}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Leave Request Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Manual Leave Registration"
        size="md"
      >
        <form onSubmit={handleCreateLeave} className="space-y-4 p-2">
          <div className="space-y-1">
            <Label>User Type *</Label>
            <Dropdown
              name="userType"
              value={userType}
              onChange={(e) => {
                setUserType(e.target.value);
                setFormStudent('');
              }}
              options={[
                { value: 'student', label: 'Student' },
                { value: 'staff', label: 'Staff (Teachers & Staff)' }
              ]}
              placeholder="Select User Type"
              required
            />
          </div>

          <div className="space-y-1">
            <Label>{userType === 'student' ? 'Student *' : 'Staff *'}</Label>

            <Dropdown
              name="formStudent"
              value={formStudent}
              onChange={(e) => setFormStudent(e.target.value)}
              options={students.length === 0 ? [{ value: '', label: `This Branch ${userType === 'student' ? 'Students' : 'Staff'} Not Found` }] : students.map(s => ({ value: s.id, label: `${s.first_name || s.fullName} ${s.last_name || ''} (${userType === 'student' ? s.registration_no || 'No Reg' : s.role || 'Staff'})` }))}
              placeholder={students.length === 0 ? `This Branch ${userType === 'student' ? 'Students' : 'Staff'} Not Found` : userType === 'student' ? 'Select Student' : 'Select Staff'}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>End Date *</Label>
              <Input
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Reason / Remarks</Label>
            <Input
              placeholder="Write leave reason..."
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <ButtonLoader /> : 'Register Leave'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
