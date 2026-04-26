"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Building2,
  Globe,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  ShieldAlert,
  Calendar,
  XCircle
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

export default function GroupsContent() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [branches, setBranches] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
    branch_ids: [],
    academic_year_id: "",
  });

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const isBranchAdmin = user?.role === ROLES.BRANCH_ADMIN;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resBranches, resGroups, resYears] = await Promise.all([
        isSuperAdmin ? apiClient.get("/api/super-admin/branches?limit=200") : Promise.resolve(null),
        apiClient.get("/api/groups"),
        apiClient.get("/api/academic-years")
      ]);

      console.log("Groups API Response:", resGroups);
      console.log("Academic Years API Response:", resYears);
      
      // Handle Groups
      if (Array.isArray(resGroups)) {
        setGroups(resGroups);
      } else if (resGroups?.groups) {
        setGroups(resGroups.groups);
      } else if (resGroups?.data?.groups) {
        setGroups(resGroups.data.groups);
      }

      // Handle Academic Years
      if (resYears?.academic_years && Array.isArray(resYears.academic_years)) {
        setAcademicYears(resYears.academic_years);
      } else if (Array.isArray(resYears)) {
        setAcademicYears(resYears);
      } else if (resYears?.data?.academic_years) {
         setAcademicYears(resYears.data.academic_years);
      }

      // Handle Branches
      if (isSuperAdmin && resBranches?.data?.branches) {
        setBranches(resBranches.data.branches);
      } else if (isSuperAdmin && Array.isArray(resBranches)) {
        setBranches(resBranches);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    if (!isSuperAdmin && !isBranchAdmin) return;
    setEditingGroup(null);
    setFormData({
      name: "",
      description: "",
      is_active: true,
      branch_ids: [],
      academic_year_id: "",
    });
    setShowModal(true);
  };

  const handleEdit = (grp) => {
    setEditingGroup(grp);
    setFormData({
      name: grp.name || "",
      description: grp.description || "",
      is_active: grp.is_active ?? true,
      branch_ids: grp.branch_id ? [grp.branch_id] : [],
      academic_year_id: grp.academic_year_id || "",
    });
    setShowModal(true);
  };

  const handleToggleActive = async (grp) => {
     try {
        const newState = !grp.is_active;
        await apiClient.put(`/api/groups/${grp.id}`, { is_active: newState });
        toast.success(`Group ${newState ? 'activated' : 'deactivated'} successfully`);
        loadData();
     } catch (error) {
        toast.error("Failed to update status");
     }
  };

  const handleDeleteClick = (id) => {
    if (!isSuperAdmin) {
      toast.error("Only Super Admin can delete records");
      return;
    }
    setDeleteModal({ show: true, id });
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/api/groups/${deleteModal.id}`);
      toast.success("Group deleted successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to delete group");
    } finally {
      setDeleteModal({ show: false, id: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Please fill Name");
      return;
    }
    if (isSuperAdmin && !editingGroup && formData.branch_ids.length === 0) {
      toast.error("Please select at least one branch");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active,
        academic_year_id: formData.academic_year_id || null,
      };

      if (editingGroup) {
        const payloadWithBranch = { ...payload };
        if (isSuperAdmin) {
          payloadWithBranch.branch_id = formData.branch_ids[0];
        }
        await apiClient.put(`/api/groups/${editingGroup.id}`, payloadWithBranch);
        toast.success("Group updated successfully");
      } else {
        if (isSuperAdmin && formData.branch_ids.length > 0) {
          const promises = formData.branch_ids.map(bid => 
             apiClient.post("/api/groups", { ...payload, branch_id: bid })
          );
          await Promise.all(promises);
          toast.success(`Groups created for ${formData.branch_ids.length} branches`);
        } else {
          await apiClient.post("/api/groups", payload);
          toast.success("Group created successfully");
        }
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save group");
    }
  };

  if (loading && groups.length === 0) {
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
          title="Delete Study Group"
          message="Are you sure you want to permanently delete this group? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal({ show: false, id: null })}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-3">
             <Users className="w-8 h-8 text-blue-600" />
             Study Groups
          </h1>
          <p className="text-sm text-gray-500 font-medium tracking-tight mt-1">
            {isSuperAdmin 
              ? "Manage groups dynamically for branches"
              : "View and manage study groups assigned to your branch"
            }
          </p>
        </div>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 h-10 px-4 rounded-lg shadow-sm">
           <Plus className="w-4 h-4 mr-2" />
           Add New Group
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {groups.length === 0 ? (
          <div className="col-span-full bg-slate-50/50 p-16 rounded-3xl border border-slate-200 border-dashed text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium text-lg">No groups defined yet.</p>
          </div>
        ) : (
          groups.map((grp) => (
            <div key={grp.id} className="group bg-white rounded-2xl border transition-all duration-300 flex flex-col hover:shadow-xl hover:-translate-y-1 overflow-hidden hover:border-blue-200">
              {/* Card Header */}
              <div className={`p-5 border-b relative overflow-hidden ${
                 grp.branch_id === null ? "bg-gradient-to-br from-blue-50/80 via-white to-blue-50/50 border-blue-100" : "bg-gradient-to-br from-slate-50/80 to-slate-100/50 border-slate-100"
              }`}>
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none ${
                   grp.branch_id === null ? 'bg-blue-400/20' : 'bg-slate-300/20'
                }`} />
                
                <div className="relative flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight line-clamp-1">{grp.name}</h3>
                    {grp.is_active ? (
                       <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
                         Active
                       </span>
                    ) : (
                       <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                         Inactive
                       </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 text-xs font-semibold tracking-wide">
                      {grp.branch_id ? (
                         <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-blue-600 shadow-sm">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{isSuperAdmin ? (grp.branch?.name || 'Unknown Branch') : "Campus Scope"}</span>
                         </div>
                      ) : (
                         <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-purple-600 shadow-sm">
                            <Globe className="w-3.5 h-3.5" />
                            <span>Global</span>
                         </div>
                      )}

                      {grp.academic_year && (
                         <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-emerald-600 shadow-sm">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{grp.academic_year.name}</span>
                         </div>
                      )}
                  </div>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1 bg-white">
                 <div className="flex flex-col gap-1 mb-5">
                   {grp.description && (
                     <p className="text-sm text-slate-500 mt-2 line-clamp-2">{grp.description}</p>
                   )}
                </div>

                <div className="mt-auto flex flex-col gap-2.5">
                  <div className="flex gap-2.5">
                    {((isBranchAdmin && grp.branch_id) || isSuperAdmin) && (
                      <Button onClick={() => handleEdit(grp)} className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold shadow-sm transition-colors">
                        <Edit className="w-4 h-4 mr-2 text-slate-500" />
                        Edit details
                      </Button>
                    )}
                    {isSuperAdmin && (
                      <Button onClick={() => handleDeleteClick(grp.id)} className="w-12 shrink-0 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-600 shadow-sm transition-colors px-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {((isBranchAdmin && grp.branch_id) || isSuperAdmin) && (
                    <Button
                      onClick={() => handleToggleActive(grp)}
                      className={`w-full border shadow-sm transition-all group/btn relative overflow-hidden ${
                        grp.is_active 
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border-amber-200" 
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border-emerald-200"
                      }`}
                    >
                      {grp.is_active ? (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          <span className="font-bold relative z-10">Deactivate Group</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="font-bold relative z-10">Activate Group</span>
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
         <Modal open={showModal} onClose={() => setShowModal(false)} title={
               <div className="flex items-center gap-3 text-slate-800">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Users className="w-5 h-5" /></div>
                  <span className="font-bold">{editingGroup ? 'Edit Group' : 'Add New Group'}</span>
               </div>
            } size="lg">
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
                                 disabled={editingGroup}
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
                       {!editingGroup && formData.branch_ids.length > 1 && (
                         <p className="text-[11px] text-amber-600 font-bold mt-2 bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center gap-2">
                           <ShieldAlert className="w-4 h-4" />
                           Note: Creating multiple branch-specific groups.
                         </p>
                       )}
                    </div>
                  )}

                  <div className="space-y-1.5 md:col-span-2">
                     <label className="text-sm font-bold text-slate-700">Group Name <span className="text-red-500">*</span></label>
                     <Input placeholder="e.g., Pre-Medical" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  
                  <div className="space-y-1.5 md:col-span-2">
                     <label className="text-sm font-bold text-slate-700">Academic Session (Optional)</label>
                     <Dropdown
                       options={[
                         { value: "", label: "No Specific Session" },
                         ...academicYears.map(y => ({ value: y.id, label: `${y.name} ${y.is_current ? '(Current)' : ''}` }))
                       ]}
                       value={formData.academic_year_id}
                       onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
                       placeholder="Select Academic Year"
                     />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                     <label className="text-sm font-bold text-slate-700">Description</label>
                     <Input placeholder="Optional detailed information..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </div>
               </div>

               <div className="pt-2">
                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors max-w-xs">
                    <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-5 h-5 rounded border-slate-300 text-blue-600" />
                    <div>
                      <span className="text-sm font-bold text-slate-800">Is Active</span>
                      <p className="text-xs text-slate-500">Enable this group for use.</p>
                    </div>
                  </label>
               </div>

               <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="px-6 text-slate-600">Cancel</Button>
                  <Button type="submit" className="px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100">
                     {editingGroup ? 'Save Changes' : 'Create Group'}
                  </Button>
               </div>
            </form>
         </Modal>
      )}
    </div>
  );
}
