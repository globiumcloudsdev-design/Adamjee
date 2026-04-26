'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Dropdown from '@/components/ui/dropdown';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Target, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

const SuperAdminPassFailRatio = ({ selectedBranch = 'all', branchPerformance = [] }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('current_academic_year');
  const [selectedChartBranch, setSelectedChartBranch] = useState(selectedBranch);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setSelectedChartBranch(selectedBranch);
  }, [selectedBranch]);

  useEffect(() => {
    fetchPassFailRatio();
  }, [selectedChartBranch, selectedTimeRange]);

  const fetchPassFailRatio = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        branch: selectedChartBranch,
        timeRange: selectedTimeRange
      };

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.CHARTS.PASS_FAIL_RATIO, { params });

      if (response.success && response.data && response.data.length > 0) {
        setData(response.data);
      } else {
        setData([]);
        setError('No pass/fail data available for the selected filters');
      }
    } catch (err) {
      console.error('Failed to fetch pass fail ratio:', err);
      setData([]);
      setError('Failed to load pass fail ratio data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPassFailRatio();
  };

  const totalStudents = data.reduce((sum, item) => sum + (item.value || 0), 0);
  const passRate = data.find(item => item.name === 'Pass')?.value || 0;
  const failRate = data.find(item => item.name === 'Fail')?.value || 0;

  // Get selected branch name
  const selectedBranchName = selectedChartBranch === 'all'
    ? 'All Branches'
    : branchPerformance.find(branch => branch.id === selectedChartBranch)?.name || selectedChartBranch;

  const COLORS = {
    Pass: '#10b981',
    Fail: '#ef4444'
  };

  // Custom tooltip for better mobile experience
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
          <p style={{ color: item.payload.color }}>
            Percentage: <span className="font-bold">{item.value}%</span>
          </p>
          <p className="text-gray-500 text-xs">
            Students: {Math.round((item.value / 100) * totalStudents)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs sm:text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom legend for better readability
  const CustomLegend = ({ payload }) => (
    <div className="flex justify-center gap-6 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <div className="text-sm">
            <span className="font-medium text-gray-900 dark:text-white">{entry.value}</span>
            <span className="text-gray-500 ml-1">
              ({entry.payload?.value || 0}%)
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className="p-1.5 sm:p-2 bg-pink-100 dark:bg-pink-900 rounded-full">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600 dark:text-pink-400" />
            </div>
            Pass vs Fail Ratio
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
                { value: 'current_semester', label: 'Current Semester' },
                { value: 'current_academic_year', label: 'Academic Year' },
                { value: 'last_academic_year', label: 'Last Year' }
              ]}
              placeholder="Select Time Range"
              className="w-full xs:w-40 text-sm"
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
        <div className="text-xs sm:text-sm text-muted-foreground mt-2 flex flex-wrap gap-x-2 gap-y-1">
          <span>Pass Rate: <span className="font-semibold text-green-600">{passRate}%</span></span>
          <span className="hidden sm:inline">|</span>
          <span>Fail Rate: <span className="font-semibold text-red-600">{failRate}%</span></span>
          <span className="hidden sm:inline">|</span>
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
            <Target className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius="80%"
                innerRadius="30%"
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || COLORS[entry.name] || COLORS[index % 2]}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default SuperAdminPassFailRatio;
