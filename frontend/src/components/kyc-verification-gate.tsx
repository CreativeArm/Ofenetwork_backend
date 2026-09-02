"use client";

import { useLayoutEffect, useState, type ChangeEvent, type ReactNode } from "react";
import {
  fetchUserProfile,
  submitKyc,
  type BackendKycStatus,
  type BackendUser,
} from "../lib/admin-backend";
import { Icon } from "./icons";
import { uploadToCloudinary } from "../lib/upload-service";

type StoredUser = {
  id?: string;
  kycStatus?: BackendKycStatus;
};

type KycUpload = {
  name: string;
  dataUrl: string;
};

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read the selected document."));
    reader.readAsDataURL(file);
  });
}

function statusCopy(status?: BackendKycStatus) {
  if (status === "PENDING") {
    return {
      title: "KYC review in progress",
      description:
        "Your document has been submitted. Transactions will unlock once our team reviews your KYC.",
      badge: "Pending Review",
      tone: "bg-amber-50 text-amber-700",
    };
  }

  if (status === "REJECTED") {
    return {
      title: "KYC needs attention",
      description:
        "Your previous KYC submission was rejected. Please upload a clearer or corrected document to continue.",
      badge: "Rejected",
      tone: "bg-rose-50 text-rose-700",
    };
  }

  return {
    title: "Complete KYC to unlock transactions",
    description:
      "For account safety, deposits, withdrawals, Buy4Me, and bonus cashouts are only available after KYC approval.",
    badge: "Required",
    tone: "bg-sky-50 text-sky-700",
  };
}

export function KycVerificationGate({
  children,
  className = "",
  title = "Complete KYC to continue",
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState("National ID / NIN");
  const [upload, setUpload] = useState<KycUpload | null>(null);
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cachedKycStatus, setCachedKycStatus] = useState<BackendKycStatus | undefined>();

  const refreshUser = (nextUserId: string) => {
    fetchUserProfile(nextUserId)
      .then((profile) => {
        setUser(profile);
        setCachedKycStatus(profile.kycStatus);
        try {
          const rawUser = window.localStorage.getItem("ofe_user");
          const stored = rawUser ? JSON.parse(rawUser) : {};
          window.localStorage.setItem(
            "ofe_user",
            JSON.stringify({ ...stored, ...profile }),
          );
        } catch {
          window.localStorage.setItem("ofe_user", JSON.stringify(profile));
        }
      })
      .catch(() => {
        setFeedback("Unable to load your KYC status right now.");
      })
      .finally(() => setIsLoading(false));
  };

  useLayoutEffect(() => {
    try {
      const rawUser = window.localStorage.getItem("ofe_user");
      const parsed = rawUser ? (JSON.parse(rawUser) as StoredUser) : null;
      if (!parsed?.id) {
        setFeedback("Please log in to complete KYC.");
        setIsLoading(false);
        return;
      }

      setUserId(parsed.id);
      setCachedKycStatus(parsed.kycStatus);

      if (parsed.kycStatus === "APPROVED") {
        setIsLoading(false);
        return;
      }

      refreshUser(parsed.id);
    } catch {
      setFeedback("Unable to load your KYC status right now.");
      setIsLoading(false);
    }
  }, []);

  if (cachedKycStatus === "APPROVED" || user?.kycStatus === "APPROVED") {
    return <>{children}</>;
  }

  if (isLoading && !user) {
    return (
      <section className={`rounded-[30px] border border-[#e6ece8] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,32,0.04)] sm:p-6 ${className}`}>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#0f7b36]">
            <Icon name="shield" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Checking KYC status</p>
            <p className="mt-1 text-sm text-slate-500">
              Please wait while we confirm your verification state.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const copy = statusCopy(user?.kycStatus);
  const canSubmit = Boolean(userId) && user?.kycStatus !== "PENDING";

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) {
      setUpload(null);
      return;
    }

    const allowedTypes = ["image/", "application/pdf"];
    if (!allowedTypes.some((type) => file.type.startsWith(type))) {
      setFeedback("Please upload an image or PDF document.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback("Please choose a file below 5MB.");
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setUpload({ name: file.name, dataUrl });
    setFeedback(`${file.name} is ready for KYC submission.`);
  };

  const handleSubmit = async () => {
    if (!userId) {
      setFeedback("Please log in to complete KYC.");
      return;
    }

    if (!upload) {
      setFeedback("Please upload your KYC document first.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);
      let docUrl = upload.dataUrl;
      try {
        docUrl = await uploadToCloudinary(upload.dataUrl, "kyc");
      } catch (uploadErr) {
        console.warn("Cloudinary upload fallback:", uploadErr);
      }
      const updated = await submitKyc({
        userId,
        documentType,
        documentUrl: docUrl,
        notes: notes.trim() || undefined,
      });
      setUser(updated);
      setCachedKycStatus(updated.kycStatus);
      setUpload(null);
      setNotes("");
      window.localStorage.setItem("ofe_user", JSON.stringify(updated));
      setFeedback("KYC submitted successfully. Our team will review it shortly.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to submit KYC right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={`rounded-[30px] border border-[#e6ece8] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,32,0.04)] sm:p-6 ${className}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#0f7b36]">
              <Icon name="shield" className="h-6 w-6" />
            </span>
            <div>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${copy.tone}`}>
                {copy.badge}
              </span>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h2>
            </div>
          </div>
          <h3 className="mt-5 text-lg font-semibold text-slate-900">{copy.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{copy.description}</p>
          {user?.kycAdminNote ? (
            <p className="mt-4 rounded-2xl bg-[#fff8e8] px-4 py-3 text-sm leading-6 text-slate-700">
              Review note: {user.kycAdminNote}
            </p>
          ) : null}
        </div>

        <div className="rounded-[22px] bg-[#f8fbf8] p-4 text-sm text-slate-600 lg:w-[320px]">
          <p className="font-semibold text-slate-900">What happens next?</p>
          <p className="mt-2 leading-6">
            Submit your document once. Our team reviews it, then all transaction features unlock automatically.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-5 rounded-2xl bg-[#f6faf7] px-4 py-3 text-sm text-slate-600">
          Checking your KYC status...
        </p>
      ) : null}

      {feedback ? (
        <p className="mt-5 rounded-2xl bg-[#f6faf7] px-4 py-3 text-sm text-slate-700">
          {feedback}
        </p>
      ) : null}

      {canSubmit ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Document Type
            </span>
            <select
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
              className="w-full rounded-2xl border border-[#e5ebe7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
            >
              <option>National ID / NIN</option>
              <option>International Passport</option>
              <option>Driver&apos;s License</option>
              <option>Voter&apos;s Card</option>
              <option>Utility Bill</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Optional Note
            </span>
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
              placeholder="Add any additional note for review"
            />
          </label>

          <label className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-[#d7e2db] bg-[#fcfdfc] px-4 py-6 text-center transition hover:border-[#9bc8aa] hover:bg-[#f8fbf8] lg:col-span-2">
            <Icon name="upload" className="h-8 w-8 text-slate-400" />
            <p className="mt-3 text-sm font-medium text-slate-700">
              {upload ? upload.name : "Click to upload KYC document"}
            </p>
            <p className="mt-1 text-xs text-slate-400">JPG, PNG, WebP or PDF (Max. 5MB)</p>
            {upload?.dataUrl.startsWith("data:image/") ? (
              <img
                src={upload.dataUrl}
                alt={`${upload.name} preview`}
                className="mt-4 max-h-32 rounded-2xl border border-[#e5ebe7] object-contain"
              />
            ) : null}
            <input
              type="file"
              accept="image/*,.pdf,application/pdf"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                handleFileSelect(event.target.files?.[0])
              }
              className="hidden"
            />
          </label>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="rounded-2xl bg-[#0f7b36] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#116f34] disabled:cursor-not-allowed disabled:opacity-60 lg:col-span-2"
          >
            {isSubmitting ? "Submitting KYC..." : "Submit KYC for Review"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
