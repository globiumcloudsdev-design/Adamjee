'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card } from '@/components/ui/card';
import ChartFilters from './ChartFilters';

// Constants
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FILTER_CONFIGS = {
  weekly: { periods: 7, labelType: 'date' },
  monthly: { periods: 6, labelType: 'month' },
  yearly: { periods: 3, labelType: 'year' }
};

// Utility functions
const formatDateLabel = (date) => {
  const month = date.toLocaleString('default', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
};

const getPeriodKey = (date, filter) => {
  switch (filter) {
    case 'weekly':
      return formatDateLabel(date);
    case 'yearly':
      return date.getFullYear().toString();
    case 'monthly':
    default:
      return MONTH_NAMES[date.getMonth()];
  }
};


const generateLabels = (filter) => {
  const { periods, labelType } = FILTER_CONFIGS[filter];
  const labels = [];

  for (let i = periods - 1; i >= 0; i--) {
    let label;
    switch (labelType) {
      case 'date':
        const date = new Date();
        date.setDate(date.getDate() - i);
        label = formatDateLabel(date);
        break;
      case 'year':
        label = (new Date().getFullYear() - i).toString();
        break;
      case 'month':
      default:
        const monthIndex = (new Date().getMonth() - i + 12) % 12;
        label = MONTH_NAMES[monthIndex];
        break;
    }
    labels.push(label);
  }

  return labels;
};

const MonthlyFeeCollection = () => {
  const [selectedFilter, setSelectedFilter] = useState('monthly');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoized values
  const currentMonth = useMemo(() => new Date().toLocaleString('default', { month: 'short' }), []);
  const labels = useMemo(() => generateLabels(selectedFilter), [selectedFilter]);

  // Mock data generation
  const getMockData = useCallback(() => {
    return labels.map(label => ({
      period: label,
      collected: Math.floor(Math.random() * 5000) + 2000,
      pending: Math.floor(Math.random() * 3000) + 1000
    }));
  }, [labels]);

  // Data processing
  const processFeeData = useCallback((approvedPayments, pendingPayments) => {
    const dataMap = labels.reduce((acc, label) => {
      acc[label] = { period: label, collected: 0, pending: 0 };
      return acc;
    }, {});

    // Process approved payments
    approvedPayments.forEach(payment => {
      const date = new Date(payment.approvedAt || payment.paymentDate);
      const periodKey = getPeriodKey(date, selectedFilter);
      if (dataMap[periodKey]) {
        dataMap[periodKey].collected += payment.amount || 0;
      }
    });

    // Process pending payments
    pendingPayments.forEach(payment => {
      const date = new Date(payment.paymentDate);
      const periodKey = getPeriodKey(date, selectedFilter);
      if (dataMap[periodKey]) {
        dataMap[periodKey].pending += payment.amount || 0;
      }
    });

    return Object.values(dataMap);
  }, [labels, selectedFilter]);

  // API call - uses fee-vouchers endpoint instead of deprecated pending-fees
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch('/api/branch-admin/fee-vouchers?limit=1000', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        const vouchers = result.data?.vouchers || result.vouchers || [];
        // Separate paid and pending vouchers
        const paidVouchers = vouchers.filter(v => v.status === 'paid');
        const pendingVouchers = vouchers.filter(v => v.status === 'pending' || v.status === 'partial');
        const processedData = processFeeData(paidVouchers, pendingVouchers);
        setData(processedData);
      } else {
        setData(getMockData());
      }
    } catch (err) {
      console.error('Monthly fee collection fetch error:', err);
      setError('Failed to load data');
      setData(getMockData());
    } finally {
      setLoading(false);
    }
  }, [processFeeData, getMockData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Monthly Fee Collection</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Monthly Fee Collection</h3>
        <div className="flex items-center justify-center h-64 text-red-500">
          <p>Failed to load data</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Monthly Fee Collection</h3>
      <ChartFilters selectedFilter={selectedFilter} onFilterChange={setSelectedFilter} />
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
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
            formatter={(value) => [`$${value}`, 'Collection']}
          />
          <Legend />
          <ReferenceLine x={currentMonth} stroke="#f59e0b" strokeDasharray="5 5" />
          <Line
            type="monotone"
            dataKey="collected"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            name="Collected"
          />
          <Line
            type="monotone"
            dataKey="pending"
            stroke="#ef4444"
            strokeWidth={3}
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
            name="Pending"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default MonthlyFeeCollection;
