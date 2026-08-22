"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CreateAccountStep1 from "@/components/CreateAccountStep1";
import VerifyOtpStep2 from "@/components/VerifyOtpStep2";
import BusinessDetailsStep3 from "@/components/BusinessDetailsStep3";
import CongratulationsStep4 from "@/components/CongratulationsStep4";

export default function SignupPage() {
  const { sendSignupOtp, verifySignupOtp, registerBusiness, loginAfterSignup, showToast } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [mobileOrEmail, setMobileOrEmail] = useState("");
  const [signupError, setSignupError] = useState("");
  const [onboardingData, setOnboardingData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Send OTP
  const handleStep1Submit = async (e) => {
    if (e) e.preventDefault();
    if (!mobileOrEmail.trim()) return;
    setSignupError("");
    setLoading(true);
    try {
      const result = await sendSignupOtp(mobileOrEmail);
      if (result.alreadyRegistered) {
        showToast(result.message || "This mobile is already registered. Redirecting you to Login.", "warning");
        router.push(`/login`);
        return;
      }
      showToast("OTP code triggered. Please check backend server console log!", "success");
      setStep(2);
    } catch (err) {
      setSignupError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleStep2Verify = async (code) => {
    setLoading(true);
    try {
      await verifySignupOtp(mobileOrEmail, code);
      setStep(3);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete business registration
  const handleStep3Complete = async (businessDetails) => {
    setLoading(true);
    try {
      const data = await registerBusiness(businessDetails);
      setOnboardingData(data);
      setStep(4);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Navigate to dashboard
  const handleStep4Finish = () => {
    if (onboardingData?.user) {
      loginAfterSignup(onboardingData.user);
    }
  };

  return (
    <>
      {step === 1 && (
        <CreateAccountStep1
          inputValue={mobileOrEmail}
          setInputValue={setMobileOrEmail}
          onSubmit={handleStep1Submit}
          loading={loading}
          onSwitchToLogin={() => { router.push("/login"); setSignupError(""); }}
          apiError={signupError}
          onClearApiError={() => setSignupError("")}
        />
      )}
      {step === 2 && (
        <VerifyOtpStep2
          mobileOrEmail={mobileOrEmail}
          onVerify={handleStep2Verify}
          onResend={() => handleStep1Submit(null)}
          onBack={() => setStep(1)}
          loading={loading}
        />
      )}
      {step === 3 && (
        <BusinessDetailsStep3
          prefilledValue={mobileOrEmail}
          onComplete={handleStep3Complete}
          loading={loading}
        />
      )}
      {step === 4 && (
        <CongratulationsStep4 onNavigateToDashboard={handleStep4Finish} />
      )}
    </>
  );
}
