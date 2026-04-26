'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Dropdown from '@/components/ui/dropdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Receipt, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

const SuperAdminMonthlyFeeCollection = ({ selectedBranch = 'all', branchPerformance = [] }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('6months');
  const [selectedChartBranch, setSelectedChartBranch] = useState(selectedBranch);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setSelectedChartBranch(selectedBranch);
  }, [selectedBranch]);

  useEffect(() => {
    fetchMonthlyFeeCollection();
  }, [selectedChartBranch, selectedTimeRange]);

  const fetchMonthlyFeeCollection = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        branch: selectedChartBranch,
        timeRange: selectedTimeRange
      };

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.CHARTS.MONTHLY_FEE_COLLECTION, { params });

      if (response.success && response.data && response.data.length > 0) {
        setData(response.data);
      } else {
        setData([]);
        setError('No fee collection data available for the selected filters');
      }
    } catch (err) {
      console.error('Failed to fetch monthly fee collection:', err);
      setData([]);
      setError('Failed to load fee collection data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMonthlyFeeCollection();
  };

  const totalCollected = data.reduce((sum, item) => sum + (item.approvedAmount || 0), 0);
  const totalPending = data.reduce((sum, item) => sum + (item.pendingAmount || 0), 0);
  const averageMonthly = data.length > 0 ? (totalCollected / data.length).toFixed(0) : 0;
  const collectionRate = totalCollected + totalPending > 0 
    ? ((totalCollected / (totalCollected + totalPending)) * 100).toFixed(1) 
    : 0;

  // Get selected branch name
  const selectedBranchName = selectedChartBranch === 'all'
    ? 'All Branches'
    : branchPerformance.find(branch => branch.id === selectedChartBranch)?.name || selectedChartBranch;

  // Custom tooltip for better mobile experience
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((item, index) => (
            <p key={index} className={item.dataKey === 'approvedAmount' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
              {item.dataKey === 'approvedAmount' ? 'Collected' : 'Pending'}: 
              <span className="font-bold ml-1">PKR {item.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom legend for better readability
  const CustomLegend = ({ payload }) => (
    <div className="flex justify-center gap-4 mt-2 text-xs sm:text-sm">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1">
          <div 
            className="w-3 h-3 rounded-sm" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600 dark:text-gray-400">{entry.value}</span>
        </div>
      ))}
    </div>
  );

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className="p-1.5 sm:p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            Monthly Fee Collection
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
                { value: '1month', label: '1 Month' },
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
        <div className="text-xs sm:text-sm text-muted-foreground mt-2 flex flex-wrap gap-x-2 gap-y-1">
          <span>Collected: <span className="font-semibold text-green-600">PKR {totalCollected.toLocaleString()}</span></span>
          <span className="hidden sm:inline">|</span>
          <span>Pending: <span className="font-semibold text-yellow-600">PKR {totalPending.toLocaleString()}</span></span>
          <span className="hidden sm:inline">|</span>
          <span>Rate: <span className="font-semibold">{collectionRate}%</span></span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div className="h-48 sm:h-64 md:h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error && data.length === 0 ? (
          <div className="h-48 sm:h-64 md:h-80 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <Receipt className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
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
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              <Bar
                dataKey="approvedAmount"
                fill="#10b981"
                name="Collected"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="pendingAmount"
                fill="#f59e0b"
                name="Pending"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default SuperAdminMonthlyFeeCollection;
