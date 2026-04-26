// app/teacher/payroll/page.js
"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { toast } from 'sonner';
import {
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Download,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import FullPageLoader from '@/components/ui/full-page-loader';

// Move monthNames outside component to avoid re-creation
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Generate years outside component
const getYears = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => currentYear - i);
};

const statusOptions = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'processed', label: 'Processed' },
];

export default function TeacherPayrollPage() {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [downloading, setDownloading] = useState({});
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 10;
  
  const [years, setYears] = useState([]);

  // Handle mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    setYears(getYears());
  }, []);

  // Fetch when filters or page changes
  useEffect(() => {
    if (mounted && user) {
      fetchPayrolls();
    }
  }, [mounted, user, currentPage, selectedMonth, selectedYear, selectedStatus]);

  const fetchPayrolls = async (showRefreshToast = false) => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: limit,
      };
      
      if (selectedMonth) params.month = parseInt(selectedMonth);
      if (selectedYear) params.year = parseInt(selectedYear);
      if (selectedStatus) params.status = selectedStatus;
      
      const response = await apiClient.get(API_ENDPOINTS.TEACHER.PAYROLL.LIST, params);
      
      if (response.success) {
        setPayrolls(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalRecords(response.pagination?.total || 0);
        
        if (showRefreshToast) {
          toast.success('Records refreshed successfully');
        }
      }
    } catch (error) {
      console.error('Fetch payrolls error:', error);
      if (showRefreshToast) {
        toast.error('Failed to refresh records');
      } else {
        toast.error('Failed to fetch payroll records');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPayrolls(true);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  /// ✅ Improved Download Function with Complete Data
const handleDownloadSlip = async (payroll) => {
  console.log('payroll', payroll);
  try {
    setDownloading(prev => ({ ...prev, [payroll._id]: true }));
    
    await apiClient.download(
      API_ENDPOINTS.TEACHER.PAYROLL.SLIP(payroll._id),
      `Salary_Slip_${payroll.month}_${payroll.year}.pdf`
    );

    toast.success('Salary slip downloaded successfully');
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Failed to download salary slip');
  } finally {
    setDownloading(prev => ({ ...prev, [payroll._id]: false }));
  }
};

  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid': 
        return <Badge variant="success" className="gap-1"><CheckCircle className="w-3 h-3" /> Paid</Badge>;
      case 'pending': 
        return <Badge variant="warning" className="gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      default: 
        return <Badge variant="info">{status}</Badge>;
    }
  };

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  if (loading && payrolls.length === 0) {
    return <FullPageLoader />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            My Salary Records
          </h1>
          <p className="text-muted-foreground mt-1">
            View and download your salary history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-lg px-4 py-2">
            Total: {totalRecords} Records
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Months</option>
              {monthNames.map((month, index) => (
                <option key={index} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">All Status</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="w-full"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Payroll Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month/Year</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Gross Salary</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead> {/* ✅ New Column */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrolls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No salary records found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try changing your filters or click refresh
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                payrolls.map((payroll) => (
                  <TableRow key={payroll._id}>
                    <TableCell className="font-medium">
                      {monthNames[payroll.month - 1]} {payroll.year}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {payroll.userId?.role?.replace('_', ' ') || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {`${payroll.userId?.firstName || ''} ${payroll.userId?.lastName || ''}`.trim() || '-'}
                    </TableCell>
                    <TableCell>{payroll.branchId?.name || '-'}</TableCell>
                    <TableCell>PKR {payroll.basicSalary?.toLocaleString() || 0}</TableCell>
                    <TableCell>PKR {payroll.grossSalary?.toLocaleString() || 0}</TableCell>
                    <TableCell className="text-red-600">
                      PKR {payroll.totalDeductions?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      PKR {payroll.netSalary?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>{getStatusBadge(payroll.paymentStatus)}</TableCell>
                    <TableCell>
                      {/* ✅ Download Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadSlip(payroll)}
                        disabled={downloading[payroll._id]}
                        className="gap-1"
                      >
                        {downloading[payroll._id] ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="hidden sm:inline">PDF</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">PDF</span>
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}