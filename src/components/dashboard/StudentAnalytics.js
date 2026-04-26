'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, GraduationCap, TrendingUp, UserCheck } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function StudentAnalytics({ data }) {
  // Enrollment trend
  const enrollmentTrend = data?.enrollmentTrend || [
    { month: 'Jul', students: 1200, new: 50 },
    { month: 'Aug', students: 1235, new: 35 },
    { month: 'Sep', students: 1278, new: 43 },
    { month: 'Oct', students: 1305, new: 27 },
    { month: 'Nov', students: 1342, new: 37 },
    { month: 'Dec', students: 1389, new: 47 },
  ];

  // Branch-wise distribution
  const branchDistribution = data?.branchDistribution || [
    { branch: 'Main Campus', students: 450, percentage: 32 },
    { branch: 'North Branch', students: 378, percentage: 27 },
    { branch: 'South Branch', students: 312, percentage: 23 },
    { branch: 'East Branch', students: 249, percentage: 18 },
  ];

  // Grade-wise enrollment
  const gradeEnrollment = data?.gradeEnrollment || [
    { grade: 'Grade 1', students: 156 },
    { grade: 'Grade 2', students: 142 },
    { grade: 'Grade 3', students: 138 },
    { grade: 'Grade 4', students: 151 },
    { grade: 'Grade 5', students: 147 },
    { grade: 'Grade 6', students: 134 },
    { grade: 'Grade 7', students: 128 },
    { grade: 'Grade 8', students: 143 },
  ];

  // Attendance rate trend
  const attendanceTrend = data?.attendanceTrend || [
    { month: 'Jul', rate: 92 },
    { month: 'Aug', rate: 94 },
    { month: 'Sep', rate: 91 },
    { month: 'Oct', rate: 95 },
    { month: 'Nov', rate: 93 },
    { month: 'Dec', rate: 96 },
  ];

  const totalStudents = enrollmentTrend[enrollmentTrend.length - 1]?.students || 0;
  const newAdmissions = enrollmentTrend.reduce((sum, item) => sum + item.new, 0);
  const averageAttendance = attendanceTrend.reduce((sum, item) => sum + item.rate, 0) / attendanceTrend.length;

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              Student Analytics
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total Students: <span className="font-semibold text-blue-600">{totalStudents}</span>
              | New Admissions: <span className="font-semibold text-green-600">{newAdmissions}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">{averageAttendance.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">Avg Attendance</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Enrollment Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Enrollment Trend
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={enrollmentTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="studentsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="newGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="students"
                stackId="1"
                stroke="#3b82f6"
                fill="url(#studentsGradient)"
                name="Total Students"
              />
              <Area
                type="monotone"
                dataKey="new"
                stackId="2"
                stroke="#10b981"
                fill="url(#newGradient)"
                name="New Admissions"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Branch Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Branch-wise Distribution
          </h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={branchDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ branch, percentage }) => `${branch}: ${percentage}%`}
                outerRadius={80}
                dataKey="students"
              >
                {branchDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => [`${props.payload.percentage}% (${value} students)`, 'Distribution']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Grade-wise Enrollment */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-indigo-600" />
            Grade-wise Enrollment
          </h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={gradeEnrollment} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="grade"
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar
                dataKey="students"
                fill="url(#gradeGradient)"
                radius={[4, 4, 0, 0]}
              />
              <defs>
                <linearGradient id="gradeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Rate Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            Attendance Rate Trend
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={attendanceTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
                domain={[85, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Attendance Rate']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{totalStudents}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Students</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{newAdmissions}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">New Admissions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{gradeEnrollment.length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Grade Levels</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{branchDistribution.length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Branches</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
