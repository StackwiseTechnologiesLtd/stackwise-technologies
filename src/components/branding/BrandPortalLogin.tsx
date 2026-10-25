"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { OtpInput } from "@/components/admin/OtpInput";
import {
  parsePortalEmail,
  PORTAL_EMAIL_MAX_LENGTH,
  PORTAL_PASSWORD_MAX_LENGTH,
} from "@/lib/branding-portal/validation";
import "@/styles/brand-guidelines/brand-portal-login.css";

type Mode = "password" | "otp";

const PASSWORD_ERROR = "Email or password is incorrect.";

export function BrandPortalLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<Mode>("password");
  const [otpStep, setOtpStep] = useState<"send" | "verify">("send");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function redirectAfterLogin(slug: string) {
    if (nextPath.startsWith(`/branding/${slug}`)) {
      router.push(nextPath);
    } else {
      router.push(`/branding/${slug}`);
    }
    router.refresh();
  }

  function validateEmailField(): string | null {
    const parsed = parsePortalEmail(email);
    if (!parsed) {
      setError("Enter a valid email address.");
      return null;
    }
    return parsed;
  }

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const parsedEmail = validateEmailField();
    if (!parsedEmail) {
      setLoading(false);
      return;
    }
    if (!password || password.length > PORTAL_PASSWORD_MAX_LENGTH) {
      setError(PASSWORD_ERROR);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/branding/login/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsedEmail, password }),
      });
      const data = (await res.json()) as { error?: string; brandSlug?: string };
      if (!res.ok) {
        setError(data.error ?? PASSWORD_ERROR);
        return;
      }
      redirectAfterLogin(data.brandSlug ?? "");
    } catch {
      setError(PASSWORD_ERROR);
    } finally {
      setLoading(false);
    }
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const parsedEmail = validateEmailField();
    if (!parsedEmail) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/branding/login/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsedEmail }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Unable to send code");
      setOtpStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(code: string) {
    setLoading(true);
    setError(null);
    const parsedEmail = parsePortalEmail(email);
    if (!parsedEmail || !/^\d{6}$/.test(code)) {
      setError("Invalid or expired code");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/branding/login/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsedEmail, otp: code }),
      });
      const data = (await res.json()) as { error?: string; brandSlug?: string };
      if (!res.ok) {
        setError(data.error ?? "Invalid or expired code");
        return;
      }
      redirectAfterLogin(data.brandSlug ?? "");
    } catch {
      setError("Invalid or expired code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="brand-portal-login">
      <div className="brand-portal-login__content">
        <div className="brand-portal-login__inner">
          <p className="brand-portal-login__eyebrow">Stackwise Technologies</p>
          <h1 className="brand-portal-login__title">Brand guidelines</h1>
          <p className="brand-portal-login__lead">
            Enter the credentials shared with you.
          </p>

          {mode === "password" ? (
            <form className="brand-portal-login__form" onSubmit={onPasswordSubmit}>
              <div className="brand-portal-sketch-box brand-portal-sketch-box--field">
                <input
                  className="brand-portal-login__field"
                  type="email"
                  autoComplete="email"
                  placeholder="Work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={PORTAL_EMAIL_MAX_LENGTH}
                  required
                />
              </div>
              <div
                className="brand-portal-sketch-box brand-portal-sketch-box--field brand-portal-login__password-wrap"
              >
                <input
                  className="brand-portal-login__field"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={PORTAL_PASSWORD_MAX_LENGTH}
                  required
                />
                <button
                  type="button"
                  className="brand-portal-login__toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <button
                type="submit"
                className="brand-portal-sketch-box brand-portal-sketch-box--button brand-portal-sketch-box--primary"
                disabled={loading}
              >
                {loading ? "Continuing…" : "Continue"}
              </button>
              {error ? <p className="brand-portal-login__error">{error}</p> : null}
              <button
                type="button"
                className="brand-portal-sketch-box brand-portal-sketch-box--button brand-portal-sketch-box--ghost"
                onClick={() => {
                  setMode("otp");
                  setError(null);
                  setOtpStep("send");
                }}
              >
                Sign in with email code instead
              </button>
            </form>
          ) : otpStep === "send" ? (
            <form className="brand-portal-login__form" onSubmit={sendOtp}>
              <div className="brand-portal-sketch-box brand-portal-sketch-box--field">
                <input
                  className="brand-portal-login__field"
                  type="email"
                  autoComplete="email"
                  placeholder="Work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={PORTAL_EMAIL_MAX_LENGTH}
                  required
                />
              </div>
              <button
                type="submit"
                className="brand-portal-sketch-box brand-portal-sketch-box--button brand-portal-sketch-box--primary"
                disabled={loading}
              >
                {loading ? "Sending…" : "Send verification code"}
              </button>
              {error ? <p className="brand-portal-login__error">{error}</p> : null}
              <button
                type="button"
                className="brand-portal-sketch-box brand-portal-sketch-box--button brand-portal-sketch-box--ghost"
                onClick={() => {
                  setMode("password");
                  setError(null);
                }}
              >
                Use password instead
              </button>
            </form>
          ) : (
            <form
              className="brand-portal-login__form"
              onSubmit={(e) => {
                e.preventDefault();
                void verifyOtp(otp);
              }}
            >
              <p className="brand-portal-login__lead" style={{ marginBottom: 0 }}>
                Enter the 6-digit code sent to <strong>{email}</strong>
              </p>
              <div
                className="brand-portal-sketch-box brand-portal-login__otp"
              >
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  autoFocus
                  disabled={loading}
                  onComplete={(code) => {
                    if (!loading) void verifyOtp(code);
                  }}
                />
              </div>
              <button
                type="submit"
                className="brand-portal-sketch-box brand-portal-sketch-box--button brand-portal-sketch-box--primary"
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Verifying…" : "Continue"}
              </button>
              {error ? <p className="brand-portal-login__error">{error}</p> : null}
              <button
                type="button"
                className="brand-portal-sketch-box brand-portal-sketch-box--button brand-portal-sketch-box--ghost"
                onClick={() => {
                  setOtpStep("send");
                  setOtp("");
                  setError(null);
                }}
              >
                Resend code
              </button>
            </form>
          )}
        </div>
        <p className="brand-portal-login__footer">
          Brand systems delivered by Stackwise Technologies
        </p>
      </div>
    </div>
  );
}
