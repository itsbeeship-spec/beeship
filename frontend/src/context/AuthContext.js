"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { BACKEND_URL } from "@/lib/config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessionChecking, setSessionChecking] = useState(true);
  const [toast, setToast] = useState(null);
  const router = useRouter();
  const sessionCheckTriggered = useRef(false);

  // ─── Toast ──────────────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ─── Session helpers ─────────────────────────────────────────────────────────
  const clearSession = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("beeship_logged_in");
      localStorage.removeItem("beeship_token");
    }
  };

  const handleUnauthorized = useCallback(() => {
    clearSession();
    showToast("Session expired or unauthorized. You have been logged out.", "warning");
    router.replace("/login");
  }, [showToast, router]);

  const checkSession = async () => {
    try {
      const data = await api.get("/auth/me");
      if (data.success) {
        setUser(data.data.user);
        if (typeof window !== "undefined") {
          localStorage.setItem("beeship_logged_in", "true");
        }
      } else {
        clearSession();
      }
    } catch (err) {
      if (err.status === 401) {
        clearSession();
      } else {
        console.error("Failed to verify session:", err);
        clearSession();
      }
    } finally {
      setSessionChecking(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const data = await api.get("/auth/me");
      if (data.success) {
        setUser(data.data.user);
      }
    } catch (err) {
      if (err.status === 401) handleUnauthorized();
      else console.error("Failed to fetch user profile:", err);
    }
  };

  // ─── Auth actions ────────────────────────────────────────────────────────────
  const login = async (identifier, password) => {
    const data = await api.post("/auth/login", { email: identifier, password });
    if (data.success) {
      const loggedUser = data.data.user;
      setUser(loggedUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("beeship_logged_in", "true");
        if (data.data?.token) {
          localStorage.setItem("beeship_token", data.data.token);
        }
      }
      if (loggedUser?.role === "SUPER_ADMIN" || loggedUser?.role?.toUpperCase()?.includes("ADMIN")) {
        router.push("/superadmin/dashboard");
      } else if (loggedUser?.role === "SUPPORT") {
        router.push("/orders");
      } else {
        router.push("/dashboard");
      }
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout request failed:", err);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("beeship_logged_in");
      localStorage.removeItem("beeship_active_tab");
      localStorage.removeItem("beeship_token");
    }
    setUser(null);
    router.push("/login");
  };

  // ─── Signup API calls ────────────────────────────────────────────────────────
  const sendSignupOtp = async (mobileOrEmail) => {
    try {
      await api.post("/auth/otp/send", { mobileOrEmail });
      return { alreadyRegistered: false };
    } catch (err) {
      if (err.status === 409) {
        return { alreadyRegistered: true, message: err.data?.error?.message };
      }
      throw err;
    }
  };

  const verifySignupOtp = async (mobileOrEmail, code) => {
    await api.post("/auth/otp/verify", { mobileOrEmail, code });
  };

  const registerBusiness = async (businessDetails) => {
    const data = await api.post("/auth/register-business", businessDetails);
    return data.data; // { user, token }
  };

  const loginAfterSignup = (userData, token) => {
    setUser(userData);
    if (typeof window !== "undefined") {
      localStorage.setItem("beeship_logged_in", "true");
      if (token) {
        localStorage.setItem("beeship_token", token);
      }
    }
    if (userData?.role === "SUPER_ADMIN" || userData?.role?.toUpperCase()?.includes("ADMIN")) {
      router.push("/superadmin/dashboard");
    } else if (userData?.role === "SUPPORT") {
      router.push("/orders");
    } else {
      router.push("/dashboard");
    }
  };

  // ─── Forgot password API calls ───────────────────────────────────────────────
  const sendRecoveryOtp = async (mobileOrEmail) => {
    await api.post("/auth/password/reset-request", { mobileOrEmail });
  };

  const confirmPasswordReset = async (mobileOrEmail, code, password, confirmPassword) => {
    await api.post("/auth/password/reset-confirm", {
      mobileOrEmail,
      code,
      password,
      confirmPassword,
    });
  };

  // ─── Init session check ──────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionCheckTriggered.current) return;
    sessionCheckTriggered.current = true;
    checkSession();
  }, []);

  const value = {
    user,
    setUser,
    sessionChecking,
    toast,
    showToast,
    handleUnauthorized,
    checkSession,
    fetchUserProfile,
    login,
    logout,
    loginAfterSignup,
    sendSignupOtp,
    verifySignupOtp,
    registerBusiness,
    sendRecoveryOtp,
    confirmPasswordReset,
    // Expose for components that still need the base URL (e.g. dashboard/page.js)
    BACKEND_URL,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
