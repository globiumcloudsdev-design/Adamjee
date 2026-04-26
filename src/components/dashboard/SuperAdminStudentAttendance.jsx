'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Dropdown from '@/components/ui/dropdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { UserCheck, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

const SuperAdminStudentAttendance = ({ selectedBranch = 'all', branchPerformance = [] }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('current_month');
  const [selectedChartBranch, setSelectedChartBranch] = useState(selectedBranch);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setSelectedChartBranch(selectedBranch);
  }, [selectedBranch]);

  useEffect(() => {
    fetchStudentAttendance();
  }, [selectedChartBranch, selectedTimeRange]);

  const fetchStudentAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        branch: selectedChartBranch,
        timeRange: selectedTimeRange
      };

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.CHARTS.STUDENT_ATTENDANCE, { params });

      if (response.success && response.data && response.data.length > 0) {
        setData(response.data);
      } else {
        setData([]);
        setError('No attendance data available for the selected filters');
      }
    } catch (err) {
      console.error('Failed to fetch student attendance:', err);
      setData([]);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStudentAttendance();
  };

  const averageAttendance = data.length > 0
    ? (data.reduce((sum, item) => sum + (item.percentage || 0), 0) / data.length).toFixed(1)
    : 0;

  // Get selected branch name
  const selectedBranchName = selectedChartBranch === 'all'
    ? 'All Branches'
    : branchPerformance.find(branch => branch.id === selectedChartBranch)?.name || selectedChartBranch;

  // Get color based on attendance percentage
  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return '#10B981'; // Green - Excellent
    if (percentage >= 80) return '#3B82F6'; // Blue - Good
    if (percentage >= 70) return '#F59E0B'; // Yellow - Average
    return '#EF4444'; // Red - Needs attention
  };

  // Custom tooltip for better mobile experience
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const percentage = payload[0].value;
      const status = percentage >= 90 ? 'Excellent' : percentage >= 80 ? 'Good' : percentage >= 70 ? 'Average' : 'Needs Attention';
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white">Class: {label}</p>
          <p className="text-orange-600 dark:text-orange-400">
            Attendance: <span className="font-bold">{percentage}%</span>
          </p>
          <p className={`text-xs ${percentage >= 80 ? 'text-green-600' : percentage >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
            Status: {status}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className="p-1.5 sm:p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
            </div>
            Student Attendance Percentage
          </CardTitle>
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
            <Dropdown
              value={selectedChartBranch}
              onChange={(e) => setSelectedChartBranch(e.target.value)}
              options={[
                { value: 'all', label: 'All Branches' },
                ...branchPerformance.map(branch => ({
                  value: branch.id,
                  label: branch.name
                }))
              ]}
              placeholder="Select Branch"
              className="w-full xs:w-32 text-sm"
            />
            <Dropdown
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              options={[
                { value: 'current_week', label: 'Current Week' },
                { value: 'current_month', label: 'Current Month' },
                { value: 'last_month', label: 'Last Month' }
              ]}
              placeholder="Select Time Range"
              className="w-full xs:w-36 text-sm"
            />
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors self-end xs:self-auto"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground mt-2">
          Average Attendance: <span className={`font-semibold ${averageAttendance >= 80 ? 'text-green-600' : averageAttendance >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{averageAttendance}%</span>
          <span className="hidden sm:inline"> | </span>
          <span className="sm:hidden"> - </span>
          <span className="truncate">{selectedBranchName}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div className="h-48 sm:h-64 md:h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error && data.length === 0 ? (
          <div className="h-48 sm:h-64 md:h-80 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <UserCheck className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="class"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="percentage"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getAttendanceColor(entry.percentage)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default SuperAdminStudentAttendance;
