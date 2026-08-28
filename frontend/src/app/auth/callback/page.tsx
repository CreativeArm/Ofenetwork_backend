import { Suspense } from "react";
import { OAuthCallback } from "../../../components/oauth-callback";
import { PublicShell } from "../../../components/public-shell";

export default function AuthCallbackPage() {
  return (
    <PublicShell>
      <section className="mx-auto flex min-h-[58vh] max-w-4xl items-center justify-center px-4 py-12">
        <Suspense
          fallback={
            <div className="mx-auto max-w-lg rounded-[32px] border border-[#e7eee9] bg-white p-8 text-center shadow-[0_18px_45px_rgba(15,23,32,0.08)]">
              <p className="text-sm text-slate-500">Completing social login...</p>
            </div>
          }
        >
          <OAuthCallback />
        </Suspense>
      </section>
    </PublicShell>
  );
}
