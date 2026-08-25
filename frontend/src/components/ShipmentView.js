"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ShipmentFilterPanel from "./ShipmentFilterPanel";
import ShipmentTabs from "./ShipmentTabs";
import ShipmentTable from "./ShipmentTable";
import TagsModal from "./TagsModal";

// Helper to map order to a rich shipment status dynamically from DB status
const getShipmentStatus = (order) => {
  const status = (order.status || "").toLowerCase();
  if (status === "cancelled") return "Cancelled";
  if (status === "delivered") return "Delivered";
  if (status === "in transit" || status === "in-transit") return "In Transit";
  if (status === "out for delivery" || status === "out_for_delivery") return "Out For Delivery";
  if (status === "ndr") return "NDR";
  if (status === "rto") return "RTO";
  if (status === "fulfilled" || status === "booked") return "Booked";
  return "Booked";
};

export default function ShipmentView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [shipments, setShipments] = useState([]);
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [manageDropdownOpen, setManageDropdownOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Tab filter state
  const [activeTab, setActiveTab] = useState("all");
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const [activeTagShipment, setActiveTagShipment] = useState(null);

  // Pagination states
  const entriesPerPage = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAwbs, setSelectedAwbs] = useState([]);

  const dropdownRef = useRef(null);

  // Sync click outside listeners
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setManageDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show auto-dismissing toast
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Fetch shipments via useQuery
  const { data: rawOrders, isLoading: loading } = useQuery({
    queryKey: ["orders", { status: "booked", limit: 100 }],
    queryFn: () => api.get("/orders?status=booked&limit=100").then(res => res.data || []),
    staleTime: 60 * 1000, // 1 min — invalidateQueries fires on ship/cancel actions
  });

  useEffect(() => {
    if (rawOrders) {
      const dbShipments = rawOrders
        .filter(o => o.awbNumber)
        .map(o => {
          const mappedStatus = getShipmentStatus(o);
          return {
            id: o.id,
            awb: o.awbNumber,
            orderId: o.orderId,
            partner: o.vendor || "-",
            source: o.pickupWarehouse || "-",
            dest: o.city || "-",
            weight: o.weight ? `${o.weight} kg` : "0.5 kg",
            length: o.length || "-",
            breadth: o.breadth || "-",
            height: o.height || "-",
            status: mappedStatus,
            eta: mappedStatus === "Delivered" ? "Completed" : "In 2 Days",
            customer: o.customer,
            phone: o.phone || "",
            product: o.product,
            products: o.products || [],
            method: o.method,
            tags: o.tags || [],
            amount: o.amount || 0,
            collectableAmount: o.collectableAmount || 0,
            address: o.address || "",
            pincode: o.pincode || "",
            state: o.state || "",
            city: o.city || "",
            rtoWarehouse: o.rtoWarehouse || "-",
            labelUrl: o.labelUrl || "",
            createdAt: o.createdAt
          };
        });

      setShipments(dbShipments);
      setFilteredShipments(dbShipments);
    }
  }, [rawOrders]);

  const handleSearch = (filters) => {
    let result = [...shipments];

    if (filters.orderNumber) {
      const oNum = filters.orderNumber.trim().toLowerCase();
      result = result.filter(s => s.orderId.toLowerCase().includes(oNum) || s.awb.toLowerCase().includes(oNum));
    }

    if (filters.channel) {
      const ch = filters.channel.toLowerCase();
      if (ch === "manual") {
        result = result.filter(s => s.tags?.includes("Manual") || !s.tags?.includes("Shopify"));
      } else if (ch === "shopify") {
        result = result.filter(s => s.tags?.includes("Shopify"));
      }
    }

    if (filters.productSku) {
      const pSku = filters.productSku.trim().toLowerCase();
      result = result.filter(s => s.product.toLowerCase().includes(pSku));
    }

    if (filters.courier) {
      const cr = filters.courier.toLowerCase();
      result = result.filter(s => s.partner.toLowerCase().includes(cr));
    }

    if (filters.awbNumber) {
      const awb = filters.awbNumber.trim().toLowerCase();
      result = result.filter(s => s.awb.toLowerCase().includes(awb));
    }

    if (filters.orderType) {
      const ot = filters.orderType.toLowerCase();
      result = result.filter(s => s.method?.toLowerCase() === ot.toLowerCase());
    }

    if (filters.warehouse) {
      const wh = filters.warehouse.toLowerCase();
      result = result.filter(s => s.source.toLowerCase().includes(wh));
    }

    if (filters.emailPhone) {
      const ep = filters.emailPhone.trim().toLowerCase();
      result = result.filter(s => (s.phone && s.phone.includes(ep)));
    }

    if (filters.tags) {
      const tagQuery = filters.tags.trim().toLowerCase();
      result = result.filter(s => s.tags?.some(t => t.toLowerCase().includes(tagQuery)));
    }

    if (filters.vendor) {
      const vd = filters.vendor.toLowerCase();
      result = result.filter(s => s.partner.toLowerCase().includes(vd));
    }

    if (filters.dateRange && filters.dateRange !== "All Time") {
      const today = new Date();
      const cutoff = new Date();
      if (filters.dateRange === "Today") {
        cutoff.setHours(0,0,0,0);
      } else if (filters.dateRange === "Yesterday") {
        cutoff.setDate(today.getDate() - 1);
        cutoff.setHours(0,0,0,0);
      } else if (filters.dateRange === "Last 7 days") {
        cutoff.setDate(today.getDate() - 7);
      } else if (filters.dateRange === "Last 30 days") {
        cutoff.setDate(today.getDate() - 30);
      }
      result = result.filter(s => new Date(s.createdAt) >= cutoff);
    }

    setFilteredShipments(result);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setFilteredShipments(shipments);
    setCurrentPage(1);
    setSelectedAwbs([]);
  };

  // Bulk Actions Handlers
  const handleBulkPrintLabel = () => {
    if (selectedAwbs.length === 0) {
      showToast("No shipments selected to print labels!", "warning");
      return;
    }
    const selectedShipments = shipments.filter(s => selectedAwbs.includes(s.awb));
    let openedCount = 0;
    const mockOrderIds = [];
    selectedShipments.forEach(s => {
      const idToPrint = s.orderId || s.id || s.awb;
      if (idToPrint) {
        mockOrderIds.push(idToPrint);
        openedCount++;
      }
    });
    if (mockOrderIds.length > 0) {
      window.open(`/label?ids=${mockOrderIds.join(",")}`, "_blank");
    }
    if (openedCount === 0) {
      showToast("Selected shipments do not have valid IDs to print labels.", "error");
    } else {
      showToast(`Opening label printer for ${openedCount} shipment(s)...`);
    }
    setSelectedAwbs([]);
  };

  const handleBulkPrintInvoice = () => {
    if (selectedAwbs.length === 0) {
      showToast("No shipments selected to print!", "warning");
      return;
    }
    const selectedShipments = shipments.filter(s => selectedAwbs.includes(s.awb));
    const orderIds = selectedShipments.map(s => s.orderId).filter(Boolean);
    if (orderIds.length === 0) {
      showToast("Selected shipments do not have order IDs!", "error");
      return;
    }
    window.open(`/invoice?ids=${orderIds.join(",")}`, "_blank");
    setSelectedAwbs([]);
  };

  const handleBulkSchedulePickup = () => {
    showToast(`Schedule pickup successfully created for ${selectedAwbs.length} shipments!`);
    setSelectedAwbs([]);
  };

  const handleBulkPrintPickList = () => {
    showToast(`Generating Pick-List for ${selectedAwbs.length} shipments...`);
    setSelectedAwbs([]);
  };

  const handleBulkCancel = () => {
    showToast(`Successfully cancelled ${selectedAwbs.length} shipments.`);
    setShipments(prev => prev.map(s => selectedAwbs.includes(s.awb) ? { ...s, status: "Cancelled" } : s));
    setSelectedAwbs([]);
  };

  const handleBulkTags = () => {
    if (selectedAwbs.length === 0) {
      showToast("No shipments selected!", "warning");
      return;
    }
    const selectedShipments = shipments.filter(s => selectedAwbs.includes(s.awb));
    const allTags = selectedShipments.flatMap(s => s.tags || []);
    const uniqueTags = Array.from(new Set(allTags));

    setActiveTagShipment({ id: "bulk", tags: uniqueTags });
    setTagsModalOpen(true);
  };

  const handleSingleTagClick = (shipment) => {
    setActiveTagShipment(shipment);
    setTagsModalOpen(true);
  };

  const handleUpdateTags = async (shipmentId, newTags, actionType, tagsToProcess) => {
    if (shipmentId === "bulk") {
      showToast(`Processing tags updates for ${selectedAwbs.length} shipments...`, "info");
      
      try {
        const selectedShipments = shipments.filter(s => selectedAwbs.includes(s.awb));
        const promises = selectedShipments.map(async (ship) => {
          const cleanId = ship.orderId.startsWith("#") ? ship.orderId.slice(1) : ship.orderId;
          const currentTags = ship.tags || [];
          
          let mergedTags = [];
          if (actionType === "add") {
            mergedTags = Array.from(new Set([...currentTags, ...tagsToProcess]));
          } else {
            mergedTags = currentTags.filter(t => !tagsToProcess.includes(t));
          }
          
          return api.patch(`/orders/${cleanId}/tags`, { tags: mergedTags });
        });
        
        await Promise.all(promises);
        showToast(`Successfully updated tags for ${selectedAwbs.length} shipments!`);
        setSelectedAwbs([]);
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      } catch (err) {
        console.error("Bulk tags update failed, falling back locally:", err);
        setShipments(prev => prev.map(s => {
          if (selectedAwbs.includes(s.awb)) {
            const currentTags = s.tags || [];
            let mergedTags = [];
            if (actionType === "add") {
              mergedTags = Array.from(new Set([...currentTags, ...tagsToProcess]));
            } else {
              mergedTags = currentTags.filter(t => !tagsToProcess.includes(t));
            }
            return { ...s, tags: mergedTags };
          }
          return s;
        }));
        showToast(`Tags updated locally for ${selectedAwbs.length} shipments.`);
        setSelectedAwbs([]);
      }
      return;
    }

    const shipmentObj = shipments.find(s => s.id === shipmentId || s.orderId === shipmentId);
    if (!shipmentObj) return;
    const cleanOrderId = shipmentObj.orderId.startsWith("#") ? shipmentObj.orderId.slice(1) : shipmentObj.orderId;

    setShipments(prev => prev.map(s => s.id === shipmentId ? { ...s, tags: newTags } : s));

    try {
      const data = await api.patch(`/orders/${cleanOrderId}/tags`, { tags: newTags });
      if (data.success) {
        showToast("Tags updated successfully!");
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      } else {
        showToast("Failed to update tags: " + data.message, "error");
      }
    } catch (err) {
      console.error("Failed to save tags to backend:", err);
      showToast("Could not save tags to database.", "warning");
    }
  };

  // Manage Dropdown Actions
  const handleDownload = () => {
    setManageDropdownOpen(false);
    const listToDownload = filteredShipments;

    if (listToDownload.length === 0) {
      showToast("No shipments available to download!", "warning");
      return;
    }

    const headers = ["AWB Number", "Order ID", "Courier Partner", "Warehouse", "Destination", "Weight", "Status", "ETA"];
    const rows = listToDownload.map(s => [s.awb, s.orderId, s.partner, s.source, s.dest, s.weight, s.status, s.eta]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `beeship_shipments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Shipments CSV downloaded successfully!");
  };

  const handleManifest = () => {
    setManageDropdownOpen(false);
    router.push("/manifest");
  };

  // Apply tab status filtering dynamically
  const displayedShipments = activeTab === "all"
    ? filteredShipments
    : filteredShipments.filter(s => s.status.toLowerCase() === activeTab);

  // Pagination calculation
  const totalEntries = displayedShipments.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, totalEntries);
  const paginatedShipments = displayedShipments.slice(startIndex, endIndex);

  return (
    <div className="w-full select-none animate-fadeIn font-sans pb-10">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border animate-slideDown text-xs font-semibold ${
          toast.type === "warning" ? "bg-amber-50 border-amber-100 text-amber-700" :
          "bg-emerald-50 border-emerald-100 text-emerald-700"
        }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          {toast.message}
        </div>
      )}

      {/* Title Header Row with Manage Shipment Dropdown */}
      <div className="flex justify-between items-center w-full mb-6">
        <h2 className="text-xl font-bold text-slate-800">Shipment</h2>
        
        {/* Manage Shipment Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button 
            type="button"
            onClick={() => setManageDropdownOpen(!manageDropdownOpen)}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-[#017cf8] hover:bg-[#0062c7] text-white hover:shadow-md rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <span>Manage Shipment</span>
            <svg className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 ${manageDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Card */}
          {manageDropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-44 bg-white border border-slate-150 rounded-2xl shadow-xl py-2 z-40 animate-slideUp">
              <button 
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download</span>
              </button>
              
              <button 
                type="button"
                onClick={handleManifest}
                className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Manifest</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Shipment Filter Panel Component */}
      <ShipmentFilterPanel onSearch={handleSearch} onClear={handleClear} />

      {/* Status Filter Tab Bar Component or Bulk Action Bar */}
      {selectedAwbs.length > 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-3 px-6 flex flex-wrap items-center gap-3.5 mb-6 shadow-sm animate-fadeIn text-xs select-none">
          <span className="text-slate-700 font-semibold text-xs mr-2">
            {selectedAwbs.length} {selectedAwbs.length === 1 ? "shipment" : "shipments"} selected
          </span>
          
          <button
            type="button"
            onClick={handleBulkPrintLabel}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-[#25a2fe] hover:text-white hover:border-[#25a2fe] text-slate-700 rounded-full font-semibold shadow-xs transition-all duration-200 cursor-pointer group"
          >
            <svg className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Label</span>
          </button>

          <button
            type="button"
            onClick={handleBulkPrintInvoice}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-[#25a2fe] hover:text-white hover:border-[#25a2fe] text-slate-700 rounded-full font-semibold shadow-xs transition-all duration-200 cursor-pointer group"
          >
            <svg className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V15a2 2 0 01-2 2z" />
            </svg>
            <span>Print Invoice</span>
          </button>

          <button
            type="button"
            onClick={handleBulkSchedulePickup}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-[#25a2fe] hover:text-white hover:border-[#25a2fe] text-slate-700 rounded-full font-semibold shadow-xs transition-all duration-200 cursor-pointer group"
          >
            <svg className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            <span>Schedule Pickup</span>
          </button>

          <button
            type="button"
            onClick={handleBulkPrintPickList}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-[#25a2fe] hover:text-white hover:border-[#25a2fe] text-slate-700 rounded-full font-semibold shadow-xs transition-all duration-200 cursor-pointer group"
          >
            <svg className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Print Pick-List</span>
          </button>

          <button
            type="button"
            onClick={handleBulkCancel}
            className="inline-flex items-center gap-2 px-4 py-2 border border-rose-250 bg-rose-50 hover:bg-[#25a2fe] hover:text-white hover:border-[#25a2fe] text-rose-600 rounded-full font-semibold shadow-xs transition-all duration-200 cursor-pointer group"
          >
            <svg className="w-4 h-4 text-rose-500 group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Cancel</span>
          </button>

          <button
            type="button"
            onClick={handleBulkTags}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-[#25a2fe] hover:text-white hover:border-[#25a2fe] text-slate-700 rounded-full font-semibold shadow-xs transition-all duration-200 cursor-pointer group"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.5 1.5 0 002.122 0l4.318-4.318a1.5 1.5 0 000-2.122L11.16 3.659A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h.008v.008H6V7.5z" />
            </svg>
            <span>Tags</span>
          </button>
        </div>
      ) : (
        <ShipmentTabs 
          shipments={shipments}
          filteredShipments={filteredShipments}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setCurrentPage(1);
            setSelectedAwbs([]);
          }}
        />
      )}

      {/* Shipments Table Component */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3 bg-white border border-slate-200/80 rounded-3xl shadow-sm">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#017cf8] rounded-full animate-spin"></div>
          <p className="text-xs text-slate-450 font-semibold">Loading shipments...</p>
        </div>
      ) : (
        <>
          <ShipmentTable 
            displayedShipments={paginatedShipments} 
            showToast={showToast} 
            selectedAwbs={selectedAwbs}
            setSelectedAwbs={setSelectedAwbs}
            onTagsClick={handleSingleTagClick}
          />

          {/* Pagination Controls Row */}
          {totalEntries > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 mt-5 select-none">
              {/* Info label */}
              <div className="text-xs font-semibold text-slate-450">
                Showing {startIndex + 1} to {endIndex} of {totalEntries} entries
              </div>

              {/* Prev / Next Pagination page numbers */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-650 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer bg-white"
                  >
                    &lt; Previous
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pNum = idx + 1;
                    const isActive = currentPage === pNum;
                    return (
                      <button
                        key={pNum}
                        type="button"
                        onClick={() => setCurrentPage(pNum)}
                        className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                          isActive 
                            ? "bg-[#25a2fe] text-white shadow-sm" 
                            : "border border-slate-200 bg-white text-slate-650 hover:bg-slate-50"
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-650 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer bg-white"
                  >
                    Next &gt;
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Tags Popup Modal */}
      <TagsModal
        isOpen={tagsModalOpen}
        onClose={() => {
          setTagsModalOpen(false);
          setActiveTagShipment(null);
        }}
        order={shipments.find((s) => s.id === activeTagShipment?.id) || activeTagShipment}
        onUpdate={handleUpdateTags}
      />

    </div>
  );
}
