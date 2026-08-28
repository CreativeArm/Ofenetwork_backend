"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Reveal, Stagger, StaggerItem } from "./homepage-motion";
import { Icon } from "./icons";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:4000/api";

type SocialProvider = "google";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export function LoginIntroText() {
  const searchParams = useSearchParams();
  const isAdminLogin = searchParams.get("admin") === "1";

  return (
    <p className="mt-4 text-sm leading-7 text-emerald-100/70">
      {isAdminLogin
        ? "Use your admin email and password to open the OFENetworks control panel securely."
        : "Continue with your email and password, or use Google to open your OFENetworks workspace faster."}
    </p>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialProvider, setSocialProvider] = useState<SocialProvider | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const isAdminLogin = searchParams.get("admin") === "1";
  const nextPath = searchParams.get("next");

  useEffect(() => {
    const registered = searchParams.get("registered");
    const presetEmail = searchParams.get("email");
    const prompt = searchParams.get("prompt");
    const oauthError = searchParams.get("oauthError");
    const reset = searchParams.get("reset");

    if (oauthError) {
      setErrorMessage(oauthError);
    }

    if (registered === "1") {
      setSuccessMessage("Account created successfully. Please log in.");
    }

    if (reset === "1") {
      setSuccessMessage("Password updated successfully. Please log in.");
    }

    if (prompt === "service") {
      setSuccessMessage(
        "Please log in or create an account to open service workspaces.",
      );
    }

    if (presetEmail) {
      setEmail(presetEmail);
    }
  }, [searchParams]);

  function startSocialLogin(provider: SocialProvider) {
    if (isAdminLogin) {
      setErrorMessage("Admin accounts must sign in with email and password.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setSocialProvider(provider);

    const params = new URLSearchParams();

    if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
      params.set("next", nextPath);
    }

    const suffix = params.toString() ? `?${params.toString()}` : "";
    window.location.assign(`${API_BASE_URL}/auth/social/${provider}${suffix}`);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | {
            message?: string | string[];
            accessToken?: string;
            refreshToken?: string;
            token?: string;
            user?: { role?: string };
          }
        | null;

      if (!response.ok) {
        const message = Array.isArray(data?.message)
          ? data.message[0]
          : data?.message ?? "Unable to log in right now.";
        throw new Error(message);
      }

      if (data?.accessToken) {
        localStorage.setItem("ofe_access_token", data.accessToken);
      }
      if (data?.refreshToken) {
        localStorage.setItem("ofe_refresh_token", data.refreshToken);
      }
      if (data?.user) {
        localStorage.setItem("ofe_user", JSON.stringify(data.user));
      }

      if (isAdminLogin && data?.user?.role !== "ADMIN") {
        window.localStorage.removeItem("ofe_access_token");
        window.localStorage.removeItem("ofe_refresh_token");
        window.localStorage.removeItem("ofe_user");
        throw new Error("This login is reserved for admin accounts only.");
      }

      const destination =
        nextPath && nextPath.startsWith("/")
          ? nextPath
          : data?.user?.role === "ADMIN"
            ? "/admin"
            : "/dashboard";
      router.push(destination);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Reveal mode="load" delay={0.08}>
      <div className="rounded-[32px] border border-[#e7eee9] bg-white p-8 shadow-[0_12px_30px_rgba(15,23,32,0.06)] transition-transform duration-500 hover:-translate-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
          {isAdminLogin ? "Admin Access" : "Welcome Back"}
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          {isAdminLogin ? "Log in as admin" : "Log in to your account"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isAdminLogin
            ? "Use an admin account to open the control panel."
            : "Enter your credentials to continue."}
        </p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <Stagger className="space-y-4">
            <StaggerItem className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-[#dde6e0] bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-3 focus:ring-emerald-100"
              />
            </StaggerItem>

            <StaggerItem className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-emerald-600 transition-colors duration-300 hover:text-emerald-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-[#dde6e0] bg-slate-50/50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-3 focus:ring-emerald-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition-colors hover:text-emerald-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  <Icon name="eye" className="h-5 w-5" />
                </button>
              </div>
            </StaggerItem>

            {errorMessage ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </p>
            ) : null}

            <StaggerItem>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-[#0f7b36] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(15,123,54,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0d6b2f] hover:shadow-[0_10px_24px_rgba(15,123,54,0.24)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isSubmitting ? "Logging in..." : "Log in"}
              </button>
            </StaggerItem>
          </Stagger>
        </form>

        {!isAdminLogin ? (
          <>
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-xs text-slate-400">or continue with</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <Stagger className="grid gap-3">
              <StaggerItem>
                <button
                  type="button"
                  disabled={Boolean(socialProvider)}
                  onClick={() => startSocialLogin("google")}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[#dde6e0] bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-[0_10px_20px_rgba(15,23,32,0.06)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {socialProvider === "google"
                    ? "Opening Google..."
                    : "Continue with Google"}
                </button>
              </StaggerItem>
            </Stagger>
          </>
        ) : null}

        <p className="mt-6 text-center text-xs text-slate-500">
          {isAdminLogin ? "Need a customer account instead? " : "Don't have an account? "}
          <Link
            href={
              isAdminLogin
                ? "/login"
                : `/register${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`
            }
            className="font-semibold text-emerald-600 transition-colors duration-300 hover:text-emerald-700 hover:underline"
          >
            {isAdminLogin ? "Use regular login" : "Create one"}
          </Link>
        </p>
      </div>
    </Reveal>
  );
}
