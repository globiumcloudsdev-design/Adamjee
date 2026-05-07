'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { 
  FileDown, 
  Filter, 
  Calendar, 
  TrendingUp, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  DollarSign, 
  PieChart, 
  Activity,
  Download,
  Search,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Pie,
  Cell
} from 'recharts';
import { toast } from 'sonner';
import DatePicker from '@/components/ui/date-picker';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import useAuth from '@/hooks/useAuth';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function FinanceReportsPage() {
  const [reportType, setReportType] = useState('daily'); // daily, weekly, monthly, custom
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    fetchReport();
  }, [reportType, startDate, endDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {
        type: reportType,
        ...(reportType === 'custom' && { startDate, endDate })
      };
      
      const res = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.REPORTS.FINANCIAL, params);
      
      if (res.success) {
        setReportData(res.data);
      } else {
        toast.error(res.message || 'Failed to fetch real-time data');
      }
    } catch (error) {
      console.error('Report error:', error);
      toast.error('Connection error while fetching reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSettlement = () => {
    if (!reportData || !reportData.recentSettlements.length) {
      toast.error('No transactions to download');
      return;
    }

    const doc = new jsPDF();
    const branchName = user?.branch?.name || 'Branch';

    console.log("User Data",user);
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('Adamjee Coaching Center', 105, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`${branchName} - Financial Settlement Report`, 105, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: 'center' });
    
    // Summary
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 38, 190, 38);
    
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(`Period: ${reportType.toUpperCase()}`, 20, 48);
    doc.text(`Total Revenue: Rs. ${reportData.summary.totalRevenue.toLocaleString()}`, 20, 55);
    doc.text(`Total Expenses: Rs. ${reportData.summary.totalExpenses.toLocaleString()}`, 120, 55);
    doc.text(`Net Profit/Loss: Rs. ${reportData.summary.netProfit.toLocaleString()}`, 20, 62);
    
    // Table
    const tableData = reportData.recentSettlements.map(item => [
      item.date,
      item.description,
      item.type.charAt(0).toUpperCase() + item.type.slice(1),
      item.method,
      `${item.type === 'revenue' ? '+' : '-'} Rs. ${item.amount.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Date', 'Description', 'Type', 'Method', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 9 },
      columnStyles: {
        4: { halign: 'right', fontStyle: 'bold' }
      }
    });

    doc.save(`Financial_Settlement_${branchName}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Report downloaded successfully');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Finance Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track your branch's financial health and performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => exportReport('Excel')}>
            <Download className="w-4 h-4 mr-2" /> Excel
          </Button>
          <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 rounded-xl" onClick={() => exportReport('PDF')}>
            <FileDown className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-visible z-50">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-end gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Report Period
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 h-[42px]">
                {['daily', 'weekly', 'monthly', 'custom'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setReportType(t)}
                    className={`px-4 text-xs font-bold rounded-lg transition-all ${
                      reportType === t 
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {reportType === 'custom' && (
              <div className="flex items-end gap-4 animate-in slide-in-from-left duration-300">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
                  <DatePicker 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="From Date"
                    disableFuture={false}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Date</label>
                  <DatePicker 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="To Date"
                    disableFuture={false}
                  />
                </div>
              </div>
            )}

            <div className="flex items-end ml-auto">
              <Button onClick={fetchReport} disabled={loading} variant="secondary" className="rounded-xl h-[42px]">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Refresh Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              title="Total Revenue" 
              value={`Rs. ${reportData.summary.totalRevenue.toLocaleString()}`}
              trend={`+${reportData.summary.revenueGrowth}%`}
              icon={<ArrowUpCircle className="text-emerald-500" />}
              description="Fees and other collections"
            />
            <MetricCard 
              title="Total Expenses" 
              value={`Rs. ${reportData.summary.totalExpenses.toLocaleString()}`}
              trend={`${reportData.summary.expenseChange}%`}
              icon={<ArrowDownCircle className="text-rose-500" />}
              description="Operational costs"
            />
            <MetricCard 
              title="Net Profit" 
              value={`Rs. ${reportData.summary.netProfit.toLocaleString()}`}
              trend="Stable"
              icon={<TrendingUp className="text-blue-500" />}
              description="Revenue minus Expenses"
            />
            <MetricCard 
              title="Pending Fees" 
              value={`Rs. ${reportData.summary.pendingFees.toLocaleString()}`}
              icon={<Activity className="text-amber-500" />}
              description="Unpaid student vouchers"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
                <CardDescription>Comparison trend for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData.trends}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} name="Revenue" />
                      <Area type="monotone" dataKey="expense" stroke="#f43f5e" fillOpacity={0} strokeWidth={2} name="Expense" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Expense Distribution</CardTitle>
                <CardDescription>Breakdown by expense categories</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.expensesByCategory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <Tooltip 
                         contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Amount">
                        {reportData.expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Settlement Table */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Financial Settlement</CardTitle>
                <CardDescription>Detailed transaction log for the period</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50" onClick={handleDownloadSettlement}>
                  <FileDown className="w-4 h-4 mr-2" /> Download Report
                </Button>
                <div className="relative">
                  <Input 
                    placeholder="Search transactions..." 
                    className="w-64 border-slate-200 h-9" 
                    icon={Search}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-800">
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Description</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Method</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {reportData.recentSettlements.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{item.date}</td>
                        <td className="py-3 px-4 font-medium">{item.description}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            item.type === 'revenue' 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                          }`}>
                            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{item.method}</td>
                        <td className={`py-3 px-4 text-right font-bold ${
                          item.type === 'revenue' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {item.type === 'revenue' ? '+' : '-'} Rs. {item.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value, trend, icon, description }) {
  return (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-800 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        {icon}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
        <div className="mt-2 flex items-center gap-2">
          {trend && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
              trend.startsWith('+') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {trend}
            </span>
          )}
          <span className="text-xs text-slate-400">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}
