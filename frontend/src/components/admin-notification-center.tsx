"use client";

import { useMemo, useState } from "react";
import { useBodyScrollLock } from "../lib/use-body-scroll-lock";
import { useGlobalSearch } from "../lib/search-context";
import { AdminStatusBadge } from "./admin-ui";

type NotificationStatus = "Draft" | "Scheduled" | "Sent" | "Live";

interface NotificationRecord {
  title: string;
  audience: string;
  channel: string;
  status: NotificationStatus | string;
  time: string;
}

interface AdminNotificationCenterProps {
  items: readonly NotificationRecord[];
}

function toneForStatus(status: string) {
  const lower = status.toLowerCase();
  if (lower.includes("sent") || lower.includes("live")) {
    return "success" as const;
  }
  if (lower.includes("scheduled") || lower.includes("draft")) {
    return "warning" as const;
  }
  return "neutral" as const;
}

const statuses = ["Draft", "Scheduled", "Sent", "Live"] as const;
const audiences = [
  "All users",
  "Eligible users",
  "Admins",
  "Buy4Me customers",
  "High-value users",
] as const;
const channels = [
  "Dashboard",
  "Dashboard + Email",
  "Realtime",
  "Email",
  "SMS",
] as const;

export function AdminNotificationCenter({ items }: AdminNotificationCenterProps) {
  const { searchQuery } = useGlobalSearch();
  const [notifications, setNotifications] = useState(items);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftAudience, setDraftAudience] = useState<(typeof audiences)[number]>("All users");
  const [draftChannel, setDraftChannel] = useState<(typeof channels)[number]>("Dashboard");
  const [draftStatus, setDraftStatus] = useState<(typeof statuses)[number]>("Draft");

  useBodyScrollLock(isComposeOpen);

  const filteredNotifications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return notifications;

    return notifications.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.audience.toLowerCase().includes(query) ||
        item.channel.toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query)
    );
  }, [notifications, searchQuery]);

  const closeCompose = () => {
    setIsComposeOpen(false);
    setDraftTitle("");
    setDraftAudience("All users");
    setDraftChannel("Dashboard");
    setDraftStatus("Draft");
  };

  const createNotification = () => {
    const trimmedTitle = draftTitle.trim();
    if (!trimmedTitle) {
      return;
    }

    setNotifications((current) => [
      {
        title: trimmedTitle,
        audience: draftAudience,
        channel: draftChannel,
        status: draftStatus,
        time: "Just now",
      },
      ...current,
    ]);
    closeCompose();
  };

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">Notification Center</h3>
          <p className="text-sm text-slate-500">
            Review what has gone out and what still needs publishing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsComposeOpen(true)}
          className="rounded-xl bg-[#0f7b36] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#116f34]"
        >
          Compose
        </button>
      </div>

      <div className="space-y-3">
        {filteredNotifications.map((item) => (
          <div key={item.title + item.time} className="rounded-[22px] border border-[#edf1ee] p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-500">
                  {item.audience} / {item.channel}
                </p>
              </div>
              <div className="text-left md:text-right">
                <AdminStatusBadge label={item.status} tone={toneForStatus(item.status)} />
                <p className="mt-2 text-xs text-slate-400">{item.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isComposeOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/18 px-4 backdrop-blur-[2px]"
          onClick={closeCompose}
        >
          <div
            className="w-full max-w-[480px] rounded-[28px] border border-[#e5ebe7] bg-white p-5 shadow-[0_28px_80px_rgba(15,23,32,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Compose Notification
                </p>
                <h4 className="mt-2 text-xl font-semibold text-slate-900">
                  Create a new broadcast
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  Draft a quick admin or customer-facing update and add it to the queue.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCompose}
                className="rounded-full border border-[#dbe5df] px-3 py-1 text-sm font-semibold text-slate-500 transition hover:bg-[#f8fbf8]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Title</span>
                <input
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                  placeholder="Enter notification title"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Audience</span>
                  <select
                    value={draftAudience}
                    onChange={(event) =>
                      setDraftAudience(event.target.value as (typeof audiences)[number])
                    }
                    className="w-full rounded-2xl border border-[#e5ebe7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                  >
                    {audiences.map((audience) => (
                      <option key={audience} value={audience}>
                        {audience}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Channel</span>
                  <select
                    value={draftChannel}
                    onChange={(event) =>
                      setDraftChannel(event.target.value as (typeof channels)[number])
                    }
                    className="w-full rounded-2xl border border-[#e5ebe7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                  >
                    {channels.map((channel) => (
                      <option key={channel} value={channel}>
                        {channel}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Status</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setDraftStatus(status)}
                      className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                        draftStatus === status
                          ? status === "Sent" || status === "Live"
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-500 text-white"
                          : "border border-[#dbe5df] bg-white text-slate-700 hover:bg-[#f8fbf8]"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeCompose}
                className="rounded-2xl border border-[#dbe5df] px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-[#f8fbf8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createNotification}
                className="rounded-2xl bg-[#0f7b36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#116f34]"
              >
                Add Notification
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
