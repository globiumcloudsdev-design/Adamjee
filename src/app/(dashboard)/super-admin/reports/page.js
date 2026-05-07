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
  RefreshCw,
  Building2
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
import Dropdown from '@/components/ui/dropdown';
import DatePicker from '@/components/ui/date-picker';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function SuperAdminReportsPage() {
  const [reportType, setReportType] = useState('monthly'); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [branches, setBranches] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedBranch, startDate, endDate]);

  const fetchBranches = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST);
      if (res.success) {
        // Handle both possible response formats
        setBranches(res.data?.branches || (Array.isArray(res.data) ? res.data : []));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {
        type: reportType,
        branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
        ...(reportType === 'custom' && { startDate, endDate })
      };
      
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.REPORTS.FINANCIAL, params);
      
      if (res.success) {
        setReportData(res.data);
      } else {
        toast.error(res.message || 'Failed to fetch global reports');
      }
    } catch (error) {
      console.error('Global report error:', error);
      toast.error('Connection error while fetching global reports');
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
    const branchName = selectedBranch === 'all' ? 'All Branches' : (branches.find(b => b.id === selectedBranch)?.name || 'Branch');
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text('Adamjee Coaching Center', 105, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139);
    doc.text(`Global Financial Settlement - ${branchName}`, 105, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 32, { align: 'center' });
    
    // Summary
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 38, 190, 38);
    
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(`Report Type: ${reportType.toUpperCase()}`, 20, 48);
    doc.text(`Revenue: Rs. ${reportData.summary.totalRevenue.toLocaleString()}`, 20, 55);
    doc.text(`Expenses: Rs. ${reportData.summary.totalExpenses.toLocaleString()}`, 120, 55);
    doc.text(`Net Profit: Rs. ${reportData.summary.netProfit.toLocaleString()}`, 20, 62);
    
    // Table
    const tableData = reportData.recentSettlements.map(item => [
      item.date,
      item.description,
      item.type.charAt(0).toUpperCase() + item.type.slice(1),
      item.branchName || 'N/A',
      `${item.type === 'revenue' ? '+' : '-'} Rs. ${item.amount.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Date', 'Description', 'Type', 'Branch', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 8 },
      columnStyles: {
        4: { halign: 'right', fontStyle: 'bold' }
      }
    });

    doc.save(`Global_Settlement_${branchName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Global report downloaded');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Global Finance Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Unified financial overview of all branches.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl">
            <Download className="w-4 h-4 mr-2" /> Export All
          </Button>
          <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 rounded-xl">
            <FileDown className="w-4 h-4 mr-2" /> PDF Report
          </Button>
        </div>
      </div>

      {/* Global Filters */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-visible z-50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-500" /> Select Branch
              </label>
              <Dropdown
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                options={[
                  { value: 'all', label: 'All Branches' },
                  ...branches.map(b => ({ value: b.id, label: b.name }))
                ]}
                placeholder="Choose Branch"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Report Period
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 h-[42px]">
                {['daily', 'weekly', 'monthly', 'custom'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setReportType(t)}
                    className={`flex-1 px-3 text-xs font-bold rounded-lg transition-all ${
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
              <>
                <div className="space-y-2 animate-in slide-in-from-left duration-300">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
                  <DatePicker
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="From Date"
                    disableFuture={false}
                  />
                </div>
                <div className="space-y-2 animate-in slide-in-from-left duration-500">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">End Date</label>
                  <DatePicker
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="To Date"
                    disableFuture={false}
                  />
                </div>
              </>
            )}

            {reportType !== 'custom' && (
              <div className="md:col-span-2 hidden md:block" />
            )}
          </div>
        </CardContent>
      </Card>


      {reportData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              title="Global Revenue" 
              value={`Rs. ${reportData.summary.totalRevenue.toLocaleString()}`}
              trend={`+${reportData.summary.revenueGrowth}%`}
              icon={<ArrowUpCircle className="text-emerald-500" />}
              description="Consolidated across branches"
            />
            <MetricCard 
              title="Global Expenses" 
              value={`Rs. ${reportData.summary.totalExpenses.toLocaleString()}`}
              trend={`${reportData.summary.expenseChange}%`}
              icon={<ArrowDownCircle className="text-rose-500" />}
              description="Total operational spending"
            />
            <MetricCard 
              title="Net Profit" 
              value={`Rs. ${reportData.summary.netProfit.toLocaleString()}`}
              trend="Strong"
              icon={<TrendingUp className="text-blue-500" />}
              description="Global earnings after costs"
            />
            <MetricCard 
              title="Fee Arrears" 
              value={`Rs. ${reportData.summary.pendingFees.toLocaleString()}`}
              icon={<Activity className="text-amber-500" />}
              description="Outstanding fee vouchers"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Financial Performance Trends</CardTitle>
                <CardDescription>Consolidated Revenue vs Expenses</CardDescription>
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
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} name="Revenue" />
                      <Area type="monotone" dataKey="expense" stroke="#f43f5e" fillOpacity={0} strokeWidth={2} name="Expense" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">Global Expenses</CardTitle>
                <CardDescription>Major cost drivers</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.expensesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {reportData.expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader>
               <CardTitle className="text-lg">Branch-wise Performance</CardTitle>
               <CardDescription>Revenue vs Expenses per branch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.branchWiseData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
                    <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expense" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Global Financial Settlement Table */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Global Financial Settlement</CardTitle>
                <CardDescription>Consolidated transaction log across branches</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50" onClick={handleDownloadSettlement}>
                  <FileDown className="w-4 h-4 mr-2" /> Download Global Report
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
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Branch</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {reportData.recentSettlements?.map((item) => (
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
                        <td className="py-3 px-4 text-slate-500 font-medium">{item.branchName || 'N/A'}</td>
                        <td className={`py-3 px-4 text-right font-bold ${
                          item.type === 'revenue' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {item.type === 'revenue' ? '+' : '-'} Rs. {item.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {(!reportData.recentSettlements || reportData.recentSettlements.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 italic">No transactions found for this period.</td>
                      </tr>
                    )}
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
