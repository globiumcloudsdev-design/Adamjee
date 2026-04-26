'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { BookOpen, Download, Filter, Users, TrendingUp, Award, AlertCircle } from 'lucide-react';

export default function AcademicReportsPage() {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const [stats, setStats] = useState({
    totalStudents: 0,
    avgAttendance: 0,
    passPercentage: 0,
    topPerformers: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [branchRes, classRes, studentRes] = await Promise.all([
        apiClient.get('/api/super-admin/branches?limit=100'),
        apiClient.get('/api/super-admin/classes?limit=100'),
        apiClient.get('/api/users?role=student&limit=100'),
      ]);

      if (branchRes.success) setBranches(branchRes.data);
      if (classRes.success) setClasses(classRes.data);
      if (studentRes.success) {
        setStats({
          totalStudents: studentRes.data.length,
          avgAttendance: 92,
          passPercentage: 85,
          topPerformers: Math.floor(studentRes.data.length * 0.15),
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="h-7 w-7" />
          Academic Reports
        </h1>
        <p className="text-gray-600 mt-1">Student performance and academic analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Attendance</p>
              <p className="text-2xl font-bold text-green-600">{stats.avgAttendance}%</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pass Rate</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.passPercentage}%</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <Award className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Top Performers</p>
              <p className="text-2xl font-bold text-purple-600">{stats.topPerformers}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Branches</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>{branch.name}</option>
            ))}
          </select>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>{cls.name}</option>
            ))}
          </select>

          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Generate Report
          </button>

          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Grade Distribution</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-20 text-sm text-gray-600">A+ Grade</div>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div className="bg-green-500 h-4 rounded-full" style={{width: '25%'}}></div>
                </div>
                <div className="w-12 text-sm text-gray-900">25%</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 text-sm text-gray-600">A Grade</div>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div className="bg-blue-500 h-4 rounded-full" style={{width: '35%'}}></div>
                </div>
                <div className="w-12 text-sm text-gray-900">35%</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 text-sm text-gray-600">B Grade</div>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div className="bg-yellow-500 h-4 rounded-full" style={{width: '25%'}}></div>
                </div>
                <div className="w-12 text-sm text-gray-900">25%</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 text-sm text-gray-600">C Grade</div>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div className="bg-orange-500 h-4 rounded-full" style={{width: '10%'}}></div>
                </div>
                <div className="w-12 text-sm text-gray-900">10%</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 text-sm text-gray-600">Fail</div>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div className="bg-red-500 h-4 rounded-full" style={{width: '5%'}}></div>
                </div>
                <div className="w-12 text-sm text-gray-900">5%</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Subject Performance</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Mathematics</span>
                <span className="font-semibold text-blue-600">88%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">English</span>
                <span className="font-semibold text-blue-600">92%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Science</span>
                <span className="font-semibold text-blue-600">85%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Social Studies</span>
                <span className="font-semibold text-blue-600">90%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
