'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Keyboard,
  Plus,
  Trash2,
  Download,
  Save,
  Users,
  Building2,
  ClipboardList,
} from 'lucide-react';

const DEFAULT_FORM = {
  attendanceType: 'student',
  entityName: '',
  identifier: '',
  branchId: '',
  department: '',
  className: '',
  status: 'present',
  remarks: '',
  date: format(new Date(), 'yyyy-MM-dd'),
};

const BRANCHES = [
  { id: 'branch-1', name: 'Gulberg Campus' },
  { id: 'branch-2', name: 'DHA Campus' },
  { id: 'branch-3', name: 'Johar Town Campus' },
];

const DEPARTMENTS = [
  { id: 'dept-1', name: 'Science' },
  { id: 'dept-2', name: 'Commerce' },
  { id: 'dept-3', name: 'Humanities' },
];

const CLASSES = [
  { id: 'class-8a', name: 'Grade 8 - Section A' },
  { id: 'class-9b', name: 'Grade 9 - Section B' },
  { id: 'class-10c', name: 'Grade 10 - Section C' },
];

export default function ManualAttendanceEntryPage() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [entries, setEntries] = useState([]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddEntry = () => {
    if (!form.entityName || !form.identifier) {
      toast.error('Please add the name and ID/registration no.');
      return;
    }

    const newEntry = {
      id: `${Date.now()}`,
      ...form,
    };
    setEntries((prev) => [newEntry, ...prev]);
    setForm((prev) => ({ ...DEFAULT_FORM, attendanceType: prev.attendanceType }));
    toast.success('Manual attendance entry added');
  };

  const handleRemoveEntry = (entryId) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  };

  const groupedCounts = useMemo(() => {
    const summary = { student: 0, teacher: 0, staff: 0 };
    entries.forEach((entry) => {
      summary[entry.attendanceType] += 1;
    });
    return summary;
  }, [entries]);

  const handleSave = async () => {
    if (!entries.length) {
      toast.error('Add at least one manual attendance entry');
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success('Manual attendance entries saved');
      console.log(entries);
    } catch (error) {
      toast.error('Unable to save manual entries');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Keyboard className="h-7 w-7 text-blue-600" />
          Manual Attendance Entry
        </h1>
        <p className="text-gray-600">Insert individual attendance records for late arrivals, corrections, or offline batches.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Students</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-semibold text-blue-600">{groupedCounts.student}</span>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Teachers</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-semibold text-green-600">{groupedCounts.teacher}</span>
            <ClipboardList className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Staff Members</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-semibold text-purple-600">{groupedCounts.staff}</span>
            <Building2 className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Plus className="h-4 w-4" />
          Add Manual Record
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600">Attendance Type</label>
            <select
              value={form.attendanceType}
              onChange={(event) => handleChange('attendanceType', event.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600">Full Name</label>
            <input
              value={form.entityName}
              onChange={(event) => handleChange('entityName', event.target.value)}
              placeholder="e.g. Ayesha Khan"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600">Registration / Employee ID</label>
            <input
              value={form.identifier}
              onChange={(event) => handleChange('identifier', event.target.value)}
              placeholder="EA-1007"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600">Branch</label>
            <select
              value={form.branchId}
              onChange={(event) => handleChange('branchId', event.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Branch</option>
              {BRANCHES.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600">Department</label>
            <select
              value={form.department}
              onChange={(event) => handleChange('department', event.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Optional</option>
              {DEPARTMENTS.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600">Class / Unit</label>
            <select
              value={form.className}
              onChange={(event) => handleChange('className', event.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Optional</option>
              {CLASSES.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600">Attendance Status</label>
            <select
              value={form.status}
              onChange={(event) => handleChange('status', event.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half-day">Half Day</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600">Attendance Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(event) => handleChange('date', event.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-3">
            <label className="text-sm font-medium text-gray-600">Remarks</label>
            <textarea
              value={form.remarks}
              onChange={(event) => handleChange('remarks', event.target.value)}
              rows={3}
              placeholder="Short note (optional)"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <button
          onClick={handleAddEntry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add To Batch
        </button>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {!entries.length ? (
          <div className="p-8 text-center text-gray-500">
            No manual entries yet. Use the form above to add records.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Identifier</th>
                    <th className="px-6 py-3 text-left">Type</th>
                    <th className="px-6 py-3 text-left">Branch</th>
                    <th className="px-6 py-3 text-left">Department/Class</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                        {entry.entityName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{entry.identifier}</td>
                      <td className="px-6 py-4 whitespace-nowrap capitalize">{entry.attendanceType}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {BRANCHES.find((branch) => branch.id === entry.branchId)?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {DEPARTMENTS.find((department) => department.id === entry.department)?.name || '—'}
                        {entry.className ? ` / ${CLASSES.find((item) => item.id === entry.className)?.name}` : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap capitalize">{entry.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(new Date(entry.date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleRemoveEntry(entry.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Remove entry"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between text-sm">
              <span className="text-gray-600">Total manual entries: {entries.length}</span>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Batch
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="h-5 w-5" />
                  Save Manual Entries
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
