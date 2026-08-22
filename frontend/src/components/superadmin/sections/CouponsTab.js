"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function CouponsTab() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    discountType: "FLAT",
    discountValue: "",
    minRecharge: "",
    maxDiscount: "",
    isFeatured: true,
    active: true,
    targetSellerId: "ALL",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch Coupons list
  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["adminCoupons"],
    queryFn: () => api.get("/coupons/admin/list").then((res) => res.data || []),
  });

  // Fetch Sellers list for assignment dropdown
  const { data: sellers = [] } = useQuery({
    queryKey: ["adminSellersList"],
    queryFn: () => api.get("/admin/sellers?limit=200").then((res) => res.data?.sellers || res.sellers || (Array.isArray(res.data) ? res.data : [])),
  });

  // Save / Update mutation
  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (editingCoupon) {
        return api.put(`/coupons/admin/${editingCoupon.id}`, payload);
      }
      return api.post("/coupons/admin/create", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["adminCoupons"]);
      queryClient.invalidateQueries(["featuredCoupon"]);
      showToast(editingCoupon ? "Coupon updated!" : "New coupon created!");
      setModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      showToast(err.data?.message || err.message || "Failed to save coupon.", "error");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/coupons/admin/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["adminCoupons"]);
      queryClient.invalidateQueries(["featuredCoupon"]);
      showToast("Coupon deleted!");
    },
  });

  // Toggle Featured status mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, isFeatured }) => api.put(`/coupons/admin/${id}`, { isFeatured }),
    onSuccess: () => {
      queryClient.invalidateQueries(["adminCoupons"]);
      queryClient.invalidateQueries(["featuredCoupon"]);
      showToast("Featured coupon updated!");
    },
  });

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      title: "",
      discountType: "FLAT",
      discountValue: "",
      minRecharge: "",
      maxDiscount: "",
      isFeatured: true,
      active: true,
      targetSellerId: "ALL",
    });
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      title: coupon.title || "",
      discountType: coupon.discountType || "FLAT",
      discountValue: coupon.discountValue || "",
      minRecharge: coupon.minRecharge || "",
      maxDiscount: coupon.maxDiscount || "",
      isFeatured: Boolean(coupon.isFeatured),
      active: Boolean(coupon.active),
      targetSellerId: coupon.targetSellerId || "ALL",
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code || !formData.discountValue) {
      showToast("Code and Discount Value are required.", "error");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-slide-in">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start pb-1 border-b border-[#1e293b]/40 select-none">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>🎟️</span> Coupons & Offers
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Create universal promo codes for ALL sellers or assign exclusive coupons to a specific seller.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
        >
          <span>+</span> Create Coupon
        </button>
      </div>

      {/* Table */}
      <div className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#080d1a] relative">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1e293b] text-[10px] text-slate-500 uppercase tracking-wider font-bold select-none">
              <th className="px-4 py-3.5">Coupon Code</th>
              <th className="px-4 py-3.5">Title / Label</th>
              <th className="px-4 py-3.5">Target Audience</th>
              <th className="px-4 py-3.5">Discount</th>
              <th className="px-4 py-3.5">Min Recharge</th>
              <th className="px-4 py-3.5">Featured Banner</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/50">
            {isLoading ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-slate-400 font-semibold">
                  Loading coupons...
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-slate-400 font-semibold">
                  No promo coupons created yet. Click "+ Create Coupon" to start.
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-[#1e293b]/50 text-slate-300 hover:bg-[#0c1324]/30 transition">
                  <td className="px-4 py-3.5 font-mono font-black text-indigo-400 uppercase text-sm">
                    {coupon.code}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-white">
                    {coupon.title || "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    {coupon.targetSeller ? (
                      <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                        👤 {coupon.targetSeller.firstName} {coupon.targetSeller.lastName}
                        <span className="text-[10px] text-amber-300/70 font-normal">({coupon.targetSeller.email})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-slate-800/60 border border-slate-700/50 text-slate-300 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                        🌐 All Sellers
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-emerald-400 text-sm">
                    {coupon.discountType === "FLAT" ? `₹${coupon.discountValue}` : `${coupon.discountValue}%`}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-400 text-sm">
                    ₹{coupon.minRecharge || 0}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => toggleFeaturedMutation.mutate({ id: coupon.id, isFeatured: !coupon.isFeatured })}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition cursor-pointer border ${
                        coupon.isFeatured
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                          : "bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {coupon.isFeatured ? "⚡ Flash Banner Active" : "Make Featured"}
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-black uppercase ${
                      coupon.active 
                        ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" 
                        : "text-slate-400 border-slate-700/50 bg-slate-800/30"
                    }`}>
                      {coupon.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="px-2.5 py-1 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete coupon ${coupon.code}?`)) {
                            deleteMutation.mutate(coupon.id);
                          }
                        }}
                        className="px-2.5 py-1 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Create/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#080d1a] border border-[#1e293b] rounded-2xl p-6 shadow-2xl space-y-4 text-xs animate-scaleUp">
            <div>
              <h3 className="text-sm font-black text-white">
                {editingCoupon ? "Edit Shipping Coupon" : "Create Shipping Coupon"}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Publish a promotional coupon code for recharge bonuses.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Coupon Target (Assign To) *</label>
                <select
                  value={formData.targetSellerId}
                  onChange={(e) => setFormData({ ...formData, targetSellerId: e.target.value })}
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition font-bold"
                >
                  <option value="ALL">🌐 ALL Sellers (Universal Offer for Everyone)</option>
                  {Array.isArray(sellers) && sellers.map((seller) => (
                    <option key={seller.id} value={seller.id}>
                      👤 {seller.firstName} {seller.lastName} — {seller.companyName ? `${seller.companyName} (${seller.email})` : seller.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. VIP200"
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white font-mono font-bold uppercase text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-500 block">Banner Title / Display Name</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Exclusive VIP Bonus Offer"
                  className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="FLAT">Flat Amount (₹)</option>
                    <option value="PERCENT">Percentage (%)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Discount Value *</label>
                  <input
                    type="number"
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder="100"
                    className="w-full bg-[#0b1120] border border-[#1e293b] text-white font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Min Recharge (₹)</label>
                  <input
                    type="number"
                    value={formData.minRecharge}
                    onChange={(e) => setFormData({ ...formData, minRecharge: e.target.value })}
                    placeholder="500"
                    className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Max Cap (₹, for %)</label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    placeholder="Optional"
                    className="w-full bg-[#0b1120] border border-[#1e293b] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1 select-none">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded border-[#1e293b] text-purple-600 focus:ring-purple-500 w-4 h-4 bg-[#0b1120]"
                  />
                  <span className="font-bold text-slate-300 text-xs">⚡ Flash on Seller Dashboard Banner</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded border-[#1e293b] text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-[#0b1120]"
                  />
                  <span className="font-bold text-slate-300 text-xs">Active</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-[#1e293b] hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {saveMutation.isLoading ? "Saving..." : "Save Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
