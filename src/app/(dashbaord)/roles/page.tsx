"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Shield,
  ShieldCheck,
  Plus,
  Edit3,
  Ban,
  X,
  Check,
  Lock,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  roleService,
  RoleSummary,
  AssignablePermissions,
} from "../../../../services/roleService";
import { DataTable, DataTableColumn } from "../../components/ui/DataTable";
import { useToast } from "../../../context/ToastContext";

// A readable label from a feature/permission key, e.g.
// "consignments.create" -> "Consignments › Create".
function prettyKey(key: string): string {
  return key
    .split(".")
    .map((p) => p.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" › ");
}

interface EditorState {
  open: boolean;
  mode: "create" | "edit";
  roleId?: number;
  code: string;
  name: string;
  description: string;
  selected: Set<string>;
  saving: boolean;
}

const emptyEditor = (): EditorState => ({
  open: false,
  mode: "create",
  code: "",
  name: "",
  description: "",
  selected: new Set<string>(),
  saving: false,
});

export default function RolesPage() {
  const toast = useToast();
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignable, setAssignable] = useState<AssignablePermissions>({ modules: [] });
  const [editor, setEditor] = useState<EditorState>(emptyEditor());

  const loadRoles = useCallback(async () => {
    setLoading(true);
    const data = await roleService.getRoles();
    setRoles(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRoles();
    roleService.getAssignablePermissions().then(setAssignable);
  }, [loadRoles]);

  const openCreate = () => setEditor({ ...emptyEditor(), open: true, mode: "create" });

  const openEdit = async (role: RoleSummary) => {
    if (role.isSystem) {
      toast.info("System roles are managed by the platform and can't be edited here.");
      return;
    }
    const detail = await roleService.getRole(role.id);
    if (!detail) {
      toast.error("Could not load role.");
      return;
    }
    setEditor({
      open: true,
      mode: "edit",
      roleId: role.id,
      code: detail.code,
      name: detail.name,
      description: detail.description ?? "",
      selected: new Set(detail.permissionKeys),
      saving: false,
    });
  };

  const closeEditor = () => setEditor((e) => ({ ...e, open: false }));

  const toggleKey = (key: string) =>
    setEditor((e) => {
      const next = new Set(e.selected);
      next.has(key) ? next.delete(key) : next.add(key);
      return { ...e, selected: next };
    });

  const togglePage = (keys: string[], on: boolean) =>
    setEditor((e) => {
      const next = new Set(e.selected);
      keys.forEach((k) => (on ? next.add(k) : next.delete(k)));
      return { ...e, selected: next };
    });

  const save = async () => {
    if (!editor.name.trim()) {
      toast.error("Role name is required.");
      return;
    }
    if (editor.mode === "create" && !editor.code.trim()) {
      toast.error("Role code is required.");
      return;
    }
    setEditor((e) => ({ ...e, saving: true }));
    const keys = Array.from(editor.selected);
    const res =
      editor.mode === "create"
        ? await roleService.createRole({
            code: editor.code.trim(),
            name: editor.name.trim(),
            description: editor.description.trim() || undefined,
            permissionKeys: keys,
          })
        : await roleService.updateRole(editor.roleId!, {
            name: editor.name.trim(),
            description: editor.description.trim(),
            permissionKeys: keys,
          });
    setEditor((e) => ({ ...e, saving: false }));
    if (!res.success) {
      toast.error(res.message || "Save failed.");
      return;
    }
    toast.success(editor.mode === "create" ? "Role created." : "Role updated.");
    closeEditor();
    loadRoles();
  };

  const deactivate = async (role: RoleSummary) => {
    if (role.isSystem) return;
    if (!window.confirm(`Deactivate role "${role.name}"? Users keep the role but lose its access.`)) return;
    const res = await roleService.deactivateRole(role.id);
    if (!res.success) {
      toast.error(res.message || "Failed to deactivate.");
      return;
    }
    toast.success("Role deactivated.");
    loadRoles();
  };

  const totalAssignable = useMemo(
    () => assignable.modules.reduce((n, m) => n + m.pages.reduce((p, pg) => p + pg.actions.length, 0), 0),
    [assignable]
  );

  const columns: DataTableColumn<RoleSummary>[] = [
    {
      key: "name",
      header: "Role",
      render: (r) => (
        <div className="flex items-center gap-2">
          {r.isSystem ? (
            <ShieldCheck className="h-4 w-4 text-slate-400" />
          ) : (
            <Shield className="h-4 w-4 text-[#2F8E86]" />
          )}
          <div>
            <div className="font-medium text-slate-800 dark:text-slate-100">{r.name}</div>
            <div className="text-xs text-slate-400">{r.code}</div>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (r) =>
        r.isSystem ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            System
          </span>
        ) : (
          <span className="rounded-full bg-[#E7F1F2] px-2 py-0.5 text-xs text-[#2F8E86]">Custom</span>
        ),
    },
    { key: "permissionCount", header: "Pages/actions", align: "center", render: (r) => r.permissionCount },
    {
      key: "assignedUserCount",
      header: "Users",
      align: "center",
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          {r.assignedUserCount}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (r) =>
        r.isActive ? (
          <span className="text-xs font-medium text-[#2F9E8F]">Active</span>
        ) : (
          <span className="text-xs font-medium text-slate-400">Inactive</span>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) =>
        r.isSystem ? (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Lock className="h-3.5 w-3.5" /> Managed
          </span>
        ) : (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => openEdit(r)}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#2F8E86] dark:hover:bg-slate-700"
              title="Edit role"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            {r.isActive && (
              <button
                onClick={() => deactivate(r)}
                className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-[#D95C5C] dark:hover:bg-slate-700"
                title="Deactivate role"
              >
                <Ban className="h-4 w-4" />
              </button>
            )}
          </div>
        ),
    },
  ];

  return (
    <div className="w-full p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Roles &amp; Permissions</h1>
          <p className="text-sm text-slate-500">
            Create roles for your team and choose exactly which pages and actions each can use.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadRoles}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2F8E86] px-4 py-2 text-sm font-medium text-white hover:bg-[#25776F]"
          >
            <Plus className="h-4 w-4" /> New Role
          </button>
        </div>
      </div>

      <DataTable<RoleSummary>
        columns={columns}
        data={roles}
        rowKey={(r) => r.id}
        loading={loading}
        emptyTitle="No roles yet"
        emptyMessage="Create your first custom role to control what your team can access."
      />

      {editor.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {editor.mode === "create" ? "New Role" : `Edit Role — ${editor.name}`}
              </h2>
              <button onClick={closeEditor} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Name</label>
                  <input
                    value={editor.name}
                    onChange={(e) => setEditor((s) => ({ ...s, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                    placeholder="e.g. Operator"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Code {editor.mode === "edit" && <span className="text-xs text-slate-400">(fixed)</span>}
                  </label>
                  <input
                    value={editor.code}
                    disabled={editor.mode === "edit"}
                    onChange={(e) => setEditor((s) => ({ ...s, code: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="e.g. operator"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Description</label>
                <input
                  value={editor.description}
                  onChange={(e) => setEditor((s) => ({ ...s, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Optional"
                />
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Pages &amp; actions</h3>
                  <span className="text-xs text-slate-400">
                    {editor.selected.size} of {totalAssignable} selected
                  </span>
                </div>
                {assignable.modules.length === 0 ? (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    No modules are enabled for your organization yet. Ask your provider to enable the modules you need.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {assignable.modules.map((m) => (
                      <div key={m.moduleCode} className="rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
                          {m.moduleName}
                        </div>
                        <div className="divide-y divide-slate-50 dark:divide-slate-800">
                          {m.pages.map((pg) => {
                            const keys = pg.actions.map((a) => a.key);
                            const allOn = keys.every((k) => editor.selected.has(k));
                            return (
                              <div key={pg.featureKey} className="flex flex-wrap items-center gap-2 px-3 py-2">
                                <button
                                  onClick={() => togglePage(keys, !allOn)}
                                  className="mr-2 min-w-[180px] text-left text-sm font-medium text-slate-600 hover:text-[#2F8E86] dark:text-slate-300"
                                  title={allOn ? "Clear all" : "Select all"}
                                >
                                  {prettyKey(pg.featureKey)}
                                </button>
                                <div className="flex flex-wrap gap-1.5">
                                  {pg.actions.map((a) => {
                                    const on = editor.selected.has(a.key);
                                    return (
                                      <button
                                        key={a.key}
                                        onClick={() => toggleKey(a.key)}
                                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
                                          on
                                            ? "border-[#2F8E86] bg-[#E7F1F2] text-[#2F8E86]"
                                            : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400"
                                        }`}
                                      >
                                        {on && <Check className="h-3 w-3" />}
                                        {a.action}
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

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button
                onClick={closeEditor}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={editor.saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2F8E86] px-4 py-2 text-sm font-medium text-white hover:bg-[#25776F] disabled:opacity-60"
              >
                {editor.saving ? "Saving…" : editor.mode === "create" ? "Create Role" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
