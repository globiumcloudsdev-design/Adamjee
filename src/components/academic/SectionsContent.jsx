"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Users,
  ChevronRight,
  ShieldCheck,
  Building2,
  CalendarDays,
  MoreVertical,
  Activity,
  CheckCircle2,
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

export default function SectionsContent() {
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [classes, setClasses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

  // Filter states for the creation form
  const [selectedBranch, setSelectedBranch] = useState(user?.branch_id || "");
  const [selectedGroup, setSelectedGroup] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    class_id: "",
    capacity: 40,
    is_active: true,
  });

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const requests = [
        apiClient.get("/api/sections"),
        apiClient.get("/api/classes"),
        apiClient.get("/api/groups"),
      ];

      if (isSuperAdmin) {
        requests.push(apiClient.get("/api/super-admin/branches?limit=200"));
      }

      const results = await Promise.all(requests);
      
      setSections(Array.isArray(results[0]) ? results[0] : (results[0]?.sections || []));
      setClasses(Array.isArray(results[1]) ? results[1] : (results[1]?.classes || []));
      setGroups(Array.isArray(results[2]) ? results[2] : (results[2]?.groups || []));

      if (isSuperAdmin && results[3]?.data?.branches) {
        setBranches(results[3].data.branches);
      }
    } catch (error) {
      console.error("Load error:", error);
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddNew = () => {
    setEditingSection(null);
    setFormData({
      name: "",
      class_id: "",
      capacity: 40,
      is_active: true,
    });
    setSelectedGroup("");
    setShowModal(true);
  };

  const handleEdit = (sec) => {
    setEditingSection(sec);
    setFormData({
      name: sec.name,
      class_id: sec.class_id,
      capacity: sec.capacity,
      is_active: sec.is_active,
    });
    // Pre-fill filters based on existing section
    setSelectedBranch(sec.class?.branch_id || "");
    setSelectedGroup(sec.class?.group_id || "");
    setShowModal(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteModal({ show: true, id });
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/api/sections/${deleteModal.id}`);
      toast.success("Section deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete section");
    } finally {
      setDeleteModal({ show: false, id: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.class_id) {
      toast.error("Required fields: Name and Class");
      return;
    }

    try {
      if (editingSection) {
        await apiClient.put(`/api/sections/${editingSection.id}`, formData);
        toast.success("Section updated");
      } else {
        await apiClient.post("/api/sections", formData);
        toast.success("Section created");
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save section");
    }
  };

  const handleStatusToggle = async (sec) => {
    try {
        await apiClient.put(`/api/sections/${sec.id}`, { is_active: !sec.is_active });
        toast.success("Status updated");
        loadData();
    } catch (error) {
        toast.error("Failed to update status");
    }
  }

  // Dependent Filtering Logic
  const filteredGroups = useMemo(() => 
    groups.filter(g => g.is_active && (!selectedBranch || g.branch_id === selectedBranch))
  , [groups, selectedBranch]);

  const filteredClasses = useMemo(() => 
    classes.filter(c => 
      c.is_active && 
      (!selectedBranch || c.branch_id === selectedBranch) &&
      (!selectedGroup || c.group_id === selectedGroup)
    )
  , [classes, selectedBranch, selectedGroup]);

  return (
    <div className="space-y-6">
      {deleteModal.show && (
        <ConfirmDeleteModal
          title="Delete Section"
          message="Are you sure you want to delete this section? This will remove all student assignments for this section."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal({ show: false, id: null })}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-fuchsia-600 rounded-xl shadow-lg shadow-fuchsia-200 dark:shadow-none">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Section Management</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Configure and track class divisions</p>
          </div>
        </div>
        <Button onClick={handleAddNew} className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl px-6 h-11 transition-all">
          <Plus className="w-4 h-4 mr-2" />
          New Section
        </Button>
      </div>

      {/* Sections Grid/List */}
      {loading && sections.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sections.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <Layers className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No sections found.</p>
            </div>
          ) : (
            sections.map((sec) => (
              <div key={sec.id} className="group bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 flex flex-col hover:shadow-xl hover:-translate-y-1 overflow-hidden hover:border-fuchsia-200 dark:hover:border-fuchsia-900 h-full">
                {/* Card Header Gradient */}
                <div className={`p-4 border-b relative overflow-hidden ${
                   sec.is_active 
                   ? "bg-gradient-to-br from-fuchsia-50/80 via-white to-fuchsia-50/50 dark:from-fuchsia-950/20 dark:via-slate-900 dark:to-fuchsia-950/10 border-fuchsia-100 dark:border-fuchsia-900/30" 
                   : "bg-gradient-to-br from-slate-50/80 to-slate-100/50 dark:from-slate-900 dark:to-slate-800 border-slate-100 dark:border-slate-800"
                }`}>
                  {/* Decorative background accent */}
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none ${
                     sec.is_active ? 'bg-fuchsia-400/20' : 'bg-slate-300/20'
                  }`} />
                  
                  <div className="relative flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight line-clamp-1 uppercase">SEC {sec.name}</h3>
                      {sec.is_active ? (
                         <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                           <span className="w-1 h-1 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                           Active
                         </span>
                      ) : (
                         <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                           Inactive
                         </span>
                      )}
                    </div>
                    
                    <div className="text-[10px] font-semibold tracking-wide">
                       <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-fuchsia-600 dark:text-fuchsia-400 shadow-sm">
                          <Layers className="w-3 h-3" />
                          <span>{sec.class?.name || 'MANUAL'}</span>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1 bg-white dark:bg-slate-900">
                  <div className="space-y-2.5 mb-5">
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 group-hover:bg-fuchsia-50/30 dark:group-hover:bg-fuchsia-900/10 transition-colors">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-fuchsia-500" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Capacity</span>
                      </div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">{sec.capacity} Seats</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Branch</span>
                      </div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate max-w-[100px]">{sec.class?.branch?.name || 'Local'}</span>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(sec)}
                        className="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold shadow-sm transition-colors h-9 text-[11px] px-0"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteClick(sec.id)}
                        className="w-9 shrink-0 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 border border-slate-200 dark:border-slate-700 hover:border-red-200 text-slate-400 hover:text-red-600 shadow-sm transition-colors px-0 h-9"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <Button
                      onClick={() => handleStatusToggle(sec)}
                      className={`w-full border shadow-sm transition-all group/btn relative overflow-hidden h-9 text-[11px] ${
                        sec.is_active 
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border-amber-200 dark:bg-amber-950/20 dark:text-amber-500 dark:border-amber-900/50" 
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-500 dark:border-emerald-900/50"
                      }`}
                    >
                      <span className={`absolute inset-0 w-full h-full transition-opacity opacity-0 group-hover/btn:opacity-20 ${
                        sec.is_active ? 'bg-amber-400' : 'bg-emerald-400'
                      }`} />
                      {sec.is_active ? (
                        <>
                          <XCircle className="w-3.5 h-3.5 mr-1.5" />
                          <span className="font-bold relative z-10 transition-colors uppercase tracking-tight">Deactivate</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          <span className="font-bold relative z-10 transition-colors uppercase tracking-tight">Activate</span>
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

      {/* Logic Modal */}
      {showModal && (
        <Modal 
          open={showModal} 
          onClose={() => setShowModal(false)}
          title={
            <div className="flex items-center gap-3">
              <div className="p-2 bg-fuchsia-100 rounded-lg text-fuchsia-600"><Layers className="w-5 h-5" /></div>
              <span className="font-bold">{editingSection ? 'Modify Section' : 'Create Section'}</span>
            </div>
          }
          size="lg"
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Hierarchical Filters */}
              {isSuperAdmin && (
                <div className="col-span-full space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Select Campus</label>
                  <Dropdown
                    value={selectedBranch}
                    onChange={(e) => {
                       setSelectedBranch(e.target.value);
                       setSelectedGroup("");
                       setFormData({ ...formData, class_id: "" });
                    }}
                    placeholder="Choose Branch"
                    options={branches.map(b => ({ label: b.name, value: b.id }))}
                    disabled={!!editingSection}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Filter by Group</label>
                <Dropdown
                  value={selectedGroup}
                  onChange={(e) => {
                     setSelectedGroup(e.target.value);
                     setFormData({ ...formData, class_id: "" });
                  }}
                  placeholder="Select Group"
                  options={filteredGroups.map(g => ({ label: g.name, value: g.id }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Linked Class <span className="text-red-500 font-black">*</span></label>
                <Dropdown
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  placeholder="Select Class"
                  options={filteredClasses.map(c => ({ label: c.name, value: c.id }))}
                />
                {!selectedGroup && !selectedBranch && isSuperAdmin && (
                   <p className="text-[10px] text-amber-600 font-bold italic">Select branch and group to find classes</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Section Name</label>
                <Input
                  placeholder="e.g., A, B, RED, JUPITER"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Student Capacity</label>
                <Input
                  type="number"
                  placeholder="40"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                />
              </div>

              <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 cursor-pointer md:col-span-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-fuchsia-600"
                />
                <div className="flex flex-col">
                   <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">Enable Section</span>
                   <span className="text-[10px] text-slate-400 mt-1 font-medium">Makes this section available for student enrollment</span>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="px-6">Cancel</Button>
              <Button type="submit" className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-10 rounded-xl font-bold transition-all shadow-lg shadow-fuchsia-100 dark:shadow-none h-11">
                {editingSection ? 'Save Changes' : 'Create Section'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
