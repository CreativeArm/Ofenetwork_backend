"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildProofPlaceholder,
  fetchAdminUsers,
  formatRelativeTime,
  updateKycStatus,
  type BackendAdminUser,
  type BackendKycStatus,
} from "../lib/admin-backend";
import { useBodyScrollLock } from "../lib/use-body-scroll-lock";
import { useGlobalSearch } from "../lib/search-context";
import { AdminStatusBadge } from "./admin-ui";
import { Icon } from "./icons";

type KycStatus = "Pending" | "Flagged" | "Approved";

export interface KycRecord {
  id: string;
  userId?: string;
  user: string;
  document: string;
  risk: string;
  status: KycStatus;
  submittedAt: string;
  proofName: string;
  proofHref: string;
  notes: string;
}

interface AdminKycQueueProps {
  items?: readonly KycRecord[];
}

function toneForStatus(status: string) {
  const lower = status.toLowerCase();
  if (lower.includes("approved")) {
    return "success" as const;
  }
  if (lower.includes("pending")) {
    return "warning" as const;
  }
  if (lower.includes("flagged") || lower.includes("rejected")) {
    return "danger" as const;
  }
  return "neutral" as const;
}

const filters = ["All", "Pending", "Flagged", "Approved"] as const;

function mapUserToKycRecord(user: BackendAdminUser): KycRecord {
  return {
    id: `KYC-${user.id.slice(-8)}`,
    userId: user.id,
    user: user.fullName || "Unnamed User",
    document: user.kycDocumentType ?? "Identity Document",
    risk: user.kycStatus === "REJECTED" ? "High" : "Low",
    status:
      user.kycStatus === "APPROVED"
        ? "Approved"
        : user.kycStatus === "REJECTED"
          ? "Flagged"
          : "Pending",
    submittedAt: user.kycSubmittedAt
      ? formatRelativeTime(user.kycSubmittedAt)
      : user.createdAt
        ? formatRelativeTime(user.createdAt)
        : "Recently",
    proofName: `${user.id}-kyc-document`,
    proofHref:
      user.kycDocumentUrl ??
      buildProofPlaceholder(user.id, user.kycDocumentType ?? "KYC", user.email),
    notes: user.kycAdminNote ?? "Awaiting admin review.",
  };
}

export function AdminKycQueue({ items = [] }: AdminKycQueueProps) {
  const { searchQuery } = useGlobalSearch();
  const [selectedFilter, setSelectedFilter] = useState<(typeof filters)[number]>("Pending");
  const [records, setRecords] = useState<KycRecord[]>([...items]);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadKycRecords = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setErrorMessage(null);
    try {
      const users = await fetchAdminUsers();
      if (Array.isArray(users)) {
        const kycSubmissions = users
          .filter((user) => user.kycStatus && user.kycStatus !== "NOT_SUBMITTED")
          .map(mapUserToKycRecord);
        setRecords(kycSubmissions);
      }
    } catch (err) {
      if (!silent) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Failed to load KYC verification requests from backend.",
        );
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKycRecords();
    const interval = window.setInterval(() => loadKycRecords(true), 25000);
    const onFocus = () => loadKycRecords(true);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const activeRecord = records.find((item) => item.id === activeRecordId) ?? null;
  const activeProofIsImage =
    activeRecord?.proofHref.startsWith("data:image/") ||
    /\.(png|jpe?g|webp|gif|svg)(?:$|\?)/i.test(activeRecord?.proofHref ?? "");

  useBodyScrollLock(Boolean(activeRecord));

  const filterCounts = useMemo(() => {
    const counts = {
      All: records.length,
      Pending: 0,
      Flagged: 0,
      Approved: 0,
    };
    records.forEach((r) => {
      if (r.status === "Pending") counts.Pending++;
      else if (r.status === "Flagged") counts.Flagged++;
      else if (r.status === "Approved") counts.Approved++;
    });
    return counts;
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return records.filter((item) => {
      const matchesFilter = selectedFilter === "All" || item.status === selectedFilter;
      if (!matchesFilter) return false;

      if (!query) return true;

      return (
        item.id.toLowerCase().includes(query) ||
        item.user.toLowerCase().includes(query) ||
        item.document.toLowerCase().includes(query) ||
        item.risk.toLowerCase().includes(query)
      );
    });
  }, [records, selectedFilter, searchQuery]);

  const statusToBackend = (status: KycStatus): BackendKycStatus =>
    status === "Approved" ? "APPROVED" : status === "Flagged" ? "REJECTED" : "PENDING";

  const updateStatus = async (id: string, status: KycStatus) => {
    const record = records.find((item) => item.id === id);
    const previousStatus = record?.status ?? "Pending";

    setRecords((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    );

    if (!record?.userId) {
      return;
    }

    setIsUpdating(true);

    try {
      const storedUser = window.localStorage.getItem("ofe_user");
      const actorId = storedUser ? (JSON.parse(storedUser) as { id?: string }).id : undefined;
      await updateKycStatus({
        userId: record.userId,
        status: statusToBackend(status),
        actorId: actorId ?? "admin-local",
        note:
          status === "Approved"
            ? "KYC approved. Transactions and account services are now available."
            : status === "Flagged"
              ? "KYC rejected. Please submit a clearer or valid government ID document."
              : "KYC returned to pending review.",
      });
      await loadKycRecords(true);
    } catch {
      setRecords((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status: previousStatus } : item,
        ),
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold">Verification Queue</h3>
            <button
              type="button"
              onClick={() => loadKycRecords()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe5df] bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-[#f4f7f5] disabled:opacity-60"
            >
              <Icon name="arrow" className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Review identity documents and resolve KYC verification submissions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => {
            const count = filterCounts[item];
            return (
              <button
                key={item}
                type="button"
                onClick={() => setSelectedFilter(item)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedFilter === item
                    ? "bg-[#0f7b36] text-white"
                    : "bg-[#f4f7f5] text-slate-600 hover:bg-[#eaf4ed]"
                }`}
              >
                {item} {count > 0 ? `(${count})` : "(0)"}
              </button>
            );
          })}
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {isLoading && records.length === 0 ? (
        <div className="rounded-[22px] border border-[#edf1ee] bg-[#fbfdfb] p-8 text-center text-sm text-slate-500">
          <Icon name="shield" className="mx-auto h-8 w-8 animate-pulse text-[#0f7b36]" />
          <p className="mt-3 font-semibold text-slate-700">Loading KYC submissions from backend...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[#dbe5df] bg-[#f8fbf8] p-8 text-center text-sm text-slate-500">
          <p className="font-semibold text-slate-700">No {selectedFilter !== "All" ? selectedFilter.toLowerCase() : ""} KYC submissions found.</p>
          <p className="mt-1 text-xs text-slate-400">When users submit identity documents, they will appear here instantly.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((item) => (
            <div
              key={item.id}
              className="grid gap-4 rounded-[22px] border border-[#edf1ee] bg-white p-4 transition-all hover:border-[#cfe2d5] hover:shadow-[0_4px_20px_rgba(15,23,32,0.04)] md:grid-cols-[1.1fr_0.75fr_0.55fr_0.55fr_0.45fr] md:items-center"
            >
              <div>
                <p className="font-semibold text-slate-900">{item.user}</p>
                <p className="text-sm text-slate-500">{item.document}</p>
                <p className="mt-1 text-xs text-slate-400">{item.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Submitted
                </p>
                <p className="mt-1 text-sm text-slate-700">{item.submittedAt}</p>
              </div>
              <div>
                <AdminStatusBadge label={`${item.risk} Risk`} tone={toneForStatus(item.risk)} />
              </div>
              <div>
                <AdminStatusBadge label={item.status} tone={toneForStatus(item.status)} />
              </div>
              <button
                type="button"
                onClick={() => setActiveRecordId(item.id)}
                className="rounded-xl border border-[#dbe5df] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#f8fbf8]"
              >
                Review
              </button>
            </div>
          ))}
        </div>
      )}

      {activeRecord ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 px-4 backdrop-blur-[2px]"
          onClick={() => setActiveRecordId(null)}
        >
          <div
            className="w-full max-w-[500px] max-h-[90vh] overflow-y-auto rounded-[28px] border border-[#e5ebe7] bg-white p-5 shadow-[0_28px_80px_rgba(15,23,32,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  KYC Verification Review
                </p>
                <h4 className="mt-2 text-xl font-semibold text-slate-900">
                  {activeRecord.user}
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  {activeRecord.document} {"|"} {activeRecord.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveRecordId(null)}
                className="rounded-full border border-[#dbe5df] px-3 py-1 text-sm font-semibold text-slate-500 transition hover:bg-[#f8fbf8]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] bg-[#f8fbf8] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Risk Level
                </p>
                <div className="mt-2">
                  <AdminStatusBadge
                    label={`${activeRecord.risk} Risk`}
                    tone={toneForStatus(activeRecord.risk)}
                  />
                </div>
              </div>
              <div className="rounded-[18px] bg-[#f8fbf8] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Current Status
                </p>
                <div className="mt-2">
                  <AdminStatusBadge
                    label={activeRecord.status}
                    tone={toneForStatus(activeRecord.status)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[22px] border border-[#e5ebe7] bg-[#fbfdfb] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Uploaded Identity Document
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {activeRecord.document}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={activeRecord.proofHref}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-[#cfe2d5] bg-white px-3 py-2 text-xs font-semibold text-[#0f7b36] transition hover:bg-[#eef8f1]"
                  >
                    Open Full
                  </a>
                  <a
                    href={activeRecord.proofHref}
                    download={activeRecord.proofName}
                    className="rounded-xl border border-[#cfe2d5] bg-white px-3 py-2 text-xs font-semibold text-[#0f7b36] transition hover:bg-[#eef8f1]"
                  >
                    Download
                  </a>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-[18px] border border-[#e5ebe7] bg-white">
                {activeProofIsImage ? (
                  <img
                    src={activeRecord.proofHref}
                    alt={`${activeRecord.id} uploaded KYC document`}
                    className="max-h-60 w-full object-contain p-2"
                  />
                ) : (
                  <div className="flex h-44 flex-col items-center justify-center px-4 text-center text-sm text-slate-500">
                    <Icon name="shield" className="h-8 w-8 text-[#0f7b36]" />
                    <p className="mt-2 font-semibold text-slate-700">Document Uploaded</p>
                    <p className="mt-1 text-xs text-slate-400">Click &quot;Open Full&quot; or &quot;Download&quot; to review the PDF file.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-[18px] bg-[#f8fbf8] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Admin Note / User Note
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{activeRecord.notes}</p>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Change Verification Status
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {(["Pending", "Flagged", "Approved"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={isUpdating}
                    onClick={() => void updateStatus(activeRecord.id, status)}
                    className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                      activeRecord.status === status
                        ? status === "Approved"
                          ? "bg-emerald-600 text-white shadow-md"
                          : status === "Flagged"
                            ? "bg-rose-600 text-white shadow-md"
                            : "bg-amber-500 text-white shadow-md"
                        : "border border-[#dbe5df] bg-white text-slate-700 hover:bg-[#f8fbf8]"
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {status === "Approved" ? "Approve" : status === "Flagged" ? "Reject" : "Pending"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
