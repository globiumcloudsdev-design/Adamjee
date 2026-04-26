'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { School, Save, Calendar, BookOpen } from 'lucide-react';

export default function AcademicSettingsPage() {
  const [settings, setSettings] = useState({
    academicYear: '2024-2025',
    termSystem: 'semester',
    gradingSystem: 'percentage',
    passingMarks: '40',
    maxMarks: '100',
    attendanceRequired: '75',
  });

  const handleSave = () => {
    toast.success('Academic settings saved successfully');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <School className="h-7 w-7" />
          Academic Settings
        </h1>
        <p className="text-gray-600 mt-1">Configure academic year and grading system</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Year Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Academic Year</label>
                <input
                  type="text"
                  value={settings.academicYear}
                  onChange={(e) => setSettings({...settings, academicYear: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term System</label>
                <select
                  value={settings.termSystem}
                  onChange={(e) => setSettings({...settings, termSystem: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="semester">Semester (2 per year)</option>
                  <option value="trimester">Trimester (3 per year)</option>
                  <option value="quarter">Quarter (4 per year)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Grading System</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grading System</label>
                <select
                  value={settings.gradingSystem}
                  onChange={(e) => setSettings({...settings, gradingSystem: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percentage">Percentage (0-100)</option>
                  <option value="gpa">GPA (0-4.0)</option>
                  <option value="letter">Letter Grade (A-F)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passing Marks (%)</label>
                <input
                  type="number"
                  value={settings.passingMarks}
                  onChange={(e) => setSettings({...settings, passingMarks: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Marks</label>
                <input
                  type="number"
                  value={settings.maxMarks}
                  onChange={(e) => setSettings({...settings, maxMarks: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Attendance Required (%)</label>
                <input
                  type="number"
                  value={settings.attendanceRequired}
                  onChange={(e) => setSettings({...settings, attendanceRequired: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Students must maintain this attendance to appear in exams</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="h-5 w-5" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
