"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// Component imports
import SellerMetrics from "@/components/superadmin/sellers/SellerMetrics";
import SellerTable from "@/components/superadmin/sellers/SellerTable";
import SellerDetailsModal from "@/components/superadmin/sellers/SellerDetailsModal";
import EditSellerModal from "@/components/superadmin/sellers/EditSellerModal";
import ActionConfirmModal from "@/components/superadmin/sellers/ActionConfirmModal";

export default function SuperAdminSellersPage() {
  const { showToast } = useAuth();
  
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    kycStatus: "",
    plan: "",
  });

  // Modal Control States
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState(null);
  const [detailsData, setDetailsData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSellerForEdit, setSelectedSellerForEdit] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Custom Alert / Confirmation Modal State
  const [confirmInputVal, setConfirmInputVal] = useState("");
  const [resetPwdData, setResetPwdData] = useState({ newPassword: "", confirmPassword: "" });
  const [actionSeller, setActionSeller] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "confirm",
    confirmText: "Confirm",
    isPending: false,
    onConfirm: null,
  });

  // Fetch Sellers List from backend
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["superadminSellers", filters, page],
    queryFn: () => {
      const q = new URLSearchParams();
      if (filters.search) q.append("search", filters.search);
      if (filters.status) q.append("status", filters.status);
      if (filters.kycStatus) q.append("kycStatus", filters.kycStatus);
      if (filters.plan) q.append("plan", filters.plan);
      q.append("page", page.toString());
      q.append("limit", "10");

      return api.get(`/admin/sellers?${q.toString()}`).then((res) => res.data || {});
    },
  });

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPage(1); // Reset to first page when filtering
  };

  // View Seller Details action
  const handleViewSeller = async (seller) => {
    setSelectedSellerId(seller.id);
    setDetailsLoading(true);
    setDetailsModalOpen(true);
    try {
      const res = await api.get(`/admin/sellers/${seller.id}`);
      setDetailsData(res.data || null);
    } catch (err) {
      showToast("Failed to load seller details: " + err.message, "error");
      setDetailsModalOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Edit Seller Profile action
  const handleEditSeller = (seller) => {
    setSelectedSellerForEdit(seller);
    setEditModalOpen(true);
  };

  const handleSaveProfile = async (userId, updateData) => {
    setIsSavingProfile(true);
    try {
      await api.put(`/admin/sellers/${userId}`, updateData);
      setEditModalOpen(false);
      refetch();
      showToast("Seller profile updated successfully!", "success");
    } catch (err) {
      showToast("Failed to update profile: " + err.message, "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Password reset action
  const handleResetPassword = (seller) => {
    setActionSeller(seller);
    setResetPwdData({ newPassword: "", confirmPassword: "" });
    setConfirmModal({
      isOpen: true,
      title: "Reset Password",
      message: `Set a new secure password for ${seller.firstName} ${seller.lastName}:`,
      type: "reset-password",
      confirmText: "Change Password",
      isPending: false,
    });
  };

  const handleExecuteConfirm = async () => {
    if (confirmModal.type === "reset-password") {
      if (resetPwdData.newPassword.length < 6) {
        return showToast("New password must be at least 6 characters.", "error");
      }
      if (resetPwdData.newPassword !== resetPwdData.confirmPassword) {
        return showToast("New passwords do not match.", "error");
      }

      setConfirmModal((prev) => ({ ...prev, isPending: true }));
      try {
        await api.patch(`/admin/sellers/${actionSeller.id}/reset-password`, {
          password: resetPwdData.newPassword,
        });
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast("Password reset successful!", "success");
      } catch (err) {
        showToast("Password reset failed: " + err.message, "error");
      } finally {
        setConfirmModal((prev) => ({ ...prev, isPending: false }));
      }
    } else {
      confirmModal.onConfirm?.();
    }
  };

  // Force logout action
  const handleForceLogout = (seller) => {
    setConfirmModal({
      isOpen: true,
      title: "Force Logout",
      message: `Are you sure you want to terminate all active sessions and force logout ${seller.firstName} ${seller.lastName}?`,
      type: "confirm",
      confirmText: "Force Logout",
      isPending: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isPending: true }));
        try {
          await api.post(`/admin/sellers/${seller.id}/force-logout`);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          showToast("Seller session invalidated successfully!", "success");
        } catch (err) {
          showToast("Action failed: " + err.message, "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isPending: false }));
        }
      },
    });
  };

  // Block or Activate account toggle
  const handleToggleBlock = (seller) => {
    const isBlocking = seller.status === "ACTIVE";
    const actionWord = isBlocking ? "suspend" : "unblock";
    setConfirmModal({
      isOpen: true,
      title: isBlocking ? "Suspend Account" : "Unblock Account",
      message: `Are you sure you want to ${actionWord} ${seller.firstName} ${seller.lastName}'s account?`,
      type: isBlocking ? "danger" : "confirm",
      confirmText: isBlocking ? "Suspend Account" : "Activate Account",
      isPending: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isPending: true }));
        try {
          const nextStatus = isBlocking ? "SUSPENDED" : "ACTIVE";
          await api.patch(`/admin/sellers/${seller.id}/status`, { status: nextStatus });
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          refetch();
          showToast(`Seller account successfully ${isBlocking ? "suspended" : "unblocked"}!`, "success");
        } catch (err) {
          showToast("Action failed: " + err.message, "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isPending: false }));
        }
      },
    });
  };

  // Delete account action
  const handleDeleteSeller = (seller) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Account Permanently",
      message: `⚠️ DANGER ZONE: Are you sure you want to PERMANENTLY DELETE ${seller.firstName} ${seller.lastName}? All associated data, orders, and configuration will be destroyed! This action is irreversible.`,
      type: "danger",
      confirmText: "Delete Account",
      isPending: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isPending: true }));
        try {
          await api.delete(`/admin/sellers/${seller.id}`);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          refetch();
          showToast("Seller account deleted permanently.", "success");
        } catch (err) {
          showToast("Deletion failed: " + err.message, "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isPending: false }));
        }
      },
    });
  };

  // CSV Export action
  const handleExportCsv = () => {
    const sellersToExport = data?.sellers || [];
    if (sellersToExport.length === 0) {
      return showToast("No seller records to export.", "warning");
    }

    const headers = [
      "Seller ID",
      "Full Name",
      "Email Address",
      "Mobile Number",
      "Company Name",
      "KYC Status",
      "Plan",
      "Wallet Balance",
      "Status",
      "Registered Date"
    ];

    const rows = sellersToExport.map((s) => [
      s.id,
      `${s.firstName} ${s.lastName}`,
      s.email,
      s.mobile,
      s.companyName || "",
      s.kycStatus,
      s.plan,
      s.walletBalance,
      s.status,
      new Date(s.createdAt).toLocaleDateString("en-IN")
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `beeship_sellers_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sellersList = data?.sellers || [];
  const paginationDetails = data?.pagination || {};
  const metricsData = data?.metrics || {};

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Sellers</h1>
        <p className="text-xs text-slate-400 mt-1">Manage and monitor all registered seller accounts.</p>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] text-center space-y-4">
          <span className="text-3xl">⚠️</span>
          <h3 className="text-xs font-bold text-slate-100">Failed to load Sellers list</h3>
          <p className="text-xs text-slate-400 max-w-sm">{error.message || "Unknown server response error."}</p>
          <button
            onClick={() => refetch()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            Retry Load
          </button>
        </div>
      ) : (
        <>
          {/* Sellers Overview Metrics */}
          <SellerMetrics metrics={metricsData} />

          {/* Sellers Main Table */}
          <SellerTable
            sellers={sellersList}
            pagination={paginationDetails}
            filters={filters}
            onFilterChange={handleFilterChange}
            onPageChange={setPage}
            onViewSeller={handleViewSeller}
            onEditSeller={handleEditSeller}
            onResetPassword={handleResetPassword}
            onForceLogout={handleForceLogout}
            onToggleBlock={handleToggleBlock}
            onDeleteSeller={handleDeleteSeller}
            onExport={handleExportCsv}
            isLoading={isLoading || isFetching}
          />
        </>
      )}

      {/* Details View Modal */}
      <SellerDetailsModal
        isOpen={detailsModalOpen}
        sellerId={selectedSellerId}
        detailsData={detailsData}
        isLoading={detailsLoading}
        onClose={() => {
          setDetailsModalOpen(false);
          setDetailsData(null);
        }}
      />

      {/* Profile Edit Modal */}
      <EditSellerModal
        isOpen={editModalOpen}
        seller={selectedSellerForEdit}
        isSaving={isSavingProfile}
        onSave={handleSaveProfile}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedSellerForEdit(null);
        }}
      />

      {/* Custom Action Confirmation Alert Modal */}
      <ActionConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        isPending={confirmModal.isPending}
        inputValue={confirmInputVal}
        onInputChange={setConfirmInputVal}
        resetData={resetPwdData}
        onResetDataChange={(field, val) => setResetPwdData((prev) => ({ ...prev, [field]: val }))}
        onConfirm={handleExecuteConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
