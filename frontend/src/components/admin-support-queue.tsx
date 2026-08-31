"use client";

import { useEffect, useMemo, useState } from "react";
import { useBodyScrollLock } from "../lib/use-body-scroll-lock";
import { useGlobalSearch } from "../lib/search-context";
import {
  fetchSupportTickets,
  formatRelativeTime,
  updateSupportTicket,
  type BackendSupportTicketStatus,
} from "../lib/admin-backend";
import { AdminStatusBadge } from "./admin-ui";
import { Icon } from "./icons";

export type TicketStatus = "Open" | "Pending User" | "Resolved";

interface TicketMessage {
  sender: string;
  time: string;
  text: string;
}

export interface TicketRecord {
  id: string;
  subject: string;
  user: string;
  priority: string;
  owner: string;
  status: TicketStatus;
  channel: string;
  updatedAt: string;
  summary: string;
  conversation: readonly TicketMessage[];
}

interface AdminSupportQueueProps {
  items?: readonly TicketRecord[];
  liveMode?: boolean;
}

function toneForStatus(status: string) {
  const lower = status.toLowerCase();
  if (lower.includes("resolved")) {
    return "success" as const;
  }
  if (lower.includes("pending")) {
    return "warning" as const;
  }
  if (lower.includes("high")) {
    return "danger" as const;
  }
  if (lower.includes("open")) {
    return "info" as const;
  }
  return "neutral" as const;
}

const filters = ["All", "Open", "Pending User", "Resolved"] as const;
const owners = ["Tosin", "Shola", "Mide", "Unassigned"] as const;

function statusToBackend(status: TicketStatus): BackendSupportTicketStatus {
  if (status === "Pending User") {
    return "PENDING_USER";
  }
  if (status === "Resolved") {
    return "RESOLVED";
  }
  return "OPEN";
}

export function AdminSupportQueue({ items = [], liveMode = true }: AdminSupportQueueProps) {
  const { searchQuery } = useGlobalSearch();
  const [selectedFilter, setSelectedFilter] = useState<(typeof filters)[number]>("Open");
  const [tickets, setTickets] = useState<TicketRecord[]>([...items]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadTickets = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const fetched = await fetchSupportTickets();
      if (Array.isArray(fetched)) {
        setTickets(
          fetched.map((ticket) => ({
            id: ticket.id,
            subject: ticket.subject,
            user: `${ticket.name} • ${ticket.email}`,
            priority:
              ticket.priority === "HIGH"
                ? "High"
                : ticket.priority === "LOW"
                  ? "Low"
                  : "Medium",
            owner: ticket.owner,
            status:
              ticket.status === "PENDING_USER"
                ? "Pending User"
                : ticket.status === "RESOLVED"
                  ? "Resolved"
                  : "Open",
            channel: ticket.channel,
            updatedAt: formatRelativeTime(ticket.updatedAt),
            summary: ticket.message,
            conversation: ticket.conversation.map((message) => ({
              ...message,
              time: formatRelativeTime(message.time),
            })),
          })),
        );
      }
    } catch {
      // Keep existing
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const activeTicket = tickets.find((ticket) => ticket.id === activeTicketId) ?? null;

  useBodyScrollLock(Boolean(activeTicket));

  const filterCounts = useMemo(() => {
    const counts = {
      All: tickets.length,
      Open: 0,
      "Pending User": 0,
      Resolved: 0,
    };
    tickets.forEach((t) => {
      if (t.status === "Open") counts.Open++;
      else if (t.status === "Pending User") counts["Pending User"]++;
      else if (t.status === "Resolved") counts.Resolved++;
    });
    return counts;
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesFilter = selectedFilter === "All" || ticket.status === selectedFilter;
      if (!matchesFilter) return false;

      if (!query) return true;

      return (
        ticket.id.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.user.toLowerCase().includes(query) ||
        ticket.summary?.toLowerCase().includes(query)
      );
    });
  }, [selectedFilter, tickets, searchQuery]);

  const updateTicket = (
    id: string,
    changes: Partial<Pick<TicketRecord, "status" | "owner">>,
  ) => {
    const previousTickets = tickets;
    setActionError("");
    setTickets((current) =>
      current.map((ticket) => (ticket.id === id ? { ...ticket, ...changes } : ticket)),
    );

    if (!liveMode) {
      return;
    }

    updateSupportTicket(id, {
      owner: changes.owner,
      status: changes.status ? statusToBackend(changes.status) : undefined,
    }).catch(() => {
      setTickets(previousTickets);
      setActionError("Unable to update this ticket. Please try again.");
    });
  };

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="whitespace-nowrap text-xl font-semibold">Support Queue ({tickets.length})</h3>
            <button
              type="button"
              onClick={() => loadTickets()}
              disabled={isLoading}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#dbe5df] bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-[#f4f7f5] disabled:opacity-60"
            >
              <Icon name="arrow" className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Track user inquiries, respond to tickets, and update resolution status.
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
                {item} {count > 0 ? `(${count})` : "(0)"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {actionError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {actionError}
          </p>
        ) : null}

        {isLoading && tickets.length === 0 ? (
          <div className="rounded-[22px] border border-[#edf1ee] bg-[#fbfdfb] p-8 text-center text-sm text-slate-500">
            <p className="font-semibold text-slate-700">Loading support tickets...</p>
          </div>
        ) : filteredTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="grid gap-4 rounded-[22px] border border-[#edf1ee] bg-white p-4 transition-all hover:border-[#cfe2d5] hover:shadow-[0_4px_20px_rgba(15,23,32,0.04)] md:grid-cols-[1.2fr_0.7fr_0.6fr_0.6fr_0.45fr] md:items-center"
          >
            <div>
              <p className="font-semibold text-slate-900">{ticket.subject}</p>
              <p className="text-sm text-slate-500">{ticket.user}</p>
              <p className="mt-1 text-xs text-slate-400">{ticket.id}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Owner
              </p>
              <p className="mt-1 text-sm text-slate-700">{ticket.owner}</p>
            </div>
            <div>
              <AdminStatusBadge label={ticket.priority} tone={toneForStatus(ticket.priority)} />
            </div>
            <div>
              <AdminStatusBadge label={ticket.status} tone={toneForStatus(ticket.status)} />
            </div>
            <button
              type="button"
              onClick={() => setActiveTicketId(ticket.id)}
              className="rounded-xl border border-[#dbe5df] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#f8fbf8]"
            >
              Open
            </button>
          </div>
        ))}

        {!isLoading && filteredTickets.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-[#dbe5df] bg-[#f8fbf8] p-6 text-sm text-slate-500">
            No support tickets in this view yet.
          </div>
        ) : null}
      </div>

      {activeTicket ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 px-4 backdrop-blur-[2px]"
          onClick={() => setActiveTicketId(null)}
        >
          <div
            className="w-full max-w-[520px] max-h-[90vh] overflow-y-auto rounded-[28px] border border-[#e5ebe7] bg-white p-5 shadow-[0_28px_80px_rgba(15,23,32,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Support Ticket
                </p>
                <h4 className="mt-2 text-xl font-semibold text-slate-900">
                  {activeTicket.subject}
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  {activeTicket.user} {"|"} {activeTicket.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTicketId(null)}
                className="rounded-full border border-[#dbe5df] px-3 py-1 text-sm font-semibold text-slate-500 transition hover:bg-[#f8fbf8]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] bg-[#f8fbf8] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Priority
                </p>
                <div className="mt-2">
                  <AdminStatusBadge
                    label={activeTicket.priority}
                    tone={toneForStatus(activeTicket.priority)}
                  />
                </div>
              </div>
              <div className="rounded-[18px] bg-[#f8fbf8] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Channel
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {activeTicket.channel}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[18px] bg-[#f8fbf8] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Summary
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{activeTicket.summary}</p>
            </div>

            <div className="mt-4 rounded-[22px] border border-[#e5ebe7] bg-[#fbfdfb] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Conversation</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Most recent customer and admin context for the issue.
                  </p>
                </div>
                <p className="text-xs font-semibold text-slate-400">
                  Updated {activeTicket.updatedAt}
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {activeTicket.conversation.map((message) => (
                  <div key={`${message.sender}-${message.time}-${message.text}`} className="rounded-[18px] border border-[#e5ebe7] bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{message.sender}</p>
                      <p className="text-xs text-slate-400">{message.time}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{message.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Owner
                </span>
                <select
                  value={activeTicket.owner}
                  onChange={(event) =>
                    updateTicket(activeTicket.id, { owner: event.target.value })
                  }
                  className="w-full rounded-2xl border border-[#e5ebe7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                >
                  {owners.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Status
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(["Open", "Pending User", "Resolved"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => updateTicket(activeTicket.id, { status })}
                      className={`rounded-xl px-3 py-3 text-xs font-semibold transition ${
                        activeTicket.status === status
                          ? status === "Resolved"
                            ? "bg-emerald-600 text-white"
                            : status === "Pending User"
                              ? "bg-amber-500 text-white"
                              : "bg-sky-600 text-white"
                          : "border border-[#dbe5df] bg-white text-slate-700 hover:bg-[#f8fbf8]"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
