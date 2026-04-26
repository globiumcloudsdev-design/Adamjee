'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import ChartFilters from './ChartFilters';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

const FeesCollectedVsPending = () => {
  const [selectedFilter, setSelectedFilter] = useState('monthly');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



  // Memoized mock data generation
  const getMockData = useCallback(() => {
    const periods = selectedFilter === 'weekly' ? 12 : selectedFilter === 'yearly' ? 3 : 6;
    const mockData = [];

    for (let i = periods - 1; i >= 0; i--) {
      let label;
      if (selectedFilter === 'weekly') {
        label = `W${periods - i}`;
      } else if (selectedFilter === 'yearly') {
        label = `${new Date().getFullYear() - i}`;
      } else {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        const monthIndex = (currentMonth - i + 12) % 12;
        label = monthNames[monthIndex];
      }

      mockData.push({
        period: label,
        collected: Math.floor(Math.random() * 5000) + 2000,
        pending: Math.floor(Math.random() * 3000) + 1000
      });
    }
    return mockData;
  }, [selectedFilter]);

  // Memoized fetch function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`${API_ENDPOINTS.BRANCH_ADMIN.CHARTS.FEES_COLLECTED_PENDING}?filter=${selectedFilter}`);

      if (response.success && response.data !== null && response.data !== undefined && response.data.length > 0) {
        setData(response.data);
      } else {
        // Use mock data if API returns null, undefined, or empty data
        setData(getMockData());
      }
    } catch (err) {
      console.error('Fees collected vs pending fetch error:', err);
      setError('Failed to load data');
      setData(getMockData());
    } finally {
      setLoading(false);
    }
  }, [selectedFilter, getMockData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Fees Collected vs Pending</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Fees Collected vs Pending</h3>
        <div className="flex items-center justify-center h-64 text-red-500">
          <p>Failed to load data</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Fees Collected vs Pending</h3>
      <ChartFilters selectedFilter={selectedFilter} onFilterChange={setSelectedFilter} />
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="period"
            className="text-sm text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            className="text-sm text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value) => [`$${value}`, 'Amount']}
          />
          <Legend />
          <Bar
            dataKey="collected"
            stackId="fees"
            fill="#10b981"
            name="Collected"
          />
          <Bar
            dataKey="pending"
            stackId="fees"
            fill="#ef4444"
            name="Pending"
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default FeesCollectedVsPending;
