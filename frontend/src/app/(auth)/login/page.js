"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LoginWidget from "@/components/LoginWidget";

export default function LoginPage() {
  const { login, showToast } = useAuth();
  const router = useRouter();

  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoadingLogin(true);
    try {
      await login(loginIdentifier, loginPassword);
      setLoginIdentifier("");
      setLoginPassword("");
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoadingLogin(false);
    }
  };

  return (
    <LoginWidget
      loginIdentifier={loginIdentifier}
      setLoginIdentifier={setLoginIdentifier}
      loginPassword={loginPassword}
      setLoginPassword={setLoginPassword}
      loginError={loginError}
      loadingLogin={loadingLogin}
      onSubmit={handleLoginSubmit}
      onSwitchToSignup={() => router.push("/signup")}
      onForgotPassword={() => router.push("/forgot-password")}
    />
  );
}
