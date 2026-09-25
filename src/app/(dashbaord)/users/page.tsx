"use client";

import React, { useState, useEffect } from "react";
import {
  userService,
  SubUserDetails,
  CreateSubUserPayload,
  UpdateSubUserPayload,
} from "../../../../services/userService";
import {
  User,
  UserPlus,
  KeyRound,
  Shield,
  ShieldCheck,
  Lock,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  Phone,
  Filter,
  Users,
} from "lucide-react";
import { PagePermissionGuard } from "@/app/components/ui/PagePermissionGuard";

// Available system features for granular user assignment
const SYSTEM_MODULES = [
  { key: "dashboard", label: "Dashboard & Analytics", category: "Core" },
  { key: "consignments", label: "Consignments (GR / LR Booking)", category: "Operations" },
  { key: "trips", label: "Manifests & Vehicle Dispatch", category: "Operations" },
  { key: "pod", label: "POD & Delivery Management", category: "Operations" },
  { key: "billing", label: "Invoicing & Money Receipts", category: "Accounts" },
  { key: "customers", label: "Party Master & Customers", category: "Masters" },
  { key: "fleet", label: "Fleet & Stations Registry", category: "Masters" },
  { key: "vendors", label: "Market Vendors & Lorry Hire", category: "Operations" },
  { key: "claims", label: "Damage & Cargo Claims", category: "Operations" },
  { key: "reports", label: "Reports & Business Ledgers", category: "Accounts" },
  { key: "tracking", label: "Live GPS Tracker", category: "Operations" },
];

export default function UsersManagementPage() {
  const [users, setUsers] = useState<SubUserDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);

  // Selected User for Actions
  const [selectedUser, setSelectedUser] = useState<SubUserDetails | null>(null);

  // Add User Form State
  const [addForm, setAddForm] = useState<CreateSubUserPayload>({
    username: "",
    password: "",
    fullName: "",
    mobile: "",
    role: "SUB_USER", // Default role is strictly standard user
    assignedFeatures: [
      "dashboard",
      "consignments",
      "trips",
      "pod",
      "billing",
      "customers",
    ],
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Edit User Form State
  const [editForm, setEditForm] = useState<UpdateSubUserPayload>({
    fullName: "",
    mobile: "",
    role: "SUB_USER",
    isActive: true,
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Reset Password Form State
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [showResetPasswordText, setShowResetPasswordText] = useState(false);
  const [submittingReset, setSubmittingReset] = useState(false);

  // Edit Permissions State
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [submittingPerms, setSubmittingPerms] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err: any) {
      showToast("error", err.message || "Failed to load user accounts.");
    } finally {
      setLoading(false);
    }
  };

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.username.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      (u.mobile && u.mobile.includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q));

    const matchesRole =
      roleFilter === "all" ||
      u.role.toLowerCase() === roleFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.isActive) ||
      (statusFilter === "inactive" && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle Add User Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.username.trim() || !addForm.password || !addForm.fullName.trim()) {
      showToast("error", "Username, password, and full name are required.");
      return;
    }

    if (addForm.password.length < 6) {
      showToast("error", "Initial password must be at least 6 characters long.");
      return;
    }

    try {
      setSubmittingAdd(true);
      const res = await userService.createSubUser(addForm);
      if (res.success) {
        showToast("success", `User account '${addForm.username}' created successfully.`);
        setShowAddModal(false);
        setAddForm({
          username: "",
          password: "",
          fullName: "",
          mobile: "",
          role: "SUB_USER",
          assignedFeatures: [
            "dashboard",
            "consignments",
            "trips",
            "pod",
            "billing",
            "customers",
          ],
        });
        loadUsers();
      } else {
        showToast("error", res.message || "Failed to create user.");
      }
    } catch (err: any) {
      showToast("error", err.message || "An error occurred while creating user.");
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Handle Superadmin Direct Password Reset
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!resetPasswordValue || resetPasswordValue.length < 6) {
      showToast("error", "New password must be at least 6 characters long.");
      return;
    }

    if (resetPasswordValue !== confirmResetPassword) {
      showToast("error", "Password confirmation does not match.");
      return;
    }

    try {
      setSubmittingReset(true);
      const res = await userService.adminResetPassword(selectedUser.id, resetPasswordValue);
      if (res.success) {
        showToast("success", `Password for user '${selectedUser.username}' has been updated.`);
        setShowResetModal(false);
        setResetPasswordValue("");
        setConfirmResetPassword("");
      } else {
        showToast("error", res.message || "Failed to reset password.");
      }
    } catch (err: any) {
      showToast("error", err.message || "An error occurred while resetting password.");
    } finally {
      setSubmittingReset(false);
    }
  };

  // Handle Edit User Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setSubmittingEdit(true);
      const res = await userService.updateSubUser(selectedUser.id, editForm);
      if (res.success) {
        showToast("success", `User '${selectedUser.username}' details updated successfully.`);
        setShowEditModal(false);
        loadUsers();
      } else {
        showToast("error", res.message || "Failed to update user.");
      }
    } catch (err: any) {
      showToast("error", err.message || "An error occurred while updating user.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Handle Permissions Update
  const handlePermsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setSubmittingPerms(true);
      const res = await userService.updatePermissions(selectedUser.id, selectedPerms);
      if (res.success) {
        showToast("success", `Permissions updated for user '${selectedUser.username}'.`);
        setShowPermModal(false);
        loadUsers();
      } else {
        showToast("error", res.message || "Failed to update permissions.");
      }
    } catch (err: any) {
      showToast("error", err.message || "An error occurred while updating permissions.");
    } finally {
      setSubmittingPerms(false);
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = async (user: SubUserDetails, newStatus: boolean) => {
    try {
      const res = await userService.toggleStatus(user.id, newStatus);
      if (res.success) {
        showToast("success", `User '${user.username}' is now ${newStatus ? "Active" : "Inactive"}.`);
        loadUsers();
      } else {
        showToast("error", res.message || "Failed to toggle status.");
      }
    } catch (err: any) {
      showToast("error", err.message || "An error occurred.");
    }
  };

  const getRoleBadge = (role: string) => {
    const r = role.toLowerCase();
    if (r === "admin" || r === "superadmin" || r === "tenantadmin") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
          <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400" />
          Admin
        </span>
      );
    }
    if (r === "operator" || r === "dispatch") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
          Operator
        </span>
      );
    }
    if (r === "accounts" || r === "billing") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
          Accounts
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        Standard User
      </span>
    );
  };

  return (
    <PagePermissionGuard permission="users.manage" moduleName="User & Role Management">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 border text-sm font-semibold animate-fadeIn ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-800"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Superadmin Control Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              User Accounts & Role Permissions
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Create sub-users with default standard rights, reset user passwords, and manage granular feature access.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadUsers}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 active:from-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Users
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {users.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Across this organization</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active Accounts
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
              {users.filter((u) => u.isActive).length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Ready for console sign in</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Standard Users
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
              {users.filter((u) => u.role.toLowerCase() === "sub_user" || u.role.toLowerCase() === "user").length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Default restricted rights</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Admins & Managers
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
              {users.filter((u) => u.role.toLowerCase() !== "sub_user" && u.role.toLowerCase() !== "user").length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Administrative operators</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, username, mobile, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Roles</option>
              <option value="sub_user">Standard User (SUB_USER)</option>
              <option value="operator">Operator (Dispatch)</option>
              <option value="accounts">Accounts & Billing</option>
              <option value="admin">Administrator</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4 sm:px-6">User / Account</th>
                  <th className="py-3.5 px-4">Assigned Role</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned Modules</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Superadmin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full" />
                        <span>Loading user directory...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <span>No users matching your filters found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* User Info */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                            {u.fullName ? u.fullName.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {u.fullName || u.username}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              @{u.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {getRoleBadge(u.role)}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {u.mobile ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {u.mobile}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No mobile</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(u, !u.isActive)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                            u.isActive
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.isActive ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          <span>{u.isActive ? "Active" : "Inactive"}</span>
                        </button>
                      </td>

                      {/* Modules Count */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setSelectedPerms(u.assignedFeatures || []);
                            setShowPermModal(true);
                          }}
                          className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>
                            {u.assignedFeatures?.length || 0} features configured
                          </span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct Password Reset */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setResetPasswordValue("");
                              setConfirmResetPassword("");
                              setShowResetModal(true);
                            }}
                            className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition border border-transparent hover:border-amber-200 dark:hover:border-amber-800/60 cursor-pointer"
                            title="Directly Reset Password (Superadmin)"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setEditForm({
                                fullName: u.fullName,
                                mobile: u.mobile || "",
                                role: u.role,
                                isActive: u.isActive,
                              });
                              setShowEditModal(true);
                            }}
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
                            title="Edit User Profile"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: ADD NEW USER */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      Create New User Account
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Default role is standard user with customized feature access.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleAddSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. rajesh_ops"
                      value={addForm.username}
                      onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={addForm.fullName}
                      onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Initial Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={addForm.password}
                      onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      maxLength={15}
                      placeholder="e.g. 9876543210"
                      value={addForm.mobile}
                      onChange={(e) => setAddForm({ ...addForm, mobile: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Role Selector with User as Default */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    System Role *
                  </label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="SUB_USER">Standard User (SUB_USER) - Default</option>
                    <option value="operator">Operator (Dispatch & Operations)</option>
                    <option value="accounts">Accounts Manager (Billing & Receipts)</option>
                    <option value="admin">Administrator (Full Tenant Control)</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Standard users only have access to modules explicitly permitted below.
                  </p>
                </div>

                {/* Granular Module Entitlements */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Permitted Features & Workspaces
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    {SYSTEM_MODULES.map((mod) => {
                      const isChecked = addForm.assignedFeatures.includes(mod.key);
                      return (
                        <label
                          key={mod.key}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAddForm({
                                  ...addForm,
                                  assignedFeatures: [...addForm.assignedFeatures, mod.key],
                                });
                              } else {
                                setAddForm({
                                  ...addForm,
                                  assignedFeatures: addForm.assignedFeatures.filter(
                                    (k) => k !== mod.key
                                  ),
                                });
                              }
                            }}
                            className="w-3.5 h-3.5 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                          />
                          <span>{mod.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAdd}
                    className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submittingAdd ? (
                      <>
                        <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                        <span>Creating User...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Create User Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: SUPERADMIN DIRECT PASSWORD RESET */}
        {showResetModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      Direct Password Override
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Reset credentials for @{selectedUser.username}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleResetPasswordSubmit} className="p-5 space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Target User:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedUser.fullName || selectedUser.username}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Username:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">@{selectedUser.username}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Role:</span>
                    <span>{getRoleBadge(selectedUser.role)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showResetPasswordText ? "text" : "password"}
                      required
                      placeholder="At least 6 characters"
                      value={resetPasswordValue}
                      onChange={(e) => setResetPasswordValue(e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPasswordText(!showResetPasswordText)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showResetPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type={showResetPasswordText ? "text" : "password"}
                    required
                    placeholder="Repeat new password"
                    value={confirmResetPassword}
                    onChange={(e) => setConfirmResetPassword(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReset}
                    className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submittingReset ? (
                      <>
                        <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Confirm Password Reset</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: EDIT USER DETAILS */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      Edit User Profile
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Update details for @{selectedUser.username}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editForm.fullName || ""}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    maxLength={15}
                    value={editForm.mobile || ""}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    System Role
                  </label>
                  <select
                    value={editForm.role || "SUB_USER"}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="SUB_USER">Standard User (SUB_USER)</option>
                    <option value="operator">Operator (Dispatch & Trips)</option>
                    <option value="accounts">Accounts Manager (Billing & Invoices)</option>
                    <option value="admin">Administrator (Tenant Admin)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Active Status</div>
                    <div className="text-[11px] text-slate-400">Allow user to sign in to console</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editForm.isActive ?? true}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEdit}
                    className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submittingEdit ? (
                      <>
                        <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: EDIT PERMISSIONS */}
        {showPermModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      Granular Module Permissions
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Custom feature overrides for @{selectedUser.username}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPermModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handlePermsSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  {SYSTEM_MODULES.map((mod) => {
                    const isChecked = selectedPerms.includes(mod.key);
                    return (
                      <label
                        key={mod.key}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPerms([...selectedPerms, mod.key]);
                            } else {
                              setSelectedPerms(selectedPerms.filter((k) => k !== mod.key));
                            }
                          }}
                          className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                        />
                        <span>{mod.label}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowPermModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPerms}
                    className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submittingPerms ? (
                      <>
                        <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                        <span>Updating Permissions...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Permissions</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PagePermissionGuard>
  );
}
