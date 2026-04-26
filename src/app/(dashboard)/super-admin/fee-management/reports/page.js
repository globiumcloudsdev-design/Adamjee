'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApi } from '@/hooks/useApi';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { FileDown, Filter, Calendar, TrendingUp, Download } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('overview');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { execute } = useApi();

  const generateReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: reportType,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await execute({
        url: `${API_ENDPOINTS.SUPER_ADMIN.REPORTS}?${params.toString()}`,
      });

      if (response?.success) {
        setReportData(response.data);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format) => {
    alert(`Exporting report as ${format}...`);
    // Implement export logic here
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Reports & Analytics
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Generate comprehensive reports across all branches
          </p>
        </div>
        <div className="flex flex-col xs:flex-row gap-2 sm:gap-2">
          <Button 
            variant="outline" 
            onClick={() => exportReport('PDF')}
            size="sm"
            className="w-full xs:w-auto"
          >
            <FileDown className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Export PDF</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => exportReport('Excel')}
            size="sm"
            className="w-full xs:w-auto"
          >
            <FileDown className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Export Excel</span>
          </Button>
        </div>
      </div>

      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Report Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 text-sm sm:text-base"
              >
                <option value="overview">Overview Report</option>
                <option value="financial">Financial Report</option>
                <option value="branches">Branches Report</option>
                <option value="users">Users Report</option>
                <option value="events">Events Report</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm sm:text-base"
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={generateReport} 
                disabled={loading} 
                className="w-full"
                size="sm"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <>
          {/* Overview Stats */}
          {reportType === 'overview' && reportData.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Branches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{reportData.summary.totalBranches}</div>
                  <p className="text-xs text-green-600">{reportData.summary.activeBranches} active</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{reportData.summary.totalUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Spent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-red-600">
                    ${reportData.financial?.totalSpent?.toLocaleString() || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Financial Report Charts */}
          {reportType === 'financial' && reportData.expensesByCategory && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] sm:h-[300px] lg:h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.expensesByCategory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="_id" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" fill="#8884d8" name="Total Amount" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Trends */}
              {reportData.expensesByMonth && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Monthly Expense Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] sm:h-[300px] lg:h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={reportData.expensesByMonth}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="_id" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="total" stroke="#8884d8" name="Expenses" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Branches Report */}
          {reportType === 'branches' && reportData.branches && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Branches Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-2 sm:-mx-0">
                  <div className="min-w-[640px] sm:min-w-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b dark:border-gray-700">
                          <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-xs sm:text-sm">Branch Name</th>
                          <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-xs sm:text-sm">Code</th>
                          <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-xs sm:text-sm">Status</th>
                          <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-xs sm:text-sm">Total Users</th>
                          <th className="text-left py-2 px-2 sm:py-3 sm:px-4 font-medium text-xs sm:text-sm">Total Expenses</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.branches.map((branch) => (
                          <tr key={branch._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm">{branch.name}</td>
                            <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm">{branch.code}</td>
                            <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm">
                              <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                                branch.status === 'active'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              }`}>
                                {branch.status}
                              </span>
                            </td>
                            <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm">{branch.stats?.totalUsers || 0}</td>
                            <td className="py-2 px-2 sm:py-3 sm:px-4 text-xs sm:text-sm">
                              ${branch.stats?.totalExpenses?.toLocaleString() || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users Report */}
          {reportType === 'users' && reportData.usersByRole && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Users by Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    {reportData.usersByRole.map((role) => (
                      <div key={role._id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="font-medium text-sm sm:text-base capitalize">{role._id.replace('_', ' ')}</span>
                        <span className="text-lg sm:text-2xl font-bold">{role.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">User Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded">
                      <span className="font-medium text-sm sm:text-base">Active Users</span>
                      <span className="text-lg sm:text-2xl font-bold text-green-600">{reportData.activeUsers}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 rounded">
                      <span className="font-medium text-sm sm:text-base">Inactive Users</span>
                      <span className="text-lg sm:text-2xl font-bold text-red-600">{reportData.inactiveUsers}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <span className="font-medium text-sm sm:text-base">Total Users</span>
                      <span className="text-lg sm:text-2xl font-bold text-blue-600">{reportData.totalUsers}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!reportData && (
        <Card>
          <CardContent className="py-8 sm:py-12">
            <div className="text-center text-gray-500">
              <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-base sm:text-lg font-medium">No Report Generated</p>
              <p className="text-xs sm:text-sm mt-1">Select report type and date range, then click "Generate Report"</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}