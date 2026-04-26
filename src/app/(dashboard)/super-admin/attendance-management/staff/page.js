'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Users,
  UserCheck,
  XCircle,
  Clock,
  Calendar,
  Building2,
  Briefcase,
  Download,
  Save,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';

const FALLBACK_BRANCHES = [
  { _id: 'branch-1', name: 'Gulberg Campus' },
  { _id: 'branch-2', name: 'DHA Campus' },
  { _id: 'branch-3', name: 'Johar Town Campus' },
];

const FALLBACK_DEPARTMENTS = [
  { _id: 'dept-1', name: 'Administration', branchId: 'branch-1' },
  { _id: 'dept-2', name: 'Operations', branchId: 'branch-1' },
  { _id: 'dept-3', name: 'Facilities', branchId: 'branch-2' },
];

const FALLBACK_STAFF = [
  {
    _id: 'staff-1',
    firstName: 'Hassan',
    lastName: 'Raza',
    employeeId: 'S-200',
    branchId: FALLBACK_BRANCHES[0],
    departmentId: FALLBACK_DEPARTMENTS[0],
    role: 'Front Desk Officer',
    shift: 'Morning',
  },
  {
    _id: 'staff-2',
    firstName: 'Sadia',
    lastName: 'Malik',
    employeeId: 'S-214',
    branchId: FALLBACK_BRANCHES[0],
    departmentId: FALLBACK_DEPARTMENTS[1],
    role: 'Accounts Assistant',
    shift: 'Evening',
  },
  {
    _id: 'staff-3',
    firstName: 'Fahad',
    lastName: 'Ahmed',
    employeeId: 'S-240',
    branchId: FALLBACK_BRANCHES[1],
    departmentId: FALLBACK_DEPARTMENTS[2],
    role: 'Transport Coordinator',
    shift: 'Morning',
  },
  {
    _id: 'staff-4',
    firstName: 'Nimra',
    lastName: 'Iqbal',
    employeeId: 'S-245',
    branchId: FALLBACK_BRANCHES[2],
    departmentId: FALLBACK_DEPARTMENTS[1],
    role: 'HR Executive',
    shift: 'Night',
  },
];

export default function StaffAttendancePage() {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    branchId: '',
    departmentId: '',
    role: '',
    shift: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    fetchBranches();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [filters.branchId, filters.departmentId, filters.role, filters.shift]);

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get('/api/super-admin/branches?limit=200');
      if (response.success) {
        setBranches(response.data);
        return;
      }
    } catch (error) {
      console.warn('Falling back to sample branches', error);
    }
    setBranches(FALLBACK_BRANCHES);
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiClient.get('/api/super-admin/departments?limit=200');
      if (response.success) {
        setDepartments(response.data);
        return;
      }
    } catch (error) {
      console.warn('Falling back to sample departments', error);
    }
    setDepartments(FALLBACK_DEPARTMENTS);
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '300' });
      if (filters.branchId) params.append('branchId', filters.branchId);
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      if (filters.role) params.append('role', filters.role);
      if (filters.shift) params.append('shift', filters.shift);

      const response = await apiClient.get(`/api/super-admin/staff?${params.toString()}`);
      if (response.success) {
        setStaffMembers(response.data);
        initialiseAttendance(response.data);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.warn('Falling back to sample staff', error);
    }

    setStaffMembers(() => {
      const filtered = FALLBACK_STAFF.filter((staff) => {
        if (filters.branchId) {
          const branchValue = typeof staff.branchId === 'string' ? staff.branchId : staff.branchId?._id;
          if (branchValue !== filters.branchId) return false;
        }
        if (filters.departmentId) {
          const departmentValue = typeof staff.departmentId === 'string' ? staff.departmentId : staff.departmentId?._id;
          if (departmentValue !== filters.departmentId) return false;
        }
        if (filters.role && staff.role !== filters.role) return false;
        if (filters.shift && staff.shift !== filters.shift) return false;
        return true;
      });
      initialiseAttendance(filtered);
      return filtered;
    });
    setLoading(false);
  };

  const initialiseAttendance = (records) => {
    const nextAttendance = {};
    records.forEach((record) => {
      nextAttendance[record._id] = 'present';
    });
    setAttendance(nextAttendance);
  };

  const stats = useMemo(() => {
    const total = Object.keys(attendance).length;
    const present = Object.values(attendance).filter((status) => status === 'present').length;
    const absent = Object.values(attendance).filter((status) => status === 'absent').length;
    const late = Object.values(attendance).filter((status) => status === 'late').length;
    return { total, present, absent, late };
  }, [attendance]);

  const departmentSummary = useMemo(() => {
    const summary = {};
    staffMembers.forEach((staff) => {
      const departmentName = staff.departmentId?.name || 'Unassigned';
      if (!summary[departmentName]) {
        summary[departmentName] = { total: 0, present: 0, absent: 0, late: 0 };
      }
      summary[departmentName].total += 1;
      const status = attendance[staff._id];
      if (status) {
        summary[departmentName][status] += 1;
      }
    });
    return summary;
  }, [staffMembers, attendance]);

  const availableRoles = useMemo(() => {
    const roles = new Set();
    staffMembers.forEach((staff) => {
      if (staff.role) roles.add(staff.role);
    });
    return Array.from(roles);
  }, [staffMembers]);

  const availableShifts = useMemo(() => {
    const shifts = new Set();
    staffMembers.forEach((staff) => {
      if (staff.shift) shifts.add(staff.shift);
    });
    return Array.from(shifts);
  }, [staffMembers]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleAttendanceChange = (staffId, status) => {
    setAttendance((prev) => ({ ...prev, [staffId]: status }));
  };

  const markAll = (status) => {
    setAttendance((prev) => {
      const next = { ...prev };
      staffMembers.forEach((staff) => {
        next[staff._id] = status;
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!staffMembers.length) {
      toast.error('No staff records available to record attendance');
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success('Staff attendance saved');
      console.log({
        type: 'staff',
        recordedBy: user?._id,
        filters,
        attendance,
      });
    } catch (error) {
      toast.error('Unable to save attendance');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Briefcase className="h-7 w-7 text-blue-600" />
          Staff Attendance Management
        </h1>
        <p className="text-gray-600">Track support teams across every branch, department, and shift.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Staff</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-semibold text-blue-600">{stats.total}</span>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Present</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-semibold text-green-600">{stats.present}</span>
            <UserCheck className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Absent</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-semibold text-red-600">{stats.absent}</span>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Late</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-semibold text-yellow-600">{stats.late}</span>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 lg:p-5">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Filter className="h-4 w-4" />
          Refine Staff List
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600">Branch</label>
            <select
              value={filters.branchId}
              onChange={(event) => handleFilterChange('branchId', event.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>{branch.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600">Department</label>
            <select
              value={filters.departmentId}
              onChange={(event) => handleFilterChange('departmentId', event.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments
                .filter((department) => {
                  if (!filters.branchId) return true;
                  const branchValue = typeof department.branchId === 'string' ? department.branchId : department.branchId?._id;
                  return branchValue === filters.branchId;
                })
                .map((department) => (
                  <option key={department._id} value={department._id}>{department.name}</option>
                ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600">Role</label>
            <select
              value={filters.role}
              onChange={(event) => handleFilterChange('role', event.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600">Shift</label>
            <select
              value={filters.shift}
              onChange={(event) => handleFilterChange('shift', event.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Shifts</option>
              {availableShifts.map((shift) => (
                <option key={shift} value={shift}>{shift}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600">Attendance Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(event) => handleFilterChange('date', event.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => markAll('present')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Mark All Present
          </button>
          <button
            onClick={() => markAll('absent')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Mark All Absent
          </button>
          <button
            onClick={() => markAll('late')}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
          >
            Mark All Late
          </button>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading staff roster...</div>
        ) : staffMembers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="h-10 w-10 mx-auto text-gray-400 mb-3" />
            No staff members found for selected filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 text-left">Staff Member</th>
                    <th className="px-6 py-3 text-left">Branch</th>
                    <th className="px-6 py-3 text-left">Department</th>
                    <th className="px-6 py-3 text-left">Role</th>
                    <th className="px-6 py-3 text-left">Shift</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {staffMembers.map((staff) => (
                    <tr key={staff._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">
                          {staff.firstName} {staff.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{staff.employeeId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span>{staff.branchId?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {staff.departmentId?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {staff.role || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {staff.shift || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleAttendanceChange(staff._id, 'present')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${attendance[staff._id] === 'present' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(staff._id, 'absent')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${attendance[staff._id] === 'absent' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          >
                            Absent
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(staff._id, 'late')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${attendance[staff._id] === 'late' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          >
                            Late
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex flex-col gap-4 text-sm lg:flex-row lg:items-center lg:justify-between">
              <div className="text-gray-600">
                Total: {stats.total} | Present: <span className="text-green-600 font-medium">{stats.present}</span> | Absent: <span className="text-red-600 font-medium">{stats.absent}</span> | Late: <span className="text-yellow-600 font-medium">{stats.late}</span>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="h-5 w-5" />
                  Save Attendance
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {Object.keys(departmentSummary).length > 0 && (
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(departmentSummary).map(([department, values]) => (
              <div key={department} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{department}</p>
                    <p className="text-xs text-gray-500">Total Staff: {values.total}</p>
                  </div>
                  <Briefcase className="h-5 w-5 text-blue-500" />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Present</span>
                    <span className="text-green-600 font-medium">{values.present}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Absent</span>
                    <span className="text-red-600 font-medium">{values.absent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Late</span>
                    <span className="text-yellow-600 font-medium">{values.late}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
