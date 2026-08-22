"use client";

import { useState } from "react";
import HomeView from "./HomeView";
import OrderView from "./OrderView";
import ShipmentView from "./ShipmentView";
import NdrView from "./NdrView";
import WeightView from "./WeightView";
import BillingView from "./BillingView";
import PaymentView from "./PaymentView";
import ReportsView from "./ReportsView";
import SettingsView from "./SettingsView";
import SupportsView from "./SupportsView";
import ImportExportView from "./ImportExportView";
import RechargeModal from "./RechargeModal";

export default function DashboardPanel({
  user,
  fetchUserProfile,
  showToast,
  health,
  fetchHealth,
  loadingHealth,
  documents,
  fetchDocuments,
  loadingDocs,
  docCacheHeader,
  fetchingDocsTime,
  title,
  setTitle,
  fileName,
  setFileName,
  mimeType,
  setMimeType,
  fileSize,
  setFileSize,
  uploadResult,
  submittingDoc,
  handleUploadSubmit,
  handleLogout,
  sessionChecking
}) {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("beeship_active_tab") || "home";
    }
    return "home";
  });
  const [activeSubTab, setActiveSubTab] = useState("auto-assign");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(133.09);
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("beeship_sidebar_collapsed") === "true";
    }
    return false;
  });

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("beeship_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  const handleRechargeClick = () => {
    if (user?.kycStatus !== "APPROVED") {
      showToast("KYC verification is required to recharge your wallet.", "warning");
    } else {
      setRechargeModalOpen(true);
    }
  };

  const handleRechargeSuccess = (amount) => {
    setWalletBalance((prev) => parseFloat((prev + parseFloat(amount)).toFixed(2)));
  };

  const handleLogoutWithClear = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("beeship_active_tab");
    }
    handleLogout();
  };

  // Tabs structure with display names and matching icons
  const tabs = [
    { id: "home", label: "Dashboard", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { id: "order", label: "Orders", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )},
    { id: "shipment", label: "Shipments", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )},
    { id: "manifest", label: "Manifest", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )},
    { id: "ndr", label: "Tracking", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
    { id: "billing", label: "Billing & Wallet", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )},
    { id: "settings", label: "Settings", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
    { id: "weight", label: "Weight", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    )},
    { id: "payment", label: "Payment", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )},
    { id: "reports", label: "Reports", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
      </svg>
    )},
    { id: "supports", label: "Supports", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )},
    { id: "importexport", label: "Import/Export", icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    )}
  ];

  // Dynamically render selected subcomponent
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeView
            user={user}
            health={health}
            fetchHealth={fetchHealth}
            loadingHealth={loadingHealth}
            documents={documents}
            fetchDocuments={fetchDocuments}
            loadingDocs={loadingDocs}
            docCacheHeader={docCacheHeader}
            fetchingDocsTime={fetchingDocsTime}
            title={title}
            setTitle={setTitle}
            fileName={fileName}
            setFileName={setFileName}
            mimeType={mimeType}
            setMimeType={setMimeType}
            fileSize={fileSize}
            setFileSize={setFileSize}
            uploadResult={uploadResult}
            submittingDoc={submittingDoc}
            handleUploadSubmit={handleUploadSubmit}
            setActiveTab={setActiveTab}
          />
        );
      case "order":
        return <OrderView user={user} showToast={showToast} />;
      case "shipment":
        return <ShipmentView />;
      case "ndr":
        return <NdrView />;
      case "weight":
        return <WeightView />;
      case "billing":
        return <BillingView walletBalance={walletBalance} onRecharge={handleRechargeClick} />;
      case "payment":
        return <PaymentView />;
      case "reports":
        return <ReportsView />;
      case "settings":
        return (
          <SettingsView 
            user={user} 
            fetchUserProfile={fetchUserProfile} 
            activeSubTab={activeSubTab} 
            setActiveSubTab={setActiveSubTab} 
          />
        );
      case "supports":
        return <SupportsView />;
      case "importexport":
        return <ImportExportView />;
      default:
        return (
          <HomeView
            user={user}
            health={health}
            fetchHealth={fetchHealth}
            loadingHealth={loadingHealth}
            documents={documents}
            fetchDocuments={fetchDocuments}
            loadingDocs={loadingDocs}
            docCacheHeader={docCacheHeader}
            fetchingDocsTime={fetchingDocsTime}
            title={title}
            setTitle={setTitle}
            fileName={fileName}
            setFileName={setFileName}
            mimeType={mimeType}
            setMimeType={setMimeType}
            fileSize={fileSize}
            setFileSize={setFileSize}
            uploadResult={uploadResult}
            submittingDoc={submittingDoc}
            handleUploadSubmit={handleUploadSubmit}
            setActiveTab={setActiveTab}
          />
        );
    }
  };

  const SidebarContent = ({ forceExpand = false }) => {
    const collapsed = isCollapsed && !forceExpand;
    return (
      <div className="flex flex-col h-full text-white">
        {/* Sidebar Header Brand */}
        <div className={`flex items-center shrink-0 select-none px-5 py-6 ${
          collapsed ? "flex-col gap-4 justify-center" : "justify-between gap-3"
        }`}>
          <img 
            src="/Companye Logo.png" 
            alt="BeeShip" 
            className={`object-contain transition-all duration-300 ${collapsed ? "h-6 w-10" : "h-7"}`} 
            style={{ filter: "invert(1) hue-rotate(180deg)" }}
          />
          
          {!collapsed && (
            <div 
              onClick={handleRechargeClick}
              className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition cursor-pointer shadow-sm shrink-0"
            >
              {/* Wallet SVG Icon */}
              <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              {/* Wallet Balance */}
              <span className="text-[13px] font-bold tracking-tight text-amber-400">
                Rs. {walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {/* Plus Sign */}
              <span className="text-base font-extrabold text-amber-400 ml-0.5">+</span>
            </div>
          )}

          {/* Collapse Toggle Button (only on desktop) */}
          {!forceExpand && (
            <button
              onClick={handleToggleCollapse}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-200 cursor-pointer shrink-0"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <svg
                className={`w-4 h-4 transform transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Tabs list */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1.5 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("beeship_active_tab", tab.id);
                  }
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3.5 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 border cursor-pointer ${
                  collapsed ? "justify-center w-12 mx-auto" : "w-full text-left"
                } ${
                  isActive 
                    ? "bg-gradient-to-r from-[#0052d4] to-[#011640] border-[#0052d4]/50 text-white shadow-md shadow-blue-500/10" 
                    : "border-transparent text-white/80 hover:text-white hover:bg-white/5"
                }`}
                title={collapsed ? tab.label : undefined}
              >
                <span className={`transition ${isActive ? "text-white" : "text-white/60"} shrink-0`}>
                  {tab.icon}
                </span>
                {!collapsed && <span>{tab.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with Log Out button */}
        <div className={`py-4 border-t border-white/10 shrink-0 ${collapsed ? "px-0" : "px-4"}`}>
          <button
            type="button"
            onClick={handleLogoutWithClear}
            className={`flex items-center gap-3.5 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 text-white/80 hover:text-white hover:bg-white/5 cursor-pointer ${
              collapsed ? "justify-center w-12 mx-auto" : "w-full text-left"
            }`}
            title={collapsed ? "Log Out" : undefined}
          >
            <svg className="w-5 h-5 text-white/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-0 w-full min-h-screen bg-[#f4f6fc] relative p-4 lg:p-0">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>
      
      {/* Mobile Drawer Trigger Bar */}
      <div className="lg:hidden flex items-center justify-between bg-white border border-slate-100 p-4 rounded-2xl shadow-sm z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 hover:bg-slate-50 rounded-xl text-slate-700 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-sm text-slate-800 uppercase tracking-wider">
            {tabs.find(t => t.id === activeTab)?.label}
          </span>
        </div>
        <img src="/Companye Logo.png" alt="BeeShip" className="h-6 object-contain" />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer content */}
          <div className="relative flex flex-col w-72 max-w-xs h-full bg-[#020a1d] border-r border-white/10 rounded-none shadow-2xl animate-slideRight">
            <div className="absolute top-4 right-4">
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl text-white/80 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarContent forceExpand={true} />
          </div>
        </div>
      )}

      {/* Desktop Left Sidebar (Bg #020a1d, Text white, No rounded borders, full screen height, dynamic width transition) */}
      <aside className={`hidden lg:flex flex-col shrink-0 bg-[#020a1d] border-r border-white/10 rounded-none overflow-hidden sticky top-0 h-screen transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-72"
      }`}>
        <SidebarContent forceExpand={false} />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-h-screen">
        {user?.kycStatus !== "APPROVED" && (
          <div className={`border-b px-6 py-3 flex items-center justify-between gap-3 text-xs select-none shrink-0 ${
            user?.kycStatus === "PENDING"
              ? "bg-blue-50/50 border-blue-150 text-blue-800"
              : user?.kycStatus === "REJECTED"
                ? "bg-rose-50 border-rose-100 text-rose-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
          }`}>
            <div className="flex items-center gap-2 font-medium">
              <span>{user?.kycStatus === "PENDING" ? "ℹ️" : "⚠️"}</span>
              <span>
                {user?.kycStatus === "PENDING"
                  ? "Your KYC details are pending verification. Once approved, shipping and wallet functions will be unlocked."
                  : user?.kycStatus === "REJECTED"
                    ? `KYC Update Required: ${user?.kycRejectReason || "Your submission was returned for editing"}. Please update and resubmit.`
                    : "Your KYC is not completed. Please complete KYC to unlock shipping and wallet functions."}
              </span>
            </div>
            {user?.kycStatus !== "PENDING" && (
              <button 
                onClick={() => {
                  setActiveTab("settings");
                  setActiveSubTab("kyc");
                  if (typeof window !== "undefined") {
                    localStorage.setItem("beeship_logged_in", "true");
                    localStorage.setItem("beeship_active_tab", "settings");
                  }
                }}
                className={`transition text-white px-3 py-1.5 rounded-lg font-bold text-[10px] cursor-pointer ${
                  user?.kycStatus === "REJECTED"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {user?.kycStatus === "REJECTED" ? "Update KYC Now" : "Complete KYC Now"}
              </button>
            )}
          </div>
        )}
        
        {/* Selected Component Render Panel (Padded inside the right-side container) */}
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto w-full font-sans animate-fadeIn">
          {sessionChecking ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#2b7fff] border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-slate-500 font-semibold tracking-wide animate-pulse">Syncing session data...</p>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>

      <RechargeModal 
        isOpen={rechargeModalOpen} 
        onClose={() => setRechargeModalOpen(false)} 
        onSuccess={handleRechargeSuccess} 
      />
    </div>
  );
}

