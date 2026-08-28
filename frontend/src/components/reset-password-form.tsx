"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Reveal, Stagger, StaggerItem } from "./homepage-motion";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:4000/api";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") ?? "";
  const tokenFromUrl = searchParams.get("token") ?? "";
  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim() || !tokenFromUrl) {
      setErrorMessage("This reset link is missing required details.");
      return;
    }

    if (!password || !confirmPassword) {
      setErrorMessage("Please enter and confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          token: tokenFromUrl,
          password,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { message?: string | string[] }
        | null;

      if (!response.ok) {
        const message = Array.isArray(data?.message)
          ? data.message[0]
          : data?.message ?? "Unable to reset password.";
        throw new Error(message);
      }

      setSuccessMessage("Password updated. Redirecting to login...");
      setPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        router.push(
          `/login?reset=1&email=${encodeURIComponent(email.trim())}`,
        );
      }, 900);
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
          Secure Reset
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900">
          Create a new password
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Choose a strong password. After this, previous sessions for this
          account will be cleared.
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
                readOnly
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-[#dde6e0] bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-3 focus:ring-emerald-100"
              />
            </StaggerItem>

            <StaggerItem className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                placeholder="At least 8 characters"
                className="w-full rounded-2xl border border-[#dde6e0] bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-3 focus:ring-emerald-100"
              />
            </StaggerItem>

            <StaggerItem className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                placeholder="Repeat new password"
                className="w-full rounded-2xl border border-[#dde6e0] bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-3 focus:ring-emerald-100"
              />
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
                {isSubmitting ? "Updating password..." : "Update Password"}
              </button>
            </StaggerItem>
          </Stagger>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Need a fresh link?{" "}
          <Link
            href="/forgot-password"
            className="font-semibold text-emerald-600 transition-colors duration-300 hover:text-emerald-700 hover:underline"
          >
            Request another reset
          </Link>
        </p>
      </div>
    </Reveal>
  );
}
