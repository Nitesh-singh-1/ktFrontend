"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  roleService,
  RoleSummary,
  RoleDetail,
  AssignablePermissions,
} from "../../../../services/roleService";
import { DataTable, DataTableColumn } from "@/app/components/ui/DataTable";
import { PagePermissionGuard } from "@/app/components/ui/PagePermissionGuard";
import { sweetAlert } from "@/utils/sweetAlert";
import {
  Shield,
  ShieldCheck,
  RefreshCw,
  Plus,
  Lock,
  Pencil,
  Eye,
  Ban,
  X,
  Users,
  KeyRound,
} from "lucide-react";

function errMsg(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

interface RoleFormState {
  code: string;
  name: string;
  description: string;
}

const EMPTY_FORM: RoleFormState = { code: "", name: "", description: "" };

function RolesContent() {
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [assignable, setAssignable] = useState<AssignablePermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal state. editingRole === null with modalOpen means "create".
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDetail | null>(null);
  const [form, setForm] = useState<RoleFormState>(EMPTY_FORM);
  const [codeTouched, setCodeTouched] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const readOnly = !!editingRole?.isSystem;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        roleService.getRoles(),
        roleService.getAssignablePermissions(),
      ]);
      setRoles(rolesRes || []);
      setAssignable(permsRes || { modules: [] });
    } catch (err) {
      sweetAlert.error(
        "Failed to Load Roles",
        errMsg(err, "Could not retrieve roles for this organization.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingRole(null);
    setForm(EMPTY_FORM);
    setCodeTouched(false);
    setSelectedKeys(new Set());
    setModalOpen(true);
  };

  const openEdit = async (role: RoleSummary) => {
    try {
      const detail = await roleService.getRole(role.id);
      setEditingRole(detail);
      setForm({
        code: detail.code,
        name: detail.name,
        description: detail.description || "",
      });
      setCodeTouched(true);
      setSelectedKeys(new Set(detail.permissionKeys || []));
      setModalOpen(true);
    } catch (err) {
      sweetAlert.error("Failed to Load Role", errMsg(err, "Could not load role detail."));
    }
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingRole(null);
  };

  const toggleKey = (key: string) => {
    if (readOnly) return;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const togglePageAll = (keys: string[]) => {
    if (readOnly) return;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      const allOn = keys.every((k) => next.has(k));
      keys.forEach((k) => (allOn ? next.delete(k) : next.add(k)));
      return next;
    });
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const code = (form.code || slugify(name)).trim();
    if (!name) {
      sweetAlert.error("Name Required", "Please enter a role name.");
      return;
    }
    if (!editingRole && !code) {
      sweetAlert.error("Code Required", "Please enter a stable role code.");
      return;
    }

    try {
      setSaving(true);
      if (editingRole) {
        const res = await roleService.updateRole(editingRole.id, {
          name,
          description: form.description.trim() || undefined,
          permissionKeys: Array.from(selectedKeys),
        });
        if (!res.success) {
          sweetAlert.error("Update Failed", res.message || "Could not update the role.");
          return;
        }
        sweetAlert.success("Role Updated", res.message || `"${name}" was updated.`);
      } else {
        const res = await roleService.createRole({
          code,
          name,
          description: form.description.trim() || undefined,
          permissionKeys: Array.from(selectedKeys),
        });
        if (!res.success) {
          sweetAlert.error("Create Failed", res.message || "Could not create the role.");
          return;
        }
        sweetAlert.success("Role Created", res.message || `"${name}" was created.`);
      }
      setModalOpen(false);
      setEditingRole(null);
      await load();
    } catch (err) {
      sweetAlert.error("Save Failed", errMsg(err, "Could not save the role."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (role: RoleSummary) => {
    const confirmed = await sweetAlert.confirm(
      `Deactivate "${role.name}"?`,
      role.assignedUserCount > 0
        ? `${role.assignedUserCount} user(s) are currently assigned this role. Deactivating it removes it from the assignable list.`
        : "This role will be removed from the assignable list. You can recreate it later if needed."
    );
    if (!confirmed) return;

    try {
      const res = await roleService.deactivateRole(role.id);
      if (!res.success) {
        sweetAlert.error("Deactivate Failed", res.message || "Could not deactivate the role.");
        return;
      }
      sweetAlert.success("Role Deactivated", res.message || `"${role.name}" was deactivated.`);
      await load();
    } catch (err) {
      sweetAlert.error("Deactivate Failed", errMsg(err, "Could not deactivate the role."));
    }
  };

  const totalAssignable = useMemo(
    () =>
      (assignable?.modules || []).reduce(
        (sum, m) => sum + m.pages.reduce((s, p) => s + p.actions.length, 0),
        0
      ),
    [assignable]
  );

  const columns: DataTableColumn<RoleSummary>[] = [
    {
      key: "name",
      header: "Role",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E7F1F2] dark:bg-slate-800 flex items-center justify-center text-[#2F8E86] dark:text-teal-400 shrink-0">
            {row.isSystem ? <Lock className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-xs text-[#111827] dark:text-slate-200 truncate">
              {row.name}
            </div>
            <div className="text-[11px] font-mono text-[#94A3B8]">{row.code}</div>
          </div>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      width: "max-w-[280px]",
      render: (row) => (
        <span className="block max-w-[280px] truncate text-xs text-[#64748B] dark:text-slate-400" title={row.description || ""}>
          {row.description || "—"}
        </span>
      ),
    },
    {
      key: "isSystem",
      header: "Type",
      render: (row) =>
        row.isSystem ? (
          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            System
          </span>
        ) : (
          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#E7F1F2] text-[#25776F] dark:bg-slate-800 dark:text-teal-300 border border-[#D9E2E3] dark:border-slate-700">
            Custom
          </span>
        ),
    },
    {
      key: "permissionCount",
      header: "Permissions",
      align: "center",
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111827] dark:text-slate-200">
          <KeyRound className="w-3.5 h-3.5 text-[#94A3B8]" />
          {row.permissionCount}
        </span>
      ),
    },
    {
      key: "assignedUserCount",
      header: "Users",
      align: "center",
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111827] dark:text-slate-200">
          <Users className="w-3.5 h-3.5 text-[#94A3B8]" />
          {row.assignedUserCount}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (row) =>
        row.isActive ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#25776F] dark:text-teal-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2F8E86] shrink-0" />
            <span>Active</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#94A3B8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8] shrink-0" />
            <span>Inactive</span>
          </span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => openEdit(row)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[#D9E2E3] dark:border-slate-700 text-[#25776F] dark:text-teal-300 hover:bg-[#E7F1F2] dark:hover:bg-slate-800 cursor-pointer transition"
            title={row.isSystem ? "View permissions (read-only)" : "Edit role"}
          >
            {row.isSystem ? <Eye className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
            <span>{row.isSystem ? "View" : "Edit"}</span>
          </button>
          {!row.isSystem && row.isActive && (
            <button
              type="button"
              onClick={() => handleDeactivate(row)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition"
              title="Deactivate role"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Deactivate</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2F8E86] dark:text-teal-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Superadmin Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white tracking-tight flex items-center gap-2">
            <Shield className="w-7 h-7 text-[#2F8E86]" />
            Roles &amp; Permissions
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1">
            Define custom roles and the exact pages and actions each one may perform — bounded by your subscribed modules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => load()}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 text-[#111827] dark:text-slate-200 text-xs font-semibold hover:bg-[#F5FAFA] dark:hover:bg-slate-700/60 shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={openCreate}
            className="px-4 py-2.5 rounded-xl bg-[#2F8E86] hover:bg-[#25776F] text-white text-xs font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Role</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable<RoleSummary>
        columns={columns}
        data={roles}
        rowKey={(row) => row.id}
        loading={loading}
        loadingText="Loading roles…"
        emptyIcon={<Shield className="w-8 h-8" />}
        emptyTitle="No roles yet"
        emptyMessage="Create a custom role to grant a curated set of pages and actions to your sub-users."
      />

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-[#E5EAEB] dark:border-slate-800 w-full max-w-3xl flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="p-5 border-b border-[#E5EAEB] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {readOnly ? <Lock className="w-5 h-5 text-[#2F8E86]" /> : <Shield className="w-5 h-5 text-[#2F8E86]" />}
                <div>
                  <h2 className="text-base font-bold text-[#111827] dark:text-white">
                    {editingRole ? (readOnly ? "View Role" : "Edit Role") : "Create Role"}
                  </h2>
                  <p className="text-xs text-[#64748B] dark:text-slate-400">
                    {readOnly
                      ? "System roles are managed by the platform and are read-only."
                      : `${selectedKeys.size} of ${totalAssignable} permissions selected`}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 text-[#94A3B8] hover:text-[#111827] dark:hover:text-slate-200 rounded-lg hover:bg-[#F7F8F8] dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Identity fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 mb-1.5">
                    Role Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    disabled={readOnly}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        name: e.target.value,
                        code: !editingRole && !codeTouched ? slugify(e.target.value) : f.code,
                      }))
                    }
                    placeholder="e.g. Dispatch Lead"
                    className="w-full h-10 px-3 rounded-lg bg-[#F7F8F8] dark:bg-slate-800/80 border border-[#D9E2E3] dark:border-slate-700 text-sm text-[#111827] dark:text-slate-100 focus:outline-none focus:border-[#2F8E86] disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 mb-1.5">
                    Code
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    disabled={readOnly || !!editingRole}
                    onChange={(e) => {
                      setCodeTouched(true);
                      setForm((f) => ({ ...f, code: slugify(e.target.value) }));
                    }}
                    placeholder="dispatch_lead"
                    className="w-full h-10 px-3 rounded-lg bg-[#F7F8F8] dark:bg-slate-800/80 border border-[#D9E2E3] dark:border-slate-700 text-sm font-mono text-[#111827] dark:text-slate-100 focus:outline-none focus:border-[#2F8E86] disabled:opacity-60"
                  />
                  {!!editingRole && !readOnly && (
                    <p className="text-[10px] text-[#94A3B8] mt-1">Code is fixed after creation.</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  disabled={readOnly}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What this role is for"
                  className="w-full h-10 px-3 rounded-lg bg-[#F7F8F8] dark:bg-slate-800/80 border border-[#D9E2E3] dark:border-slate-700 text-sm text-[#111827] dark:text-slate-100 focus:outline-none focus:border-[#2F8E86] disabled:opacity-60"
                />
              </div>

              {/* Permission matrix */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 mb-2">
                  Permissions
                </h3>
                {(assignable?.modules || []).length === 0 ? (
                  <p className="text-xs text-[#94A3B8]">
                    No assignable modules — your subscription grants no pages to delegate.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {assignable!.modules.map((mod) => (
                      <div
                        key={mod.moduleCode}
                        className="rounded-xl border border-[#E5EAEB] dark:border-slate-800 overflow-hidden"
                      >
                        <div className="px-3.5 py-2 bg-[#F7F8F8] dark:bg-slate-800/60 border-b border-[#E5EAEB] dark:border-slate-800">
                          <span className="text-xs font-bold text-[#111827] dark:text-slate-200">
                            {mod.moduleName}
                          </span>
                        </div>
                        <div className="divide-y divide-[#F1F3F4] dark:divide-slate-800">
                          {mod.pages.map((pg) => {
                            const pageKeys = pg.actions.map((a) => a.key);
                            const allOn = pageKeys.length > 0 && pageKeys.every((k) => selectedKeys.has(k));
                            return (
                              <div key={pg.featureKey} className="px-3.5 py-2.5">
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <span className="text-[11px] font-mono text-[#64748B] dark:text-slate-400">
                                    {pg.featureKey}
                                  </span>
                                  {!readOnly && (
                                    <button
                                      type="button"
                                      onClick={() => togglePageAll(pageKeys)}
                                      className="text-[10px] font-bold text-[#2F8E86] hover:text-[#25776F] cursor-pointer"
                                    >
                                      {allOn ? "Clear" : "Select all"}
                                    </button>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {pg.actions.map((act) => {
                                    const on = selectedKeys.has(act.key);
                                    return (
                                      <button
                                        key={act.key}
                                        type="button"
                                        disabled={readOnly}
                                        onClick={() => toggleKey(act.key)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer disabled:cursor-default ${
                                          on
                                            ? "bg-[#E7F1F2] text-[#25776F] border-[#2F8E86]/40 dark:bg-slate-800 dark:text-teal-300 dark:border-slate-600"
                                            : "bg-white text-[#94A3B8] border-[#E5EAEB] dark:bg-slate-900 dark:border-slate-700"
                                        }`}
                                      >
                                        {act.action}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-5 border-t border-[#E5EAEB] dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-[#D9E2E3] dark:border-slate-700 text-xs font-bold text-[#64748B] dark:text-slate-300 hover:bg-[#F7F8F8] dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                {readOnly ? "Close" : "Cancel"}
              </button>
              {!readOnly && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#2F8E86] hover:bg-[#25776F] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving…" : editingRole ? "Save Changes" : "Create Role"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RolesPage() {
  return (
    <PagePermissionGuard permission="system.users.view" moduleName="Roles & Permissions">
      <RolesContent />
    </PagePermissionGuard>
  );
}
