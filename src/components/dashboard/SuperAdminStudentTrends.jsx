'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Dropdown from '@/components/ui/dropdown';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

const SuperAdminStudentTrends = ({ selectedBranch = 'all', branchPerformance = [] }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('6months');
  const [selectedChartBranch, setSelectedChartBranch] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStudentTrends();
  }, [selectedChartBranch, selectedTimeRange]);

  const fetchStudentTrends = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        branch: selectedChartBranch,
        timeRange: selectedTimeRange
      };

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.CHARTS.STUDENT_TRENDS, { params });

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setData([]);
        setError('No data available for the selected filters');
      }
    } catch (err) {
      console.error('Failed to fetch student trends:', err);
      setData([]);
      setError('Failed to load student trends data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStudentTrends();
  };

  const calculateGrowth = () => {
    if (data.length < 2) return 0;
    const first = data[0]?.students || 0;
    const last = data[data.length - 1]?.students || 0;
    return first > 0 ? ((last - first) / first * 100).toFixed(1) : 0;
  };

  const growth = calculateGrowth();

  // Custom tooltip for better mobile experience
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
          <p className="text-blue-600 dark:text-blue-400">
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
            <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </div>
            Student Trends by Branch
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
                { value: '3months', label: '3 Months' },
                { value: '6months', label: '6 Months' },
                { value: '1year', label: '1 Year' }
              ]}
              placeholder="Select Time Range"
              className="w-full xs:w-32 text-sm"
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
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-2">
          {growth >= 0 ? (
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
          )}
          <span className={`font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {growth >= 0 ? '+' : ''}{growth}% growth
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="truncate">{selectedChartBranch === 'all' ? 'All Branches' : `Branch: ${selectedChartBranch}`}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div className="h-48 sm:h-64 md:h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error && data.length === 0 ? (
          <div className="h-48 sm:h-64 md:h-80 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <TrendingUp className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="month"
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
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="students"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#3B82F6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default SuperAdminStudentTrends;
