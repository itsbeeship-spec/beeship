"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

function CustomSelect({ value, onChange, options, placeholder, disabled, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold bg-white disabled:bg-slate-50 disabled:text-slate-400 hover:border-slate-350 focus:outline-none transition cursor-pointer text-left h-[38px] select-none"
      >
        <span className={!value ? "text-slate-400 font-medium" : "text-slate-700 font-semibold"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-40 animate-slideUp text-xs font-semibold text-slate-700 max-h-48 overflow-y-auto select-none">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between ${
                  value === opt.value ? "text-[#25a2fe] bg-blue-50/20" : ""
                }`}
              >
                <span>{opt.label}</span>
                {value === opt.value && (
                  <svg className="w-3.5 h-3.5 text-[#25a2fe]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AutoAssignSettings() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);

  // Fetch rules via useQuery
  const { data: rules = [], isLoading: loading } = useQuery({
    queryKey: ["autoAssignRules"],
    queryFn: () => api.get("/auto-assign-rules").then(res => res.data || []),
  });
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  
  // Form states
  const [ruleName, setRuleName] = useState("");
  const [priorityLevel, setPriorityLevel] = useState("1");
  const [isEnabled, setIsEnabled] = useState(true);
  const [conditionsJoin, setConditionsJoin] = useState("AND");
  const [configurations, setConfigurations] = useState([
    { field: "", condition: "", value: "" }
  ]);
  const [courierPriorities, setCourierPriorities] = useState([
    { courier: "", percentage: "100", maxCount: "0" }
  ]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setRuleName("");
    setPriorityLevel("1");
    setIsEnabled(true);
    setConditionsJoin("AND");
    setConfigurations([{ field: "", condition: "", value: "" }]);
    setCourierPriorities([{ courier: "", percentage: "100", maxCount: "0" }]);
    setShowModal(true);
  };

  const handleOpenEditModal = (rule) => {
    setEditingRule(rule);
    setRuleName(rule.name);
    setPriorityLevel(String(rule.priority));
    setIsEnabled(rule.enabled);
    setConditionsJoin(rule.conditionsJoin || "AND");
    setConfigurations(rule.configurations || []);
    setCourierPriorities(rule.priorities || []);
    setShowModal(true);
  };

  // Toggle Mutation
  const toggleMutation = useMutation({
    mutationFn: (ruleId) => api.patch(`/auto-assign-rules/${ruleId}/toggle`),
    onSuccess: (res) => {
      if (res?.success) {
        showToast("Rule status toggled successfully");
        queryClient.invalidateQueries({ queryKey: ["autoAssignRules"] });
      }
    },
    onError: (err) => {
      console.error(err);
      showToast(err.message || "Failed to toggle rule", "error");
    }
  });

  const handleToggleRule = (ruleId) => {
    toggleMutation.mutate(ruleId);
  };

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (ruleId) => api.delete(`/auto-assign-rules/${ruleId}`),
    onSuccess: (res) => {
      if (res) {
        showToast("Allocation rule deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["autoAssignRules"] });
      }
    },
    onError: (err) => {
      console.error(err);
      showToast(err.message || "Failed to delete rule", "error");
    }
  });

  const handleDeleteRule = (ruleId) => {
    if (!window.confirm("Are you sure you want to delete this allocation rule?")) return;
    deleteMutation.mutate(ruleId);
  };

  // Add more configurations
  const handleAddConfiguration = () => {
    setConfigurations(prev => [...prev, { field: "", condition: "", value: "" }]);
  };

  // Update configuration field
  const handleUpdateConfiguration = (index, key, val) => {
    setConfigurations(prev => prev.map((item, idx) => idx === index ? { ...item, [key]: val } : item));
  };

  // Delete configuration
  const handleDeleteConfiguration = (index) => {
    if (configurations.length === 1) {
      showToast("At least one configuration condition is required", "error");
      return;
    }
    setConfigurations(prev => prev.filter((_, idx) => idx !== index));
  };

  // Add priority level
  const handleAddPriorityLevel = () => {
    setCourierPriorities(prev => [...prev, { courier: "", percentage: "0", maxCount: "0" }]);
  };

  // Update priority level
  const handleUpdatePriorityLevel = (index, key, val) => {
    setCourierPriorities(prev => prev.map((item, idx) => idx === index ? { ...item, [key]: val } : item));
  };

  // Delete priority level
  const handleDeletePriorityLevel = (index) => {
    if (courierPriorities.length === 1) {
      showToast("At least one priority level is required", "error");
      return;
    }
    setCourierPriorities(prev => prev.filter((_, idx) => idx !== index));
  };

  // Save/Update Mutation
  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (editingRule) {
        return api.put(`/auto-assign-rules/${editingRule.id}`, payload);
      } else {
        return api.post("/auto-assign-rules", payload);
      }
    },
    onSuccess: (res) => {
      if (res?.success) {
        showToast(editingRule ? "Allocation rule updated successfully" : "New allocation rule created successfully");
        setShowModal(false);
        queryClient.invalidateQueries({ queryKey: ["autoAssignRules"] });
      }
    },
    onError: (err) => {
      console.error(err);
      showToast(err.message || "Failed to save rule", "error");
    }
  });

  const handleSaveRule = async (e) => {
    e.preventDefault();

    if (!ruleName.trim()) {
      showToast("Rule Name is required", "error");
      return;
    }

    if (configurations.some(c => !c.value.trim())) {
      showToast("Please fill values for all configurations", "error");
      return;
    }

    if (courierPriorities.some(p => !p.courier)) {
      showToast("Please select courier partner for all priority levels", "error");
      return;
    }

    // Validate priorities sum to 100% total (standard allocation check if multiple)
    const totalPercentage = courierPriorities.reduce((sum, item) => sum + parseFloat(item.percentage || 0), 0);
    if (totalPercentage !== 100) {
      showToast(`Total courier percentages must sum up to exactly 100% (currently ${totalPercentage}%)`, "warning");
      return;
    }

    const payload = {
      name: ruleName,
      priority: parseInt(priorityLevel, 10) || 1,
      enabled: isEnabled,
      conditionsJoin,
      configurations,
      priorities: courierPriorities
    };

    saveMutation.mutate(payload);
  };

  // Helper labels mapping
  const fieldLabels = {
    orderNumber: "Order Number",
    paymentMethod: "Payment Method",
    totalAmount: "Total Amount",
    collectableAmount: "Collectable Amount",
    channelId: "Channel ID",
    tags: "Tags",
    weight: "Weight",
    packageLength: "Package Length",
    packageBreadth: "Package Breadth",
    packageHeight: "Package Height",
    volumetricWeight: "Volumetric Weight",
    maxWeight: "Max Weight",
    firstName: "First Name",
    lastName: "Last Name",
    address: "Address",
    address2: "Address 2",
    phoneNumber: "Phone Number",
    city: "City",
    state: "State",
    pincode: "Pincode",
    zone: "Zone",
    productTitle: "Product Title",
    productQuantity: "Product Quantity",
    productSku: "Product SKU",
    productPrice: "Product Price"
  };

  const conditionLabels = {
    equals: "Equals",
    not_equals: "Not Equals",
    less_than: "Less Than",
    greater_than: "Greater Than",
    greater_than_or_equal: "Greater Than or Equal",
    less_than_or_equal: "Less Than or Equal",
    in: "In",
    not_in: "Not In"
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn font-sans select-none relative min-h-[400px]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4.5 py-3 rounded-xl shadow-xl border animate-slideDown text-xs font-semibold ${
          toast.type === "error" ? "bg-rose-50 border-rose-100 text-rose-700" :
          toast.type === "warning" ? "bg-amber-50 border-amber-100 text-amber-700" :
          "bg-emerald-50 border-emerald-100 text-emerald-700"
        }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          {toast.message}
        </div>
      )}

      {/* Main Header */}
      <div className="flex justify-between items-center w-full">
        <div>
          <h3 className="text-base font-black text-slate-900">Auto Assign Couriers</h3>
          <p className="text-xs text-slate-500 mt-1">Configure automated rules for assigning shipment orders to courier partners.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-[#25a2fe] hover:bg-[#1a85db] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Create Allocation Rule</span>
        </button>
      </div>

      {/* Rules Grid / List Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <div className="w-8 h-8 border-4 border-[#25a2fe]/30 border-t-[#25a2fe] rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-bold mt-4">Loading rules configuration...</span>
        </div>
      ) : rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs text-center">
          <div className="w-16 h-16 bg-[#25a2fe]/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#25a2fe]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.656 48.656 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7C4.547 9.547 4.5 10.768 4.5 12s.047 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.092-1.209.138-2.45.138-3.662z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 10.5h.008v.008H9V10.5zm3 0h.008v.008H12V10.5zm3 0h.008v.008H15V10.5z" />
            </svg>
          </div>
          <h4 className="text-slate-800 font-bold text-sm">No Allocation Rules Configured</h4>
          <p className="text-slate-400 text-xs mt-1.5 max-w-xs leading-relaxed">
            Create routing rules to automatically distribute shipment orders among different courier companies.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-5 px-4.5 py-2.5 bg-[#25a2fe] hover:bg-[#1a85db] text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Create Your First Rule
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider font-extrabold select-none">
                  <th className="py-4 px-6 font-bold w-12 text-center">Priority</th>
                  <th className="py-4 px-4 font-bold">Rule Name</th>
                  <th className="py-4 px-4 font-bold">Conditions</th>
                  <th className="py-4 px-4 font-bold">Courier Routing Allocation</th>
                  <th className="py-4 px-4 font-bold text-center w-24">Status</th>
                  <th className="py-4 pr-6 pl-4 font-bold text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/20 transition-all">
                    <td className="py-4 px-6 text-center select-none">
                      <span className="w-6 h-6 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full font-bold text-[10.5px]">
                        #{rule.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-800 font-bold text-xs">{rule.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Created: {new Date(rule.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {rule.configurations?.map((c, idx) => (
                          <span key={idx} className="bg-slate-50 border border-slate-150 rounded px-1.5 py-0.5 text-[9.5px] font-bold text-slate-600">
                            {idx > 0 && <span className="text-blue-500 mr-1 font-black uppercase text-[8px]">{rule.conditionsJoin}</span>}
                            {fieldLabels[c.field] || c.field} {conditionLabels[c.condition] || c.condition} "{c.value}"
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {rule.priorities?.map((p, idx) => (
                          <span key={idx} className="bg-blue-50/40 border border-blue-100 rounded-lg px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            {p.courier}: <strong className="text-[#25a2fe]">{p.percentage}%</strong>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          rule.enabled ? 'bg-[#25a2fe]' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            rule.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-4 pr-6 pl-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(rule)}
                          className="p-1.5 hover:bg-slate-50 hover:text-[#25a2fe] text-slate-400 rounded-lg transition cursor-pointer"
                          title="Edit Rule"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition cursor-pointer"
                          title="Delete Rule"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creation / Editing Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-text">
          <div className="bg-white border border-slate-150 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 select-none">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#25a2fe]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                <span>{editingRule ? "Edit Allocation Rule" : "Create New Allocation Rule"}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content Scrollable Area */}
            <form onSubmit={handleSaveRule} className="p-8 flex-1 overflow-y-auto flex flex-col gap-8">
              
              {/* 1. Basic Information */}
              <div className="flex flex-col gap-4">
                <h4 className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-2 select-none">
                  <span className="w-5 h-5 flex items-center justify-center bg-[#25a2fe]/10 text-[#25a2fe] rounded-full text-[10px] font-black">1</span>
                  Basic Information
                </h4>
                
                <div className="grid grid-cols-12 gap-5">
                  <div className="col-span-12 md:col-span-6 flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Rule Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Premium Orders to BlueDart"
                      value={ruleName}
                      onChange={(e) => setRuleName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold placeholder-slate-400 focus:outline-none focus:border-slate-350 transition"
                    />
                  </div>
                  
                  <div className="col-span-12 md:col-span-6 flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Priority Level *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g., 1 (Lower number = higher priority)"
                      value={priorityLevel}
                      onChange={(e) => setPriorityLevel(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold placeholder-slate-400 focus:outline-none focus:border-slate-350 transition"
                    />
                  </div>

                  <div className="col-span-12 flex items-center gap-3 mt-1 select-none">
                    <button
                      type="button"
                      onClick={() => setIsEnabled(!isEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-[#25a2fe]' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-bold text-slate-700">Enabled</span>
                  </div>
                </div>
              </div>

              {/* 2. Rule Configuration */}
              <div className="flex flex-col gap-4">
                <h4 className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-2 select-none">
                  <span className="w-5 h-5 flex items-center justify-center bg-[#25a2fe]/10 text-[#25a2fe] rounded-full text-[10px] font-black">2</span>
                  Rule Configuration
                </h4>
                
                <div className="border border-slate-150 bg-slate-50/10 rounded-2xl p-5 flex flex-col gap-4">
                  {configurations.map((config, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-end bg-white border border-slate-100 rounded-xl p-4 relative shadow-sm">
                      {/* Configuration counter */}
                      <span className="absolute -top-2 left-3 bg-white border border-slate-100 rounded px-1.5 py-0.5 text-[8.5px] text-[#25a2fe] font-black uppercase tracking-wider select-none">
                        {index === 0 ? "IF" : "AND"} Configuration {index + 1}
                      </span>
                      
                      <div className="col-span-12 md:col-span-4 flex flex-col gap-1.5">
                        <label className="text-[9.5px] text-slate-400 font-bold uppercase select-none">Field *</label>
                        <CustomSelect
                          value={config.field}
                          onChange={(val) => {
                            handleUpdateConfiguration(index, "field", val);
                            handleUpdateConfiguration(index, "condition", ""); // reset condition
                          }}
                          placeholder="Select Field"
                          options={Object.entries(fieldLabels).map(([val, label]) => ({ value: val, label }))}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-4 flex flex-col gap-1.5">
                        <label className="text-[9.5px] text-slate-400 font-bold uppercase select-none">Condition *</label>
                        <CustomSelect
                          disabled={!config.field}
                          value={config.condition}
                          onChange={(val) => handleUpdateConfiguration(index, "condition", val)}
                          placeholder="Select Condition"
                          options={[
                            { value: "equals", label: "Equals" },
                            { value: "not_equals", label: "Not Equals" },
                            { value: "less_than", label: "Less Than" },
                            { value: "greater_than", label: "Greater Than" },
                            { value: "greater_than_or_equal", label: "Greater Than or Equal" },
                            { value: "less_than_or_equal", label: "Less Than or Equal" },
                            { value: "in", label: "In" },
                            { value: "not_in", label: "Not In" }
                          ]}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-3 flex flex-col gap-1.5">
                        <label className="text-[9.5px] text-slate-400 font-bold uppercase select-none">Value *</label>
                        <input
                          type="text"
                          required
                          disabled={!config.field}
                          placeholder={
                            config.field === "totalAmount" || config.field === "collectableAmount" || config.field === "productPrice" ? "e.g., 1000" :
                            config.field === "paymentMethod" ? "e.g., COD, Prepaid" :
                            config.field === "pincode" ? "e.g., 342902" : "Enter value"
                          }
                          value={config.value}
                          onChange={(e) => handleUpdateConfiguration(index, "value", e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 font-semibold placeholder-slate-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 transition"
                        />
                      </div>

                      <div className="col-span-12 md:col-span-1 flex justify-center py-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteConfiguration(index)}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                        >
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddConfiguration}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-[#25a2fe]/40 hover:border-[#25a2fe] text-[#25a2fe] hover:bg-[#25a2fe]/5 rounded-xl text-xs font-bold transition cursor-pointer select-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>Add more Configuration</span>
                  </button>

                  <div className="flex items-center justify-between border-t border-slate-150/70 pt-4 mt-2 select-none">
                    <span className="text-[11px] text-slate-500 font-bold">Apply conditions using:</span>
                    <CustomSelect
                      value={conditionsJoin}
                      onChange={setConditionsJoin}
                      placeholder="Apply conditions using"
                      className="w-72"
                      options={[
                        { value: "AND", label: "AND (All conditions must match)" },
                        { value: "OR", label: "OR (Any condition must match)" }
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Courier Priority */}
              <div className="flex flex-col gap-4">
                <h4 className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-2 select-none">
                  <span className="w-5 h-5 flex items-center justify-center bg-[#25a2fe]/10 text-[#25a2fe] rounded-full text-[10px] font-black">3</span>
                  Courier Priority
                </h4>

                <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-150/50 text-[9.5px] text-slate-400 uppercase font-black tracking-wider select-none">
                        <th className="py-3.5 px-5 w-16 text-center">Priority</th>
                        <th className="py-3.5 px-4">Courier Partner</th>
                        <th className="py-3.5 px-4 w-32">Percentage</th>
                        <th className="py-3.5 px-4 w-36">Max Count (Daily)</th>
                        <th className="py-3.5 pr-5 pl-4 w-16 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                      {courierPriorities.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/10">
                          <td className="py-3 px-5 text-center select-none">
                            <span className="w-5 h-5 flex items-center justify-center bg-blue-50 text-[#25a2fe] rounded-full font-extrabold text-[9.5px]">
                              #{idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <CustomSelect
                              value={item.courier}
                              onChange={(val) => handleUpdatePriorityLevel(idx, "courier", val)}
                              placeholder="Select Courier Partner"
                              options={[
                                { value: "Delhivery Surface", label: "Delhivery Surface" },
                                { value: "Xpressbees Lite", label: "Xpressbees Lite" },
                                { value: "BlueDart Express", label: "BlueDart Express" },
                                { value: "Amazon Shipping", label: "Amazon Shipping" }
                              ]}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                required
                                min="0"
                                max="100"
                                placeholder="0"
                                value={item.percentage}
                                onChange={(e) => handleUpdatePriorityLevel(idx, "percentage", e.target.value)}
                                className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-slate-700 focus:outline-none transition"
                              />
                              <span className="text-xs text-slate-400 font-bold select-none">%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              required
                              min="0"
                              placeholder="e.g., 100"
                              value={item.maxCount}
                              onChange={(e) => handleUpdatePriorityLevel(idx, "maxCount", e.target.value)}
                              className="w-24 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-center font-semibold text-slate-700 focus:outline-none transition"
                            />
                          </td>
                          <td className="py-3 pr-5 pl-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeletePriorityLevel(idx)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="p-4 border-t border-slate-100 bg-slate-50/30 select-none">
                    <button
                      type="button"
                      onClick={handleAddPriorityLevel}
                      className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-[#25a2fe]/40 hover:border-[#25a2fe] text-[#25a2fe] hover:bg-[#25a2fe]/5 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span>Add Priority Level</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Action Footer inside form */}
              <div className="flex justify-end items-center gap-3 border-t border-slate-100 pt-6 mt-2 select-none">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
                >
                  {editingRule ? "Save Changes" : "Create Rule"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
