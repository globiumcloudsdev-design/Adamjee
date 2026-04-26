//src/app/(dashboard)/branch-admin/expenses/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';
import { Plus, Edit, Trash2, Search, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS, buildUrl } from '@/constants/api-endpoints';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const EXPENSE_CATEGORIES = [
  { value: 'salary', label: 'Salary' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export default function SuperAdminExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [branches, setBranches] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'other',
    date: new Date().toISOString().split('T')[0],
    vendor_name: '',
    receipt_url: '',
    status: 'pending',
    branch_id: '',
    rejection_reason: '',
    payment_reference: '',
  });

  useEffect(() => {
    fetchExpenses();
    fetchBranches();
  }, [search, categoryFilter, statusFilter, branchFilter, pagination.page]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(branchFilter && { branch_id: branchFilter }),
      };
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.EXPENSES.LIST, params);
      if (response.success) {
        setExpenses(response.data.expenses || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.totalPages || 0,
        }));
      } else {
        toast.error(response.error || 'Failed to load expenses');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error fetching expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST);
      if (res.success) setBranches(res.data.branches || []);
    } catch (error) {
      console.error('Failed to fetch branches', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.category || !formData.date || !formData.branch_id) {
      toast.warning('Please fill all required fields (including branch)');
      return;
    }
    if (parseFloat(formData.amount) < 0) {
      toast.warning('Amount must be positive');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        vendor_name: formData.vendor_name || undefined,
        receipt_url: formData.receipt_url || undefined,
        status: formData.status,
        branch_id: formData.branch_id,
        rejection_reason: formData.rejection_reason,
        payment_reference: formData.payment_reference,
      };

      if (isEditMode) {
        const url = buildUrl(API_ENDPOINTS.SUPER_ADMIN.EXPENSES.UPDATE, { id: currentExpense.id });
        const response = await apiClient.put(url, payload);
        if (response.success) {
          toast.success('Expense updated');
          setIsModalOpen(false);
          fetchExpenses();
        } else {
          toast.error(response.error || 'Update failed');
        }
      } else {
        const response = await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.EXPENSES.CREATE, payload);
        if (response.success) {
          toast.success('Expense created');
          setIsModalOpen(false);
          fetchExpenses();
        } else {
          toast.error(response.error || 'Creation failed');
        }
      }
    } catch (error) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (expense) => {
    setCurrentExpense(expense);
    setFormData({
      title: expense.title || '',
      description: expense.description || '',
      amount: expense.amount || '',
      category: expense.category || 'other',
      date: expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0],
      vendor_name: expense.vendor_name || '',
      receipt_url: expense.receipt_url || '',
      status: expense.status || 'pending',
      branch_id: expense.branch_id || '',
      rejection_reason: expense.rejection_reason || '',
      payment_reference: expense.payment_reference || '',
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense permanently?')) return;
    try {
      const url = buildUrl(API_ENDPOINTS.SUPER_ADMIN.EXPENSES.DELETE, { id });
      const response = await apiClient.delete(url);
      if (response.success) {
        toast.success('Expense deleted');
        fetchExpenses();
      } else {
        toast.error(response.error || 'Delete failed');
      }
    } catch (error) {
      toast.error('Error deleting expense');
    }
  };

  const handleAddNew = () => {
    setCurrentExpense(null);
    setFormData({
      title: '',
      description: '',
      amount: '',
      category: 'other',
      date: new Date().toISOString().split('T')[0],
      vendor_name: '',
      receipt_url: '',
      status: 'pending',
      branch_id: '',
      rejection_reason: '',
      payment_reference: '',
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // Charts data
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const categoryTotals = {};
  expenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + Number(exp.amount);
  });
  const chartData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));

  if (loading && expenses.length === 0) return <FullPageLoader message="Loading expenses..." />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Expenses Tracking</h1>
          <p className="text-gray-600">Monitor all branch expenses</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="text-sm text-gray-600">Total Expenses</div><div className="text-2xl font-bold">PKR {totalExpenses.toLocaleString()}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-gray-600">Paid</div><div className="text-2xl font-bold text-green-600">PKR {expenses.filter(e => e.status === 'paid').reduce((s, e) => s + Number(e.amount), 0).toLocaleString()}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-gray-600">Pending</div><div className="text-2xl font-bold text-orange-600">PKR {expenses.filter(e => e.status === 'pending').reduce((s, e) => s + Number(e.amount), 0).toLocaleString()}</div></CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle>By Category (Pie)</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>{chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>Category Breakdown</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#8884d8" /></BarChart></ResponsiveContainer></CardContent></Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} icon={Search} />
            <Dropdown placeholder="Category" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} options={[{ value: '', label: 'All' }, ...EXPENSE_CATEGORIES]} />
            <Dropdown placeholder="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={[{ value: '', label: 'All' }, ...STATUS_OPTIONS]} />
            <Dropdown placeholder="Branch" value={branchFilter} onChange={e => setBranchFilter(e.target.value)} options={[{ value: '', label: 'All Branches' }, ...branches.map(b => ({ value: b.id, label: b.name }))]} />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Exp No.</TableHead><TableHead>Title</TableHead><TableHead>Branch</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center">No expenses</TableCell></TableRow> :
                  expenses.map(exp => (
                    <TableRow key={exp.id}>
                      <TableCell className="font-mono text-sm">{exp.expense_number}</TableCell>
                      <TableCell className="font-medium">{exp.title}</TableCell>
                      <TableCell><Building2 className="inline w-4 h-4 mr-1" /> {exp.branch?.name || '—'}</TableCell>
                      <TableCell><span className="px-2 py-1 rounded-full text-xs bg-blue-100 capitalize">{exp.category}</span></TableCell>
                      <TableCell>PKR {Number(exp.amount).toLocaleString()}</TableCell>
                      <TableCell>{new Date(exp.date).toLocaleDateString()}</TableCell>
                      <TableCell><span className={`px-2 py-1 rounded-full text-xs ${exp.status === 'paid' ? 'bg-green-100 text-green-700' : exp.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'}`}>{exp.status}</span></TableCell>
                      <TableCell><div className="flex gap-2"><Button variant="ghost" size="icon-sm" onClick={() => handleEdit(exp)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="icon-sm" onClick={() => handleDelete(exp.id)}><Trash2 className="w-4 h-4 text-red-600" /></Button></div></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">Total {pagination.total} expenses</div>
              <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1}>Prev</Button><Button variant="outline" size="sm" onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pagination.totalPages}>Next</Button></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? 'Edit Expense' : 'Add Expense'} size="lg" footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSubmit} disabled={submitting}>{submitting ? <ButtonLoader /> : (isEditMode ? 'Update' : 'Create')}</Button></div>}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Title *</label><input name="title" value={formData.title} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" required /></div>
          <div><label className="block text-sm font-medium mb-1">Description</label><textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" rows="2" /></div>
          <div className="grid grid-cols-2 gap-4"><div><label>Amount (PKR) *</label><input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" required min="0" /></div><div><label>Category *</label><select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg">{EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div></div>
          <div className="grid grid-cols-2 gap-4"><div><label>Date *</label><input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" required /></div><div><label>Vendor Name</label><input type="text" name="vendor_name" value={formData.vendor_name} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" /></div></div>
          <div><label>Receipt URL (optional)</label><input type="url" name="receipt_url" value={formData.receipt_url} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="grid grid-cols-2 gap-4"><div><label>Branch *</label><select name="branch_id" value={formData.branch_id} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" required><option value="">Select Branch</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div><div><label>Status</label><select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg">{STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div></div>
          {formData.status === 'rejected' && <div><label>Rejection Reason</label><textarea name="rejection_reason" value={formData.rejection_reason} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" rows="2" /></div>}
          <div><label>Payment Reference</label><input type="text" name="payment_reference" value={formData.payment_reference} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg" /></div>
        </form>
      </Modal>
    </div>
  );
}