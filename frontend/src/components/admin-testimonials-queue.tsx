"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchTestimonials,
  formatRelativeTime,
  updateTestimonialStatus,
  type BackendTestimonial,
} from "../lib/admin-backend";
import { useBodyScrollLock } from "../lib/use-body-scroll-lock";
import { useGlobalSearch } from "../lib/search-context";
import { AdminStatusBadge } from "./admin-ui";
import { Icon } from "./icons";

type TestimonialStatus = BackendTestimonial["status"];

export interface TestimonialRecord {
  id: string;
  name: string;
  service: string;
  text: string;
  status: TestimonialStatus;
  submittedAt: string;
  rating?: number;
}

interface AdminTestimonialsQueueProps {
  items?: readonly TestimonialRecord[];
}

const filters = ["All", "PENDING_REVIEW", "APPROVED", "REJECTED"] as const;

function statusLabel(status: TestimonialStatus) {
  if (status === "PENDING_REVIEW") {
    return "Pending Review";
  }

  return status.charAt(0) + status.slice(1).toLowerCase();
}

function toneForStatus(status: string) {
  const lower = status.toLowerCase();
  if (lower.includes("approve")) {
    return "success" as const;
  }
  if (lower.includes("pending")) {
    return "warning" as const;
  }
  if (lower.includes("reject")) {
    return "danger" as const;
  }
  return "neutral" as const;
}

export function AdminTestimonialsQueue({ items = [] }: AdminTestimonialsQueueProps) {
  const { searchQuery } = useGlobalSearch();
  const [selectedFilter, setSelectedFilter] =
    useState<(typeof filters)[number]>("PENDING_REVIEW");
  const [testimonials, setTestimonials] = useState<TestimonialRecord[]>([...items]);
  const [activeTestimonialId, setActiveTestimonialId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadTestimonials = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const fetched = await fetchTestimonials();
      if (Array.isArray(fetched)) {
        setTestimonials(
          fetched.map((t) => ({
            id: t.id,
            name: t.name,
            service: t.service,
            text: t.text,
            status: t.status,
            submittedAt: formatRelativeTime(t.submittedAt),
          })),
        );
      }
    } catch {
      // Keep existing list
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  const activeTestimonial =
    testimonials.find((item) => item.id === activeTestimonialId) ?? null;

  useBodyScrollLock(Boolean(activeTestimonial));

  const filterCounts = useMemo(() => {
    const counts = {
      All: testimonials.length,
      PENDING_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
    };
    testimonials.forEach((t) => {
      if (t.status === "PENDING_REVIEW") counts.PENDING_REVIEW++;
      else if (t.status === "APPROVED") counts.APPROVED++;
      else if (t.status === "REJECTED") counts.REJECTED++;
    });
    return counts;
  }, [testimonials]);

  const filteredTestimonials = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return testimonials.filter((item) => {
      const matchesFilter = selectedFilter === "All" || item.status === selectedFilter;
      if (!matchesFilter) return false;

      if (!query) return true;

      return (
        item.id.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.service.toLowerCase().includes(query) ||
        item.text.toLowerCase().includes(query)
      );
    });
  }, [selectedFilter, testimonials, searchQuery]);

  const updateStatus = async (id: string, status: TestimonialStatus) => {
    try {
      setIsSaving(true);
      setFeedback(null);
      const updated = await updateTestimonialStatus(id, status);
      setTestimonials((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                ...updated,
              }
            : item,
        ),
      );
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to update this testimonial right now.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="whitespace-nowrap text-xl font-semibold">Moderation Queue ({testimonials.length})</h3>
            <button
              type="button"
              onClick={() => loadTestimonials()}
              disabled={isLoading}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#dbe5df] bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-[#f4f7f5] disabled:opacity-60"
            >
              <Icon name="arrow" className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Approve reviews for the public storefront or reject inappropriate submissions.
          </p>
        </div>
        <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0">
          {filters.map((item) => {
            const count = filterCounts[item];
            return (
              <button
                key={item}
                type="button"
                onClick={() => setSelectedFilter(item)}
                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition ${
                  selectedFilter === item
                    ? "bg-[#0f7b36] text-white"
                    : "bg-[#f4f7f5] text-slate-600 hover:bg-[#eaf4ed]"
                }`}
              >
                {item === "All" ? item : statusLabel(item)} {count > 0 ? `(${count})` : "(0)"}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading && testimonials.length === 0 ? (
        <div className="rounded-[22px] border border-[#edf1ee] bg-[#fbfdfb] p-8 text-center text-sm text-slate-500">
          <p className="font-semibold text-slate-700">Loading testimonials...</p>
        </div>
      ) : filteredTestimonials.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[#dbe5df] bg-[#f8fbf8] p-8 text-center text-sm text-slate-500">
          <p className="font-semibold text-slate-700">No testimonials in this view.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTestimonials.map((item) => (
            <div
              key={item.id}
              className="grid gap-4 rounded-[22px] border border-[#edf1ee] bg-white p-4 transition-all hover:border-[#cfe2d5] hover:shadow-[0_4px_20px_rgba(15,23,32,0.04)] md:grid-cols-[1fr_0.65fr_0.55fr_0.45fr] md:items-center"
            >
              <div>
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-500">{item.service}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.text}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Submitted
                </p>
                <p className="mt-1 text-sm text-slate-700">{item.submittedAt}</p>
              </div>
              <div>
                <AdminStatusBadge label={statusLabel(item.status)} tone={toneForStatus(item.status)} />
              </div>
              <button
                type="button"
                onClick={() => setActiveTestimonialId(item.id)}
                className="rounded-xl border border-[#dbe5df] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#f8fbf8]"
              >
                Review
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTestimonial ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 px-4 backdrop-blur-[2px]"
          onClick={() => setActiveTestimonialId(null)}
        >
          <div
            className="w-full max-w-[500px] rounded-[28px] border border-[#e5ebe7] bg-white p-5 shadow-[0_28px_80px_rgba(15,23,32,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Testimonial Review
                </p>
                <h4 className="mt-2 text-xl font-semibold text-slate-900">
                  {activeTestimonial.name}
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  {activeTestimonial.service} {"|"} {activeTestimonial.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTestimonialId(null)}
                className="rounded-full border border-[#dbe5df] px-3 py-1 text-sm font-semibold text-slate-500 transition hover:bg-[#f8fbf8]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 rounded-[18px] bg-[#f8fbf8] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Current status
              </p>
              <div className="mt-2">
                <AdminStatusBadge
                  label={statusLabel(activeTestimonial.status)}
                  tone={toneForStatus(activeTestimonial.status)}
                />
              </div>
            </div>

            {feedback ? (
              <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {feedback}
              </p>
            ) : null}

            <div className="mt-4 rounded-[22px] border border-[#e5ebe7] bg-[#fbfdfb] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Customer message
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {activeTestimonial.text}
              </p>
              <p className="mt-4 text-xs text-slate-400">
                Submitted {activeTestimonial.submittedAt}
              </p>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Moderation action
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => updateStatus(activeTestimonial.id, "REJECTED")}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    activeTestimonial.status === "REJECTED"
                      ? "bg-rose-600 text-white"
                      : "border border-[#f0d7d7] bg-white text-rose-600 hover:bg-rose-50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  Reject testimonial
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => updateStatus(activeTestimonial.id, "APPROVED")}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    activeTestimonial.status === "APPROVED"
                      ? "bg-emerald-600 text-white"
                      : "bg-[#0f7b36] text-white hover:bg-[#116f34]"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {isSaving ? "Saving..." : "Approve for storefront"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
