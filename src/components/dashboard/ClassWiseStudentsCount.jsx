'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import ChartFilters from './ChartFilters';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

const ClassWiseStudentsCount = ({ data: externalData }) => {
  const [selectedFilter, setSelectedFilter] = useState('monthly');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Memoized mock data generation
  const getMockData = useCallback(() => {
    const classes = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'];
    return classes.map(className => ({
      class: className,
      count: Math.floor(Math.random() * 30) + 10
    }));
  }, []);

  useEffect(() => {
    if (externalData && externalData.length > 0) {
      setData(externalData.map(item => ({
        class: item.name || item.class,
        count: item.students || item.count
      })));
      setLoading(false);
    } else if (!externalData) {
      fetchData();
    }
  }, [externalData]);

  // Memoized fetch function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`${API_ENDPOINTS.BRANCH_ADMIN.CHARTS.CLASS_WISE_STUDENTS}?filter=${selectedFilter}`);

      // Check if response has valid data
      if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
        setData(response.data.map(item => ({
          class: item.name || item.class,
          count: item.students || item.count
        })));
      } else {
        setData(getMockData());
      }
    } catch (err) {
      console.error('Class-wise students fetch error:', err);
      setData(getMockData());
    } finally {
      setLoading(false);
    }
  }, [selectedFilter, getMockData]);

  useEffect(() => {
    if (!externalData) {
      fetchData();
    }
  }, [fetchData, externalData]);

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Class-wise Students Count</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Class-wise Students Count</h3>
        <div className="flex items-center justify-center h-64 text-red-500">
          <p>Failed to load data</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Class-wise Students Count</h3>
      <ChartFilters selectedFilter={selectedFilter} onFilterChange={setSelectedFilter} />
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="class"
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
          />
          <Legend />
          <Bar
            dataKey="count"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default ClassWiseStudentsCount;
