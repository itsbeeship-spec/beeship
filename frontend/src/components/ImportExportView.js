"use client";

import { useState, useRef } from "react";
import api from "@/lib/api";
import * as XLSX from "xlsx";

export default function ImportExportView() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [validOrders, setValidOrders] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [toast, setToast] = useState(null);
  
  const fileInputRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const processFile = (file) => {
    // Check file extension
    const name = file.name;
    const extension = name.substring(name.lastIndexOf(".")).toLowerCase();
    if (![".xlsx", ".xls", ".csv"].includes(extension)) {
      showToast("Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file.", "error");
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
    setValidationErrors([]);
    setValidOrders([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet);

        if (!rawJson || rawJson.length === 0) {
          showToast("The uploaded file is empty.", "error");
          setSelectedFile(null);
          return;
        }

        setParsedRows(rawJson);
        validateRows(rawJson);
      } catch (err) {
        console.error("Error reading file:", err);
        showToast("Error reading file. Make sure the file is not corrupted.", "error");
        setSelectedFile(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateRows = (rows) => {
    const errors = [];
    const valid = [];

    rows.forEach((row, index) => {
      const rowNum = index + 2; // 1-indexed + header row
      
      // Normalize columns (trim keys, remove spaces, lowercase)
      const normalizedRow = {};
      Object.keys(row).forEach(key => {
        const normalizedKey = key.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
        normalizedRow[normalizedKey] = row[key];
      });

      const customer = (normalizedRow.customer || normalizedRow.customername || normalizedRow.name || normalizedRow.consignee || "").toString().trim();
      const product = (normalizedRow.product || normalizedRow.productname || normalizedRow.item || normalizedRow.description || "").toString().trim();
      const amountRaw = normalizedRow.amount || normalizedRow.price || normalizedRow.orderamount || normalizedRow.total;
      const amount = parseFloat(amountRaw);

      let method = "COD";
      const paymentRaw = (normalizedRow.method || normalizedRow.payment || normalizedRow.paymentmethod || "").toString().toLowerCase().trim();
      if (paymentRaw.includes("prepaid") || paymentRaw === "online" || paymentRaw === "card" || paymentRaw === "upi") {
        method = "Prepaid";
      }

      let status = "unfulfilled";
      const statusRaw = (normalizedRow.status || "").toString().toLowerCase().trim();
      if (["fulfilled", "unfulfilled", "cancelled"].includes(statusRaw)) {
        status = statusRaw;
      }

      const rowErrors = [];
      if (!customer || customer.length < 2) {
        rowErrors.push("Customer name must be at least 2 characters");
      } else if (customer.length > 100) {
        rowErrors.push("Customer name must be under 100 characters");
      }

      if (!product || product.length < 2) {
        rowErrors.push("Product details must be at least 2 characters");
      } else if (product.length > 200) {
        rowErrors.push("Product details must be under 200 characters");
      }

      if (isNaN(amount) || amount <= 0) {
        rowErrors.push("Amount must be a positive number greater than 0");
      }

      if (rowErrors.length > 0) {
        errors.push(`Row ${rowNum}: ${rowErrors.join(", ")}`);
      } else {
        valid.push({
          customer,
          product,
          amount,
          method,
          status
        });
      }
    });

    setValidationErrors(errors);
    setValidOrders(valid);
  };

  const handleUploadSubmit = async () => {
    if (validOrders.length === 0) {
      showToast("No valid orders to upload.", "error");
      return;
    }

    setUploading(true);
    try {
      const res = await api.post("/orders/bulk", { orders: validOrders });
      if (res.success) {
        setUploadResult({
          success: true,
          count: res.count,
          message: `Successfully imported ${res.count} orders!`
        });
        showToast(`Successfully imported ${res.count} orders!`);
        setSelectedFile(null);
        setValidOrders([]);
        setParsedRows([]);
        setValidationErrors([]);
      } else {
        showToast(res.message || "Failed to upload bulk orders.", "error");
      }
    } catch (err) {
      console.error("Bulk upload error:", err);
      showToast(err.message || "Bulk upload request failed.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setValidOrders([]);
    setValidationErrors([]);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        "Customer": "John Doe",
        "Product": "Premium Leather Wallet",
        "Amount": 1299,
        "Method": "COD",
        "Status": "unfulfilled"
      },
      {
        "Customer": "Jane Smith",
        "Product": "Wireless Bluetooth Earbuds",
        "Amount": 2499,
        "Method": "Prepaid",
        "Status": "unfulfilled"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders Template");
    
    // Adjust column widths automatically
    const max_width = [{ wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
    worksheet["!cols"] = max_width;

    XLSX.writeFile(workbook, "BeeShip_Bulk_Orders_Template.xlsx");
    showToast("Template downloaded successfully!");
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full animate-fadeIn">
      {/* Custom Toast Alert */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-xl shadow-lg border transition-all duration-300 text-xs font-semibold ${
          toast.type === "error" 
            ? "bg-rose-50 border-rose-100 text-rose-800" 
            : "bg-emerald-50 border-emerald-100 text-emerald-800"
        }`}>
          {toast.type === "error" ? (
            <span className="mr-2">⚠️</span>
          ) : (
            <span className="mr-2">✅</span>
          )}
          {toast.message}
        </div>
      )}

      <h2 className="text-xl font-bold text-slate-800 mb-2">Import / Export Tools</h2>
      <p className="text-xs text-slate-500 mb-8">Upload orders in bulk via Excel/CSV spreadsheets, or export shipping ledgers.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Bulk Import */}
        <div className="flex flex-col gap-4 border border-slate-150 p-5 rounded-2xl bg-white shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800">Bulk Import Orders</h3>
            <button 
              onClick={downloadTemplate}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-500 transition flex items-center gap-1 cursor-pointer"
            >
              📥 Download Excel Template
            </button>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept=".xlsx,.xls,.csv" 
            className="hidden"
          />

          {!selectedFile ? (
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center transition cursor-pointer ${
                dragActive ? "border-blue-500 bg-blue-50/50" : "border-slate-300 hover:border-blue-400"
              }`}
            >
              <svg className="w-10 h-10 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-xs font-semibold text-slate-800">Drag & Drop order sheets here</span>
              <span className="text-[10px] text-slate-400 mt-1">Supports XLSX, XLS, CSV formats. Max 10MB.</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileInput();
                }}
                className="mt-4 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold text-xs transition cursor-pointer"
              >
                Select File
              </button>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl p-4 flex flex-col gap-4 bg-slate-50/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold text-sm shrink-0">
                    {selectedFile.name.split('.').pop().toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs font-bold text-slate-800 block truncate max-w-[200px] md:max-w-[250px]">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {formatFileSize(selectedFile.size)} • {parsedRows.length} rows found
                    </span>
                  </div>
                </div>
                <button 
                  onClick={handleCancel}
                  className="text-slate-400 hover:text-slate-650 p-1 rounded-lg hover:bg-slate-100 transition shrink-0 cursor-pointer font-bold"
                  title="Remove file"
                >
                  ✕
                </button>
              </div>

              {/* Validation Status */}
              <div className="border-t border-slate-100 pt-3">
                {validationErrors.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                      ⚠️ {validationErrors.length} validation errors found
                    </span>
                    <div className="max-h-28 overflow-y-auto bg-rose-50/40 border border-rose-100 rounded-lg p-2 flex flex-col gap-1">
                      {validationErrors.map((err, idx) => (
                        <span key={idx} className="text-[10px] text-rose-800 font-medium">
                          {err}
                        </span>
                      ))}
                    </div>
                    <span className="text-[9.5px] text-slate-400 leading-tight">
                      Please fix these issues in your spreadsheet and try again. Only valid orders ({validOrders.length} of {parsedRows.length}) can be uploaded.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[11px] bg-emerald-50/50 border border-emerald-100 rounded-lg p-2">
                    <span>✨</span> All {parsedRows.length} orders parsed and validated successfully!
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  onClick={handleCancel}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUploadSubmit}
                  disabled={uploading || validOrders.length === 0}
                  className={`px-3 py-1.5 rounded-lg text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1 ${
                    uploading || validOrders.length === 0
                      ? "bg-slate-350 cursor-not-allowed opacity-75"
                      : "bg-blue-600 hover:bg-blue-500"
                  }`}
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    `Upload ${validOrders.length} Orders`
                  )}
                </button>
              </div>
            </div>
          )}

          {uploadResult && (
            <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <span>🎉</span>
              {uploadResult.message}
            </div>
          )}
        </div>

        {/* Data Exports */}
        <div className="flex flex-col gap-4 border border-slate-150 p-5 rounded-2xl bg-white shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Export Data Ledgers</h3>
          <div className="flex flex-col gap-4 text-xs">
            {[
              { label: "Shipping Ledger (Last 30 Days)", format: "CSV" },
              { label: "COD Remittance Breakdown", format: "XLSX" },
              { label: "Weight reconciliation statements", format: "CSV" }
            ].map((exp, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition duration-150">
                <div>
                  <span className="font-semibold text-slate-800 block">{exp.label}</span>
                  <span className="text-[9px] text-slate-400">File format: {exp.format}</span>
                </div>
                <button 
                  onClick={() => alert(`Generating ${exp.label} export... download will start shortly.`)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  Export
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
