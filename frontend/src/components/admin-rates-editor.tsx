"use client";

import { useEffect, useMemo, useState } from "react";
import { ServiceIcon, getRateServiceIconName } from "./service-icon";
import {
  createRate,
  deleteRate,
  fetchRates,
  getCachedApi,
  mapBackendRatesToBoard,
  updateRate,
  type BackendRate,
} from "../lib/admin-backend";
import { useBodyScrollLock } from "../lib/use-body-scroll-lock";

interface RateItem {
  id: string;
  name: string;
  deposit: string;
  withdrawal: string;
}

function getInitialRates(): RateItem[] {
  if (typeof window === "undefined") return [];
  try {
    const cached = getCachedApi<BackendRate[]>("/rates");
    if (cached && cached.length > 0) {
      return mapBackendRatesToBoard(cached);
    }
  } catch {}
  return [];
}

export function AdminRatesEditor() {
  const [rates, setRates] = useState<RateItem[]>(() => getInitialRates());
  const [isLoadingRates, setIsLoadingRates] = useState(() => {
    if (typeof window === "undefined") return true;
    const cached = getCachedApi<BackendRate[]>("/rates");
    return !cached || cached.length === 0;
  });
  const [ratesLoadFailed, setRatesLoadFailed] = useState(false);

  useEffect(() => {
    fetchRates()
      .then((fetched) => {
        if (fetched && fetched.length > 0) {
          setRates(mapBackendRatesToBoard(fetched));
        }
      })
      .catch(() => {
        if (rates.length === 0) {
          setRatesLoadFailed(true);
        }
      })
      .finally(() => {
        setIsLoadingRates(false);
      });
  }, []);

  const [activeRateId, setActiveRateId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const activeRate = useMemo(
    () => rates.find((rate) => rate.id === activeRateId) ?? null,
    [activeRateId, rates],
  );
  const [draftName, setDraftName] = useState("");
  const [draftDeposit, setDraftDeposit] = useState("");
  const [draftWithdrawal, setDraftWithdrawal] = useState("");

  useBodyScrollLock(Boolean(activeRate) || isAddModalOpen);

  const openEditor = (rate: RateItem) => {
    setActiveRateId(rate.id);
    setDraftName(rate.name);
    setDraftDeposit(rate.deposit);
    setDraftWithdrawal(rate.withdrawal);
    setFeedback(null);
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
    setActiveRateId(null);
    setDraftName("");
    setDraftDeposit("");
    setDraftWithdrawal("");
    setFeedback(null);
  };

  const closeEditor = () => {
    setActiveRateId(null);
    setIsAddModalOpen(false);
    setDraftName("");
    setDraftDeposit("");
    setDraftWithdrawal("");
    setFeedback(null);
  };

  const saveRate = async () => {
    if (!activeRate) {
      return;
    }

    const trimmedName = draftName.trim();
    const trimmedDeposit = draftDeposit.trim();
    const trimmedWithdrawal = draftWithdrawal.trim();

    if (!trimmedName || !trimmedDeposit || !trimmedWithdrawal) {
      setFeedback("Fill in all rate fields before saving.");
      return;
    }

    try {
      setIsSaving(true);
      setFeedback(null);
      let updated;
      try {
        updated = await updateRate(activeRate.id, {
          service: trimmedName,
          depositRate: trimmedDeposit,
          withdrawalRate: trimmedWithdrawal,
        });
      } catch (err) {
        if (
          err instanceof Error &&
          (err.message.includes("404") || err.message.toLowerCase().includes("not found"))
        ) {
          updated = await createRate({
            service: trimmedName,
            depositRate: trimmedDeposit,
            withdrawalRate: trimmedWithdrawal,
          });
        } else {
          throw err;
        }
      }

      setRates((current) =>
        current.map((rate) =>
          rate.id === activeRate.id
            ? {
                id: updated.id,
                name: updated.service,
                deposit: updated.depositRate,
                withdrawal: updated.withdrawalRate,
              }
            : rate,
        ),
      );
      closeEditor();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to save rate right now.");
    } finally {
      setIsSaving(false);
    }
  };

  const addRate = async () => {
    const trimmedName = draftName.trim();
    const trimmedDeposit = draftDeposit.trim();
    const trimmedWithdrawal = draftWithdrawal.trim();

    if (!trimmedName || !trimmedDeposit || !trimmedWithdrawal) {
      setFeedback("Fill in all rate fields before adding a new service.");
      return;
    }

    try {
      setIsSaving(true);
      setFeedback(null);
      const created = await createRate({
        service: trimmedName,
        depositRate: trimmedDeposit,
        withdrawalRate: trimmedWithdrawal,
      });

      setRates((current) => [
        ...current,
        {
          id: created.id,
          name: created.service,
          deposit: created.depositRate,
          withdrawal: created.withdrawalRate,
        },
      ]);
      closeEditor();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to add rate right now.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeRate = async () => {
    if (!activeRate) {
      return;
    }

    try {
      setIsSaving(true);
      setFeedback(null);
      await deleteRate(activeRate.id);
      setRates((current) => current.filter((rate) => rate.id !== activeRate.id));
      closeEditor();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to delete rate right now.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Live Rate Board</h3>
          <p className="text-sm text-slate-500">
            Manage public deposit and withdrawal rates per service.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="rounded-xl bg-[#0f7b36] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#116f34]"
        >
          Add new rate
        </button>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#edf1ee]">
        <div className="hidden grid-cols-4 bg-[#f8fbf8] px-5 py-4 text-sm font-semibold text-slate-500 md:grid">
          <p>Service</p>
          <p>Deposit Rate</p>
          <p>Withdrawal Rate</p>
          <p>Action</p>
        </div>

        {isLoadingRates ? (
          <p className="px-5 py-6 text-sm text-slate-500">Loading live rates…</p>
        ) : ratesLoadFailed || rates.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">Live rates are temporarily unavailable.</p>
        ) : null}

        {!isLoadingRates && !ratesLoadFailed && rates.length > 0 ? <div className="md:hidden">
          {rates.map((rate, index) => {
            const iconName = getRateServiceIconName(rate.name);
            return (
              <div
                key={rate.id}
                className={`space-y-4 px-4 py-4 ${index > 0 ? "border-t border-[#edf1ee]" : ""}`}
              >
                <div className="flex items-center gap-3">
                  {iconName ? (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f6faf7]">
                      <ServiceIcon name={iconName} className="h-5 w-5 object-contain" />
                    </span>
                  ) : null}
                  <p className="text-base font-semibold text-slate-800">{rate.name}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] bg-[#f8fbf8] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Deposit
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#0f7b36]">{rate.deposit}</p>
                  </div>
                  <div className="rounded-[18px] bg-[#f8fbf8] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Withdrawal
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">{rate.withdrawal}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openEditor(rate)}
                  className="inline-flex rounded-xl border border-[#dbe5df] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#f8fbf8]"
                >
                  Edit Rate
                </button>
              </div>
            );
          })}
        </div> : null}

        {!isLoadingRates && !ratesLoadFailed && rates.length > 0 ? <div className="hidden md:block">
          {rates.map((rate) => {
            const iconName = getRateServiceIconName(rate.name);
            return (
              <div
                key={rate.id}
                className="grid grid-cols-4 items-center border-t border-[#edf1ee] px-5 py-4 text-sm"
              >
                <div className="flex items-center gap-3">
                  {iconName ? (
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f6faf7]">
                      <ServiceIcon name={iconName} className="h-5 w-5 object-contain" />
                    </span>
                  ) : null}
                  <p className="font-semibold text-slate-800">{rate.name}</p>
                </div>
                <p className="font-semibold text-[#0f7b36]">{rate.deposit}</p>
                <p className="font-semibold text-slate-800">{rate.withdrawal}</p>
                <button
                  type="button"
                  onClick={() => openEditor(rate)}
                  className="w-fit rounded-lg border border-[#dbe5df] px-3 py-1.5 text-center text-xs font-semibold text-slate-600 transition hover:bg-[#f8fbf8]"
                >
                  Edit
                </button>
              </div>
            );
          })}
        </div> : null}
      </div>

      {activeRate ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/18 px-4 backdrop-blur-[2px]"
          onClick={closeEditor}
        >
          <div
            className="w-full max-w-[440px] rounded-[28px] border border-[#e5ebe7] bg-white p-5 shadow-[0_28px_80px_rgba(15,23,32,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Edit Rate
                </p>
                <h4 className="mt-2 text-xl font-semibold text-slate-900">{activeRate.name}</h4>
                <p className="mt-1 text-sm text-slate-500">
                  Update the latest deposit and withdrawal values for this service.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-full border border-[#dbe5df] px-3 py-1 text-sm font-semibold text-slate-500 transition hover:bg-[#f8fbf8]"
              >
                Close
              </button>
            </div>
            {feedback ? (
              <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {feedback}
              </p>
            ) : null}

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Service name</span>
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                  placeholder="Enter service name"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Deposit rate</span>
                <input
                  value={draftDeposit}
                  onChange={(event) => setDraftDeposit(event.target.value)}
                  className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                  placeholder="Enter deposit rate"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Withdrawal rate</span>
                <input
                  value={draftWithdrawal}
                  onChange={(event) => setDraftWithdrawal(event.target.value)}
                  className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                  placeholder="Enter withdrawal rate"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={removeRate}
                className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Delete
              </button>
              <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeEditor}
                disabled={isSaving}
                className="rounded-2xl border border-[#dbe5df] px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-[#f8fbf8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveRate}
                disabled={isSaving}
                className="rounded-2xl bg-[#0f7b36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#116f34] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Rate"}
              </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isAddModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/18 px-4 backdrop-blur-[2px]"
          onClick={closeEditor}
        >
          <div
            className="w-full max-w-[440px] rounded-[28px] border border-[#e5ebe7] bg-white p-5 shadow-[0_28px_80px_rgba(15,23,32,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Add Rate
                </p>
                <h4 className="mt-2 text-xl font-semibold text-slate-900">Create new service rate</h4>
                <p className="mt-1 text-sm text-slate-500">
                  Add a new service row with deposit and withdrawal values.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-full border border-[#dbe5df] px-3 py-1 text-sm font-semibold text-slate-500 transition hover:bg-[#f8fbf8]"
              >
                Close
              </button>
            </div>
            {feedback ? (
              <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {feedback}
              </p>
            ) : null}

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Service name</span>
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                  placeholder="Enter service name"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Deposit rate</span>
                <input
                  value={draftDeposit}
                  onChange={(event) => setDraftDeposit(event.target.value)}
                  className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                  placeholder="Enter deposit rate"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Withdrawal rate</span>
                <input
                  value={draftWithdrawal}
                  onChange={(event) => setDraftWithdrawal(event.target.value)}
                  className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                  placeholder="Enter withdrawal rate"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeEditor}
                disabled={isSaving}
                className="rounded-2xl border border-[#dbe5df] px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-[#f8fbf8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addRate}
                disabled={isSaving}
                className="rounded-2xl bg-[#0f7b36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#116f34] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Adding..." : "Add Rate"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
