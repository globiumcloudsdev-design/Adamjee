"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Calendar,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  RefreshCw,
  Globe,
  Clock,
  ArrowRight,
  Building2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";
import Dropdown from "@/components/ui/dropdown";
import Modal from "@/components/ui/modal";
import DatePicker from "@/components/ui/date-picker";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import { useAuth } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import apiClient from "@/lib/api-client";

export default function AcademicYearsContent() {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    is_current: false,
    branch_ids: [], 
  });

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const isBranchAdmin = user?.role === ROLES.BRANCH_ADMIN;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const requests = [apiClient.get("/api/academic-years")];
      
      if (isSuperAdmin) {
        requests.push(apiClient.get("/api/super-admin/branches?limit=200"));
      }

      const [yearsRes, branchesRes] = await Promise.all(requests);

      if (yearsRes?.academic_years) {
        setAcademicYears(yearsRes.academic_years);
      }
      
      if (isSuperAdmin && branchesRes?.data?.branches) {
        setBranches(branchesRes.data.branches);
      }
    } catch (error) {
      console.error("Failed to load academic data:", error);
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    if (!isSuperAdmin && !isBranchAdmin) return;
    setEditingYear(null);
    setFormData({
      name: "",
      start_date: "",
      end_date: "",
      is_current: false,
      branch_ids: [],
    });
    setShowModal(true);
  };

  const handleEdit = (year) => {
    if (isBranchAdmin && year.branch_id === null) {
       toast.error("Branch admins cannot edit global years.");
       return;
    }
    
    setEditingYear(year);
    setFormData({
      name: year.name || "",
      start_date: year.start_date ? year.start_date.split("T")[0] : "",
      end_date: year.end_date ? year.end_date.split("T")[0] : "",
      is_current: year.is_current || false,
      branch_ids: year.branch_id ? [year.branch_id] : [],
    });
    setShowModal(true);
  };

   const handleDeleteClick = (id) => {
    if (!isSuperAdmin) {
      toast.error("Only Super Admin can delete academic years");
      return;
    }
    setDeleteModal({ show: true, id });
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/api/academic-years/${deleteModal.id}`);
      toast.success("Academic year deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete");
    } finally {
      setDeleteModal({ show: false, id: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.start_date || !formData.end_date) {
      toast.error("Please fill required fields (Name, Start Date, End Date)");
      return;
    }

    if (isSuperAdmin && formData.branch_ids.length === 0) {
      toast.error("Please select at least one branch");
      return;
    }

    try {
      const basePayload = {
        name: formData.name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_current: formData.is_current,
      };

      if (editingYear) {
        const payload = { ...basePayload };
        if (isSuperAdmin) {
          payload.branch_id = formData.branch_ids[0] || editingYear.branch_id;
        }
        await apiClient.put(`/api/academic-years/${editingYear.id}`, payload);
        toast.success("Academic year updated");
      } else {
        if (isSuperAdmin && formData.branch_ids.length > 0) {
          // Create for multiple branches
          const promises = formData.branch_ids.map(bid => 
            apiClient.post("/api/academic-years", { ...basePayload, branch_id: bid })
          );
          await Promise.all(promises);
          toast.success(`Created for ${formData.branch_ids.length} branches`);
        } else {
          // Single branch (Branch Admin case or Super Admin with single selection)
          const payload = { ...basePayload };
          if (isSuperAdmin) {
            payload.branch_id = formData.branch_ids[0] || null;
          }
          await apiClient.post("/api/academic-years", payload);
          toast.success("Academic year created successfully");
        }
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error.message || "Failed to save");
    }
  };

  const handleToggleCurrent = async (year) => {
    try {
      const newState = !year.is_current;
      const payload = {
        name: year.name,
        is_current: newState,
      };
      await apiClient.put(`/api/academic-years/${year.id}`, payload);
      toast.success(newState ? "Academic cycle activated" : "Academic cycle deactivated");
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to update status");
    }
  };

  // Stats
  const activeYears = academicYears.filter((y) => y.is_current).length;
  const currentGlobalYear = academicYears.find((y) => y.is_current && !y.branch_id);

  if (loading && academicYears.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <ConfirmDeleteModal
          title="Delete Academic Session"
          message="Are you sure you want to permanently delete this academic cycle? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal({ show: false, id: null })}
        />
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-3">
             <CalendarDays className="w-8 h-8 text-blue-600" />
             Academic Timelines
          </h1>
          <p className="text-sm text-gray-500 font-medium tracking-tight mt-1">
            {isSuperAdmin 
              ? "Manage branch-specific academic cycles across all campuses"
              : "View academic cycles and manage timelines for your assigned branch"
            }
          </p>
        </div>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 h-10 px-4 rounded-lg shadow-sm">
           <Plus className="w-4 h-4 mr-2" />
           Add Academic Year
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform duration-500 ease-out" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Cycles</p>
              <p className="text-3xl font-black text-slate-800 tracking-tight mt-1">{academicYears.length}</p>
            </div>
            <div className="w-12 h-12 bg-white/90 backdrop-blur border border-blue-100 rounded-xl flex items-center justify-center shadow-sm">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform duration-500 ease-out" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Active Current</p>
              <p className="text-3xl font-black text-slate-800 tracking-tight mt-1">{activeYears}</p>
            </div>
            <div className="w-12 h-12 bg-white/90 backdrop-blur border border-emerald-100 rounded-xl flex items-center justify-center shadow-sm">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform duration-500 ease-out" />
          <div className="relative flex items-center justify-between w-full">
            <div className="w-full pr-4 overflow-hidden">
              <p className="text-sm font-medium text-slate-500">Global Active Year</p>
              <p className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mt-1.5 truncate">
                 {currentGlobalYear?.name || 'Not Set'}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/90 backdrop-blur border border-indigo-100 rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-50 rounded-full group-hover:scale-110 transition-transform duration-500 ease-out" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Branch Scopes</p>
              <p className="text-3xl font-black text-slate-800 tracking-tight mt-1">
                 {new Set(academicYears.filter(y => y.branch_id).map(y => y.branch_id)).size}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/90 backdrop-blur border border-purple-100 rounded-xl flex items-center justify-center shadow-sm">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Academic Years Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {academicYears.length === 0 ? (
          <div className="col-span-full bg-slate-50/50 p-16 rounded-3xl border border-slate-200 border-dashed text-center">
            <CalendarDays className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium text-lg">No academic years defined yet.</p>
            <p className="text-slate-400 text-sm mt-1">Get started by adding your first academic cycle.</p>
          </div>
        ) : (
          academicYears.map((year) => (
            <div key={year.id} className="group bg-white rounded-2xl border transition-all duration-300 flex flex-col hover:shadow-xl hover:-translate-y-1 overflow-hidden hover:border-blue-200">
              {/* Card Header Gradient */}
              <div className={`p-5 border-b relative overflow-hidden ${
                 year.is_current 
                 ? "bg-gradient-to-br from-blue-50/80 via-white to-blue-50/50 border-blue-100" 
                 : "bg-gradient-to-br from-slate-50/80 to-slate-100/50 border-slate-100"
              }`}>
                {/* Decorative background accent */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none ${
                   year.is_current ? 'bg-blue-400/20' : 'bg-slate-300/20'
                }`} />
                
                <div className="relative flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight line-clamp-1">{year.name}</h3>
                    {year.is_current ? (
                       <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                         Active Current
                       </span>
                    ) : (
                       <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                         Inactive
                       </span>
                    )}
                  </div>
                  
                  <div className="text-xs font-semibold tracking-wide">
                     {year.branch_id ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-blue-600 shadow-sm">
                           <Building2 className="w-3.5 h-3.5" />
                           <span>
                             {year.branch?.name || (isSuperAdmin ? (branches.find(b => b.id === year.branch_id)?.name || 'Unknown Branch') : "Specific Campus Scope")}
                           </span>
                        </div>
                     ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-purple-600 shadow-sm">
                           <Globe className="w-3.5 h-3.5" />
                           <span>System-wide (Global Scope)</span>
                        </div>
                     )}
                  </div>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1 bg-white">
                <div className="flex items-center justify-center p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 mb-5 relative group-hover:bg-blue-50/30 transition-colors">
                  <div className="flex items-center justify-between w-full relative z-10">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Starts</span>
                       <span className="font-semibold text-slate-700">{format(new Date(year.start_date), 'dd MMM, yyyy')}</span>
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm">
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex flex-col text-right">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Ends</span>
                       <span className="font-semibold text-slate-700">{format(new Date(year.end_date), 'dd MMM, yyyy')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-2.5">
                  <div className="flex gap-2.5">
                    {((isBranchAdmin && year.branch_id) || isSuperAdmin) && (
                      <Button
                        onClick={() => handleEdit(year)}
                        className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold shadow-sm transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-2 text-slate-500" />
                        Edit details
                      </Button>
                    )}
                    {isSuperAdmin && (
                      <Button
                        onClick={() => handleDeleteClick(year.id)}
                        className="w-12 shrink-0 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-600 shadow-sm transition-colors px-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {((isBranchAdmin && year.branch_id) || isSuperAdmin) && (
                    <Button
                      onClick={() => handleToggleCurrent(year)}
                      className={`w-full border shadow-sm transition-all group/btn relative overflow-hidden ${
                        year.is_current 
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border-amber-200" 
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border-emerald-200"
                      }`}
                    >
                      <span className={`absolute inset-0 w-full h-full transition-opacity opacity-0 group-hover/btn:opacity-20 ${
                        year.is_current ? 'bg-amber-400' : 'bg-emerald-400'
                      }`} />
                      {year.is_current ? (
                        <>
                          <Clock className="w-4 h-4 mr-2" />
                          <span className="font-bold relative z-10">Deactivate Cycle</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="font-bold relative z-10">Mark as Current Cycle</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
         <Modal
            open={showModal}
            onClose={() => setShowModal(false)}
            title={
               <div className="flex items-center gap-3 text-slate-800">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><CalendarDays className="w-5 h-5" /></div>
                  <span className="font-bold">{editingYear ? 'Edit Academic Year' : 'Create Academic Year'}</span>
               </div>
            }
            size="lg"
         >
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {isSuperAdmin && (
                    <div className="space-y-3 md:col-span-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                       <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                         <Building2 className="w-4 h-4 text-blue-600" />
                         Assign to Campus(es)
                       </label>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         {branches.map((branch) => {
                           const isSelected = formData.branch_ids.includes(branch.id);
                           return (
                             <label 
                               key={branch.id} 
                               className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                             >
                               <input
                                 type="checkbox"
                                 checked={isSelected}
                                 disabled={editingYear}
                                 onChange={(e) => {
                                   const newIds = e.target.checked 
                                     ? [...formData.branch_ids, branch.id]
                                     : formData.branch_ids.filter(id => id !== branch.id);
                                   setFormData({ ...formData, branch_ids: newIds });
                                 }}
                                 className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                               />
                               <div className="flex flex-col">
                                 <span className="text-sm font-bold text-slate-800 truncate max-w-[150px]">{branch.name}</span>
                                 <span className="text-[10px] text-slate-500 font-medium">{branch.code || 'Campus'}</span>
                               </div>
                             </label>
                           );
                         })}
                       </div>
                       {!editingYear && formData.branch_ids.length > 0 && (
                         <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1 mt-2 bg-amber-50 p-2 rounded-lg border border-amber-100">
                           <RefreshCw className="w-3 h-3 animate-spin" />
                           Note: Choosing multiple branches will create separate records for each.
                         </p>
                       )}
                    </div>
                  )}

                  <div className="space-y-1.5 md:col-span-2">
                     <label className="text-sm font-bold text-slate-700">Year Name / Label <span className="text-red-500">*</span></label>
                     <Input
                        placeholder="e.g., 2024-2025"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                     />
                  </div>
                  <div>
                     <DatePicker
                        label="Start Date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        required
                     />
                  </div>
                  <div>
                     <DatePicker
                        label="End Date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        required
                     />
                  </div>
               </div>

               <div className="pt-2">
                 <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                   <input
                     type="checkbox"
                     checked={formData.is_current}
                     onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                     className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                   />
                   <div>
                     <span className="text-sm font-bold text-slate-800 tracking-tight">Active Current</span>
                     <p className="text-xs text-slate-500 mt-0.5">Check this to make it the executing academic year for its respective scope.</p>
                   </div>
                 </label>
               </div>

               <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="px-6 text-slate-600">Cancel</Button>
                  <Button type="submit" className="px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100">
                     {editingYear ? 'Save Changes' : 'Create Year'}
                  </Button>
               </div>
            </form>
         </Modal>
      )}
    </div>
  );
}
