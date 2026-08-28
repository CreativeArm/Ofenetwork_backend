"use client";

import { useEffect, useState, type ChangeEvent, type DragEvent } from "react";
import {
  fetchRates,
  formatCurrency,
  createDepositTransaction,
  createWithdrawalTransaction,
  type BackendRate,
} from "../lib/admin-backend";
import { homeRates, serviceConfigs, type ServiceConfig, type UserServiceSlug } from "../lib/mock-data";
import { buildDepositDetails } from "../lib/transaction-details";
import { Icon } from "./icons";
import { KycVerificationGate } from "./kyc-verification-gate";
import { ServiceIcon } from "./service-icon";
import {
  TransactionSubmittedPopup,
  type TransactionSubmittedPopupContent,
} from "./transaction-submitted-popup";

interface ServiceWorkspaceProps {
  activeSlug: UserServiceSlug;
  title?: string;
  subtitle?: string;
}

function getService(slug: UserServiceSlug): ServiceConfig {
  if (slug === "dashboard") {
    return serviceConfigs[0];
  }

  return serviceConfigs.find((item) => item.slug === slug) ?? serviceConfigs[0];
}

type StoredUser = {
  id?: string;
};

type UploadState = {
  name: string;
  dataUrl: string;
};

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });
}

function parseAmount(values: Record<string, string>) {
  const amountEntry =
    Object.entries(values).find(([label]) => label.toLowerCase().includes("amount")) ??
    Object.entries(values)[0];
  const amount = Number.parseFloat((amountEntry?.[1] ?? "").replace(/,/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function detectCurrency(values: Record<string, string>): "NGN" | "USD" {
  const amountLabel =
    Object.keys(values).find((label) => label.toLowerCase().includes("amount")) ?? "";
  return amountLabel.toLowerCase().includes("ngn") ? "NGN" : "USD";
}

function getReferenceEntry(values: Record<string, string>) {
  return Object.entries(values).find(([label]) => !label.toLowerCase().includes("amount"));
}

function parseNgnRate(rateText?: string) {
  const match = rateText?.match(/(?:NGN|N)\s*([0-9,]+(?:\.[0-9]+)?)/i);
  if (!match) {
    return null;
  }

  const value = Number.parseFloat(match[1].replace(/,/g, ""));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function matchesServiceRate(serviceName: string, rateService: string) {
  const service = serviceName.toLowerCase();
  const rate = rateService.toLowerCase();
  return service === rate || rate.includes(service) || service.includes(rate);
}

function getBankDetailRows(value: string) {
  if (!value.includes("Kuda Microfinance Bank")) {
    return null;
  }

  return [
    ["Bank", "Kuda Microfinance Bank"],
    ["Account name", "Ofenetworks Solutions NG LTD"],
    ["Account number", "3003193472"],
  ] as const;
}

export function ServiceWorkspace({ activeSlug, title, subtitle }: ServiceWorkspaceProps) {
  const service = getService(activeSlug);
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");
  const [userId, setUserId] = useState<string | null>(null);
  const [rates, setRates] = useState<BackendRate[]>([]);
  const [depositValues, setDepositValues] = useState<Record<string, string>>({});
  const [withdrawalValues, setWithdrawalValues] = useState<Record<string, string>>({});
  const [depositProof, setDepositProof] = useState<UploadState | null>(null);
  const [withdrawalProof, setWithdrawalProof] = useState<UploadState | null>(null);
  const [requestBonusWithdrawal, setRequestBonusWithdrawal] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submittedPopup, setSubmittedPopup] =
    useState<TransactionSubmittedPopupContent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedBankDetail, setCopiedBankDetail] = useState<string | null>(null);
  const bankDetailRows = getBankDetailRows(service.depositMethodValue);

  const copyBankDetail = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedBankDetail(label);
    window.setTimeout(() => setCopiedBankDetail(null), 1800);
  };

  useEffect(() => {
    try {
      const rawUser = window.localStorage.getItem("ofe_user");
      const parsed = rawUser ? (JSON.parse(rawUser) as StoredUser) : null;
      setUserId(parsed?.id ?? null);
    } catch {
      window.localStorage.removeItem("ofe_user");
      setUserId(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    fetchRates()
      .then((items) => {
        if (mounted) {
          setRates(items);
        }
      })
      .catch(() => {
        if (mounted) {
          setRates([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setDepositValues({});
    setWithdrawalValues({});
    setDepositProof(null);
    setWithdrawalProof(null);
    setRequestBonusWithdrawal(false);
    setFeedback(null);
    setSubmittedPopup(null);
  }, [service.slug]);

  const depositFields =
    service.depositFields.length > 0
      ? service.depositFields
      : [{ label: "Amount (USD)", placeholder: "Enter amount in USD", suffix: "$" }];
  const withdrawalFields = [
    { label: "Amount (USD)", placeholder: "Enter amount to withdraw" },
    ...service.withdrawalFields,
  ];
  const liveDepositRate = rates.find((rate) => matchesServiceRate(service.name, rate.service));
  const fallbackDepositRate = homeRates.find((rate) => matchesServiceRate(service.name, rate.name));
  const depositRateText = liveDepositRate?.depositRate ?? fallbackDepositRate?.deposit;
  const depositRateValue = parseNgnRate(depositRateText);
  const depositAmount = parseAmount(depositValues);
  const depositNairaEquivalent =
    depositAmount && depositRateValue ? depositAmount * depositRateValue : null;
  const liveWithdrawalRate = rates.find((rate) => matchesServiceRate(service.name, rate.service));
  const fallbackWithdrawalRate = homeRates.find((rate) => matchesServiceRate(service.name, rate.name));
  const withdrawalRateText = liveWithdrawalRate?.withdrawalRate ?? fallbackWithdrawalRate?.withdrawal;
  const withdrawalRateValue = parseNgnRate(withdrawalRateText);
  const withdrawalAmount = parseAmount(withdrawalValues);
  const withdrawalNairaEquivalent =
    withdrawalAmount && withdrawalRateValue ? withdrawalAmount * withdrawalRateValue : null;

  const handleUpload = async (
    file: File | undefined,
    onUpload: (upload: UploadState | null) => void,
  ) => {
    if (!file) {
      onUpload(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFeedback("Please upload an image file, such as JPG, PNG, or WebP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback("Please choose an image below 5MB.");
      return;
    }

    const dataUrl = await readImageAsDataUrl(file);
    onUpload({ name: file.name, dataUrl });
    setFeedback(`${file.name} is ready to submit.`);
  };

  const submitDeposit = async () => {
    if (!userId) {
      setFeedback("Please log in before submitting a deposit.");
      return;
    }

    if (!depositProof) {
      setFeedback("Please upload your payment screenshot before submitting.");
      return;
    }

    const values =
      service.depositFields.length > 0 ? depositValues : { "Amount (USD)": depositValues["Amount (USD)"] ?? "" };
    const amount = parseAmount(values);
    if (!amount) {
      setFeedback("Please enter a valid deposit amount.");
      return;
    }

    if (!depositRateValue || !depositNairaEquivalent) {
      setFeedback("Unable to calculate the NGN amount right now. Please check the service rate and try again.");
      return;
    }

    const referenceEntry = getReferenceEntry(values);
    const reference = referenceEntry?.[1]?.trim();
    if (referenceEntry && !reference) {
      setFeedback(`Please enter your ${referenceEntry[0]} before submitting.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);
      await createDepositTransaction({
        userId,
        service: service.name,
        amount,
        currency: detectCurrency(values),
        nairaEquivalent: depositNairaEquivalent,
        reference,
        destinationDetails: referenceEntry
          ? buildDepositDetails(service.name, referenceEntry[0], reference)
          : undefined,
        proofOfPaymentUrl: depositProof.dataUrl,
      });
      setDepositValues({});
      setDepositProof(null);
      const message = "Deposit submitted with your screenshot. Admin will review it shortly.";
      setFeedback(message);
      setSubmittedPopup({
        title: "Deposit submitted successfully",
        message: `Your ${service.name} deposit has been submitted.`,
        detail: "Admin has received your payment screenshot and transaction details. You can track the review from your transaction history.",
      });
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to submit this deposit right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitWithdrawal = async () => {
    if (!userId) {
      setFeedback("Please log in before submitting a withdrawal.");
      return;
    }

    if (!withdrawalProof) {
      setFeedback("Please upload your payment screenshot before submitting.");
      return;
    }

    const amount = parseAmount(withdrawalValues);
    if (!amount) {
      setFeedback("Please enter a valid withdrawal amount.");
      return;
    }

    if (!withdrawalRateValue || !withdrawalNairaEquivalent) {
      setFeedback("Unable to calculate the NGN amount right now. Please check the service rate and try again.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);
      await createWithdrawalTransaction({
        userId,
        service: service.name,
        amount,
        currency: detectCurrency(withdrawalValues),
        nairaEquivalent: withdrawalNairaEquivalent,
        destinationDetails: {
          ...withdrawalValues,
          bonusWithdrawalRequested: requestBonusWithdrawal ? "Yes" : "No",
        },
        proofOfPaymentUrl: withdrawalProof.dataUrl,
      });
      setWithdrawalValues({});
      setWithdrawalProof(null);
      setRequestBonusWithdrawal(false);
      const message = "Withdrawal submitted with your screenshot. Admin will review it shortly.";
      setFeedback(message);
      setSubmittedPopup({
        title: "Withdrawal submitted successfully",
        message: `Your ${service.name} withdrawal has been submitted.`,
        detail: "Admin has received your screenshot and payout details. You can track the review from your transaction history.",
      });
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to submit this withdrawal right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-5">
      <KycVerificationGate title={`Verify your account to use ${service.name}`}>
      <div className="rounded-[28px] border border-[#e6ece8] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,32,0.04)]">
        <p className="text-xs text-slate-400">
          Dashboard <span className="px-2 text-slate-300">/</span> {title ?? service.name}
        </p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${service.accent}`}>
              <ServiceIcon name={service.slug} className="h-8 w-8 object-contain" />
            </span>
            <div>
              <h2 className="text-3xl font-semibold">{title ?? service.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{subtitle ?? service.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#e6ece8] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,32,0.04)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">Choose Action</p>
            <p className="mt-1 text-sm text-slate-500">Switch between deposit and withdrawal to focus on one process at a time.</p>
          </div>
          <div className="inline-flex rounded-full border border-[#dbe5df] bg-[#f5faf6] p-1">
            <button
              type="button"
              onClick={() => setMode("deposit")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                mode === "deposit" ? "bg-[#0f7b36] text-white shadow-sm" : "text-slate-600"
              }`}
            >
              Deposit
            </button>
            <button
              type="button"
              onClick={() => setMode("withdraw")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                mode === "withdraw" ? "bg-[#0f7b36] text-white shadow-sm" : "text-slate-600"
              }`}
            >
              Withdraw
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div
            className={`transition-all duration-300 ease-out ${
              mode === "deposit"
                ? "visible translate-y-0 opacity-100"
                : "invisible absolute inset-0 translate-y-3 opacity-0"
            }`}
            aria-hidden={mode !== "deposit"}
          >
            <div className="mb-5">
              <h3 className="text-2xl font-semibold">{service.depositTitle}</h3>
              <p className="text-sm text-slate-500">{service.depositSubtitle}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-[#f5faf6] p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-white p-2 text-[#0f7b36]">
                  <ServiceIcon name={service.slug} className="h-5 w-5 object-contain" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{service.depositMethodLabel}</p>
                  {bankDetailRows ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {bankDetailRows.map(([label, value]) => (
                        <div
                          key={label}
                          className={`rounded-xl border px-3 py-2.5 ${
                            label === "Account number"
                              ? "border-emerald-200 bg-white sm:col-span-2"
                              : "border-white/80 bg-white/70"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">{label}</p>
                            {label === "Account number" ? (
                              <button
                                type="button"
                                onClick={() => void copyBankDetail(label, value)}
                                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                              >
                                {copiedBankDetail === label ? "Copied" : "Copy"}
                              </button>
                            ) : null}
                          </div>
                          <p className={`mt-1 break-words font-semibold ${label === "Account number" ? "text-xl tracking-wide text-emerald-800" : "text-sm text-slate-800"}`}>
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-slate-600">{service.depositMethodValue}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {depositFields.map((field) => (
                <label key={field.label} className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">{field.label}</span>
                  <div className="flex items-center overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white">
                    <input
                      value={depositValues[field.label] ?? ""}
                      onChange={(event) =>
                        setDepositValues((current) => ({
                          ...current,
                          [field.label]: event.target.value,
                        }))
                      }
                      className="w-full border-0 px-4 py-3 text-sm outline-none"
                      placeholder={field.placeholder}
                      aria-label={field.label}
                    />
                    {field.suffix ? <span className="pr-4 text-sm font-semibold text-emerald-600">{field.suffix}</span> : null}
                  </div>
                </label>
              ))}

              <div className="rounded-[22px] border border-emerald-100 bg-gradient-to-br from-[#f2fff8] to-white p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      Amount To Transfer
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-[#075f2a]">
                      {formatCurrency(depositNairaEquivalent ?? 0)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      This is the NGN amount you should send to us.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-emerald-100">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Deposit Rate
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {depositRateText ?? "Rate unavailable"}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Enter the USD amount you want credited. The transfer amount updates automatically using the current deposit rate.
                </p>
              </div>

              <UploadBox
                title={service.slug === "crypto" ? "Upload Payment Proof" : "Upload Payment Screenshot"}
                upload={depositProof}
                onFileSelect={(file) => handleUpload(file, setDepositProof)}
              />
              {feedback ? (
                <p className="rounded-2xl bg-[#f6faf7] px-4 py-3 text-sm text-slate-700">
                  {feedback}
                </p>
              ) : null}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={submitDeposit}
                className="w-full rounded-2xl bg-[#0f7b36] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && mode === "deposit" ? "Submitting..." : "Submit Deposit"}
              </button>
            </div>
          </div>

          <div
            className={`transition-all duration-300 ease-out ${
              mode === "withdraw"
                ? "visible translate-y-0 opacity-100"
                : "invisible absolute inset-0 translate-y-3 opacity-0"
            }`}
            aria-hidden={mode !== "withdraw"}
          >
            <div className="mb-5">
              <h3 className="text-2xl font-semibold">{service.withdrawalTitle}</h3>
              <p className="text-sm text-slate-500">{service.withdrawalSubtitle}</p>
            </div>
            <div className="rounded-2xl bg-[#f5faf6] p-4">
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-white p-2 text-[#0f7b36]">
                  <ServiceIcon name={service.slug} className="h-5 w-5 object-contain" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{service.withdrawalMethodLabel}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{service.withdrawalMethodValue}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <UploadBox
                title={service.slug === "crypto" ? "Upload Payment Proof" : "Upload Payment Screenshot"}
                upload={withdrawalProof}
                onFileSelect={(file) => handleUpload(file, setWithdrawalProof)}
              />

              {withdrawalFields.map((field) => (
                <label key={field.label} className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">{field.label}</span>
                  <input
                    value={withdrawalValues[field.label] ?? ""}
                    onChange={(event) =>
                      setWithdrawalValues((current) => ({
                        ...current,
                        [field.label]: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none"
                    placeholder={field.placeholder}
                    aria-label={field.label}
                  />
                </label>
              ))}

              <div className="rounded-[22px] border border-sky-100 bg-gradient-to-br from-[#f2fbff] to-white p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                      Amount To Receive
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-[#075f2a]">
                      {formatCurrency(withdrawalNairaEquivalent ?? 0)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      This is the NGN amount we will send to you.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-sky-100">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Withdrawal Rate
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {withdrawalRateText ?? "Rate unavailable"}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Enter the USD amount you want to withdraw. Your receive amount updates automatically using the current withdrawal rate.
                </p>
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-[#e5ebe7] bg-[#fbfdfb] px-4 py-3">
                <input
                  type="checkbox"
                  checked={requestBonusWithdrawal}
                  onChange={(event) => setRequestBonusWithdrawal(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[#dbe5df] accent-[#0f7b36]"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Request bonus withdrawal on this transaction
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Admin will review your available referral or threshold bonus with this withdrawal request.
                  </span>
                </span>
              </label>

              {feedback ? (
                <p className="rounded-2xl bg-[#f6faf7] px-4 py-3 text-sm text-slate-700">
                  {feedback}
                </p>
              ) : null}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={submitWithdrawal}
                className="w-full rounded-2xl bg-[#0f7b36] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && mode === "withdraw" ? "Submitting..." : "Submit Withdrawal"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-[#e6ece8] bg-[#f8fbff] px-5 py-4 text-sm text-slate-600">
        <span className="font-semibold text-slate-800">Important Note:</span> Ensure all details are correct before submitting.
        Incorrect information may lead to delays.
      </div>
      </KycVerificationGate>
      <TransactionSubmittedPopup
        content={submittedPopup}
        onClose={() => setSubmittedPopup(null)}
      />
    </section>
  );
}

function UploadBox({
  title,
  upload,
  onFileSelect,
}: {
  title: string;
  upload: UploadState | null;
  onFileSelect: (file: File | undefined) => void;
}) {
  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    onFileSelect(event.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{title}</p>
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-[#d7e2db] bg-[#fcfdfc] px-4 py-6 text-center transition hover:border-[#9bc8aa] hover:bg-[#f8fbf8]"
      >
        <Icon name="upload" className="h-8 w-8 text-slate-400" />
        <p className="mt-3 text-sm font-medium text-slate-700">
          {upload ? upload.name : "Click to upload or drag and drop"}
        </p>
        <p className="mt-1 text-xs text-slate-400">JPG, PNG or WebP (Max. 5MB)</p>
        {upload ? (
          <img
            src={upload.dataUrl}
            alt={`${upload.name} preview`}
            className="mt-4 max-h-32 rounded-2xl border border-[#e5ebe7] object-contain"
          />
        ) : null}
        <input
          type="file"
          accept="image/*"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onFileSelect(event.target.files?.[0])
          }
          className="hidden"
        />
      </label>
    </div>
  );
}
