"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function ChannelsSettings() {
  const [shopifyUrl, setShopifyUrl] = useState("");
  const [wooUrl, setWooUrl] = useState("");
  
  // Connection Status State
  const [isConnected, setIsConnected] = useState(false);
  const [connectedShop, setConnectedShop] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const queryClient = useQueryClient();

  // Show status-toast
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Check connection status via useQuery
  const { data: statusData, isLoading: loading } = useQuery({
    queryKey: ["settings", "shopifyStatus"],
    queryFn: () => api.get("/shopify/status"),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (statusData) {
      setIsConnected(statusData.connected);
      setConnectedShop(statusData.shop || "");
    }
  }, [statusData]);

  useEffect(() => {
    // Check URL parameters for Shopify redirection success/error
    const params = new URLSearchParams(window.location.search);
    if (params.get("shopify") === "success") {
      showToast("Shopify Store connected successfully!", "success");
      // Clean up query parameters in URL
      window.history.replaceState({}, document.title, window.location.pathname + (params.get("tab") ? `?tab=${params.get("tab")}` : ""));
    } else if (params.get("shopify") === "error") {
      const errorMsg = params.get("message") || "Shopify authorization failed. Please try again.";
      showToast(errorMsg, "error");
      window.history.replaceState({}, document.title, window.location.pathname + (params.get("tab") ? `?tab=${params.get("tab")}` : ""));
    }
  }, []);

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: (shopName) => api.get(`/shopify/auth?shop=${shopName}`),
    onSuccess: (res) => {
      if (res.success && res.authUrl) {
        // Redirect browser to Shopify Consent Page
        window.location.href = res.authUrl;
      } else {
        showToast(res.message || "Failed to initiate connection. Please check your URL.", "error");
        setActionLoading(false);
      }
    },
    onError: (err) => {
      console.error("OAuth initiation error:", err);
      showToast("Network error. Please try again later.", "error");
      setActionLoading(false);
    }
  });

  // Initiate Shopify authorization redirect
  const handleConnectShopify = () => {
    if (!shopifyUrl.trim()) {
      showToast("Please enter a shopify store URL.", "error");
      return;
    }

    // Standardize URL input
    let shopName = shopifyUrl.trim().toLowerCase();
    // Strip http/https/trailing slashes
    shopName = shopName.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");

    // Append .myshopify.com if not present
    if (!shopName.includes(".myshopify.com")) {
      shopName = `${shopName}.myshopify.com`;
    }

    setActionLoading(true);
    showToast("Connecting to Shopify... Redirecting shortly.", "info");
    connectMutation.mutate(shopName);
  };

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: () => api.post("/shopify/disconnect"),
    onSuccess: (res) => {
      if (res.success) {
        setIsConnected(false);
        setConnectedShop("");
        setShopifyUrl("");
        queryClient.invalidateQueries({ queryKey: ["settings", "shopifyStatus"] });
        showToast("Shopify store disconnected successfully.", "success");
      } else {
        showToast(res.message || "Failed to disconnect Shopify store.", "error");
      }
    },
    onError: (err) => {
      console.error("Disconnection error:", err);
      showToast("Could not disconnect. Please try again.", "error");
    },
    onSettled: () => {
      setActionLoading(false);
    }
  });

  // Disconnect Shopify account
  const handleDisconnectShopify = () => {
    if (!confirm("Are you sure you want to disconnect your Shopify Store? Orders will no longer sync automatically.")) {
      return;
    }

    setActionLoading(true);
    disconnectMutation.mutate();
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn font-sans relative">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold transition-all transform animate-bounce duration-500 ${
          toast.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : toast.type === "error" 
            ? "bg-rose-50 border-rose-200 text-rose-800" 
            : "bg-blue-50 border-blue-200 text-blue-800"
        }`}>
          {toast.message}
        </div>
      )}

      <div>
        <h3 className="text-base font-bold text-slate-900">Integrations Channels</h3>
        <p className="text-xs text-slate-500 mt-1">Connect your online store sales channels to fetch orders automatically.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-400 text-xs">
          <svg className="animate-spin h-5 w-5 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading integration settings...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shopify Integration */}
          <div className="border border-slate-150 rounded-2xl p-5 bg-white flex flex-col gap-4 shadow-sm justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold text-xs">S</span>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Shopify Channel</span>
                    <span className="text-[10px] text-slate-400">Sync sales orders</span>
                  </div>
                </div>

                {isConnected ? (
                  <span className="px-2.5 py-1 text-[9px] font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-150 uppercase tracking-wide">
                    Connected
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-[9px] font-bold rounded-full bg-slate-50 text-slate-400 border border-slate-200 uppercase tracking-wide">
                    Not Connected
                  </span>
                )}
              </div>

              {isConnected ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex flex-col gap-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Connected Store</span>
                  <span className="text-xs font-bold text-slate-700 break-all">{connectedShop}</span>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500">Directly connect your Shopify store to sync orders, tracking updates, and fulfillment data seamlessly.</span>
                </div>
              )}
            </div>

            {isConnected ? (
              <button 
                onClick={handleDisconnectShopify}
                disabled={actionLoading}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-150 transition text-rose-600 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Disconnecting..." : "Disconnect Shopify Store"}
              </button>
            ) : (
              <div className="flex flex-col gap-3 w-full">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Enter Shopify Store URL / Domain
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. shopify.beeship.in or my-store.myshopify.com"
                    value={shopifyUrl}
                    onChange={(e) => setShopifyUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleConnectShopify();
                    }}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none transition"
                  />
                </div>
                <button 
                  onClick={handleConnectShopify}
                  disabled={actionLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 transition text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19.333 4.667L15 2 4.667 7.333v9.334L9 19l10.333-5.333V4.667zM9.5 17.5L5.833 15.5V8.833L9.5 10.8v6.7zm.833-8.083L6.5 7.417l7.833-4 3.834 2.416-7.834 3.584z"/>
                  </svg>
                  {actionLoading ? "Connecting to Shopify..." : "Connect Shopify Store"}
                </button>
              </div>
            )}
          </div>

          {/* WooCommerce Integration */}
          <div className="border border-slate-150 rounded-2xl p-5 bg-white flex flex-col gap-4 shadow-sm justify-between opacity-70">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-xs">W</span>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">WooCommerce</span>
                    <span className="text-[10px] text-slate-400">Sync sales orders</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[9px] font-bold rounded-full bg-slate-50 text-slate-400 border border-slate-200 uppercase tracking-wide">
                  Coming Soon
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Store URL</span>
                <input 
                  type="text" 
                  placeholder="https://mystore.com" 
                  value={wooUrl}
                  onChange={(e) => setWooUrl(e.target.value)}
                  disabled={true}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none opacity-60" 
                />
              </div>
            </div>

            <button disabled={true} className="w-full py-2.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed">
              Connect WooCommerce
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
