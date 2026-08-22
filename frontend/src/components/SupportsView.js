"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function SupportsView() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Modal State: null | "SELECT_CATEGORY" | "FORM_SHIPMENT" | "FORM_BILLING" | "FORM_TECH"
  const [modalState, setModalState] = useState(null);

  // Form Fields
  const [awbNumber, setAwbNumber] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [remarks, setRemarks] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const resetForm = () => {
    setAwbNumber("");
    setSubCategory("");
    setSubject("");
    setRemarks("");
    setSelectedFiles([]);
  };

  const closeModal = () => {
    setModalState(null);
    resetForm();
  };

  // Fetch real seller tickets from DB API
  const { data: responseData, isLoading } = useQuery({
    queryKey: ["sellerSupportTicketsList"],
    queryFn: () => api.get("/support/tickets").then((res) => res || {}),
  });

  const tickets = responseData?.data || [];

  // Submit ticket mutation
  const createMutation = useMutation({
    mutationFn: (payload) => api.post("/support/tickets", payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["sellerSupportTicketsList"]);
      showToast(res.message || "Support ticket created successfully!", "success");
      closeModal();
    },
    onError: (err) => {
      showToast(err.message || "Failed to submit ticket.", "error");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    let ticketSubject = "";
    let ticketDesc = "";
    let ticketCategory = "";

    if (modalState === "FORM_SHIPMENT") {
      if (!awbNumber || !remarks) {
        showToast("Please fill in all required fields (AWB & Remarks)", "error");
        return;
      }
      ticketCategory = "Shipment Issue";
      ticketSubject = `AWB: ${awbNumber} (${subCategory || "Shipment Issue"})`;
      ticketDesc = `AWB Number(s): ${awbNumber}\nSub Category: ${subCategory || "N/A"}\nRemarks: ${remarks}`;
    } else if (modalState === "FORM_BILLING") {
      if (!subject || !remarks) {
        showToast("Please fill in all required fields (Subject & Remarks)", "error");
        return;
      }
      ticketCategory = "Billing & Remittance";
      ticketSubject = subject;
      ticketDesc = remarks;
    } else if (modalState === "FORM_TECH") {
      if (!subject || !remarks) {
        showToast("Please fill in all required fields (Subject & Remarks)", "error");
        return;
      }
      ticketCategory = "Technical Support";
      ticketSubject = subject;
      ticketDesc = remarks;
    }

    createMutation.mutate({
      subject: ticketSubject,
      description: ticketDesc,
      category: ticketCategory,
      priority: "MEDIUM",
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full animate-fadeIn font-sans pb-10 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border shadow-xl flex items-center gap-2.5 text-xs font-bold animate-slideDown ${
          toast.type === "error" ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-emerald-50 border-emerald-200 text-emerald-700"
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Bar with Brand Blue Create Ticket Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Support & Escalations</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage support tickets and resolve logistics queries with our operations team.</p>
        </div>

        {/* Create Ticket Button (Brand Blue Button: #017cf8) */}
        <button
          onClick={() => setModalState("SELECT_CATEGORY")}
          className="self-start sm:self-auto px-5 py-2.5 bg-[#017cf8] hover:bg-[#0062c7] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2"
        >
          <span>Create Ticket</span>
        </button>
      </div>

      {/* Main Tickets List Container */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs min-h-[380px] flex flex-col justify-center">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-[#017cf8] rounded-full animate-spin"></div>
            <p className="text-xs text-slate-450 font-semibold">Loading support tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          /* Empty State (Matching Screenshot 1) */
          <div className="py-28 text-center flex flex-col items-center justify-center">
            <p className="text-slate-500 font-normal text-sm">No escalation tickets found.</p>
          </div>
        ) : (
          /* Active Tickets List Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tickets.map((t) => (
              <div key={t.id || t.ticketNumber || t.ticketId} className="p-5 border border-slate-200/80 rounded-2xl bg-white flex flex-col gap-3 shadow-xs hover:shadow-md hover:border-[#017cf8]/30 transition">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#017cf8]">{t.ticketNumber || t.ticketId}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">{t.category}</span>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    t.status === "OPEN" || t.status === "Open" ? "bg-amber-50 text-amber-600 border-amber-200" :
                    t.status === "IN_PROGRESS" || t.status === "In Progress" ? "bg-indigo-50 text-indigo-600 border-indigo-200" :
                    "bg-emerald-50 text-emerald-600 border-emerald-200"
                  }`}>
                    {t.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800">{t.subject}</h4>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-700 block mb-1">Ticket History & Updates:</span>
                  <p className="text-slate-800 font-medium whitespace-pre-line leading-normal">
                    {t.lastReply || t.update || t.description || "Ticket submitted, waiting for agent review."}
                  </p>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium pt-1">
                  <span>Assigned Agent: <strong className="text-slate-600">{t.assignedAgent || "Unassigned"}</strong></span>
                  <span>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "Just now"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL STEP 1: CREATE NEW TICKET - CATEGORY SELECTION (Screenshot 2) */}
      {/* ========================================================================= */}
      {modalState === "SELECT_CATEGORY" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white border border-slate-100 rounded-3xl p-7 shadow-2xl max-w-lg w-full relative animate-scaleUp">
            {/* Close Icon (Top Right) */}
            <button
              onClick={closeModal}
              className="absolute top-6 right-6 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-slate-900">Create New Ticket</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">Select the type of issue you're experiencing to create a support ticket</p>

            {/* 4 Category Selection Cards Stack */}
            <div className="flex flex-col gap-3.5">
              {/* Option 1: Shipment Issue */}
              <button
                type="button"
                onClick={() => setModalState("FORM_SHIPMENT")}
                className="w-full text-left p-4.5 rounded-2xl border border-slate-200 hover:border-[#017cf8] hover:shadow-md transition flex items-start gap-4 cursor-pointer group bg-white"
              >
                <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 group-hover:bg-[#017cf8]/10 group-hover:text-[#017cf8] transition">
                  <svg className="w-5 h-5 text-slate-700 group-hover:text-[#017cf8] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#017cf8] transition">Shipment Issue</h4>
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-[#017cf8] transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">Track and resolve delivery problems</p>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">Report issues like delayed deliveries, lost packages, RTO stuck in transit, proof of delivery requests, delivery disputes, or status mismatches.</p>
                </div>
              </button>

              {/* Option 2: Pickup Issue (Redirects to /manifest as requested) */}
              <button
                type="button"
                onClick={() => {
                  closeModal();
                  router.push("/manifest");
                }}
                className="w-full text-left p-4.5 rounded-2xl border border-slate-200 hover:border-[#017cf8] hover:shadow-md transition flex items-start gap-4 cursor-pointer group bg-white"
              >
                <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 group-hover:bg-[#017cf8]/10 group-hover:text-[#017cf8] transition">
                  <svg className="w-5 h-5 text-slate-700 group-hover:text-[#017cf8] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#017cf8] transition">Pickup Issue</h4>
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-[#017cf8] transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">Schedule or resolve pickup problems</p>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">Report pickup delays, rider not arriving, incorrect pickup address, or any issues preventing successful order collection.</p>
                </div>
              </button>

              {/* Option 3: Billing & Remittance */}
              <button
                type="button"
                onClick={() => setModalState("FORM_BILLING")}
                className="w-full text-left p-4.5 rounded-2xl border border-slate-200 hover:border-[#017cf8] hover:shadow-md transition flex items-start gap-4 cursor-pointer group bg-white"
              >
                <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 group-hover:bg-[#017cf8]/10 group-hover:text-[#017cf8] transition">
                  <svg className="w-5 h-5 text-slate-700 group-hover:text-[#017cf8] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#017cf8] transition">Billing & Remittance</h4>
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-[#017cf8] transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">Resolve payment and billing queries</p>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">Raise concerns about remittance delays, weight discrepancies, incorrect charges, wallet balance issues, or invoice disputes.</p>
                </div>
              </button>

              {/* Option 4: Technical Support */}
              <button
                type="button"
                onClick={() => setModalState("FORM_TECH")}
                className="w-full text-left p-4.5 rounded-2xl border border-slate-200 hover:border-[#017cf8] hover:shadow-md transition flex items-start gap-4 cursor-pointer group bg-white"
              >
                <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 group-hover:bg-[#017cf8]/10 group-hover:text-[#017cf8] transition">
                  <svg className="w-5 h-5 text-slate-700 group-hover:text-[#017cf8] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#017cf8] transition">Technical Support</h4>
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-[#017cf8] transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">Get help with platform issues</p>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">Report bugs, integration errors, API issues, dashboard problems, or any technical difficulties with the platform.</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL STEP 2: NEW SHIPMENT ISSUE FORM (Screenshot 3) */}
      {/* ========================================================================= */}
      {modalState === "FORM_SHIPMENT" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white border border-slate-100 rounded-3xl p-7 shadow-2xl max-w-lg w-full relative animate-scaleUp">
            {/* Top Bar: Back Button, Title, Close Button */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalState("SELECT_CATEGORY")}
                  className="p-1 rounded-lg text-slate-600 hover:text-[#017cf8] hover:bg-slate-100 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-xl font-bold text-slate-900">New Shipment Issue</h3>
              </div>
              <button
                onClick={closeModal}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
              {/* AWB Numbers * */}
              <div>
                <input
                  type="text"
                  placeholder="AWB Numbers *"
                  value={awbNumber}
                  onChange={(e) => setAwbNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#017cf8] focus:ring-1 focus:ring-[#017cf8] transition"
                  required
                />
              </div>

              {/* Sub Category */}
              <div>
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 bg-white focus:outline-none focus:border-[#017cf8] focus:ring-1 focus:ring-[#017cf8] transition font-medium"
                >
                  <option value="">Sub Category</option>
                  <option value="Delayed Delivery">Delayed Delivery</option>
                  <option value="Lost Package">Lost Package</option>
                  <option value="RTO Stuck in Transit">RTO Stuck in Transit</option>
                  <option value="Proof of Delivery (POD) Request">Proof of Delivery (POD) Request</option>
                  <option value="Delivery Dispute">Delivery Dispute</option>
                  <option value="Status Mismatch">Status Mismatch</option>
                </select>
              </div>

              {/* Remarks * */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Remarks *</label>
                <textarea
                  placeholder="Describe your issue in detail..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#017cf8] focus:ring-1 focus:ring-[#017cf8] transition resize-none"
                  required
                />
              </div>

              {/* Attachments (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Attachments (Optional)</label>
                <label className="w-full border-2 border-dashed border-slate-200/90 hover:border-[#017cf8] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50/50 transition group">
                  <svg className="w-6 h-6 text-slate-400 group-hover:text-[#017cf8] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-[#017cf8] transition mt-2">
                    Click to upload <span className="font-normal text-slate-500">or drag and drop</span>
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">Images, PDF, Excel (max 5MB)</span>
                  <input type="file" onChange={handleFileChange} className="hidden" multiple />
                </label>

                {/* Display selected files */}
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedFiles.map((file, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold">
                        {file.name}
                        <button type="button" onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500">
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Ticket Button (Brand Blue: #017cf8) */}
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-6 py-2.5 bg-[#017cf8] hover:bg-[#0062c7] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {createMutation.isPending && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{createMutation.isPending ? "Submitting..." : "Submit Ticket"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL STEP 2: BILLING & REMITTANCE / TECHNICAL SUPPORT FORM (Screenshot 4) */}
      {/* ========================================================================= */}
      {(modalState === "FORM_BILLING" || modalState === "FORM_TECH") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white border border-slate-100 rounded-3xl p-7 shadow-2xl max-w-lg w-full relative animate-scaleUp">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalState("SELECT_CATEGORY")}
                  className="p-1 rounded-lg text-slate-600 hover:text-[#017cf8] hover:bg-slate-100 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-xl font-bold text-slate-900">
                  {modalState === "FORM_BILLING" ? "New Billing & Remittance" : "New Technical Support"}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
              {/* Subject * */}
              <div>
                <input
                  type="text"
                  placeholder="Subject *"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#017cf8] focus:ring-1 focus:ring-[#017cf8] transition"
                  required
                />
              </div>

              {/* Remarks * */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Remarks *</label>
                <textarea
                  placeholder="Describe your issue in detail..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#017cf8] focus:ring-1 focus:ring-[#017cf8] transition resize-none"
                  required
                />
              </div>

              {/* Attachments (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Attachments (Optional)</label>
                <label className="w-full border-2 border-dashed border-slate-200/90 hover:border-[#017cf8] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50/50 transition group">
                  <svg className="w-6 h-6 text-slate-400 group-hover:text-[#017cf8] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-[#017cf8] transition mt-2">
                    Click to upload <span className="font-normal text-slate-500">or drag and drop</span>
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">Images, PDF, Excel (max 5MB)</span>
                  <input type="file" onChange={handleFileChange} className="hidden" multiple />
                </label>

                {/* Display selected files */}
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedFiles.map((file, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold">
                        {file.name}
                        <button type="button" onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500">
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Ticket Button (Brand Blue: #017cf8) */}
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-6 py-2.5 bg-[#017cf8] hover:bg-[#0062c7] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {createMutation.isPending && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{createMutation.isPending ? "Submitting..." : "Submit Ticket"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
