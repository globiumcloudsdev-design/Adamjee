"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Building2,
  CalendarDays,
  Plus,
  Edit,
  Trash2,
  Users,
  LayoutGrid,
  CheckCircle,
  XCircle,
  ChevronRight,
  MoreVertical,
  Layers,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import Dropdown from "@/components/ui/dropdown";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import { useAuth } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import apiClient from "@/lib/api-client";

export default function ClassesContent() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [groups, setGroups] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

  const [formData, setFormData] = useState({
    name: "",
    group_id: "",
    branch_id: user?.branch_id || "",
    academic_year_id: "",
    is_active: true,
  });

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const requests = [
        apiClient.get("/api/classes"),
        apiClient.get("/api/groups"),
        apiClient.get("/api/academic-years"),
      ];

      if (isSuperAdmin) {
        requests.push(apiClient.get("/api/super-admin/branches?limit=200"));
      }

      const results = await Promise.all(requests);
      
      // New API returns array directly
      setClasses(Array.isArray(results[0]) ? results[0] : (results[0]?.classes || []));
      setGroups(Array.isArray(results[1]) ? results[1] : (results[1]?.groups || []));
      
      const yearsData = results[2];
      setAcademicYears(Array.isArray(yearsData) ? yearsData : (yearsData?.academic_years || []));

      if (isSuperAdmin && results[3]?.data?.branches) {
        setBranches(results[3].data.branches);
      }
    } catch (error) {
      console.error("Load error:", error);
      toast.error("Failed to load academic records");
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddNew = () => {
    setEditingClass(null);
    setFormData({
      name: "",
      group_id: "",
      branch_id: user?.branch_id || "",
      academic_year_id: academicYears.find(y => y.is_current)?.id || "",
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      group_id: cls.group_id,
      branch_id: cls.branch_id,
      academic_year_id: cls.academic_year_id || "",
      is_active: cls.is_active,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteModal({ show: true, id });
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/api/classes/${deleteModal.id}`);
      toast.success("Class deleted successfully");
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete class");
    } finally {
      setDeleteModal({ show: false, id: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.group_id || (isSuperAdmin && !formData.branch_id)) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      if (editingClass) {
        await apiClient.put(`/api/classes/${editingClass.id}`, formData);
        toast.success("Class updated successfully");
      } else {
        await apiClient.post("/api/classes", formData);
        toast.success("Class created successfully");
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save class");
    }
  };

  const handleStatusToggle = async (cls) => {
    try {
      await apiClient.put(`/api/classes/${cls.id}`, { is_active: !cls.is_active });
      toast.success(`Class ${!cls.is_active ? 'activated' : 'deactivated'}`);
      loadData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  }

  // Filter groups based on selected branch
  const filteredGroups = groups.filter(g => 
    g.is_active && (!formData.branch_id || g.branch_id === formData.branch_id)
  );

  return (
    <div className="space-y-6">
      {deleteModal.show && (
        <ConfirmDeleteModal
          title="Delete Class"
          message="Are you sure you want to delete this class? This will also affect linked sections."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal({ show: false, id: null })}
        />
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Classes Directory</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Manage grade levels and academic streams</p>
          </div>
        </div>
        <Button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 h-11 transition-all">
          <Plus className="w-4 h-4 mr-2" />
          Add Class
        </Button>
      </div>

      {/* Classes Grid */}
      {loading && classes.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No classes found. Start by adding one.</p>
            </div>
          ) : (
            classes.map((cls) => (
              <div key={cls.id} className="group bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 flex flex-col hover:shadow-xl hover:-translate-y-1 overflow-hidden hover:border-indigo-200 dark:hover:border-indigo-900 h-full">
                {/* Card Header Gradient */}
                <div className={`p-5 border-b relative overflow-hidden ${
                   cls.is_active 
                   ? "bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/50 dark:from-indigo-950/20 dark:via-slate-900 dark:to-indigo-950/10 border-indigo-100 dark:border-indigo-900/30" 
                   : "bg-gradient-to-br from-slate-50/80 to-slate-100/50 dark:from-slate-900 dark:to-slate-800 border-slate-100 dark:border-slate-800"
                }`}>
                  {/* Decorative background accent */}
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none ${
                     cls.is_active ? 'bg-indigo-400/20' : 'bg-slate-300/20'
                  }`} />
                  
                  <div className="relative flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight line-clamp-1 uppercase">{cls.name}</h3>
                      {cls.is_active ? (
                         <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                           Active
                         </span>
                      ) : (
                         <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                           Inactive
                         </span>
                      )}
                    </div>
                    
                    <div className="text-xs font-semibold tracking-wide">
                       <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm">
                          <Users className="w-3.5 h-3.5" />
                          <span>{cls.group?.name || 'GENERIC CLASS'}</span>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1 bg-white dark:bg-slate-900">
                  <div className="flex flex-col gap-3 mb-5">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-900/10 transition-colors">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Academic Year</span>
                      </div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">{cls.academic_year?.name || '---'}</span>
                    </div>

                    {isSuperAdmin && (
                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Branch</span>
                        </div>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{cls.branch?.name || 'Global'}</span>
                      </div>
                    )}
                  </div>

                  {/* Bound Units Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Layers className="w-3 h-3" /> Linked Sections
                      </span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md border border-slate-200 dark:border-slate-700">
                        {cls.sections?.length || 0}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 min-h-[40px]">
                      {cls.sections?.length > 0 ? (
                        cls.sections.map(sec => (
                          <div key={sec.id} className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                            <ChevronRight className="w-2.5 h-2.5 text-indigo-400" />
                            {sec.name}
                          </div>
                        ))
                      ) : (
                        <div className="w-full py-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center">
                          <span className="text-[10px] text-slate-400 font-bold italic uppercase">No Units</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-2.5">
                    <div className="flex gap-2.5">
                      <Button
                        onClick={() => handleEdit(cls)}
                        className="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold shadow-sm transition-colors h-10 px-0"
                      >
                        <Edit className="w-4 h-4 mr-2 text-slate-500" />
                        Edit details
                      </Button>
                      <Button
                        onClick={() => handleDeleteClick(cls.id)}
                        className="w-12 shrink-0 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 border border-slate-200 dark:border-slate-700 hover:border-red-200 text-slate-400 hover:text-red-600 shadow-sm transition-colors px-0 h-10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <Button
                      onClick={() => handleStatusToggle(cls)}
                      className={`w-full border shadow-sm transition-all group/btn relative overflow-hidden h-10 ${
                        cls.is_active 
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border-amber-200 dark:bg-amber-950/20 dark:text-amber-500 dark:border-amber-900/50" 
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-500 dark:border-emerald-900/50"
                      }`}
                    >
                      <span className={`absolute inset-0 w-full h-full transition-opacity opacity-0 group-hover/btn:opacity-20 ${
                        cls.is_active ? 'bg-amber-400' : 'bg-emerald-400'
                      }`} />
                      {cls.is_active ? (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          <span className="font-bold relative z-10 transition-colors">Deactivate Class</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="font-bold relative z-10 transition-colors">Activate Class</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal 
          open={showModal} 
          onClose={() => setShowModal(false)}
          title={
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Layers className="w-5 h-5" /></div>
              <span className="font-bold">{editingClass ? 'Update Class' : 'Create New Class'}</span>
            </div>
          }
          size="lg"
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isSuperAdmin && (
                <div className="col-span-full">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Target Branch</label>
                  <Dropdown
                    value={formData.branch_id}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value, group_id: "" })}
                    placeholder="Select Branch"
                    options={branches.map(b => ({ label: b.name, value: b.id }))}
                    disabled={!!editingClass}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">Class Name</label>
                <Input
                  placeholder="e.g., 9TH, 10TH, FIRST YEAR"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">Parent Group</label>
                <Dropdown
                  value={formData.group_id}
                  onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                  placeholder="Select Group"
                  options={filteredGroups.map(g => ({ label: g.name, value: g.id }))}
                />
                {!formData.branch_id && isSuperAdmin && (
                  <p className="text-[10px] text-amber-600 font-medium italic">Please select a branch first</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">Academic Session</label>
                <Dropdown
                  value={formData.academic_year_id}
                  onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
                  placeholder="Select Session"
                  options={academicYears.map(y => ({ label: `${y.name} ${y.is_current ? '(Current)' : ''}`, value: y.id }))}
                />
              </div>

              <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 cursor-pointer self-end">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600"
                />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Set as Active</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
                {editingClass ? 'Update Class' : 'Create Class'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
