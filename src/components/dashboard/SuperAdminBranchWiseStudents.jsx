'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

const SuperAdminBranchWiseStudents = ({ selectedBranch = 'all', branchPerformance = [] }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBranchWiseStudents();
  }, []);

  const fetchBranchWiseStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.CHARTS.BRANCH_WISE_STUDENTS);

      if (response.success && response.data && response.data.length > 0) {
        setData(response.data);
      } else {
        setData([]);
        setError('No branch data available');
      }
    } catch (err) {
      console.error('Failed to fetch branch-wise students:', err);
      setData([]);
      setError('Failed to load branch-wise students data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBranchWiseStudents();
  };

  const totalStudents = data.reduce((sum, item) => sum + (item.students || 0), 0);
  const totalBranches = data.length;

  // Custom tooltip for better mobile experience
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white">Branch: {label}</p>
          <p className="text-purple-600 dark:text-purple-400">
            Students: <span className="font-bold">{payload[0].value}</span>
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
            <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
            </div>
            Branch-wise Student Distribution
          </CardTitle>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors self-end sm:self-auto"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground mt-2">
          Total Students: <span className="font-semibold">{totalStudents}</span>
          <span className="hidden sm:inline"> | </span>
          <span className="sm:hidden"> - </span>
          <span>{totalBranches} Branches</span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div className="h-48 sm:h-64 md:h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error && data.length === 0 ? (
          <div className="h-48 sm:h-64 md:h-80 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <Building2 className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="branch"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="students"
                fill="#8B5CF6"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default SuperAdminBranchWiseStudents;
