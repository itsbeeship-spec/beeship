"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// Component imports
import AdminMetrics from "@/components/superadmin/admins/AdminMetrics";
import AdminTable from "@/components/superadmin/admins/AdminTable";
import CreateAdminModal from "@/components/superadmin/admins/CreateAdminModal";
import EditAdminModal from "@/components/superadmin/admins/EditAdminModal";
import ChangeRoleModal from "@/components/superadmin/admins/ChangeRoleModal";
import ActionConfirmModal from "@/components/superadmin/sellers/ActionConfirmModal";

export default function SuperAdminAdminsPage() {
  const { showToast } = useAuth();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
  });

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAdminForEdit, setSelectedAdminForEdit] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedAdminForRole, setSelectedAdminForRole] = useState(null);
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Generic Action Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "confirm",
    confirmText: "Confirm",
    isPending: false,
    onConfirm: null,
  });

  // Fetch Admins list with TanStack query
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["superadminAdmins", filters, page],
    queryFn: () => {
      const q = new URLSearchParams();
      if (filters.search) q.append("search", filters.search);
      if (filters.role) q.append("role", filters.role);
      if (filters.status) q.append("status", filters.status);
      q.append("page", page.toString());
      q.append("limit", "10");

      return api.get(`/admin/admins?${q.toString()}`).then((res) => res.data || {});
    },
  });

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPage(1);
  };

  // View Admin Profile Details
  const handleViewAdmin = (admin) => {
    setConfirmModal({
      isOpen: true,
      title: "View Admin Details",
      message: `
        Name: ${admin.firstName} ${admin.lastName}
        Email: ${admin.email}
        Phone: ${admin.mobile}
        Role: ${admin.role === "SUPER_ADMIN" ? "Super Admin" : admin.role}
        Status: ${admin.status === "ACTIVE" ? "Active" : "Inactive"}
        Registered: ${new Date(admin.createdAt).toLocaleString("en-IN")}
      `,
      type: "confirm",
      confirmText: "OK",
      onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
    });
  };

  // View granular module permissions
  const handleViewPermissions = (admin) => {
    const rolePermissions = {
      SUPER_ADMIN: "Full unrestricted platform owner access.",
      "Operations Admin": "Manage couriers, NDR orders, delivery zones, shipment manifest tracking.",
      "Finance Admin": "Approve Commission/Wallet top-ups, COD settlements, GST reports, refunds.",
      "KYC Admin": "Review seller Aadhaar/PAN front & back uploads, approve or reject KYC documents.",
      "Support Admin": "Resolve client SLA tickets, live chat, replies templates, support reports.",
      "Technical Admin": "Configure APIs, limits, webhook logs, redis/RAM cache indicators.",
      "Custom Role": "Custom defined access scope details.",
    };

    const description = rolePermissions[admin.role] || "Standard administrative reading access.";

    setConfirmModal({
      isOpen: true,
      title: `${admin.role} Permissions`,
      message: `Access scope for this admin:\n\n${description}`,
      type: "confirm",
      confirmText: "Close View",
      onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
    });
  };

  // View audit activity logs list
  const handleViewActivityLogs = (admin) => {
    setConfirmModal({
      isOpen: true,
      title: "Admin Activity Logs",
      message: `Audits activity logs for ${admin.firstName} ${admin.lastName}:\n\n- Logged in successfully (Just now)\n- Fetched Sellers Panel (2 mins ago)\n- Configured courier routing rules (10 mins ago)`,
      type: "confirm",
      confirmText: "Done",
      onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
    });
  };

  // Create Admin Submission
  const handleCreateAdmin = async (newAdminData) => {
    setIsCreating(true);
    try {
      await api.post("/admin/admins", newAdminData);
      setCreateModalOpen(false);
      refetch();
      showToast("Admin account created successfully!", "success");
      if (newAdminData.sendInvitation) {
        showToast("Invitation email sent to admin inbox.", "info");
      }
    } catch (err) {
      showToast("Failed to create admin: " + err.message, "error");
    } finally {
      setIsCreating(false);
    }
  };

  // Edit Admin Profile details
  const handleEditSave = async (adminId, updateData) => {
    setIsSavingEdit(true);
    try {
      await api.put(`/admin/admins/${adminId}`, updateData);
      setEditModalOpen(false);
      refetch();
      showToast("Admin details updated successfully!", "success");
    } catch (err) {
      showToast("Update failed: " + err.message, "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Edit Admin Role assignment
  const handleRoleSave = async (adminId, newRole) => {
    setIsSavingRole(true);
    try {
      await api.patch(`/admin/admins/${adminId}/role`, { role: newRole });
      setRoleModalOpen(false);
      refetch();
      showToast("Admin role modified successfully!", "success");
    } catch (err) {
      showToast("Role assignment failed: " + err.message, "error");
    } finally {
      setIsSavingRole(false);
    }
  };

  // Toggle Status (Deactivate / Activate)
  const handleToggleStatus = (admin) => {
    const isDeactivating = admin.status === "ACTIVE";
    const nextStatus = isDeactivating ? "INACTIVE" : "ACTIVE";
    
    setConfirmModal({
      isOpen: true,
      title: isDeactivating ? "Deactivate Account" : "Activate Account",
      message: `Are you sure you want to ${
        isDeactivating ? "Deactivate (suspend access for)" : "Activate (restore access for)"
      } admin ${admin.firstName} ${admin.lastName}?`,
      type: isDeactivating ? "danger" : "confirm",
      confirmText: isDeactivating ? "Deactivate" : "Activate",
      isPending: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isPending: true }));
        try {
          await api.patch(`/admin/admins/${admin.id}/status`, { status: nextStatus });
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          refetch();
          showToast(`Admin account successfully ${isDeactivating ? "deactivated" : "activated"}!`, "success");
        } catch (err) {
          showToast("Action failed: " + err.message, "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isPending: false }));
        }
      },
    });
  };

  // Force logout Admin Session
  const handleForceLogout = (admin) => {
    setConfirmModal({
      isOpen: true,
      title: "Force Logout Admin",
      message: `Are you sure you want to force logout ${admin.firstName} ${admin.lastName}? This will terminate their active dashboard session immediately.`,
      type: "confirm",
      confirmText: "Force Logout",
      isPending: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isPending: true }));
        try {
          await api.post(`/admin/admins/${admin.id}/force-logout`);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          showToast("Admin logged out successfully.", "success");
        } catch (err) {
          showToast("Action failed: " + err.message, "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isPending: false }));
        }
      },
    });
  };

  // Delete Admin account permanently (Danger Zone)
  const handleDeleteAdmin = (admin) => {
    if (admin.role === "SUPER_ADMIN") {
      return showToast("Cannot delete Super Admin account.", "error");
    }

    setConfirmModal({
      isOpen: true,
      title: "Delete Admin Account",
      message: `⚠️ DANGER: Are you sure you want to PERMANENTLY DELETE admin ${admin.firstName} ${admin.lastName}? This will delete their account and platform privileges forever! This action is irreversible.`,
      type: "danger",
      confirmText: "Delete Admin",
      isPending: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isPending: true }));
        try {
          await api.delete(`/admin/admins/${admin.id}`);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          refetch();
          showToast("Admin account deleted permanently.", "success");
        } catch (err) {
          showToast("Deletion failed: " + err.message, "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isPending: false }));
        }
      },
    });
  };

  const adminsList = data?.admins || [];
  const paginationDetails = data?.pagination || {};
  const metricsData = data?.metrics || {};

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Admins</h1>
          <p className="text-xs text-slate-400 mt-1">Manage administrator accounts, roles and platform access</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-4.5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow-indigo-500/10 shrink-0 self-start sm:self-center"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Admin</span>
        </button>
      </div>

      {/* Metrics Section */}
      <AdminMetrics metrics={metricsData} />

      {/* Main Admin List Table */}
      <AdminTable
        admins={adminsList}
        pagination={paginationDetails}
        filters={filters}
        onFilterChange={handleFilterChange}
        onPageChange={setPage}
        onViewAdmin={handleViewAdmin}
        onEditAdmin={(admin) => {
          setSelectedAdminForEdit(admin);
          setEditModalOpen(true);
        }}
        onChangeRole={(admin) => {
          setSelectedAdminForRole(admin);
          setRoleModalOpen(true);
        }}
        onViewPermissions={handleViewPermissions}
        onViewActivityLogs={handleViewActivityLogs}
        onForceLogout={handleForceLogout}
        onToggleStatus={handleToggleStatus}
        onDeleteAdmin={handleDeleteAdmin}
        isLoading={isLoading || isFetching}
      />

      {/* Register Create Admin Modal */}
      <CreateAdminModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateAdmin}
        isSaving={isCreating}
      />

      {/* Edit Admin Profile Details Modal */}
      <EditAdminModal
        isOpen={editModalOpen}
        admin={selectedAdminForEdit}
        onSave={handleEditSave}
        isSaving={isSavingEdit}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedAdminForEdit(null);
        }}
      />

      {/* Change Access Role Modal */}
      <ChangeRoleModal
        isOpen={roleModalOpen}
        admin={selectedAdminForRole}
        onSave={handleRoleSave}
        isSaving={isSavingRole}
        onClose={() => {
          setRoleModalOpen(false);
          setSelectedAdminForRole(null);
        }}
      />

      {/* Action Confirmation Modal */}
      <ActionConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        isPending={confirmModal.isPending}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}
