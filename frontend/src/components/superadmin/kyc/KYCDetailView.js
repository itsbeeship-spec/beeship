"use client";

import { useState } from "react";
import api from "@/lib/api";

// ── DetailRow Helper ───────────────────────────────────────────────────────────
function DetailRow({ label, value, mono }) {
  return (
    <div className="flex items-start gap-2 justify-between">
      <span className="text-[10px] text-slate-500 font-semibold shrink-0">{label}</span>
      <span className={`text-[11px] text-slate-200 text-right ${mono ? "font-mono text-[10px]" : ""}`}>{value}</span>
    </div>
  );
}

// ── Reject Modal Component ─────────────────────────────────────────────────────
function RejectModal({ isOpen, onClose, onReject, sellerName }) {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason) return;
    onReject(reason, comment);
  };

  const reasons = [
    { value: "Invalid Document",   label: "Invalid Document" },
    { value: "Details Mismatch",   label: "Details Mismatch" },
    { value: "Blurry Document",    label: "Blurry Document" },
    { value: "Expired Document",   label: "Expired Document" },
    { value: "Other",              label: "Other" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#0b1120] border border-[#1e293b] rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
        <div>
          <h3 className="text-sm font-black text-white">Reject KYC Verification</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Seller: {sellerName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reason *</label>
            <div className="space-y-2">
              {reasons.map((r) => (
                <label key={r.value} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="rejectReason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="accent-indigo-500"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Provide specific details about rejection..."
              rows={3}
              className="w-full px-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Reject KYC
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Re-upload Request Modal ────────────────────────────────────────────────────
function ReuploadModal({ isOpen, onClose, onSend, sellerName }) {
  const [docs, setDocs] = useState({ aadhaar: false, pan: false, gst: false });
  const [comment, setComment] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const selected = Object.keys(docs).filter(k => docs[k]);
    if (selected.length === 0) return;
    onSend(selected, comment);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#0b1120] border border-[#1e293b] rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
        <div>
          <h3 className="text-sm font-black text-white">Request Document Re-upload</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Seller: {sellerName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select Documents to Re-upload *</label>
            <div className="space-y-2">
              {["Aadhaar Card", "PAN Card", "GST Certificate"].map((label, idx) => {
                const key = ["aadhaar", "pan", "gst"][idx];
                return (
                  <label key={key} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={docs[key]}
                      onChange={(e) => setDocs(p => ({ ...p, [key]: e.target.checked }))}
                      className="rounded accent-indigo-500"
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Instructions for Seller</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Please upload clear front and back scans of Aadhaar Card..."
              rows={3}
              className="w-full px-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!Object.values(docs).some(Boolean)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── KYCDetailView Component ────────────────────────────────────────────────────
export default function KYCDetailView({ seller, onBack, onVerifySuccess }) {
  // Pre-fill checklists if status is already approved
  const isApproved = seller.kycStatus === "APPROVED";
  const [checklist, setChecklist] = useState({
    name: isApproved,
    pan: isApproved,
    gst: isApproved,
    clear: isApproved
  });
  const [adminNote, setAdminNote] = useState(seller.kycRejectReason || "");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reuploadOpen, setReuploadOpen] = useState(false);
  const [actioning, setActioning] = useState(false);

  const handleApprove = async () => {
    setActioning(true);
    try {
      await api.put(`/admin/kyc/${seller.id}/verify`, {
        status: "APPROVED",
        rejectReason: adminNote || "Approved"
      });
      onVerifySuccess();
    } catch (err) {
      alert(err.message || "Failed to approve KYC");
    } finally {
      setActioning(false);
    }
  };

  const handleReject = async (reason, comment) => {
    setActioning(true);
    setRejectOpen(false);
    try {
      const fullReason = comment ? `${reason}: ${comment}` : reason;
      await api.put(`/admin/kyc/${seller.id}/verify`, {
        status: "REJECTED",
        rejectReason: fullReason
      });
      onVerifySuccess();
    } catch (err) {
      alert(err.message || "Failed to reject KYC");
    } finally {
      setActioning(false);
    }
  };

  const handleReupload = async (selectedDocs, comment) => {
    setActioning(true);
    setReuploadOpen(false);
    try {
      const reason = `RE-UPLOAD REQUIRED [${selectedDocs.join(", ").toUpperCase()}]${comment ? `: ${comment}` : ""}`;
      await api.put(`/admin/kyc/${seller.id}/verify`, {
        status: "REJECTED",
        rejectReason: reason
      });
      onVerifySuccess();
    } catch (err) {
      alert(err.message || "Failed to request re-upload");
    } finally {
      setActioning(false);
    }
  };

  const allChecked = Object.values(checklist).every(Boolean);

  const statusColors = {
    PENDING: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    APPROVED: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    REJECTED: "bg-rose-500/15 text-rose-400 border border-rose-500/20",
  };

  const statusLabel = seller.kycStatus || "PENDING";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-semibold cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to List
      </button>

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
        <div>
          <h2 className="text-base font-black text-white">KYC Verification</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Verification details for registered seller account</p>
        </div>
        <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${statusColors[statusLabel] || statusColors.PENDING}`}>
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Seller Information */}
          <div className="bg-[#080d1a]/60 border border-[#1e293b]/60 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Seller Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Name</p>
                <p className="text-xs font-bold text-white mt-0.5">{seller.firstName} {seller.lastName}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Seller ID</p>
                <p className="text-xs font-mono text-slate-300 mt-0.5">{seller.id?.slice(0, 8)?.toUpperCase() || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Company</p>
                <p className="text-xs text-slate-300 mt-0.5">{seller.companyName || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Business Type</p>
                <p className="text-xs text-slate-300 mt-0.5">{seller.businessType || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Email</p>
                <p className="text-xs text-slate-300 mt-0.5">{seller.email}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Phone</p>
                <p className="text-xs text-slate-300 mt-0.5">{seller.mobile}</p>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-[#080d1a]/60 border border-[#1e293b]/60 rounded-2xl p-5 space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Documents</h3>

            {/* Aadhaar Card */}
            <div className="p-4 bg-[#0b1120] border border-[#1e293b] rounded-xl flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-white">Aadhaar Card</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Number: {seller.aadhaarNumber ? `XXXX XXXX ${seller.aadhaarNumber.slice(-4)}` : "—"}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {seller.aadhaarFrontUrl && (
                  <a href={seller.aadhaarFrontUrl} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg transition">
                    Front Preview
                  </a>
                )}
                {seller.aadhaarBackUrl && (
                  <a href={seller.aadhaarBackUrl} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg transition">
                    Back Preview
                  </a>
                )}
              </div>
            </div>

            {/* PAN Card */}
            <div className="p-4 bg-[#0b1120] border border-[#1e293b] rounded-xl flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-white">PAN Card</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Number: {seller.panNumber || "—"}</p>
              </div>
              {seller.panUrl && (
                <a href={seller.panUrl} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg transition shrink-0">
                  Document Preview
                </a>
              )}
            </div>

            {/* GST Certificate */}
            <div className="p-4 bg-[#0b1120] border border-[#1e293b] rounded-xl flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-white">GST Certificate</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">GSTIN: {seller.gstNumber || "—"}</p>
              </div>
              {seller.gstUrl && (
                <a href={seller.gstUrl} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg transition shrink-0">
                  Document Preview
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Checklist + Actions */}
        <div className="space-y-6">
          <div className="bg-[#080d1a]/60 border border-[#1e293b]/60 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification Checklist</h3>

            <div className="space-y-3">
              {[
                { key: "name",  label: "Name matches seller profile" },
                { key: "pan",   label: "PAN details verified" },
                { key: "gst",   label: "GST details verified" },
                { key: "clear", label: "Documents are clear and valid" },
              ].map((item) => (
                <label key={item.key} className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checklist[item.key]}
                    onChange={(e) => setChecklist(p => ({ ...p, [item.key]: e.target.checked }))}
                    className="mt-0.5 rounded accent-indigo-600 focus:ring-0 focus:outline-none"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <div className="space-y-1 pt-3 border-t border-[#1e293b]">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Admin Note</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Type a note..."
                rows={3}
                className="w-full px-3 py-2 bg-[#080d1a] border border-[#1e293b] rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleApprove}
                disabled={!allChecked || actioning}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                Approve KYC
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReuploadOpen(true)}
                  disabled={actioning}
                  className="py-2.5 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/20 text-amber-400 hover:text-amber-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Request Re-upload
                </button>
                <button
                  type="button"
                  onClick={() => setRejectOpen(true)}
                  disabled={actioning}
                  className="py-2.5 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReuploadModal
        isOpen={reuploadOpen}
        onClose={() => setReuploadOpen(false)}
        sellerName={`${seller.firstName} ${seller.lastName}`}
        onSend={handleReupload}
      />

      <RejectModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        sellerName={`${seller.firstName} ${seller.lastName}`}
        onReject={handleReject}
      />
    </div>
  );
}
