"use client";

import React, { useState, useEffect } from "react";
import {
  userService,
  SubUserDetails,
  CreateSubUserPayload,
  UpdateSubUserPayload,
  InviteItem,
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
  Mail,
  Send,
  Copy,
} from "lucide-react";
import { PagePermissionGuard } from "@/app/components/ui/PagePermissionGuard";
import { sanitizeMobile, validateMobile, validateEmail, firstError } from "@/utils/validation";
import { useUsernameAvailability } from "@/utils/useUsernameAvailability";

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

  // Invite state
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState<{ email: string; role: string }>({ email: "", role: "SUB_USER" });
  const [submittingInvite, setSubmittingInvite] = useState(false);

  const loadInvites = async () => {
    setInvites(await userService.getInvites());
  };

  const handleSendInvite = async () => {
    if (!inviteForm.email.trim()) {
      setNotification({ type: "error", message: "Please enter an email address." });
      return;
    }
    const emailErr = validateEmail(inviteForm.email, "Email");
    if (emailErr) {
      setNotification({ type: "error", message: emailErr });
      return;
    }
    try {
      setSubmittingInvite(true);
      const res = await userService.inviteUser({ email: inviteForm.email.trim(), role: inviteForm.role, assignedFeatures: [] });
      if (res.success) {
        setNotification({ type: "success", message: res.message || "Invitation sent." });
        setShowInviteModal(false);
        setInviteForm({ email: "", role: "SUB_USER" });
        loadInvites();
      } else {
        setNotification({ type: "error", message: res.message || "Failed to send invite." });
      }
    } catch (e: any) {
      setNotification({ type: "error", message: e?.message || "Failed to send invite." });
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleRevokeInvite = async (id: number) => {
    const res = await userService.revokeInvite(id);
    setNotification({ type: res.success ? "success" : "error", message: res.message || "" });
    loadInvites();
  };

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

  // Debounced availability probe for the add-user form. UX hint only — server still
  // rejects a real duplicate on POST, so this never blocks legitimate submissions.
  const addUsernameAvailability = useUsernameAvailability(addForm.username);

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
    loadInvites();
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

    if (addUsernameAvailability.status === "taken") {
      showToast("error", `Username '${addForm.username}' is already taken. Please choose another.`);
      return;
    }

    const mobErr = validateMobile(addForm.mobile || "", "Mobile number");
    if (mobErr) {
      showToast("error", mobErr);
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

    const valErr = firstError(
      validateMobile(editForm.mobile || "", "Mobile number"),
      validateEmail((editForm as any).email || "", "Email"),
    );
    if (valErr) {
      showToast("error", valErr);
      return;
    }

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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E7F1F2] text-[#25776F] dark:bg-slate-800 dark:text-teal-300 border border-[#D9E2E3] dark:border-slate-700">
          <Shield className="w-3 h-3 text-[#2F8E86]" />
          Admin
        </span>
      );
    }
    if (r === "operator" || r === "dispatch") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-[#4A90E2] dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
          Operator
        </span>
      );
    }
    if (r === "accounts" || r === "billing") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#2F9E8F] dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
          Accounts
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F7F8F8] text-[#64748B] dark:bg-slate-800 dark:text-slate-300 border border-[#D9E2E3] dark:border-slate-700">
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
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2F8E86] dark:text-teal-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Superadmin Control Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white tracking-tight">
              User Accounts & Role Permissions
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1">
              Create sub-users with default standard rights, reset user passwords, and manage granular feature access.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadUsers}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 text-[#111827] dark:text-slate-200 text-xs font-semibold hover:bg-[#F5FAFA] dark:hover:bg-slate-700/60 shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#2F8E86] hover:bg-[#25776F] text-white text-xs font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Invite by Email</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 text-[#111827] dark:text-slate-200 text-xs font-semibold hover:bg-[#F5FAFA] shadow-2xs transition flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Directly</span>
            </button>
          </div>
        </div>

        {/* Pending Invitations */}
        {invites.filter((i) => i.status === "Pending").length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-3 text-sm font-bold text-[#111827] dark:text-white">
              <Send className="w-4 h-4 text-[#2F8E86]" /> Pending Invitations
            </div>
            <div className="space-y-2">
              {invites.filter((i) => i.status === "Pending").map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-[#E5EAEB] dark:border-slate-800 text-xs">
                  <div className="min-w-0">
                    <span className="font-semibold text-[#111827] dark:text-slate-200">{inv.email}</span>
                    <span className="ml-2 text-[#64748B]">· {inv.role === "admin" ? "Administrator" : "Standard User"}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {inv.acceptUrl && (
                      <button
                        onClick={() => { navigator.clipboard?.writeText(inv.acceptUrl!); setNotification({ type: "success", message: "Invite link copied." }); }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#E7F1F2] text-[#25776F] font-semibold hover:bg-[#d9ecec] cursor-pointer"
                        title="Copy invite link (email delivery is off)"
                      >
                        <Copy className="w-3 h-3" /> Copy link
                      </button>
                    )}
                    <button onClick={() => handleRevokeInvite(inv.id)} className="text-[#D95C5C] font-semibold hover:underline cursor-pointer">Revoke</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
                Total Users
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#E7F1F2] dark:bg-slate-800 text-[#2F8E86] dark:text-teal-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#111827] dark:text-white mt-2">
              {users.length}
            </div>
            <div className="text-[11px] text-[#94A3B8] mt-1">Across this organization</div>
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
              <div className="w-8 h-8 rounded-lg bg-[#E7F1F2] dark:bg-slate-800 text-[#2F8E86] flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#111827] dark:text-white mt-2">
              {users.filter((u) => u.role.toLowerCase() === "sub_user" || u.role.toLowerCase() === "user").length}
            </div>
            <div className="text-[11px] text-[#64748B] mt-1">Default restricted rights</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#E5EAEB] dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
                Admins & Managers
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#E7F1F2] dark:bg-slate-800 text-[#2F8E86] dark:text-teal-400 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#111827] dark:text-white mt-2">
              {users.filter((u) => u.role.toLowerCase() !== "sub_user" && u.role.toLowerCase() !== "user").length}
            </div>
            <div className="text-[11px] text-[#94A3B8] mt-1">Administrative operators</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, username, mobile, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-xs font-medium text-[#111827] dark:text-white placeholder:text-[#94A3B8] focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86] transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#111827] dark:text-slate-200 focus:outline-none focus:border-[#2F8E86]"
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
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#111827] dark:text-slate-200 focus:outline-none focus:border-[#2F8E86]"
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
                        <div className="animate-spin h-6 w-6 border-2 border-[#2F8E86] border-t-transparent rounded-full" />
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
                          <div className="w-9 h-9 rounded-xl bg-[#2F8E86] text-white font-bold text-xs flex items-center justify-center shadow-xs">
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
                          className="text-xs font-semibold text-[#2F8E86] hover:text-[#25776F] dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
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
        {/* Invite by Email Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E5EAEB] dark:border-slate-800 shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5EAEB] dark:border-slate-800">
                <div className="flex items-center gap-2 text-base font-bold text-[#111827] dark:text-white">
                  <Mail className="w-4 h-4 text-[#2F8E86]" /> Invite a Teammate
                </div>
                <button onClick={() => setShowInviteModal(false)} className="p-1.5 rounded-lg hover:bg-[#F7F8F8] dark:hover:bg-slate-800 text-[#64748B] cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  They'll get an email with a secure link to set their own username and password. You can fine-tune their module access after they join.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="teammate@company.com"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-sm text-[#111827] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-lg text-sm text-[#111827] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2F8E86]/20 focus:border-[#2F8E86]"
                  >
                    <option value="SUB_USER">Standard User</option>
                    <option value="admin">Administrator (Full Org Control)</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E5EAEB] dark:border-slate-800">
                <button onClick={() => setShowInviteModal(false)} className="px-4 py-2 rounded-lg text-xs font-semibold text-[#64748B] hover:bg-[#F7F8F8] dark:hover:bg-slate-800 cursor-pointer">Cancel</button>
                <button
                  onClick={handleSendInvite}
                  disabled={submittingInvite}
                  className="px-4 py-2 rounded-lg bg-[#2F8E86] hover:bg-[#25776F] text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> {submittingInvite ? "Sending…" : "Send Invitation"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#E7F1F2] dark:bg-slate-800 text-[#2F8E86] dark:text-teal-400 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Username *
                      </label>
                      {addUsernameAvailability.status === "checking" && (
                        <span className="text-[10px] font-semibold text-slate-500">Checking…</span>
                      )}
                      {addUsernameAvailability.status === "available" && (
                        <span className="text-[10px] font-bold text-[#2F9E8F]">Available ✓</span>
                      )}
                      {addUsernameAvailability.status === "taken" && (
                        <span className="text-[10px] font-bold text-[#D95C5C]">Already taken</span>
                      )}
                      {addUsernameAvailability.status === "invalid" && (
                        <span className="text-[10px] font-bold text-[#B76E32]">{addUsernameAvailability.message || "Invalid"}</span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. rajesh_ops"
                      value={addForm.username}
                      onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                      aria-invalid={addUsernameAvailability.status === "taken" || addUsernameAvailability.status === "invalid"}
                      className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-2 transition ${
                        addUsernameAvailability.status === "taken" || addUsernameAvailability.status === "invalid"
                          ? "border-[#D95C5C] focus:ring-[#D95C5C]/20 focus:border-[#D95C5C]"
                          : addUsernameAvailability.status === "available"
                          ? "border-[#2F9E8F] focus:ring-[#2F9E8F]/20 focus:border-[#2F9E8F]"
                          : "border-[#D9E2E3] dark:border-slate-700 focus:ring-[#2F8E86]/15 focus:border-[#2F8E86]"
                      }`}
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
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#2F8E86] focus:ring-2 focus:ring-[#2F8E86]/15"
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
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#2F8E86] focus:ring-2 focus:ring-[#2F8E86]/15"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      inputMode="numeric"
                      placeholder="e.g. 9876543210"
                      value={addForm.mobile}
                      onChange={(e) => setAddForm({ ...addForm, mobile: sanitizeMobile(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#2F8E86] focus:ring-2 focus:ring-[#2F8E86]/15"
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#2F8E86]"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-[#D9E2E3] dark:border-slate-700">
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
                            className="w-3.5 h-3.5 rounded text-[#2F8E86] focus:ring-[#2F8E86] border-slate-300"
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
                    className="px-5 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
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
                    className="px-5 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
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
                  <div className="w-8 h-8 rounded-lg bg-[#E7F1F2] dark:bg-slate-800 text-[#2F8E86] dark:text-teal-400 flex items-center justify-center">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#2F8E86] focus:ring-2 focus:ring-[#2F8E86]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    inputMode="numeric"
                    value={editForm.mobile || ""}
                    onChange={(e) => setEditForm({ ...editForm, mobile: sanitizeMobile(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#2F8E86] focus:ring-2 focus:ring-[#2F8E86]/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    System Role
                  </label>
                  <select
                    value={editForm.role || "SUB_USER"}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-[#D9E2E3] dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#2F8E86]"
                  >
                    <option value="SUB_USER">Standard User (SUB_USER)</option>
                    <option value="operator">Operator (Dispatch & Trips)</option>
                    <option value="accounts">Accounts Manager (Billing & Invoices)</option>
                    <option value="admin">Administrator (Tenant Admin)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-[#D9E2E3] dark:border-slate-700">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Active Status</div>
                    <div className="text-[11px] text-slate-400">Allow user to sign in to console</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editForm.isActive ?? true}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-[#2F8E86] focus:ring-[#2F8E86] border-slate-300 cursor-pointer"
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
                    className="px-5 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
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
                  <div className="w-8 h-8 rounded-lg bg-[#E7F1F2] dark:bg-slate-800 text-[#2F8E86] dark:text-teal-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-[#D9E2E3] dark:border-slate-700">
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
                          className="w-4 h-4 rounded text-[#2F8E86] focus:ring-[#2F8E86] border-slate-300"
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
                    className="px-5 py-2 bg-[#2F8E86] hover:bg-[#25776F] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
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
