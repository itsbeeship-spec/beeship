"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function WarehouseSettings() {
  const [warehouses, setWarehouses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [editingWarehouseId, setEditingWarehouseId] = useState(null);
  
  // Toast notifications state
  const [toast, setToast] = useState(null);
  const queryClient = useQueryClient();

  // Add/Edit Warehouse Form State
  const [form, setForm] = useState({
    name: "",
    personName: "",
    phone: "",
    email: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    gstNumber: ""
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Fetch warehouses via useQuery
  const { data: warehousesList, isLoading: loading } = useQuery({
    queryKey: ["warehouse"],
    queryFn: () => api.get("/warehouse").then(res => res.data || []),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (warehousesList) {
      setWarehouses(warehousesList);
    }
  }, [warehousesList]);

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenAddModal = () => {
    setForm({
      name: "",
      personName: "",
      phone: "",
      email: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      gstNumber: ""
    });
    setEditingWarehouseId(null);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (wh) => {
    setForm({
      name: wh.name || "",
      personName: wh.personName || "",
      phone: wh.phone || "",
      email: wh.email || "",
      address1: wh.address1 || "",
      address2: wh.address2 || "",
      city: wh.city || "",
      state: wh.state || "",
      country: wh.country || "India",
      pincode: wh.pincode || "",
      gstNumber: wh.gstNumber || ""
    });
    setEditingWarehouseId(wh.id);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  // Create or update mutation
  const submitMutation = useMutation({
    mutationFn: (payload) => {
      if (editingWarehouseId) {
        return api.put(`/warehouse/${editingWarehouseId}`, payload);
      } else {
        return api.post("/warehouse", payload);
      }
    },
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["warehouse"] });
        setModalOpen(false);
        showToast(
          editingWarehouseId 
            ? "Warehouse updated successfully!" 
            : "Warehouse created successfully!"
        );
      } else {
        setErrorMsg(res.message || "Failed to save warehouse");
      }
    },
    onError: (err) => {
      console.error("Failed to save warehouse:", err);
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    },
    onSettled: () => {
      setSubmitting(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    // Validation
    if (!form.name.trim() || !form.personName.trim() || !form.phone.trim() || !form.address1.trim() || !form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
      setErrorMsg("Please fill all fields marked with *");
      return;
    }

    setSubmitting(true);
    submitMutation.mutate(form);
  };

  // Set default mutation
  const defaultMutation = useMutation({
    mutationFn: (id) => api.put(`/warehouse/${id}/default`),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["warehouse"] });
        showToast("Default warehouse updated!");
      }
    },
    onError: (err) => {
      console.error("Failed to set default warehouse:", err);
    }
  });

  const handleSetDefault = (id) => {
    defaultMutation.mutate(id);
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/warehouse/${id}`),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["warehouse"] });
        showToast("Warehouse deleted successfully!");
      } else {
        showToast(res.message || "Failed to delete warehouse", "error");
      }
    },
    onError: (err) => {
      console.error("Failed to delete warehouse:", err);
      showToast("Something went wrong. Please try again.", "error");
    }
  });

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="w-full animate-fadeIn font-sans select-none" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border animate-slideDown text-xs font-semibold ${
          toast.type === "info" ? "bg-blue-50 border-blue-100 text-blue-700" :
          toast.type === "error" ? "bg-rose-50 border-rose-100 text-rose-700" :
          "bg-emerald-50 border-emerald-100 text-emerald-700"
        }`}>
          {toast.type === "info" ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : toast.type === "error" ? (
            <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toast.message}
        </div>
      )}

      {/* Title Header */}
      <div className="mb-6 select-none">
        <h2 className="text-xl font-bold text-slate-800">Warehouse Management</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage your warehouse locations and operations.</p>
      </div>

      {/* Main card box containing Warehouse list table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6.5 shadow-sm">
        
        {/* Table header row with Add New button */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4 select-none">
          <h3 className="text-sm font-bold text-slate-800">Warehouse List</h3>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-t-transparent border-[#25a2fe] rounded-full animate-spin" />
          </div>
        ) : warehouses.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-semibold animate-fadeIn">
            No warehouses found. Click "Add New" to add a pickup location.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider bg-slate-50/50">
                  <th className="py-4 px-4">Name</th>
                  <th className="py-4 px-4">Person Details</th>
                  <th className="py-4 px-4">Address</th>
                  <th className="py-4 px-4">Pincode</th>
                  <th className="py-4 px-4">Contact</th>
                  <th className="py-4 px-4">Default Warehouse</th>
                  <th className="py-4 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold select-none animate-fadeIn">
                {warehouses.map((wh) => (
                  <tr key={wh.id} className="hover:bg-slate-50/30 transition">
                    <td className="py-4.5 px-4 font-bold text-slate-800">{wh.name}</td>
                    <td className="py-4.5 px-4 font-bold text-slate-750">{wh.personName}</td>
                    <td className="py-4.5 px-4 max-w-[220px] truncate leading-relaxed">
                      {wh.address1}{wh.address2 ? `, ${wh.address2}` : ""}, {wh.city}, {wh.state}, {wh.country}
                    </td>
                    <td className="py-4.5 px-4 font-bold text-slate-650">{wh.pincode}</td>
                    <td className="py-4.5 px-4 text-slate-650 leading-relaxed font-sans">
                      <div>{wh.phone}</div>
                      {wh.email && <div className="text-[10px] text-slate-400 font-medium">{wh.email}</div>}
                    </td>
                    <td className="py-4.5 px-4">
                      {wh.isDefault ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black uppercase">
                          Default
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefault(wh.id)}
                          className="text-[#25a2fe] hover:text-[#1f8ce0] font-bold text-[10px] cursor-pointer hover:underline"
                        >
                          Set as Default
                        </button>
                      )}
                    </td>
                    <td className="py-4.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenEditModal(wh)}
                        className="text-[#25a2fe] hover:text-[#1f8ce0] font-bold text-[10px] cursor-pointer hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Warehouse Modal Dialog Popup */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn backdrop-blur-xs">
          <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-2xl shadow-2xl relative p-7 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingWarehouseId ? "Edit Warehouse" : "Add New Warehouse"}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer text-lg"
              >
                &times;
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4.5 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            {/* Modal form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4.5 font-sans">
              
              {/* Row 1: Warehouse Name & Person Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wide">
                    Warehouse Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter warehouse name"
                    value={form.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wide">
                    Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter person name"
                    value={form.personName}
                    onChange={(e) => handleInputChange("personName", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs"
                  />
                </div>
              </div>

              {/* Row 2: Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wide">
                    Phone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter 10 digit phone number"
                    value={form.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={form.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs"
                  />
                </div>
              </div>

              {/* Row 3: Address Line 1 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wide">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter address line 1"
                  value={form.address1}
                  onChange={(e) => handleInputChange("address1", e.target.value)}
                  className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs w-full"
                />
              </div>

              {/* Row 4: Address 2 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wide">
                  Address 2
                </label>
                <input
                  type="text"
                  placeholder="Enter address 2 (optional)"
                  value={form.address2}
                  onChange={(e) => handleInputChange("address2", e.target.value)}
                  className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs w-full"
                />
              </div>

              {/* Row 5: City, State, Country */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wide">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter city name"
                    value={form.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wide">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter state name"
                    value={form.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wide">
                    Country
                  </label>
                  <input
                    type="text"
                    placeholder="Enter country name"
                    value={form.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs"
                  />
                </div>
              </div>

              {/* Row 6: Pincode & GST */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wide">
                    Pin Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter 6 digit pin code"
                    value={form.pincode}
                    onChange={(e) => handleInputChange("pincode", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-700 font-extrabold uppercase tracking-wide">
                    GST Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 15 character GST number"
                    value={form.gstNumber}
                    onChange={(e) => handleInputChange("gstNumber", e.target.value)}
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#25a2fe] shadow-xs"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 py-3 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 shadow-sm font-sans"
              >
                {submitting ? "Saving..." : editingWarehouseId ? "Save Changes" : "Submit"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
