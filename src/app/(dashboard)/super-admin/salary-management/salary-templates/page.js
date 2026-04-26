'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import {
  DollarSign,
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  X,
  AlertCircle,
  Percent,
  Users,
} from 'lucide-react';

export default function SalaryTemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [branches, setBranches] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    templateName: '',
    branchId: '',
    designation: '',
    basicSalary: '',
    description: '',
    allowances: {
      houseRent: '',
      medical: '',
      transport: '',
      other: '',
    },
    deductions: {
      tax: '',
      providentFund: '',
      insurance: '',
      other: '',
    },
    status: 'active',
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    avgBasicSalary: 0,
    activeCount: 0,
  });

  useEffect(() => {
    fetchTemplates();
    fetchBranches();
    fetchDesignations();
  }, [searchTerm, selectedBranch]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '100',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedBranch && { branchId: selectedBranch }),
      });

      const response = await apiClient.get(`/api/super-admin/salary-templates?${params}`);
      
      if (response.success) {
        setTemplates(response.data);
        
        const total = response.data.length;
        const avgBasicSalary = total > 0
          ? Math.round(response.data.reduce((sum, t) => sum + (Number(t.basicSalary) || 0), 0) / total)
          : 0;
        const activeCount = response.data.filter(t => t.status === 'active').length;
        
        setStats({ total, avgBasicSalary, activeCount });
      }
    } catch (error) {
      if (error.message !== 'Not found') {
        toast.error('Failed to fetch salary templates');
      }
      setTemplates([]);
      setStats({ total: 0, avgBasicSalary: 0, activeCount: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get('/api/super-admin/branches?limit=100');
      if (response.success) {
        setBranches(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const fetchDesignations = async () => {
    // Sample designations - in a real app, these would come from a designation model
    setDesignations([
      'Principal',
      'Vice Principal',
      'Senior Teacher',
      'Teacher',
      'Junior Teacher',
      'Lab Assistant',
      'Administrative Staff',
      'Support Staff',
    ]);
  };

  const calculateTotals = () => {
    const basicSalary = Number(formData.basicSalary) || 0;
    const allowances = Object.values(formData.allowances).reduce(
      (sum, val) => sum + (Number(val) || 0),
      0
    );
    const deductions = Object.values(formData.deductions).reduce(
      (sum, val) => sum + (Number(val) || 0),
      0
    );
    
    return {
      grossSalary: basicSalary + allowances,
      totalAllowances: allowances,
      totalDeductions: deductions,
      netSalary: basicSalary + allowances - deductions,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.templateName || !formData.branchId || !formData.designation || !formData.basicSalary) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingTemplate) {
        const response = await apiClient.put(
          `/api/super-admin/salary-templates/${editingTemplate._id}`,
          formData
        );
        
        if (response.success) {
          toast.success('Salary template updated successfully');
          fetchTemplates();
          handleCloseModal();
        }
      } else {
        const response = await apiClient.post('/api/super-admin/salary-templates', formData);
        
        if (response.success) {
          toast.success('Salary template created successfully');
          fetchTemplates();
          handleCloseModal();
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save salary template');
      console.error(error);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      templateName: template.templateName || '',
      branchId: template.branchId?._id || template.branchId || '',
      designation: template.designation || '',
      basicSalary: template.basicSalary || '',
      description: template.description || '',
      allowances: {
        houseRent: template.allowances?.houseRent || '',
        medical: template.allowances?.medical || '',
        transport: template.allowances?.transport || '',
        other: template.allowances?.other || '',
      },
      deductions: {
        tax: template.deductions?.tax || '',
        providentFund: template.deductions?.providentFund || '',
        insurance: template.deductions?.insurance || '',
        other: template.deductions?.other || '',
      },
      status: template.status || 'active',
    });
    setShowModal(true);
    setActiveTab('basic');
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this salary template?')) return;
    
    try {
      const response = await apiClient.delete(`/api/super-admin/salary-templates/${id}`);
      
      if (response.success) {
        toast.success('Salary template deleted successfully');
        fetchTemplates();
      }
    } catch (error) {
      toast.error('Failed to delete salary template');
      console.error(error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setFormData({
      templateName: '',
      branchId: '',
      designation: '',
      basicSalary: '',
      description: '',
      allowances: {
        houseRent: '',
        medical: '',
        transport: '',
        other: '',
      },
      deductions: {
        tax: '',
        providentFund: '',
        insurance: '',
        other: '',
      },
      status: 'active',
    });
    setActiveTab('basic');
  };

  const totals = calculateTotals();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="h-7 w-7" />
          Salary Templates
        </h1>
        <p className="text-gray-600 mt-1">Create and manage salary structure templates</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Basic Salary</p>
              <p className="text-2xl font-bold text-green-600">
                PKR {stats.avgBasicSalary.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Percent className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Templates</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.activeCount}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search templates by name or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Branches</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="h-5 w-5" />
            New Template
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 p-8 text-center text-gray-500">
            Loading salary templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-3 p-8 text-center text-gray-500">
            No salary templates found
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900">
                      {template.templateName}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">{template.designation}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      template.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {template.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600 mt-2">
                  <Building2 className="h-3 w-3" />
                  {template.branchId?.name}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-xs text-gray-600">Basic Salary</span>
                    <span className="font-semibold text-sm text-gray-900">
                      PKR {Number(template.basicSalary || 0).toLocaleString()}
                    </span>
                  </div>

                  {(template.allowances?.houseRent || template.allowances?.medical ||
                    template.allowances?.transport) && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">Allowances</p>
                      <div className="space-y-1 text-xs text-gray-600">
                        {template.allowances?.houseRent && (
                          <div className="flex justify-between">
                            <span>House Rent</span>
                            <span className="text-gray-900">
                              PKR {Number(template.allowances.houseRent).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {template.allowances?.medical && (
                          <div className="flex justify-between">
                            <span>Medical</span>
                            <span className="text-gray-900">
                              PKR {Number(template.allowances.medical).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {template.allowances?.transport && (
                          <div className="flex justify-between">
                            <span>Transport</span>
                            <span className="text-gray-900">
                              PKR {Number(template.allowances.transport).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(template.deductions?.tax || template.deductions?.providentFund) && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">Deductions</p>
                      <div className="space-y-1 text-xs text-gray-600">
                        {template.deductions?.tax && (
                          <div className="flex justify-between">
                            <span>Tax</span>
                            <span className="text-red-600">
                              PKR {Number(template.deductions.tax).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {template.deductions?.providentFund && (
                          <div className="flex justify-between">
                            <span>Provident Fund</span>
                            <span className="text-red-600">
                              PKR {Number(template.deductions.providentFund).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-700">Net Salary</span>
                    <span className="font-bold text-sm text-green-600">
                      PKR{' '}
                      {(
                        (Number(template.basicSalary || 0) +
                          Object.values(template.allowances || {}).reduce(
                            (sum, val) => sum + (Number(val) || 0),
                            0
                          ) -
                          Object.values(template.deductions || {}).reduce(
                            (sum, val) => sum + (Number(val) || 0),
                            0
                          )) ||
                        0
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center gap-2">
                <button
                  onClick={() => handleEdit(template)}
                  className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200 flex items-center gap-1 justify-center"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(template._id)}
                  className="flex-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200 flex items-center gap-1 justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTemplate ? 'Edit Salary Template' : 'Create Salary Template'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('basic')}
                className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'basic'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Basic Info
              </button>
              <button
                onClick={() => setActiveTab('allowances')}
                className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'allowances'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Allowances
              </button>
              <button
                onClick={() => setActiveTab('deductions')}
                className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'deductions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Deductions
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'summary'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Summary
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Senior Teacher Template"
                      value={formData.templateName}
                      onChange={(e) =>
                        setFormData({ ...formData, templateName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Branch *
                      </label>
                      <select
                        required
                        value={formData.branchId}
                        onChange={(e) =>
                          setFormData({ ...formData, branchId: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Branch</option>
                        {branches.map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Designation *
                      </label>
                      <select
                        required
                        value={formData.designation}
                        onChange={(e) =>
                          setFormData({ ...formData, designation: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Designation</option>
                        {designations.map((des) => (
                          <option key={des} value={des}>
                            {des}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Basic Salary (PKR) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={formData.basicSalary}
                      onChange={(e) =>
                        setFormData({ ...formData, basicSalary: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Optional details about this template"
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Allowances Tab */}
              {activeTab === 'allowances' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2 mb-4">
                    <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      Enter allowances that will be added to the basic salary
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      House Rent (PKR)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.allowances.houseRent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          allowances: {
                            ...formData.allowances,
                            houseRent: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medical (PKR)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.allowances.medical}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          allowances: {
                            ...formData.allowances,
                            medical: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transport (PKR)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.allowances.transport}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          allowances: {
                            ...formData.allowances,
                            transport: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Other Allowances (PKR)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.allowances.other}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          allowances: {
                            ...formData.allowances,
                            other: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Deductions Tab */}
              {activeTab === 'deductions' && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 mb-4">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">
                      Enter deductions that will be subtracted from gross salary
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax (PKR)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.deductions.tax}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deductions: {
                            ...formData.deductions,
                            tax: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provident Fund (PKR)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.deductions.providentFund}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deductions: {
                            ...formData.deductions,
                            providentFund: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Insurance (PKR)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.deductions.insurance}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deductions: {
                            ...formData.deductions,
                            insurance: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Other Deductions (PKR)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.deductions.other}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deductions: {
                            ...formData.deductions,
                            other: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Summary Tab */}
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold text-gray-900">Salary Summary</h3>
                    
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-700">Basic Salary</span>
                      <span className="font-medium">
                        PKR {Number(formData.basicSalary || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-700">Total Allowances</span>
                      <span className="font-medium text-green-600">
                        + PKR {totals.totalAllowances.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-700">Gross Salary</span>
                      <span className="font-medium">
                        PKR {totals.grossSalary.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-700">Total Deductions</span>
                      <span className="font-medium text-red-600">
                        - PKR {totals.totalDeductions.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between py-3 bg-blue-50 px-3 rounded border border-blue-200">
                      <span className="font-semibold text-gray-900">Net Salary</span>
                      <span className="font-bold text-lg text-blue-600">
                        PKR {totals.netSalary.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
