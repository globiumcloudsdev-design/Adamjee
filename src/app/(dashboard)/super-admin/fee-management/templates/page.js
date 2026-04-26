'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Filter,
  Calendar,
  TrendingUp,
  X,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import Input from '@/components/ui/input';
import BranchSelect from '@/components/ui/branch-select';
import Dropdown from '@/components/ui/dropdown';
import NestedDropdown from '@/components/ui/dropdown_fixed';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/modal';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';
import Table, { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function FeeTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [branches, setBranches] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  const STATUS_OPTIONS = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'archived', label: 'Archived' },
  ];

  const FREQUENCY_OPTIONS = [
    { value: 'one-time', label: 'One Time' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'half-yearly', label: 'Half Yearly' },
    { value: 'annually', label: 'Annually' },
  ];

  const APPLICABLE_OPTIONS = [
    { value: 'all', label: 'All Students' },
    { value: 'class-specific', label: 'Class Specific' },
    { value: 'student-specific', label: 'Student Specific' },
  ];

  const MONTH_OPTIONS = [
    { value: '', label: 'Any Month' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    baseAmount: 0,
    items: [{ name: '', amount: '', discount: { enabled: false, type: 'fixed', amount: 0 } }],
    description: '',
    frequency: 'monthly',
    applicableTo: 'all',
    classes: [],
    dueDate: { day: 1, month: 1 },
    validFrom: '',
    validTo: '',
    lateFee: { enabled: false, type: 'fixed', amount: 0, graceDays: 0 },
    discount: { enabled: false, type: 'fixed', amount: 0, criteria: '' },
    paymentMethods: ['cash', 'bank-transfer', 'online'],
    status: 'active',
    branchId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [searchTerm, frequencyFilter, statusFilter, branchFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadTemplates(), loadBranches()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // load classes for selected branch in the form
  const loadClasses = async (branchId) => {
    if (!branchId) {
      setClassesList([]);
      return;
    }
    try {
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.CLASSES.LIST, { branchId, limit: 200 });
      if (res && res.success) setClassesList(res.data || []);
    } catch (err) {
      console.error('Error loading classes for branch:', err);
      setClassesList([]);
    }
  };

  useEffect(() => {
    // whenever the branch in the form changes, reload classes for that branch
    if (formData.branchId) {
      loadClasses(formData.branchId);
    } else {
      setClassesList([]);
    }
  }, [formData.branchId]);

  const loadTemplates = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (frequencyFilter) params.frequency = frequencyFilter;
      if (statusFilter) params.status = statusFilter;
      if (branchFilter) params.branchId = branchFilter;

      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.FEE_TEMPLATES.LIST, params);

      if (res && res.success) {
        setTemplates(res.data);
      } else {
        toast.error(res?.message || 'Failed to load fee templates');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      const msg = error?.message || 'Failed to load fee templates';
      if (error?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error(msg);
      }
    }
  };

  const loadBranches = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST, { limit: 100 });
      if (res && res.success) {
        setBranches(res.data.branches);
      }
      console.log('Branches Loaded', res);
      
    } catch (error) {
      console.error('Error loading branches:', error);
      const msg = error?.message || 'Failed to load branches';
      if (error?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error(msg);
      }
    }
  };

  const handleAddNew = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      code: '',
      baseAmount: 0,
      items: [{ name: '', amount: '', discount: { enabled: false, type: 'fixed', amount: 0 } }],
      description: '',
      frequency: 'monthly',
      applicableTo: 'all',
      classes: [],
      dueDate: { day: 1, month: 1 },
      lateFee: { enabled: false, type: 'fixed', amount: 0, graceDays: 0 },
      discount: { enabled: false, type: 'fixed', amount: 0, criteria: '' },
      paymentMethods: ['cash', 'bank-transfer', 'online'],
      status: 'active',
      branchId: '',
    });
    setShowModal(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);

    // normalize any date-like values that were previously stored in `applicableTo`
    const isDateString = (val) => {
      return typeof val === 'string' && !['all', 'class-specific', 'student-specific'].includes(val) && !isNaN(Date.parse(val));
    };

    let applicableToValue = template.applicableTo;
    let validFromValue = template.validFrom ? new Date(template.validFrom).toISOString().slice(0,10) : '';
    let validToValue = template.validTo ? new Date(template.validTo).toISOString().slice(0,10) : '';

    if (isDateString(applicableToValue)) {
      // move old date stored incorrectly under `applicableTo` into `validFrom`
      validFromValue = validFromValue || new Date(applicableToValue).toISOString().slice(0,10);
      applicableToValue = 'all';
    }

    setFormData({
      name: template.name,
      code: template.code,
      baseAmount: template.baseAmount || 0,
      items: template.items?.length > 0 ? template.items.map(item => ({
        name: item.name,
        amount: item.amount.toString(),
        discount: item.discount || { enabled: false, type: 'fixed', amount: 0 }
      })) : [{ name: '', amount: '', discount: { enabled: false, type: 'fixed', amount: 0 } }],
      description: template.description || '',
      frequency: template.frequency,
      applicableTo: applicableToValue || 'all',
      classes: (template.classes || []).map(c => (c && c._id) ? c._id : c),
      dueDate: template.dueDate || { day: 1, month: 1 },
      validFrom: validFromValue,
      validTo: validToValue,
      lateFee: template.lateFee || { enabled: false, type: 'fixed', amount: 0, graceDays: 0 },
      discount: template.discount || { enabled: false, type: 'fixed', amount: 0, criteria: '' },
      paymentMethods: template.paymentMethods || ['cash', 'bank-transfer', 'online'],
      status: template.status,
      branchId: template.branchId?._id || '',
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.code || !formData.items || formData.items.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if all items have name and amount
    const invalidItem = formData.items.find(item => !item.name || !item.amount);
    if (invalidItem) {
      toast.error('Please provide name and amount for all fee components');
      return;
    }

    try {

      const url = editingTemplate
        ? API_ENDPOINTS.SUPER_ADMIN.FEE_TEMPLATES.UPDATE.replace(':id', editingTemplate._id)
        : API_ENDPOINTS.SUPER_ADMIN.FEE_TEMPLATES.CREATE;

      const method = editingTemplate ? 'PUT' : 'POST';

      const body = {
        ...formData,
        branchId: formData.branchId || null,
        baseAmount: parseFloat(formData.baseAmount) || 0,
        classes: (formData.classes || []).map(c => (c && c._id) ? c._id : c),
        items: formData.items.map(item => ({
          ...item,
          amount: parseFloat(item.amount) || 0,
          discount: {
            ...item.discount,
            amount: parseFloat(item.discount?.amount) || 0
          }
        })),
        lateFee: {
          ...formData.lateFee,
          amount: parseFloat(formData.lateFee.amount) || 0,
        },
        discount: {
          ...formData.discount,
          amount: parseFloat(formData.discount.amount) || 0,
        },
      };

      // sanitize incorrect date stored under applicableTo from older records
      if (
        body.applicableTo &&
        !['all', 'class-specific', 'student-specific'].includes(body.applicableTo) &&
        !isNaN(Date.parse(body.applicableTo))
      ) {
        body.validFrom = body.validFrom || body.applicableTo;
        body.applicableTo = 'all';
      }

      let response;
      try {
        setSubmitting(true);
        if (editingTemplate) {
          response = await apiClient.put(url, body);
        } else {
          response = await apiClient.post(url, body);
        }

        if (response && response.success) {
          toast.success(response.message || 'Template saved');
          setShowModal(false);
          loadTemplates();
        } else {
          toast.error(response?.message || 'Operation failed');
        }
      } catch (err) {
        console.error('Error saving template:', err);
        if (err?.status === 401) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error(err?.message || 'Failed to save template');
        }
      } finally {
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Error in handleFormSubmit (outer):', error);
      toast.error('Failed to save template');
    }
  };

  const handleClone = (template) => {
    setEditingTemplate(null);
    setFormData({
      name: template.name + ' (Copy)',
      code: (template.code || '') + '-COPY',
      baseAmount: template.baseAmount || 0,
      description: template.description || '',
      items: template.items?.length > 0 ? template.items.map(item => ({
        name: item.name,
        amount: item.amount.toString(),
        discount: item.discount || { enabled: false, type: 'fixed', amount: 0 }
      })) : [{ name: '', amount: '', discount: { enabled: false, type: 'fixed', amount: 0 } }],
      frequency: template.frequency || 'monthly',
      applicableTo: template.applicableTo || 'all',
      classes: template.classes || [],
      dueDate: template.dueDate || { day: 1, month: 1 },
      validFrom: template.validFrom ? new Date(template.validFrom).toISOString().split('T')[0] : '',
      validTo: template.validTo ? new Date(template.validTo).toISOString().split('T')[0] : '',
      lateFee: template.lateFee || { enabled: false, type: 'fixed', amount: 0, graceDays: 0 },
      discount: template.discount || { enabled: false, type: 'fixed', amount: 0, criteria: '' },
      paymentMethods: template.paymentMethods || ['cash', 'bank-transfer', 'online'],
      status: 'active',
      branchId: template.branchId || '',
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      setDeleting(true);
      const response = await apiClient.delete(API_ENDPOINTS.SUPER_ADMIN.FEE_TEMPLATES.DELETE.replace(':id', templateToDelete._id));
      if (response && response.success) {
        toast.success('Fee template archived successfully');
        setShowDeleteModal(false);
        setTemplateToDelete(null);
        loadTemplates();
      } else {
        toast.error(response?.message || 'Failed to archive template');
      }
    } catch (err) {
      console.error('Error archiving template:', err);
      if (err?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error(err?.message || 'Failed to archive template');
      }
    } finally {
      setDeleting(false);
    }
  };

  // Calculate stats
  const totalTemplates = templates.length;
  const activeTemplates = templates.filter(t => t.status === 'active').length;
  const totalRevenue = templates.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  if (loading) return <FullPageLoader message="Loading fee templates..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Templates</h1>
          <p className="text-sm text-gray-600 mt-1">Manage fee structures and templates</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4" />
          Create Template
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalTemplates}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Templates</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{activeTemplates}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Frequencies</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{FREQUENCY_OPTIONS.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Filter className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">Rs. {(totalRevenue || 0).toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              icon={Search}
            />
          </div> 

          <Dropdown
            value={frequencyFilter}
            onChange={(e) => setFrequencyFilter(e.target.value)}
            options={[{ value: '', label: 'All Frequencies' }, ...FREQUENCY_OPTIONS]}
            placeholder="All Frequencies"
          />

          <Dropdown
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
            placeholder="All Status"
          />

          <BranchSelect
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            branches={branches}
            placeholder="All Branches"
            className="w-full"
          />
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Components</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Applicable To</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Late Fee</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-12">
                  <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No fee templates found. Create your first template to get started.</p>
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => {
                return (
                  <TableRow key={template._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-sm text-gray-500 line-clamp-1">{template.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{template.code}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {template.baseAmount > 0 && (
                          <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            Base Amount: Rs. {template.baseAmount.toLocaleString()}
                          </div>
                        )}
                        {template.items?.map((item, idx) => (
                          <div key={idx} className="text-[10px] text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                            {item.name}: Rs. {(item.amount || 0).toLocaleString()}
                            {item.discount?.enabled && (
                              <span className="text-green-600 ml-1">
                                (-{item.discount.type === 'percentage' ? `${item.discount.amount}%` : `Rs. ${item.discount.amount}`})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">Rs. {(template.totalAmount || 0).toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{template.frequency}</TableCell>
                    <TableCell className="capitalize">{template.applicableTo}</TableCell>
                    <TableCell>{template.branchId?.name || 'All Branches'}</TableCell>
                    <TableCell>
                      {template.lateFee?.enabled ? (
                        <span className="text-xs text-orange-600">
                          {template.lateFee.type === 'percentage'
                            ? `${template.lateFee.amount}%`
                            : `Rs. ${template.lateFee.amount}`}
                          {template.lateFee.graceDays > 0 && ` (${template.lateFee.graceDays}d)`}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {template.discount?.enabled ? (
                        <span className="text-xs text-green-600">
                          {template.discount.type === 'percentage'
                            ? `${template.discount.amount}%`
                            : `Rs. ${template.discount.amount}`}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          template.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : template.status === 'inactive'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {template.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button onClick={() => handleEdit(template)} variant="outline" size="sm" title="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleClone(template)} variant="outline" size="sm" title="Clone">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setTemplateToDelete(template);
                            setShowDeleteModal(true);
                          }}
                          variant="destructive"
                          size="sm"
                          title="Archive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingTemplate ? 'Edit Fee Template' : 'Create Fee Template'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" form="template-form" disabled={submitting}>
              {submitting ? <ButtonLoader /> : (editingTemplate ? 'Update Template' : 'Create Template')}
            </Button>
          </div>
        }
      >
        <form id="template-form" onSubmit={handleFormSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Monthly Tuition Fee - Grade 1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Code <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                disabled={editingTemplate}
                placeholder="e.g., TF-G1-M"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch (Optional)
              </label>
              <BranchSelect
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                branches={branches}
                placeholder="All Branches"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Dropdown
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
                placeholder="Status"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="2"
              placeholder="Describe the fee template..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <Dropdown
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                options={FREQUENCY_OPTIONS}
                placeholder="Frequency"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Applicable To
              </label>
              <Dropdown
                value={formData.applicableTo}
                onChange={(e) => setFormData({ ...formData, applicableTo: e.target.value })}
                options={APPLICABLE_OPTIONS}
                placeholder="Applicable To"
              />
            </div>
          </div>

          {formData.applicableTo === 'class-specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Classes</label>
              <NestedDropdown
                name="classes"
                options={(classesList || []).map(c => ({ label: c.name, value: c._id }))}
                value={formData.classes}
                placeholder="Select classes"
                multiple={true}
                onChange={(e) => {
                  const v = e?.target?.value;
                  setFormData({ ...formData, classes: Array.isArray(v) ? v : (v ? [v] : []) });
                }}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Template Amount (Fixed)
            </label>
            <Input
              type="number"
              value={formData.baseAmount}
              onChange={(e) => setFormData({ ...formData, baseAmount: e.target.value })}
              placeholder="0.00"
            />
            <p className="text-[10px] text-gray-500 mt-1 italic">This amount will be added to the total regardless of components.</p>
          </div>

          {/* Fee Items/Components */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Fee Components
              </h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setFormData({
                    ...formData,
                    items: [...formData.items, { name: '', amount: '', discount: { enabled: false, type: 'fixed', amount: 0 } }]
                  });
                }}
                className="h-8 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Component
              </Button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                  <div className="md:col-span-5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Component Name</label>
                    <Input
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...formData.items];
                        newItems[index].name = e.target.value;
                        setFormData({ ...formData, items: newItems });
                      }}
                      placeholder="e.g. Tuition Fee"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Amount</label>
                    <Input
                      type="number"
                      value={item.amount}
                      onChange={(e) => {
                        const newItems = [...formData.items];
                        newItems[index].amount = e.target.value;
                        setFormData({ ...formData, items: newItems });
                      }}
                      placeholder="0.00"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        checked={item.discount?.enabled}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].discount.enabled = e.target.checked;
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-3 h-3 text-blue-600 rounded"
                      />
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Discount</label>
                    </div>
                    {item.discount?.enabled && (
                      <div className="flex gap-1">
                        <select
                          value={item.discount.type}
                          onChange={(e) => {
                            const newItems = [...formData.items];
                            newItems[index].discount.type = e.target.value;
                            setFormData({ ...formData, items: newItems });
                          }}
                          className="text-[10px] border border-gray-300 rounded px-1 h-7 bg-gray-50"
                        >
                          <option value="fixed">Rs.</option>
                          <option value="percentage">%</option>
                        </select>
                        <Input
                          type="number"
                          value={item.discount.amount}
                          onChange={(e) => {
                            const newItems = [...formData.items];
                            newItems[index].discount.amount = e.target.value;
                            setFormData({ ...formData, items: newItems });
                          }}
                          className="h-7 text-[10px]"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-1 pt-5">
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = formData.items.filter((_, i) => i !== index);
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end pt-2 border-t border-gray-200">
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-500 uppercase">Total Template Amount</p>
                <p className="text-xl font-black text-blue-600">
                  Rs. {(
                    (parseFloat(formData.baseAmount) || 0) + 
                    formData.items.reduce((sum, item) => {
                      let amt = parseFloat(item.amount) || 0;
                      if (item.discount?.enabled) {
                        if (item.discount.type === 'fixed') amt -= parseFloat(item.discount.amount) || 0;
                        else amt -= (amt * (parseFloat(item.discount.amount) || 0)) / 100;
                      }
                      return sum + Math.max(0, amt);
                    }, 0)
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Day
              </label>
              <input
                type="number"
                value={formData.dueDate.day}
                onChange={(e) => setFormData({
                  ...formData,
                  dueDate: { ...formData.dueDate, day: parseInt(e.target.value) || 1 }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="31"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Month (Optional)
              </label>
              <Dropdown
                value={formData.dueDate.month ? String(formData.dueDate.month) : ''}
                onChange={(e) => setFormData({
                  ...formData,
                  dueDate: { ...formData.dueDate, month: parseInt(e.target.value) || undefined }
                })}
                options={MONTH_OPTIONS}
                placeholder="Any Month"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid From (optional)</label>
              <input
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid To (optional)</label>
              <input
                type="date"
                value={formData.validTo}
                onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Late Fee */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Late Fee Settings</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.lateFee.enabled}
                  onChange={(e) => setFormData({
                    ...formData,
                    lateFee: { ...formData.lateFee, enabled: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enable Late Fee</span>
              </label>
            </div>

            {formData.lateFee.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <Dropdown
                    value={formData.lateFee.type}
                    onChange={(e) => setFormData({
                      ...formData,
                      lateFee: { ...formData.lateFee, type: e.target.value }
                    })}
                    options={[{ value: 'fixed', label: 'Fixed Amount' }, { value: 'percentage', label: 'Percentage' }]}
                    placeholder="Type"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount {formData.lateFee.type === 'percentage' && '(%)'}
                  </label>
                  <input
                    type="number"
                    value={formData.lateFee.amount}
                    onChange={(e) => setFormData({
                      ...formData,
                      lateFee: { ...formData.lateFee, amount: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grace Days</label>
                  <input
                    type="number"
                    value={formData.lateFee.graceDays}
                    onChange={(e) => setFormData({
                      ...formData,
                      lateFee: { ...formData.lateFee, graceDays: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Discount */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Discount Settings</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.discount.enabled}
                  onChange={(e) => setFormData({
                    ...formData,
                    discount: { ...formData.discount, enabled: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enable Discount</span>
              </label>
            </div>

            {formData.discount.enabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <Dropdown
                      value={formData.discount.type}
                      onChange={(e) => setFormData({
                        ...formData,
                        discount: { ...formData.discount, type: e.target.value }
                      })}
                      options={[{ value: 'fixed', label: 'Fixed Amount' }, { value: 'percentage', label: 'Percentage' }]}
                      placeholder="Type"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount {formData.discount.type === 'percentage' && '(%)'}
                    </label>
                    <input
                      type="number"
                      value={formData.discount.amount}
                      onChange={(e) => setFormData({
                        ...formData,
                        discount: { ...formData.discount, amount: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Criteria
                  </label>
                  <textarea
                    value={formData.discount.criteria}
                    onChange={(e) => setFormData({
                      ...formData,
                      discount: { ...formData.discount, criteria: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    placeholder="e.g., Early payment discount, Sibling discount"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Methods
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['cash', 'bank-transfer', 'online', 'cheque', 'card'].map(method => (
                <label key={method} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.paymentMethods.includes(method)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          paymentMethods: [...formData.paymentMethods, method]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          paymentMethods: formData.paymentMethods.filter(m => m !== method)
                        });
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">{method.replace('-', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Archive Fee Template</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to archive "{templateToDelete?.name}"? This will move it to archived status.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? <ButtonLoader /> : 'Archive'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
