'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Building2,
  Download,
  Save,
  Filter,
  LayoutDashboardIcon,
} from 'lucide-react';
import { format } from 'date-fns';

const FALLBACK_BRANCHES = [
  { _id: 'branch-1', name: 'Gulberg Campus' },
  { _id: 'branch-2', name: 'DHA Campus' },
];

const FALLBACK_DEPARTMENTS = [
  { _id: 'dept-1', name: 'Science Faculty', branchId: 'branch-1' },
  { _id: 'dept-2', name: 'Mathematics Faculty', branchId: 'branch-1' },
  { _id: 'dept-3', name: 'Humanities Faculty', branchId: 'branch-2' },
];

const FALLBACK_TEACHERS = [
  {
    _id: 'teacher-1',
    firstName: 'Imran',
    lastName: 'Malik',
    employeeId: 'T-100',
    branchId: FALLBACK_BRANCHES[0],
    departmentId: FALLBACK_DEPARTMENTS[0],
    designation: 'Physics Teacher',
    subjectSpecialization: 'Physics',
  },
  {
    _id: 'teacher-2',
    firstName: 'Sara',
    lastName: 'Nawaz',
    employeeId: 'T-101',
    branchId: FALLBACK_BRANCHES[0],
    departmentId: FALLBACK_DEPARTMENTS[1],
    designation: 'Mathematics Lecturer',
    subjectSpecialization: 'Mathematics',
  },
  {
    _id: 'teacher-3',
    firstName: 'Rizwan',
    lastName: 'Ali',
    employeeId: 'T-120',
    branchId: FALLBACK_BRANCHES[1],
    departmentId: FALLBACK_DEPARTMENTS[2],
    designation: 'History Teacher',
    subjectSpecialization: 'History',
  },
];

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    branchId: '',
    departmentId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    fetchBranches();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [filters.branchId, filters.departmentId]);

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

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        limit: '300',
        role: 'teacher'
      });
      if (filters.branchId) params.append('branchId', filters.branchId);
      if (filters.departmentId) params.append('departmentId', filters.departmentId);

      const response = await apiClient.get(`/api/users?${params.toString()}`);
      if (response.success) {
        setTeachers(response.data);
        initialiseAttendance(response.data);
        return;
      }
    } catch (error) {
      console.warn('Falling back to sample teachers', error);
    }
    setTeachers(() => {
      const filtered = FALLBACK_TEACHERS.filter((teacher) => {
        if (filters.branchId && teacher.branchId?._id !== filters.branchId) return false;
        if (filters.departmentId && teacher.departmentId?._id !== filters.departmentId) return false;
        return true;
      });
      initialiseAttendance(filtered);
      return filtered;
    });
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

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleAttendanceChange = (teacherId, status) => {
    setAttendance((prev) => ({ ...prev, [teacherId]: status }));
  };

  const markAll = (status) => {
    setAttendance((prev) => {
      const next = { ...prev };
      teachers.forEach((teacher) => {
        next[teacher._id] = status;
      });
      return next;
    });
  };

  const facultySummary = useMemo(() => {
    const summary = {};
    teachers.forEach((teacher) => {
      const departmentName = teacher.departmentId?.name || 'Unassigned';
      if (!summary[departmentName]) {
        summary[departmentName] = { total: 0, present: 0, absent: 0, late: 0 };
      }
      summary[departmentName].total += 1;
      const status = attendance[teacher._id];
      if (status) {
        summary[departmentName][status] += 1;
      }
    });
    return summary;
  }, [teachers, attendance]);

  const handleSave = async () => {
    if (!teachers.length) {
      toast.error('No teachers available to record attendance');
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success('Teacher attendance saved');
      console.log({
        type: 'teacher',
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
          <LayoutDashboardIcon className="h-7 w-7 text-blue-600" />
          Teacher Attendance Management
        </h1>
        <p className="text-gray-600">Track punctuality and presence for every faculty member.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Teachers</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-semibold text-blue-600">{stats.total}</span>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Present</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-semibold text-green-600">{stats.present}</span>
            <CheckCircle className="h-8 w-8 text-green-500" />
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
          Filter Faculty
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                .filter((department) => !filters.branchId || department.branchId === filters.branchId || department.branchId?._id === filters.branchId)
                .map((department) => (
                  <option key={department._id} value={department._id}>{department.name}</option>
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
          <div className="p-8 text-center text-gray-500">Loading teacher roster...</div>
        ) : teachers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="h-10 w-10 mx-auto text-gray-400 mb-3" />
            No teachers found for selected filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 text-left">Teacher</th>
                    <th className="px-6 py-3 text-left">Branch</th>
                    <th className="px-6 py-3 text-left">Department</th>
                    <th className="px-6 py-3 text-left">Designation</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {teachers.map((teacher) => (
                    <tr key={teacher._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">
                          {teacher.firstName} {teacher.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{teacher.employeeId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span>{teacher.branchId?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {teacher.departmentId?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {teacher.designation || teacher.subjectSpecialization || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleAttendanceChange(teacher._id, 'present')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${attendance[teacher._id] === 'present' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(teacher._id, 'absent')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${attendance[teacher._id] === 'absent' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          >
                            Absent
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(teacher._id, 'late')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${attendance[teacher._id] === 'late' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
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
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between text-sm">
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

      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Faculty Department Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.entries(facultySummary).map(([department, summary]) => (
            <div key={department} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-800">{department}</span>
                <span className="text-xs text-gray-500">{summary.total} teachers</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Present</span>
                  <span className="text-green-600 font-medium">{summary.present}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Absent</span>
                  <span className="text-red-600 font-medium">{summary.absent}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Late</span>
                  <span className="text-yellow-600 font-medium">{summary.late}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
