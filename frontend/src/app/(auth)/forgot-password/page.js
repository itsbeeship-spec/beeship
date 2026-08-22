"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ForgotPasswordStep1 from "@/components/ForgotPasswordStep1";
import VerifyRecoveryOtpStep2 from "@/components/VerifyRecoveryOtpStep2";
import ResetPasswordStep3 from "@/components/ResetPasswordStep3";

export default function ForgotPasswordPage() {
  const { sendRecoveryOtp, confirmPasswordReset, showToast } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [mobileOrEmail, setMobileOrEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Request recovery OTP
  const handleStep1Submit = async (val) => {
    setLoading(true);
    try {
      await sendRecoveryOtp(val);
      setMobileOrEmail(val);
      showToast("Password reset OTP triggered. Check backend server console!", "success");
      setStep(2);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleStep2Verify = (code) => {
    setRecoveryCode(code);
    setStep(3);
  };

  // Step 3: Reset password
  const handleStep3Reset = async (password, confirmPassword) => {
    setLoading(true);
    try {
      await confirmPasswordReset(mobileOrEmail, recoveryCode, password, confirmPassword);
      showToast("Password reset successfully. You can now log in!", "success");
      router.push("/login");
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {step === 1 && (
        <ForgotPasswordStep1
          onSubmit={handleStep1Submit}
          onBackToLogin={() => router.push("/login")}
          loading={loading}
        />
      )}
      {step === 2 && (
        <VerifyRecoveryOtpStep2
          mobileOrEmail={mobileOrEmail}
          onVerify={handleStep2Verify}
          onResend={() => handleStep1Submit(mobileOrEmail)}
          onBack={() => setStep(1)}
          loading={loading}
        />
      )}
      {step === 3 && (
        <ResetPasswordStep3
          onReset={handleStep3Reset}
          loading={loading}
        />
      )}
    </>
  );
}
