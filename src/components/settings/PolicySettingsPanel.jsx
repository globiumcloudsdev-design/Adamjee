"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Power,
  Search,
  Sparkles,
  Loader2,
  Building2,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/ui/modal";
import apiClient from "@/lib/api-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const POLICY_TYPE_OPTIONS = [
  "id_card",
  "payroll",
  "weekly_off",
  "holiday",
  "event",
  "shift",
];

const INITIAL_CONFIGS = {
  payroll: {
    base_currency: "PKR",
    payment_cycle: "monthly",
    salary_date: 5,
    overtime_multiplier: 1.5,
    tax_enabled: true,
  },
  id_card: {
    policy_name: "",
    policy_type: "id_card",
    template: "standard",
    show_qr: true,
  },
  weekly_off: {
    policy_name: "",
    policy_type: "weekly_off",
    day_off_name: "Sunday",
  },
  event: {
    policy_name: "",
    policy_type: "event",
    event_type: "Academic",
    event_date: "",
  },
  shift: {
    start_time: "09:00",
    end_time: "17:00",
    grace_period_mins: 10,
    break_duration_mins: 60,
  },
  leave: {
    sick_leaves: 10,
    casual_leaves: 15,
    annual_leaves: 15,
    unpaid_limit: 30,
  }
};

const DEFAULT_CONFIG = {
  rules: {},
  notes: "",
};

function prettyPolicyType(type) {
  return type
    .split("_")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

function renderConfigSummary(policy) {
  const cfg = policy.config || {};
  if (Object.keys(cfg).length === 0) return "N/A";

  switch (policy.policy_type) {
    case "payroll":
      return `Date: ${cfg.salary_date || '-'}, Cur: ${cfg.base_currency || '-'}`;
    case "weekly_off":
      return `Off: ${cfg.days?.join(", ") || "None"}`;
    case "shift":
      return `${cfg.start_time || "-"} to ${cfg.end_time || "-"}`;
    case "holiday":
      return `${cfg.holiday_date || 'No Date'} (${cfg.holiday_day || '-'})`;
    case "id_card":
      return `Template: ${cfg.template || 'standard'}`;
    default:
      return JSON.stringify(cfg).substring(0, 30) + "...";
  }
}

function cleanConfig(type, config, meta = {}) {
  const cfg = typeof config === 'string' ? JSON.parse(config) : config;
  const defaults = INITIAL_CONFIGS[type] || {};
  const cleaned = {};

  // Only keep keys that exist in the initial config for that type
  Object.keys(defaults).forEach(key => {
    if (cfg[key] !== undefined) {
      cleaned[key] = cfg[key];
    } else {
      cleaned[key] = defaults[key];
    }
  });

  // Inject meta fields if defined in defaults
  if (defaults.hasOwnProperty('policy_name')) cleaned.policy_name = meta.policy_name;
  if (defaults.hasOwnProperty('policy_type')) cleaned.policy_type = type;

  return cleaned;
}

function parseJsonSafe(value) {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, message: "Config must be a JSON object" };
    }
    return { ok: true, parsed };
  } catch {
    return { ok: false, message: "Config must be valid JSON" };
  }
}

export default function PolicySettingsPanel({ role = "SUPER_ADMIN" }) {
  const isSuperAdmin = role === "SUPER_ADMIN";

  const [policies, setPolicies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [formData, setFormData] = useState({
    policy_name: "",
    policy_type: "payroll",
    description: "",
    config: JSON.stringify(DEFAULT_CONFIG, null, 2),
    branch_id: "",
    is_active: true,
  });

  const stats = useMemo(() => {
    const active = policies.filter((item) => item.is_active).length;
    const uniqueTypes = new Set(policies.map((item) => item.policy_type)).size;
    return {
      total: policies.length,
      active,
      uniqueTypes,
    };
  }, [policies]);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const params = {
        page: 1,
        limit: 200,
        ...(search ? { search } : {}),
        ...(typeFilter ? { policy_type: typeFilter } : {}),
        ...(statusFilter ? { is_active: statusFilter } : {}),
        ...(isSuperAdmin && branchFilter ? { branch_id: branchFilter } : {}),
      };

      const response = await apiClient.get("/api/policies", params);
      setPolicies(response?.data?.policies || []);
    } catch (error) {
      toast.error(error.message || "Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    if (!isSuperAdmin) return;
    try {
      const response = await apiClient.get("/api/super-admin/branches", {
        page: 1,
        limit: 200,
      });
      setBranches(response?.data?.branches || []);
    } catch {
      setBranches([]);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [search, typeFilter, statusFilter, branchFilter]);

  useEffect(() => {
    fetchBranches();
  }, [isSuperAdmin]);

  const handleAdd = () => {
    setEditingPolicy(null);
    const initialType = "payroll";
    setFormData({
      policy_name: "",
      policy_type: initialType,
      description: "",
      config: JSON.stringify(INITIAL_CONFIGS[initialType] || DEFAULT_CONFIG, null, 2),
      branch_id: "",
      is_active: true,
    });
    setOpenModal(true);
  };

  const handleEdit = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      policy_name: policy.policy_name || "",
      policy_type: policy.policy_type || "payroll",
      description: policy.description || "",
      config: JSON.stringify(policy.config || DEFAULT_CONFIG, null, 2),
      branch_id: policy.branch_id || "",
      is_active: Boolean(policy.is_active),
    });
    setOpenModal(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!formData.policy_name.trim()) {
      toast.error("Policy name is required");
      return;
    }

    if (!formData.policy_type) {
      toast.error("Policy type is required");
      return;
    }

    const parsedConfig = parseJsonSafe(formData.config);
    if (!parsedConfig.ok) {
      toast.error(parsedConfig.message);
      return;
    }

    setSaving(true);
    try {
      let configObj;
      try {
        configObj = typeof formData.config === 'string' ? JSON.parse(formData.config) : formData.config;
      } catch (e) {
        toast.error("Config must be a valid JSON object");
        setSaving(false);
        return;
      }

      const cleanedConfig = cleanConfig(formData.policy_type, formData.config, {
        policy_name: formData.policy_name
      });

      const payload = {
        policy_name: formData.policy_name.trim(),
        policy_type: formData.policy_type,
        description: formData.description?.trim() || null,
        config: cleanedConfig,
        is_active: Boolean(formData.is_active),
        ...(isSuperAdmin && formData.branch_id ? { branch_id: formData.branch_id } : {}),
      };

      if (editingPolicy) {
        await apiClient.put(`/api/policies/${editingPolicy.id}`, payload);
        toast.success("Policy updated successfully");
      } else {
        await apiClient.post("/api/policies", payload);
        toast.success("Policy created successfully");
      }

      setOpenModal(false);
      fetchPolicies();
    } catch (error) {
      toast.error(error.message || "Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (policy) => {
    try {
      await apiClient.patch(`/api/policies/${policy.id}/toggle-status`, {
        is_active: !policy.is_active,
      });
      toast.success(`Policy ${policy.is_active ? "deactivated" : "activated"}`);
      fetchPolicies();
    } catch (error) {
      toast.error(error.message || "Unable to update status");
    }
  };

  const handleDelete = async (policy) => {
    const shouldDelete = window.confirm(
      `Delete policy \"${policy.policy_name}\"? This action can be reverted only from database backups.`
    );
    if (!shouldDelete) return;

    try {
      await apiClient.delete(`/api/policies/${policy.id}`);
      toast.success("Policy deleted successfully");
      fetchPolicies();
    } catch (error) {
      toast.error(error.message || "Failed to delete policy");
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <section className="rounded-2xl border border-sky-100 bg-gradient-to-r from-cyan-50 via-white to-indigo-50 p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-100/70 px-3 py-1 text-xs font-semibold text-cyan-700">
              <Sparkles className="h-3.5 w-3.5" />
              Central Policy Configuration
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {isSuperAdmin ? "Institute Policy Settings" : "Branch Policy Settings"}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Create versioned policies, keep one active policy per type, and manage module-level behavior professionally.
            </p>
          </div>
          <Button onClick={handleAdd} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Policy
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-cyan-100">
          <CardHeader className="pb-2">
            <CardDescription>Total Policies</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <CardDescription>Active Policies</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-indigo-100">
          <CardHeader className="pb-2">
            <CardDescription>Policy Types</CardDescription>
            <CardTitle className="text-2xl text-indigo-600">{stats.uniqueTypes}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or description"
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-cyan-300 transition focus:ring"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-cyan-300 transition focus:ring"
            >
              <option value="">All Policy Types</option>
              {POLICY_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {prettyPolicyType(type)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-cyan-300 transition focus:ring"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            {isSuperAdmin ? (
              <select
                value={branchFilter}
                onChange={(event) => setBranchFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-cyan-300 transition focus:ring"
              >
                <option value="">All Branches + Global</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                Branch-scoped results
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[200px] font-bold text-slate-700">Policy Details</TableHead>
                <TableHead className="font-bold text-slate-700">Type</TableHead>
                <TableHead className="font-bold text-slate-700">Rules Preview</TableHead>
                <TableHead className="font-bold text-slate-700">Scope</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Version</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Status</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-cyan-600" />
                    <p className="mt-2 text-sm text-slate-500">Loading policies...</p>
                  </TableCell>
                </TableRow>
              ) : policies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <Shield className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="font-medium text-slate-600">No policies found</p>
                    <p className="text-xs text-slate-400">Try adjusting your filters or create a new policy.</p>
                  </TableCell>
                </TableRow>
              ) : (
                policies.map((policy) => (
                  <TableRow key={policy.id} className="group transition-colors hover:bg-slate-50/50">
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-900">{policy.policy_name}</p>
                        <p className="mt-0.5 max-w-[200px] truncate text-xs text-slate-500" title={policy.description}>
                          {policy.description || "No description"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium uppercase tracking-wider text-[10px]">
                        {prettyPolicyType(policy.policy_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] font-medium text-slate-600 font-mono bg-slate-100/50 px-1.5 py-0.5 rounded">
                        {renderConfigSummary(policy)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {policy.branch?.name ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                          <Building2 className="h-3 w-3" />
                          {policy.branch.name}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                          <Globe className="h-3 w-3" />
                          Global
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs font-mono font-bold text-slate-500">v{policy.version}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={policy.is_active ? "default" : "secondary"}
                        className={policy.is_active ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}
                      >
                        {policy.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50"
                          onClick={() => handleEdit(policy)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${policy.is_active ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                          onClick={() => handleToggleStatus(policy)}
                          title={policy.is_active ? "Deactivate" : "Activate"}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(policy)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        size="lg"
        title={editingPolicy ? "Edit Policy" : "Create Policy"}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="policy-settings-form" disabled={saving}>
              {saving ? "Saving..." : "Save Policy"}
            </Button>
          </div>
        }
      >
        <form id="policy-settings-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Policy Name</label>
              <input
                value={formData.policy_name}
                onChange={(event) => setFormData((prev) => ({ ...prev, policy_name: event.target.value }))}
                placeholder="Monthly Payroll Rule"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-cyan-300 transition focus:ring"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Policy Type</label>
              <select
                value={formData.policy_type}
                onChange={(event) => setFormData((prev) => ({ ...prev, policy_type: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-cyan-300 transition focus:ring"
              >
                {POLICY_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {prettyPolicyType(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isSuperAdmin && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Branch Scope (optional)</label>
              <select
                value={formData.branch_id}
                onChange={(event) => setFormData((prev) => ({ ...prev, branch_id: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-cyan-300 transition focus:ring"
              >
                <option value="">Global (all branches)</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Explain what this policy controls"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-cyan-300 transition focus:ring"
            />
          </div>          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-600" />
              Policy Configuration
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {formData.policy_type === "weekly_off" && (
                <div className="col-span-full">
                  <label className="mb-1 block text-xs font-semibold text-slate-600 uppercase tracking-tight">Day Off Name</label>
                  <select
                    value={(() => {
                      const cfg = typeof formData.config === 'string' ? JSON.parse(formData.config) : formData.config;
                      return cfg.day_off_name || "Sunday";
                    })()}
                    onChange={(e) => {
                      const cfg = typeof formData.config === 'string' ? JSON.parse(formData.config) : formData.config;
                      setFormData(prev => ({
                        ...prev,
                        config: JSON.stringify({ ...cfg, day_off_name: e.target.value }, null, 2)
                      }));
                    }}
                    className="w-full rounded border border-slate-200 bg-white px-2 py-2 text-sm focus:ring-2 focus:ring-cyan-100 outline-none"
                  >
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.policy_type === "event" && (
                <>
                  <div className="col-span-full">
                    <label className="mb-1 block text-xs font-semibold text-slate-600 uppercase tracking-tight">Event Type</label>
                    <input
                      value={(() => {
                        const cfg = typeof formData.config === 'string' ? JSON.parse(formData.config) : formData.config;
                        return cfg.event_type || "";
                      })()}
                      onChange={(e) => {
                        const cfg = typeof formData.config === 'string' ? JSON.parse(formData.config) : formData.config;
                        setFormData(prev => ({
                          ...prev,
                          config: JSON.stringify({ ...cfg, event_type: e.target.value }, null, 2)
                        }));
                      }}
                      placeholder="e.g. Workshop, Exam, Sports Day"
                      className="w-full rounded border border-slate-200 bg-white px-2 py-2 text-sm focus:ring-2 focus:ring-cyan-100 outline-none"
                    />
                  </div>
                  <div className="col-span-full">
                    <label className="mb-1 block text-xs font-semibold text-slate-600 uppercase tracking-tight">Event Date</label>
                    <input
                      type="date"
                      value={(() => {
                        const cfg = typeof formData.config === 'string' ? JSON.parse(formData.config) : formData.config;
                        return cfg.event_date || "";
                      })()}
                      onChange={(e) => {
                        const cfg = typeof formData.config === 'string' ? JSON.parse(formData.config) : formData.config;
                        setFormData(prev => ({
                          ...prev,
                          config: JSON.stringify({ ...cfg, event_date: e.target.value }, null, 2)
                        }));
                      }}
                      className="w-full rounded border border-slate-200 bg-white px-2 py-2 text-sm focus:ring-2 focus:ring-cyan-100 outline-none"
                    />
                  </div>
                </>
              )}

              {formData.policy_type === "id_card" && (
                <div className="col-span-full">
                  <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-500 tracking-wider">ID Card Settings (JSON)</label>
                  <textarea
                    rows={4}
                    value={typeof formData.config === 'string' ? formData.config : JSON.stringify(formData.config, null, 2)}
                    onChange={(e) => setFormData(prev => ({ ...prev, config: e.target.value }))}
                    className="w-full rounded border border-slate-200 bg-slate-900 px-3 py-2 font-mono text-xs text-emerald-400 focus:ring-2 focus:ring-cyan-100 outline-none"
                  />
                </div>
              )}

              {/* Advanced JSON Fallback for complex rules */}
              {!["payroll", "weekly_off", "shift", "holiday", "event", "id_card"].includes(formData.policy_type) && (
                <div className="col-span-full">
                  <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-500 tracking-wider">Advanced Config (JSON)</label>
                  <textarea
                    rows={4}
                    value={typeof formData.config === 'string' ? formData.config : JSON.stringify(formData.config, null, 2)}
                    onChange={(e) => setFormData(prev => ({ ...prev, config: e.target.value }))}
                    className="w-full rounded border border-slate-200 bg-slate-900 px-3 py-2 font-mono text-xs text-emerald-400 focus:ring-2 focus:ring-cyan-100 outline-none"
                    placeholder="{ ... }"
                  />
                </div>
              )}
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(event) => setFormData((prev) => ({ ...prev, is_active: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300"
            />
            Set policy as active after save
          </label>
        </form>
      </Modal>
    </div>
  );
}
