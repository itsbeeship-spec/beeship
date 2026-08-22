"use client";

import { useState } from "react";
import AutoAssignSettings from "./settings/AutoAssignSettings";
import NotificationSettings from "./settings/NotificationSettings";
import ChannelsSettings from "./settings/ChannelsSettings";
import WarehouseSettings from "./settings/WarehouseSettings";
import ProfileSettings from "./settings/ProfileSettings";
import WebhookSettings from "./settings/WebhookSettings";
import KycSettings from "./settings/KycSettings";
import EmployeeSettings from "./settings/EmployeeSettings";
import InvoiceSettings from "./settings/InvoiceSettings";
import LabelSettings from "./settings/LabelSettings";
import TaxSettings from "./settings/TaxSettings";
import ApiDocSettings from "./settings/ApiDocSettings";
import VendorSettings from "./settings/VendorSettings";

export default function SettingsView({ user, fetchUserProfile, activeSubTab, setActiveSubTab }) {
  const [internalSubTab, setInternalSubTab] = useState("auto-assign");

  const currentSubTab = activeSubTab || internalSubTab;
  const changeSubTab = setActiveSubTab || setInternalSubTab;

  const settingsTabs = [
    {
      id: "auto-assign",
      label: "Auto Assign Couriers",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <circle cx="12" cy="12" r="6" strokeWidth="2" />
          <circle cx="12" cy="12" r="2" strokeWidth="2" />
        </svg>
      )
    },
    {
      id: "notification",
      label: "Notification Settings",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
    },
    {
      id: "channels",
      label: "Channels",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: "warehouse",
      label: "Warehouse",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      id: "profile",
      label: "Profile Settings",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: "webhooks",
      label: "Webhooks",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )
    },
    {
      id: "kyc",
      label: "KYC Verification",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      id: "employees",
      label: "Employees",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: "invoice",
      label: "Invoice Settings",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: "labels",
      label: "Label Settings",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: "tax",
      label: "Product Tax Mapping",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
        </svg>
      )
    },
    {
      id: "apidoc",
      label: "API Doc",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      id: "vendor",
      label: "Vendor Management",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 16v3c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2v-3M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14" />
        </svg>
      )
    }
  ];

  const renderSubTabContent = () => {
    switch (currentSubTab) {
      case "auto-assign":
        return <AutoAssignSettings />;
      case "notification":
        return <NotificationSettings />;
      case "channels":
        return <ChannelsSettings />;
      case "warehouse":
        return <WarehouseSettings />;
      case "profile":
        return <ProfileSettings />;
      case "webhooks":
        return <WebhookSettings />;
      case "kyc":
        return <KycSettings user={user} fetchUserProfile={fetchUserProfile} />;
      case "employees":
        return <EmployeeSettings />;
      case "invoice":
        return <InvoiceSettings />;
      case "labels":
        return <LabelSettings />;
      case "tax":
        return <TaxSettings />;
      case "apidoc":
        return <ApiDocSettings />;
      case "vendor":
        return <VendorSettings />;
      default:
        return <AutoAssignSettings />;
    }
  };

  return (
    <div className="w-full flex gap-8 items-start animate-fadeIn font-sans">
      {/* Secondary Settings Sidebar (Middle Panel matching screenshots) */}
      <div className="w-72 bg-slate-50 border border-slate-200/60 rounded-3xl p-5 shrink-0 flex flex-col gap-5">
        {/* Settings Header Title */}
        <div className="flex items-center gap-2 px-2 text-slate-500 font-bold uppercase tracking-wider text-[11px] py-1">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Settings</span>
        </div>

        {/* Menu Options */}
        <div className="flex flex-col gap-1.5 max-h-[75vh] overflow-y-auto pr-1 no-scrollbar select-none">
          {settingsTabs.map((tab) => {
            const isSelected = currentSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => changeSubTab(tab.id)}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-all text-xs font-bold text-left cursor-pointer ${
                  isSelected
                    ? "bg-white border-slate-200/50 shadow-sm text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`transition ${isSelected ? "text-blue-600" : "text-slate-400"}`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </div>
                {isSelected && (
                  <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Settings Detail Content Area (Right Panel) */}
      <div className="flex-1 bg-white border border-slate-200/80 rounded-3xl p-8 min-h-[500px]">
        {renderSubTabContent()}
      </div>
    </div>
  );
}
