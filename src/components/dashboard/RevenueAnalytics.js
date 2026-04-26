'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function RevenueAnalytics({ data }) {
  // 6-month revenue trend
  const revenueTrend = data?.revenueTrend || [
    { month: 'Jul', revenue: 45000, target: 50000 },
    { month: 'Aug', revenue: 52000, target: 50000 },
    { month: 'Sep', revenue: 48000, target: 55000 },
    { month: 'Oct', revenue: 61000, target: 60000 },
    { month: 'Nov', revenue: 55000, target: 60000 },
    { month: 'Dec', revenue: 67000, target: 65000 },
  ];

  // Branch-wise revenue
  const branchRevenue = data?.branchRevenue || [
    { branch: 'Main Campus', revenue: 125000 },
    { branch: 'North Branch', revenue: 98000 },
    { branch: 'South Branch', revenue: 87000 },
    { branch: 'East Branch', revenue: 76000 },
  ];

  // Fee collection vs outstanding
  const collectionData = data?.collectionData || [
    { name: 'Collected', value: 780000, percentage: 78 },
    { name: 'Outstanding', value: 220000, percentage: 22 },
  ];

  // Payment methods
  const paymentMethods = data?.paymentMethods || [
    { name: 'Online', value: 45 },
    { name: 'Cash', value: 30 },
    { name: 'Cheque', value: 15 },
    { name: 'Bank Transfer', value: 10 },
  ];

  return (
    <Card className="col-span-1 lg:col-span-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Revenue Analytics</CardTitle>
          <TrendingUp className="h-5 w-5 text-green-600" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Revenue Trend */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">6-Month Revenue Trend</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `₨${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Branch Revenue Comparison */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Branch-wise Revenue</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={branchRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="branch" />
              <YAxis />
              <Tooltip formatter={(value) => `₨${value.toLocaleString()}`} />
              <Bar dataKey="revenue" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Collection vs Outstanding */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Collection Status</h4>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={collectionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {collectionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₨${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Methods</h4>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="value"
                  label={(entry) => `${entry.value}%`}
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legend for Collection Status */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {collectionData.map((item, idx) => (
            <div key={idx} className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: COLORS[idx] }}
              />
              <span className="text-gray-600">{item.name}: {item.percentage}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
