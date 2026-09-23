"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { OtpInput } from "@/components/admin/OtpInput";
import Mark from "@/components/Mark";
import { useToast } from "@/components/ToastProvider";
import { SITE_NAME } from "@/lib/content";
import { BTN_GHOST, BTN_PRIMARY } from "@/lib/ui/buttons";

export default function AdminLoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Unable to send code");
      setStep("otp");
      toast.toast("If your email is authorized, a verification code was sent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to send code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtpWithCode(code: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    await verifyOtpWithCode(otp);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-line bg-panel p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Mark className="h-10 w-10" />
          <div>
            <h1 className="text-lg font-semibold">{SITE_NAME}</h1>
            <p className="text-sm text-muted">Admin sign in with email code</p>
          </div>
        </div>

        {step === "email" ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm text-muted">Work email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-line bg-background px-3 py-2"
                placeholder="you@stackwisetechnologies.com"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 ${BTN_PRIMARY}`}
            >
              {loading ? "Sending code…" : "Send verification code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <p className="text-sm text-muted">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>
            <div className="space-y-3">
              <p id="otp-input-label" className="text-center text-sm text-muted">
                Verification code
              </p>
              <OtpInput
                value={otp}
                onChange={setOtp}
                autoFocus
                disabled={loading}
                onComplete={(code) => {
                  if (!loading) {
                    void verifyOtpWithCode(code);
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className={`w-full py-2.5 ${BTN_PRIMARY}`}
            >
              {loading ? "Verifying…" : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtp("");
              }}
              className={`w-full ${BTN_GHOST}`}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
