"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Reveal } from "./homepage-motion";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:4000/api";

interface OAuthUser {
  role?: string;
  fullName?: string;
  email?: string;
}

interface OAuthSessionResponse {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  user?: OAuthUser;
  next?: string;
}

function isSafeNextPath(value: string | null) {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//"));
}

export function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function completeSocialLogin() {
      const oauthError =
        searchParams.get("oauthError") ?? searchParams.get("error");

      if (oauthError) {
        setErrorMessage(oauthError);
        return;
      }

      try {
        let accessToken =
          searchParams.get("accessToken") ?? searchParams.get("token");
        let refreshToken = searchParams.get("refreshToken");
        let nextPath = searchParams.get("next");
        let user: OAuthUser | null = null;
        const oauthCode = searchParams.get("oauthCode");
        const userPayload = searchParams.get("user");

        if (oauthCode) {
          const response = await fetch(`${API_BASE_URL}/auth/social/session`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code: oauthCode }),
          });

          if (!response.ok) {
            const message = await response.text();
            throw new Error(
              message || "Social login session could not be confirmed.",
            );
          }

          const session = (await response.json()) as OAuthSessionResponse;
          accessToken = session.accessToken ?? session.token ?? null;
          refreshToken = session.refreshToken ?? null;
          user = session.user ?? null;
          nextPath = session.next ?? nextPath;
        } else if (userPayload) {
          user = JSON.parse(userPayload) as OAuthUser;
        }

        if (!accessToken || !refreshToken || !user) {
          throw new Error("Social login could not complete. Please try again.");
        }

        if (isCancelled) {
          return;
        }

        window.localStorage.setItem("ofe_access_token", accessToken);
        window.localStorage.setItem("ofe_refresh_token", refreshToken);
        window.localStorage.setItem("ofe_user", JSON.stringify(user));

        const destination = isSafeNextPath(nextPath)
          ? nextPath
          : user.role === "ADMIN"
            ? "/admin"
            : "/dashboard";

        window.setTimeout(() => {
          router.replace(destination ?? "/dashboard");
        }, 350);
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Social login returned invalid session details.",
          );
        }
      }
    }

    completeSocialLogin();

    return () => {
      isCancelled = true;
    };
  }, [router, searchParams]);

  return (
    <Reveal mode="load" delay={0.08}>
      <div className="mx-auto max-w-lg rounded-[32px] border border-[#e7eee9] bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,23,32,0.08)]">
        {errorMessage ? (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-xl font-bold text-rose-600">
              !
            </div>
            <h1 className="mt-5 text-2xl font-bold text-slate-950">
              Social login failed
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{errorMessage}</p>
            <Link
              href={`/login?oauthError=${encodeURIComponent(errorMessage)}`}
              className="mt-6 inline-flex rounded-2xl bg-[#0f7b36] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0d6b2f]"
            >
              Back to login
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-emerald-50 ring-8 ring-emerald-50/60">
              <div className="h-full w-full rounded-2xl bg-emerald-600" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-slate-950">
              Signing you in
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              We are confirming your social account and opening your dashboard.
            </p>
          </>
        )}
      </div>
    </Reveal>
  );
}
