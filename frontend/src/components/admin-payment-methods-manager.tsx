"use client";

import { useMemo, useState } from "react";
import { useBodyScrollLock } from "../lib/use-body-scroll-lock";
import { AdminStatusBadge } from "./admin-ui";

type PaymentMethodStatus = "Primary" | "Active" | "Paused";

interface PaymentMethodRecord {
  channel: string;
  details: string;
  usage: string;
  status: PaymentMethodStatus | string;
}

interface AdminPaymentMethodsManagerProps {
  items: readonly PaymentMethodRecord[];
}

const statuses = ["Primary", "Active", "Paused"] as const;

function toneForStatus(status: string) {
  const lower = status.toLowerCase();
  if (lower.includes("primary") || lower.includes("active")) {
    return "success" as const;
  }
  if (lower.includes("paused")) {
    return "warning" as const;
  }
  return "neutral" as const;
}

export function AdminPaymentMethodsManager({
  items,
}: AdminPaymentMethodsManagerProps) {
  const [methods, setMethods] = useState(items);
  const [activeMethodName, setActiveMethodName] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [draftChannel, setDraftChannel] = useState("");
  const [draftDetails, setDraftDetails] = useState("");
  const [draftUsage, setDraftUsage] = useState("");
  const [draftStatus, setDraftStatus] =
    useState<(typeof statuses)[number]>("Active");

  const activeMethod = useMemo(
    () => methods.find((item) => item.channel === activeMethodName) ?? null,
    [activeMethodName, methods],
  );

  useBodyScrollLock(Boolean(activeMethod) || isAddModalOpen);

  const resetDraft = () => {
    setDraftChannel("");
    setDraftDetails("");
    setDraftUsage("");
    setDraftStatus("Active");
  };

  const closeModal = () => {
    setActiveMethodName(null);
    setIsAddModalOpen(false);
    resetDraft();
  };

  const openAddModal = () => {
    setActiveMethodName(null);
    setIsAddModalOpen(true);
    resetDraft();
  };

  const openEditModal = (method: PaymentMethodRecord) => {
    setIsAddModalOpen(false);
    setActiveMethodName(method.channel);
    setDraftChannel(method.channel);
    setDraftDetails(method.details);
    setDraftUsage(method.usage);
    setDraftStatus(
      statuses.includes(method.status as (typeof statuses)[number])
        ? (method.status as (typeof statuses)[number])
        : "Active",
    );
  };

  const saveMethod = () => {
    if (!activeMethod) {
      return;
    }

    const trimmedChannel = draftChannel.trim();
    const trimmedDetails = draftDetails.trim();
    const trimmedUsage = draftUsage.trim();

    if (!trimmedChannel || !trimmedDetails || !trimmedUsage) {
      return;
    }

    setMethods((current) =>
      current.map((method) =>
        method.channel === activeMethod.channel
          ? {
              channel: trimmedChannel,
              details: trimmedDetails,
              usage: trimmedUsage,
              status: draftStatus,
            }
          : method,
      ),
    );
    closeModal();
  };

  const addMethod = () => {
    const trimmedChannel = draftChannel.trim();
    const trimmedDetails = draftDetails.trim();
    const trimmedUsage = draftUsage.trim();

    if (!trimmedChannel || !trimmedDetails || !trimmedUsage) {
      return;
    }

    setMethods((current) => [
      {
        channel: trimmedChannel,
        details: trimmedDetails,
        usage: trimmedUsage,
        status: draftStatus,
      },
      ...current,
    ]);
    closeModal();
  };

  const deleteMethod = (channel: string) => {
    setMethods((current) => current.filter((method) => method.channel !== channel));
    if (activeMethodName === channel) {
      closeModal();
    }
  };

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">Receiving & Payout Channels</h3>
          <p className="text-sm text-slate-500">
            Keep account and wallet details accurate across every payment route.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="rounded-xl bg-[#0f7b36] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#116f34]"
        >
          Add payment method
        </button>
      </div>

      <div className="space-y-3">
        {methods.map((item) => (
          <div
            key={item.channel}
            className="rounded-[22px] border border-[#edf1ee] p-4 transition hover:border-[#dce8e0] hover:bg-[#fbfdfb]"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-base font-semibold text-slate-900">{item.channel}</p>
                  <AdminStatusBadge
                    label={item.status}
                    tone={toneForStatus(item.status)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] bg-[#f8fbf8] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Details
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{item.details}</p>
                  </div>
                  <div className="rounded-[18px] bg-[#f8fbf8] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Usage
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{item.usage}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="rounded-xl border border-[#dbe5df] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#f8fbf8]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteMethod(item.channel)}
                  className="rounded-xl border border-[#f0d7d7] px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeMethod ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/18 px-4 backdrop-blur-[2px]"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-[520px] rounded-[28px] border border-[#e5ebe7] bg-white p-5 shadow-[0_28px_80px_rgba(15,23,32,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Edit Payment Method
                </p>
                <h4 className="mt-2 text-xl font-semibold text-slate-900">
                  Update {activeMethod.channel}
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  Change the payout or receiving details shown to users and admins.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-[#dbe5df] px-3 py-1 text-sm font-semibold text-slate-500 transition hover:bg-[#f8fbf8]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Payment method
                </span>
                <input
                  value={draftChannel}
                  onChange={(event) => setDraftChannel(event.target.value)}
                  className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                  placeholder="Enter payment method name"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Account or wallet details
                </span>
                <textarea
                  value={draftDetails}
                  onChange={(event) => setDraftDetails(event.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                  placeholder="Enter account number, wallet, or handle"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Usage
                </span>
                <input
                  value={draftUsage}
                  onChange={(event) => setDraftUsage(event.target.value)}
                  className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                  placeholder="What services use this method?"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Status
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setDraftStatus(status)}
                      className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                        draftStatus === status
                          ? status === "Paused"
                            ? "bg-amber-500 text-white"
                            : "bg-[#0f7b36] text-white"
                          : "border border-[#dbe5df] bg-white text-slate-700 hover:bg-[#f8fbf8]"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => deleteMethod(activeMethod.channel)}
                className="rounded-2xl border border-[#f0d7d7] px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                Delete
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-[#dbe5df] px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-[#f8fbf8]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveMethod}
                  className="rounded-2xl bg-[#0f7b36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#116f34]"
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isAddModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/18 px-4 backdrop-blur-[2px]"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-[520px] rounded-[28px] border border-[#e5ebe7] bg-white p-5 shadow-[0_28px_80px_rgba(15,23,32,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Add Payment Method
                </p>
                <h4 className="mt-2 text-xl font-semibold text-slate-900">
                  Create a new channel
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  Add a new bank, wallet, or payout route for the operations team.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-[#dbe5df] px-3 py-1 text-sm font-semibold text-slate-500 transition hover:bg-[#f8fbf8]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Payment method
                </span>
                <input
                  value={draftChannel}
                  onChange={(event) => setDraftChannel(event.target.value)}
                  className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                  placeholder="Enter payment method name"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Account or wallet details
                </span>
                <textarea
                  value={draftDetails}
                  onChange={(event) => setDraftDetails(event.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                  placeholder="Enter account number, wallet, or handle"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Usage
                </span>
                <input
                  value={draftUsage}
                  onChange={(event) => setDraftUsage(event.target.value)}
                  className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                  placeholder="What services use this method?"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Status
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setDraftStatus(status)}
                      className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                        draftStatus === status
                          ? status === "Paused"
                            ? "bg-amber-500 text-white"
                            : "bg-[#0f7b36] text-white"
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
                onClick={closeModal}
                className="rounded-2xl border border-[#dbe5df] px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-[#f8fbf8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addMethod}
                className="rounded-2xl bg-[#0f7b36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#116f34]"
              >
                Add method
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
