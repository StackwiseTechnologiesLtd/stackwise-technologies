"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { getBrand, listBrands } from "@/lib/branding/brands";
import { OtpInput } from "@/components/admin/OtpInput";
import "@/styles/brand-guidelines/brand-portal-login.css";

type Mode = "password" | "otp";

export function BrandPortalLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const brands = useMemo(() => listBrands(), []);

  const initialSlug = searchParams.get("project") ?? searchParams.get("brand") ?? brands[0]?.slug ?? "";
  const nextPath = searchParams.get("next") ?? "";

  const [brandSlug, setBrandSlug] = useState(initialSlug);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<Mode>("password");
  const [otpStep, setOtpStep] = useState<"send" | "verify">("send");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const brand = getBrand(brandSlug);
  const title = brand ? `${brand.name} guidelines` : "Brand guidelines";

  function redirectAfterLogin(slug: string) {
    if (nextPath.startsWith(`/branding/${slug}`)) {
      router.push(nextPath);
    } else {
      router.push(`/branding/${slug}`);
    }
    router.refresh();
  }

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/branding/login/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandSlug, email, password }),
      });
      const data = (await res.json()) as { error?: string; brandSlug?: string };
      if (!res.ok) {
        setError(data.error ?? "Project or password is incorrect.");
        return;
      }
      redirectAfterLogin(data.brandSlug ?? brandSlug);
    } catch {
      setError("Project or password is incorrect.");
    } finally {
      setLoading(false);
    }
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/branding/login/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandSlug, email }),
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
    try {
      const res = await fetch("/api/branding/login/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandSlug, email, otp: code }),
      });
      const data = (await res.json()) as { error?: string; brandSlug?: string };
      if (!res.ok) {
        setError(data.error ?? "Invalid or expired code");
        return;
      }
      redirectAfterLogin(data.brandSlug ?? brandSlug);
    } catch {
      setError("Invalid or expired code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="brand-portal-login">
      <div className="brand-portal-login__inner">
        <p className="brand-portal-login__eyebrow">Stackwise Technologies</p>
        <h1 className="brand-portal-login__title">{title}</h1>
        <p className="brand-portal-login__lead">
          Enter the project details shared with you.
        </p>

        {mode === "password" ? (
          <form className="brand-portal-login__form" onSubmit={onPasswordSubmit}>
            <select
              className="brand-portal-login__field"
              value={brandSlug}
              onChange={(e) => setBrandSlug(e.target.value)}
              aria-label="Project"
            >
              {brands.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
            <input
              className="brand-portal-login__field"
              type="email"
              autoComplete="email"
              placeholder="Work email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="brand-portal-login__password-wrap">
              <input
                className="brand-portal-login__field"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              className="brand-portal-login__submit"
              disabled={loading}
            >
              {loading ? "Continuing…" : "Continue"}
            </button>
            {error ? <p className="brand-portal-login__error">{error}</p> : null}
            <p className="brand-portal-login__alt">
              <button
                type="button"
                onClick={() => {
                  setMode("otp");
                  setError(null);
                  setOtpStep("send");
                }}
              >
                Sign in with email code instead
              </button>
            </p>
          </form>
        ) : otpStep === "send" ? (
          <form className="brand-portal-login__form" onSubmit={sendOtp}>
            <select
              className="brand-portal-login__field"
              value={brandSlug}
              onChange={(e) => setBrandSlug(e.target.value)}
              aria-label="Project"
            >
              {brands.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
            <input
              className="brand-portal-login__field"
              type="email"
              autoComplete="email"
              placeholder="Work email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="brand-portal-login__submit"
              disabled={loading}
            >
              {loading ? "Sending…" : "Send verification code"}
            </button>
            {error ? <p className="brand-portal-login__error">{error}</p> : null}
            <p className="brand-portal-login__alt">
              <button
                type="button"
                onClick={() => {
                  setMode("password");
                  setError(null);
                }}
              >
                Use password instead
              </button>
            </p>
          </form>
        ) : (
          <form
            className="brand-portal-login__form"
            onSubmit={(e) => {
              e.preventDefault();
              void verifyOtp(otp);
            }}
          >
            <p className="brand-portal-login__lead" style={{ marginBottom: "1rem" }}>
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>
            <OtpInput
              value={otp}
              onChange={setOtp}
              autoFocus
              disabled={loading}
              onComplete={(code) => {
                if (!loading) void verifyOtp(code);
              }}
            />
            <button
              type="submit"
              className="brand-portal-login__submit"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying…" : "Continue"}
            </button>
            {error ? <p className="brand-portal-login__error">{error}</p> : null}
            <p className="brand-portal-login__alt">
              <button
                type="button"
                onClick={() => {
                  setOtpStep("send");
                  setOtp("");
                  setError(null);
                }}
              >
                Resend code
              </button>
            </p>
          </form>
        )}
      </div>
      <p className="brand-portal-login__footer">
        Brand systems delivered by Stackwise Technologies
      </p>
    </div>
  );
}
