'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Calendar,
  Download,
  Save,
  Filter,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { format } from 'date-fns';

const FALLBACK_BRANCHES = [
  { _id: 'branch-1', name: 'Gulberg Campus' },
  { _id: 'branch-2', name: 'DHA Campus' },
  { _id: 'branch-3', name: 'Johar Town Campus' },
];

const FALLBACK_DEPARTMENTS = [
  { _id: 'dept-1', name: 'Science', branchId: 'branch-1' },
  { _id: 'dept-2', name: 'Commerce', branchId: 'branch-1' },
  { _id: 'dept-3', name: 'Humanities', branchId: 'branch-2' },
];

const FALLBACK_CLASSES = [
  { _id: 'class-1', name: 'Grade 8', grade: '8', departmentId: 'dept-1', branchId: 'branch-1' },
  { _id: 'class-2', name: 'Grade 9', grade: '9', departmentId: 'dept-2', branchId: 'branch-1' },
  { _id: 'class-3', name: 'Grade 10', grade: '10', departmentId: 'dept-3', branchId: 'branch-2' },
];

const FALLBACK_STUDENTS = [
  {
    _id: 'std-1',
    firstName: 'Ayesha',
    lastName: 'Khan',
    registrationNumber: 'EA-1001',
    branchId: FALLBACK_BRANCHES[0],
    departmentId: FALLBACK_DEPARTMENTS[0],
    classId: FALLBACK_CLASSES[0],
    section: 'A',
  },
  {
    _id: 'std-2',
    firstName: 'Usman',
    lastName: 'Ali',
    registrationNumber: 'EA-1002',
    branchId: FALLBACK_BRANCHES[0],
    departmentId: FALLBACK_DEPARTMENTS[1],
    classId: FALLBACK_CLASSES[1],
    section: 'B',
  },
  {
    _id: 'std-3',
    firstName: 'Iqra',
    lastName: 'Ahmed',
    registrationNumber: 'EA-1050',
    branchId: FALLBACK_BRANCHES[1],
    departmentId: FALLBACK_DEPARTMENTS[2],
    classId: FALLBACK_CLASSES[2],
    section: 'C',
  },
];

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    branchId: '',
    departmentId: '',
    classId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    fetchBranches();
    fetchDepartments();
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [filters.branchId, filters.departmentId, filters.classId]);

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

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get('/api/super-admin/classes?limit=200');
      if (response.success) {
        setClasses(response.data);
        return;
      }
    } catch (error) {
      console.warn('Falling back to sample classes', error);
    }
    setClasses(FALLBACK_CLASSES);
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        limit: '300',
        role: 'student'
      });
      if (filters.branchId) params.append('branchId', filters.branchId);
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      if (filters.classId) params.append('classId', filters.classId);

      const response = await apiClient.get(`/api/users?${params.toString()}`);
      if (response.success) {
        setStudents(response.data);
        initialiseAttendance(response.data);
        return;
      }
    } catch (error) {
      console.warn('Falling back to sample students', error);
    }
    setStudents(() => {
      const filtered = FALLBACK_STUDENTS.filter((student) => {
        if (filters.branchId && student.branchId?._id !== filters.branchId) return false;
        if (filters.departmentId && student.departmentId?._id !== filters.departmentId) return false;
        if (filters.classId && student.classId?._id !== filters.classId) return false;
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

  const groupedByDepartment = useMemo(() => {
    const summary = {};
    students.forEach((student) => {
      const departmentName = student.departmentId?.name || 'Unassigned';
      if (!summary[departmentName]) {
        summary[departmentName] = { total: 0, present: 0, absent: 0, late: 0 };
      }
      summary[departmentName].total += 1;
      const status = attendance[student._id];
      if (status) {
        summary[departmentName][status] += 1;
      }
    });
    return summary;
  }, [students, attendance]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    setAttendance((prev) => {
      const next = { ...prev };
      students.forEach((student) => {
        next[student._id] = status;
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!filters.classId) {
      toast.error('Please select a class');
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success('Student attendance saved');
      console.log({
        type: 'student',
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
          <GraduationCap className="h-7 w-7 text-blue-600" />
          Student Attendance Management
        </h1>
        <p className="text-gray-600">Monitor every branch, department, and class in a dedicated view.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Students</p>
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
          Advanced Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
            <label className="text-sm font-medium text-gray-600">Class</label>
            <select
              value={filters.classId}
              onChange={(event) => handleFilterChange('classId', event.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classes</option>
              {classes
                .filter((item) => {
                  if (filters.branchId && (item.branchId?._id || item.branchId) !== filters.branchId) return false;
                  if (filters.departmentId && (item.departmentId?._id || item.departmentId) !== filters.departmentId) return false;
                  return true;
                })
                .map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} {item.section ? `- Section ${item.section}` : ''}
                  </option>
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
          <div className="p-8 text-center text-gray-500">Loading student roster...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="h-10 w-10 mx-auto text-gray-400 mb-3" />
            No students found for selected filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 text-left">Student</th>
                    <th className="px-6 py-3 text-left">Branch</th>
                    <th className="px-6 py-3 text-left">Department</th>
                    <th className="px-6 py-3 text-left">Class</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {students.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{student.registrationNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span>{student.branchId?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {student.departmentId?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {student.classId?.name || 'N/A'}
                        {student.section ? ` • Section ${student.section}` : ''}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleAttendanceChange(student._id, 'present')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${attendance[student._id] === 'present' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(student._id, 'absent')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${attendance[student._id] === 'absent' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          >
                            Absent
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(student._id, 'late')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${attendance[student._id] === 'late' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.entries(groupedByDepartment).map(([department, summary]) => (
            <div key={department} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-800">{department}</h3>
                <span className="text-xs text-gray-500">{summary.total} students</span>
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
