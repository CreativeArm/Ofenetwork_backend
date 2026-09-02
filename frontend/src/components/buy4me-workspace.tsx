"use client";

import { useEffect, useMemo, useState } from "react";
import { Reveal, Stagger, StaggerItem } from "./homepage-motion";
import { Icon } from "./icons";
import {
  cancelBuy4MeOrder,
  createBuy4MeOrder,
  fetchUserBuy4MeOrders,
  submitBuy4MePayment,
  type BackendBuy4MeOrder,
} from "../lib/admin-backend";
import { buy4MeCategories, buy4MeSteps, supportReasons } from "../lib/mock-data";
import { uploadToCloudinary } from "../lib/upload-service";
import { useBodyScrollLock } from "../lib/use-body-scroll-lock";
import { KycVerificationGate } from "./kyc-verification-gate";
import {
  TransactionSubmittedPopup,
  type TransactionSubmittedPopupContent,
} from "./transaction-submitted-popup";

type PaymentMethod = {
  label: string;
  short: string;
  accent: string;
  detailsTitle: string;
  details: ReadonlyArray<readonly [string, string]>;
  note: string;
};

type StoredUser = {
  id?: string;
};

type PaymentProof = {
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

const paymentMethods: PaymentMethod[] = [
  {
    label: "Bank Transfer",
    short: "Bank",
    accent: "bg-emerald-50 text-emerald-700",
    detailsTitle: "Bank Account Details",
    details: [
      ["Bank Name", "Kuda Microfinance Bank"],
      ["Account Name", "Ofenetworks Solutions NG LTD"],
      ["Account Number", "3003193472"],
      ["Narration", "payment for chicken feeds"],
    ],
    note: "Use your order ID as the payment reference where possible.",
  },
  {
    label: "USDT (TRC20)",
    short: "USDT",
    accent: "bg-cyan-50 text-cyan-700",
    detailsTitle: "USDT Wallet Details",
    details: [
      ["Network", "TRC20 (Tron)"],
      ["Wallet Address", "TJLZtrdyxUuE96zwj687S63Z2zVes8in73"],
    ],
    note: "Send only USDT on the TRC20 network to avoid failed delivery.",
  },
  {
    label: "PayPal",
    short: "PP",
    accent: "bg-sky-50 text-sky-700",
    detailsTitle: "PayPal Payment Details",
    details: [
      ["PayPal Email", "payments@ofenetworks.ng"],
      ["Account Name", "Ofenetworks Solutions"],
    ],
    note: "Choose Friends and Family only if instructed by support.",
  },
  {
    label: "Zelle",
    short: "ZL",
    accent: "bg-violet-50 text-violet-700",
    detailsTitle: "Zelle Payment Details",
    details: [
      ["Account Number / Phone", "+12673998390"],
      ["Name on Account", "Olaoluwa Oladele"],
    ],
    note: "Confirm the recipient details carefully before sending your payment.",
  },
  {
    label: "Skrill",
    short: "SK",
    accent: "bg-fuchsia-50 text-fuchsia-700",
    detailsTitle: "Skrill Payment Details",
    details: [
      ["Skrill Email", "payments@ofenetworks.ng"],
      ["Receiver Name", "Ofenetworks Solutions"],
    ],
    note: "Confirm the receiver details carefully before sending funds.",
  },
];

function formatStatus(status: BackendBuy4MeOrder["status"]) {
  if (status === "COMPLETED") {
    return "Delivered";
  }
  if (status === "CANCELLED") {
    return "Cancelled";
  }
  if (status === "PAYMENT_SUBMITTED" || status === "PURCHASING") {
    return "Processing";
  }

  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCurrency(amount?: number) {
  if (amount == null) {
    return null;
  }

  const formatted = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 2,
  }).format(amount);

  return formatted.replace(/^([^\d\s]+)(\d)/, "$1 $2");
}

function statusTone(status: BackendBuy4MeOrder["status"]) {
  if (status === "COMPLETED") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (status === "ISSUE" || status === "CANCELLED") {
    return "bg-rose-50 text-rose-700";
  }
  if (status === "SHIPPED") {
    return "bg-sky-50 text-sky-700";
  }
  return "bg-amber-50 text-amber-700";
}

function stageLabel(status?: BackendBuy4MeOrder["status"]) {
  if (!status) {
    return null;
  }
  if (status === "AWAITING_PAYMENT") {
    return "Awaiting Payment";
  }
  if (status === "SHIPPED") {
    return "Shipped";
  }
  if (status === "COMPLETED") {
    return "Delivered";
  }
  if (status === "CANCELLED") {
    return "Cancelled";
  }

  return "Processing";
}

const cancelledOrderNote =
  "This order has been cancelled. No payment is required, and you can submit a new product link whenever you are ready.";

export function Buy4MeWorkspace() {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[0]);
  const [userId, setUserId] = useState<string | null>(null);
  const [orders, setOrders] = useState<BackendBuy4MeOrder[]>([]);
  const [productLink, setProductLink] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submittedPopup, setSubmittedPopup] =
    useState<TransactionSubmittedPopupContent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const rawUser = window.localStorage.getItem("ofe_user");
      if (!rawUser) {
        return;
      }
      const parsed = JSON.parse(rawUser) as StoredUser;
      if (parsed.id) {
        setUserId(parsed.id);
      }
    } catch {
      window.localStorage.removeItem("ofe_user");
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isMounted = true;

    const loadOrders = (showError = true) => {
      fetchUserBuy4MeOrders(userId)
        .then((items) => {
          if (isMounted) {
            setOrders(items);
          }
        })
        .catch(() => {
          if (isMounted && showError) {
            setFeedback("Unable to load your Buy4Me orders right now.");
          }
        });
    };

    const handleFocus = () => loadOrders(false);

    loadOrders();
    const interval = window.setInterval(() => loadOrders(false), 10000);
    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [userId]);

  const activeOrder = useMemo(() => {
    if (activeOrderId) {
      return orders.find((order) => order.id === activeOrderId) ?? null;
    }

    return null;
  }, [activeOrderId, orders]);

  const showQuote =
    activeOrder &&
    activeOrder.status !== "CANCELLED" &&
    (activeOrder.totalCost != null ||
      activeOrder.status !== "PROCESSING");

  const showPayment =
    activeOrder &&
    activeOrder.status !== "CANCELLED" &&
    activeOrder.totalCost != null &&
    activeOrder.status === "AWAITING_PAYMENT";
  const showCancelledOrder = activeOrder?.status === "CANCELLED";

  useBodyScrollLock(Boolean(activeOrder));

  const submitRequest = async () => {
    if (!userId) {
      setFeedback("You need to be logged in to create a Buy4Me request.");
      return;
    }

    if (!productLink.trim()) {
      setFeedback("Please paste at least one product link.");
      return;
    }

    try {
      setIsSubmittingRequest(true);
      setFeedback(null);
      const created = await createBuy4MeOrder({
        userId,
        productLink: productLink.trim(),
        productDetails:
          productDetails.trim() || "Customer submitted a product link for review.",
      });

      setOrders((current) => [created, ...current]);
      setProductLink("");
      setProductDetails("");
      const message = "Your request has been submitted. Our team is now reviewing it.";
      setFeedback(message);
      setSubmittedPopup({
        title: "Buy4Me request submitted",
        message: "Your product link has been submitted successfully.",
        detail: "Our team has been notified and will review your link. Your order status will remain Processing until a quote is ready.",
      });
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to submit your Buy4Me request.",
      );
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const submitPayment = async () => {
    if (!activeOrder) {
      return;
    }

    if (!selectedProof) {
      setFeedback("Please upload your payment screenshot before submitting.");
      return;
    }

    try {
      setIsSubmittingPayment(true);
      setFeedback(null);
      let proofUrl = selectedProof.dataUrl;
      try {
        proofUrl = await uploadToCloudinary(selectedProof.dataUrl, "proofs");
      } catch (uploadErr) {
        console.warn("Cloudinary upload fallback:", uploadErr);
      }
      const updated = await submitBuy4MePayment(activeOrder.id, {
        paymentMethod: selectedPaymentMethod.label,
        proofOfPaymentUrl: proofUrl,
      });

      setOrders((current) =>
        current.map((order) => (order.id === updated.id ? updated : order)),
      );
      setSelectedProof(null);
      const message = "Payment details submitted. Our team will confirm your order shortly.";
      setFeedback(message);
      setSubmittedPopup({
        title: "Payment proof submitted",
        message: "Your Buy4Me payment proof has been submitted successfully.",
        detail: "Our team can now review your screenshot and move your order to the next stage once payment is confirmed.",
      });
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to submit your payment proof.",
      );
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const cancelOrder = async () => {
    if (!activeOrder) {
      return;
    }

    try {
      setIsCancellingOrder(true);
      setFeedback(null);
      const updated = await cancelBuy4MeOrder(
        activeOrder.id,
        "Customer declined the quote.",
      );
      setOrders((current) =>
        current.map((order) => (order.id === updated.id ? updated : order)),
      );
      setSelectedProof(null);
      setFeedback("This Buy4Me request has been cancelled.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to cancel this order right now.",
      );
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const handleProofSelect = async (file: File | undefined) => {
    if (!file) {
      setSelectedProof(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFeedback("Please upload an image file, such as JPG, PNG, or WebP.");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setFeedback("Please choose an image below 4MB.");
      return;
    }

    const dataUrl = await readImageAsDataUrl(file);
    setSelectedProof({ name: file.name, dataUrl });
    setFeedback(`${file.name} is ready to submit.`);
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[1.1fr_0.55fr]">
      <KycVerificationGate
        className="xl:col-span-2"
        title="Verify your account to use Buy4Me"
      >
      <Stagger className="space-y-5">
        <StaggerItem>
          <div className="rounded-[28px] border border-[#e6ece8] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,32,0.04)] transition-all duration-300 hover:shadow-[0_18px_40px_rgba(15,23,32,0.06)]">
            <div className="grid gap-3 md:grid-cols-4">
              {["Secure & Reliable", "Fast Processing", "Best Rates", "Doorstep Delivery"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-[#f6faf7] p-3 text-sm font-semibold text-slate-700 transition-colors duration-300 hover:bg-[#eef8f1]">
                  <span className="rounded-xl bg-white p-2 text-[#0f7b36]">
                    <Icon name="check" className="h-4 w-4" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="rounded-[28px] border border-[#e6ece8] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,32,0.04)] transition-all duration-300 hover:shadow-[0_18px_40px_rgba(15,23,32,0.06)]">
            <div>
              <h2 className="text-2xl font-semibold">Submit Your Product Link(s)</h2>
              <p className="mt-1 text-sm text-slate-500">Paste the link(s) of the product(s) you want us to buy for you.</p>
            </div>
            <div className="mt-5 rounded-[22px] border border-[#e5ebe7] p-4">
              <textarea
                value={productLink}
                onChange={(event) => setProductLink(event.target.value)}
                className="min-h-[130px] w-full resize-none border-0 text-sm outline-none"
                placeholder="Paste product link(s) here..."
              />
            </div>
            <div className="mt-4 rounded-[22px] border border-[#e5ebe7] p-4">
              <textarea
                value={productDetails}
                onChange={(event) => setProductDetails(event.target.value)}
                className="min-h-[110px] w-full resize-none border-0 text-sm outline-none"
                placeholder="Optional: add product size, color, quantity, or any extra note for us."
              />
            </div>
            {feedback ? (
              <p className="mt-4 rounded-2xl bg-[#f6faf7] px-4 py-3 text-sm text-slate-700">
                {feedback}
              </p>
            ) : null}
            <ul className="mt-4 space-y-2 text-sm text-slate-500">
              <li>We can purchase multiple links in one request.</li>
              <li>Once you submit, our team is notified automatically.</li>
            </ul>
            <button
              type="button"
              disabled={isSubmittingRequest}
              onClick={submitRequest}
              className="mt-5 w-full rounded-2xl bg-[#0f7b36] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingRequest ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </StaggerItem>

        {showQuote ? (
          <StaggerItem className="hidden">
            <div className="rounded-[28px] border border-[#e6ece8] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,32,0.04)] transition-all duration-300 hover:shadow-[0_18px_40px_rgba(15,23,32,0.06)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Order & Pricing</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(activeOrder.status)}`}>
                  {formatStatus(activeOrder.status)}
                </span>
              </div>
              <div className="rounded-[22px] bg-[#fff8e8] p-4 text-sm text-slate-600">
                {activeOrder.timelineUpdate ?? "Your request is being reviewed."}
              </div>
              {activeOrder.totalCost != null ? (
                <div className="mt-5 space-y-4 rounded-[22px] border border-[#edf1ee] p-5">
                  {[
                    ["Product Cost", formatCurrency(activeOrder.productCost) ?? formatCurrency(0)],
                    ["Shipping Cost", formatCurrency(activeOrder.shippingCost) ?? formatCurrency(0)],
                    ["Service Charge", formatCurrency(activeOrder.serviceCharge) ?? formatCurrency(0)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{label}</span>
                      <span className="font-semibold text-slate-900">{value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-[#edf1ee] pt-4">
                    <span className="text-lg font-semibold text-slate-900">Total Amount</span>
                    <span className="text-3xl font-semibold text-[#0f7b36]">
                      {formatCurrency(activeOrder.totalCost)}
                    </span>
                  </div>
                  {activeOrder.status === "AWAITING_PAYMENT" ? (
                    <div className="border-t border-[#edf1ee] pt-3">
                      <button
                        type="button"
                        disabled={isCancellingOrder}
                        onClick={cancelOrder}
                        className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      >
                        {isCancellingOrder ? "Cancelling..." : "Cancel Transaction"}
                      </button>
                      <p className="mt-2 hidden text-xs font-semibold text-[#0f7b36] sm:block">
                        Payment details and proof upload are available here.
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-5 rounded-[22px] border border-[#edf1ee] bg-[#fbfcfb] p-5 text-sm text-slate-500">
                  Our team has been notified. Pricing will appear here once your request has been reviewed.
                </div>
              )}
            </div>
          </StaggerItem>
        ) : null}

        {showCancelledOrder ? (
          <StaggerItem className="hidden">
            <div className="rounded-[28px] border border-rose-100 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,32,0.04)] transition-all duration-300 hover:shadow-[0_18px_40px_rgba(15,23,32,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-sm font-semibold text-rose-700">
                    !
                  </span>
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950">Order Cancelled</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      This Buy4Me request is closed and no payment is required.
                    </p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(activeOrder.status)}`}>
                  {formatStatus(activeOrder.status)}
                </span>
              </div>

              <div className="mt-5 rounded-[22px] bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700">
                {activeOrder.timelineUpdate ??
                  "This order was cancelled. You can submit a new product link whenever you are ready."}
              </div>

              <div className="mt-5 grid gap-3 rounded-[22px] border border-[#edf1ee] bg-[#fbfcfb] p-5 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Order ID</p>
                  <p className="mt-2 break-all font-semibold text-slate-900">{activeOrder.id}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Submitted</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {new Date(activeOrder.createdAt).toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </StaggerItem>
        ) : null}

        {showPayment ? (
          <StaggerItem className="hidden">
            <div className="rounded-[28px] border border-[#e6ece8] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,32,0.04)] transition-all duration-300 hover:shadow-[0_18px_40px_rgba(15,23,32,0.06)]">
              <div>
                <h2 className="text-2xl font-semibold">Make Payment</h2>
                <p className="mt-1 text-sm text-slate-500">Submit payment details once you have paid the quoted total.</p>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[22px] bg-[#f6faf7] p-5">
                  <p className="text-sm text-slate-500">Total Amount to Pay</p>
                  <p className="mt-2 text-4xl font-semibold text-[#0f7b36]">
                    {formatCurrency(activeOrder.totalCost) ?? formatCurrency(0)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {paymentMethods.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(item)}
                      className={`rounded-[22px] border p-4 text-left transition-all duration-300 hover:border-[#c8ddd0] hover:bg-[#fbfdfb] ${
                        selectedPaymentMethod.label === item.label
                          ? "border-[#9bc8aa] bg-[#f8fbf8] shadow-[0_12px_24px_rgba(15,123,54,0.08)]"
                          : "border-[#e5ebe7] bg-white"
                      }`}
                    >
                      <span className={`inline-flex rounded-xl px-2.5 py-1 text-xs font-semibold ${item.accent}`}>
                        {item.short}
                      </span>
                      <p className="mt-3 text-sm font-semibold leading-6 text-slate-800">{item.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              <Reveal className="mt-5 rounded-[22px] border border-[#dfeae3] bg-[#f8fbf8] p-5" delay={0.04}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{selectedPaymentMethod.detailsTitle}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Selected method: {selectedPaymentMethod.label}
                    </p>
                  </div>
                  <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${selectedPaymentMethod.accent}`}>
                    {selectedPaymentMethod.short}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {selectedPaymentMethod.details.map(([label, value]) => (
                    <div key={label} className="rounded-[18px] border border-[#e5ebe7] bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
                      <p className="mt-2 break-words text-sm font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-slate-500">{selectedPaymentMethod.note}</p>
              </Reveal>
              <div className="mt-5 rounded-[22px] border border-dashed border-[#d7e2db] bg-[#fcfdfc] px-4 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Icon name="upload" className="h-6 w-6" />
                </div>
                <label className="mt-3 block cursor-pointer text-sm font-medium text-slate-700">
                  Click to choose your payment screenshot
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleProofSelect(event.target.files?.[0])}
                    className="hidden"
                  />
                </label>
                <p className="mt-1 text-xs text-slate-400">
                  {selectedProof?.name || "JPG, PNG or WebP (Max. 4MB)"}
                </p>
                {selectedProof ? (
                  <img
                    src={selectedProof.dataUrl}
                    alt={`${selectedProof.name} preview`}
                    className="mx-auto mt-4 max-h-36 rounded-2xl border border-[#e5ebe7] object-contain"
                  />
                ) : null}
              </div>
              <button
                type="button"
                disabled={isSubmittingPayment}
                onClick={submitPayment}
                className="mt-5 w-full rounded-2xl bg-[#0f7b36] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingPayment ? "Submitting Payment..." : "Upload & Submit Payment"}
              </button>
            </div>
          </StaggerItem>
        ) : null}

        {orders.length > 0 ? (
          <StaggerItem>
            <div className="rounded-[28px] border border-[#e6ece8] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,32,0.04)] transition-all duration-300 hover:shadow-[0_18px_40px_rgba(15,23,32,0.06)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold">Order History</h2>
                    <p className="mt-1 text-sm text-slate-500">Open an order to view its details and next steps.</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  ["Processing", "bg-amber-500"],
                  ["Awaiting Payment", "bg-blue-500"],
                  ["Shipped", "bg-sky-500"],
                  ["Delivered", "bg-emerald-500"],
                ].map(([label, dotClass]) => {
                  const isActive = stageLabel(activeOrder?.status) === label;

                  return (
                    <span
                      key={label}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                        isActive
                          ? "border-[#0f7b36] bg-[#0f7b36] text-white shadow-sm"
                          : "border-[#e5ebe7] bg-[#fbfdfb] text-slate-600"
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-white" : dotClass}`} />
                      {label}
                    </span>
                  );
                })}
                {activeOrder?.status === "CANCELLED" ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    Cancelled
                  </span>
                ) : null}
              </div>

              <div className="mt-5 overflow-hidden rounded-[22px] border border-[#edf1ee]">
                <div className="hidden grid-cols-[1.35fr_0.9fr_1fr_0.9fr_0.45fr] bg-[#f8fbf8] px-5 py-3 text-sm font-semibold text-slate-500 md:grid">
                  <p>Order ID</p>
                  <p>Date</p>
                  <p>Status</p>
                  <p>Total Amount</p>
                  <p className="text-right">Action</p>
                </div>

                <div className="space-y-4 px-4 py-4 md:hidden">
                  {orders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setActiveOrderId(order.id)}
                      className="w-full rounded-[20px] bg-[#fbfcfb] p-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Order ID</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{order.id}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(order.status)}`}>
                          {formatStatus(order.status)}
                        </span>
                      </div>
                      <p className="mt-4 text-sm text-slate-500">
                        {order.status === "CANCELLED"
                          ? cancelledOrderNote
                          : order.timelineUpdate ?? "No update yet"}
                      </p>
                      <span className="mt-4 inline-flex rounded-full bg-[#0f7b36] px-3 py-1 text-xs font-semibold text-white">
                        View Details
                      </span>
                    </button>
                  ))}
                </div>

                <div className="hidden md:block">
                  {orders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setActiveOrderId(order.id)}
                      className={`grid w-full grid-cols-[1.35fr_0.9fr_1fr_0.9fr_0.45fr] items-center border-t border-[#edf1ee] px-5 py-4 text-left text-sm transition hover:bg-[#fbfdfb] ${
                        activeOrderId === order.id ? "bg-[#f8fbf8]" : ""
                      }`}
                    >
                      <p className="font-semibold text-slate-900">{order.id}</p>
                      <p className="text-slate-700">
                        {new Date(order.createdAt).toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(order.status)}`}>
                          {formatStatus(order.status)}
                        </span>
                      </p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(order.totalCost) ?? "Quote pending"}
                      </p>
                      <span className="justify-self-end rounded-full border border-[#dbe5df] px-3 py-1 text-xs font-semibold text-slate-600">
                        Details
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </StaggerItem>
        ) : null}
      </Stagger>

      <Stagger className="space-y-5">
        <StaggerItem>
          <aside className="rounded-[28px] border border-[#e6ece8] bg-[radial-gradient(circle_at_top_right,#f0fbf4,white_60%)] p-6 shadow-[0_12px_30px_rgba(15,23,32,0.04)] transition-all duration-300 hover:shadow-[0_18px_40px_rgba(15,23,32,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">How It Works</p>
                <p className="mt-1 text-sm text-slate-500">Simple steps from request to delivery.</p>
              </div>
              <span className="rounded-full bg-emerald-50 p-2 text-emerald-600">
                <Icon name="bag" className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-5 space-y-4">
              {buy4MeSteps.map((step, index) => (
                <div key={step.title} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-[#0f7b36]">
                      {index + 1}
                    </span>
                    {index < buy4MeSteps.length - 1 ? <span className="mt-2 h-8 w-px bg-[#d9e5dc]" /> : null}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{step.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </StaggerItem>

        <StaggerItem>
          <div className="rounded-[28px] border border-[#e6ece8] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,32,0.04)] transition-all duration-300 hover:shadow-[0_18px_40px_rgba(15,23,32,0.06)]">
            <h3 className="text-lg font-semibold">We Can Help You Buy & Ship Almost Anything!</h3>
            <p className="mt-2 text-sm text-slate-500">From China and the United States.</p>
            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              {buy4MeCategories.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-full bg-emerald-50 p-1 text-emerald-600">
                    <Icon name="check" className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="rounded-[28px] border border-[#e6ece8] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,32,0.04)] transition-all duration-300 hover:shadow-[0_18px_40px_rgba(15,23,32,0.06)]">
            <h3 className="text-lg font-semibold">Why Choose Us?</h3>
            <div className="mt-5 space-y-4">
              {supportReasons.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                    <Icon name="check" className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">{item}</p>
                    <p className="text-sm text-slate-500">Built to reduce confusion and keep your order moving.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="rounded-[28px] bg-[#143a27] p-6 text-white shadow-[0_18px_40px_rgba(15,123,54,0.18)] transition-all duration-300 hover:shadow-[0_22px_50px_rgba(15,123,54,0.22)]">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">China & USA Stores</p>
            <h3 className="mt-3 text-2xl font-semibold">Shop from any store and let us handle payment, shipping and local delivery.</h3>
          </div>
        </StaggerItem>
      </Stagger>
      </KycVerificationGate>

      {activeOrder ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="buy4me-order-details-title"
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/20 px-3 py-4 backdrop-blur-[3px] sm:px-5 sm:py-6 lg:items-center"
          onClick={() => setActiveOrderId(null)}
        >
          <div
            className="max-h-[calc(100vh-2rem)] w-full max-w-[980px] overflow-y-auto rounded-[26px] border border-[#e5ebe7] bg-white p-4 shadow-[0_28px_90px_rgba(15,23,32,0.2)] sm:max-h-[calc(100vh-3rem)] sm:p-5 lg:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Buy4Me Order
                </p>
                <h2 id="buy4me-order-details-title" className="mt-2 text-2xl font-semibold text-slate-950">
                  Order Details
                </h2>
                <p className="mt-1 break-all text-sm text-slate-500">{activeOrder.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveOrderId(null)}
                className="rounded-full border border-[#dbe5df] px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-[#f8fbf8]"
              >
                Close
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                ["Processing", "bg-amber-500"],
                ["Awaiting Payment", "bg-blue-500"],
                ["Shipped", "bg-sky-500"],
                ["Delivered", "bg-emerald-500"],
              ].map(([label, dotClass]) => {
                const isActive = stageLabel(activeOrder.status) === label;

                return (
                  <span
                    key={label}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      isActive
                        ? "border-[#0f7b36] bg-[#0f7b36] text-white"
                        : "border-[#e5ebe7] bg-[#fbfdfb] text-slate-600"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-white" : dotClass}`} />
                    {label}
                  </span>
                );
              })}
              {activeOrder.status === "CANCELLED" ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  Cancelled
                </span>
              ) : null}
            </div>

            <div className="mt-4 rounded-[22px] bg-[#f8fbf8] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Current Status
                  </p>
                  <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone(activeOrder.status)}`}>
                    {formatStatus(activeOrder.status)}
                  </span>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Submitted
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {new Date(activeOrder.createdAt).toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <p className={`mt-3 rounded-[18px] px-4 py-2.5 text-sm leading-6 ${
                activeOrder.status === "CANCELLED"
                  ? "bg-rose-50 text-rose-700"
                  : "bg-white text-slate-600"
              }`}>
                {activeOrder.status === "CANCELLED"
                  ? cancelledOrderNote
                  : activeOrder.timelineUpdate ?? "Your request is being reviewed."}
              </p>
            </div>

            <div
              className={
                showPayment
                  ? "mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start"
                  : ""
              }
            >
            <div>
            {showQuote ? (
              <div className={`${showPayment ? "" : "mt-5"} rounded-[22px] border border-[#edf1ee] p-4`}>
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-slate-950">Order & Pricing</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(activeOrder.status)}`}>
                    {formatStatus(activeOrder.status)}
                  </span>
                </div>

                {activeOrder.totalCost != null ? (
                  <div className="mt-4 space-y-3">
                    {[
                      ["Product Cost", formatCurrency(activeOrder.productCost) ?? formatCurrency(0)],
                      ["Shipping Cost", formatCurrency(activeOrder.shippingCost) ?? formatCurrency(0)],
                      ["Service Charge", formatCurrency(activeOrder.serviceCharge) ?? formatCurrency(0)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-slate-600">{label}</span>
                        <span className="font-semibold text-slate-900">{value}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-4 border-t border-[#edf1ee] pt-3">
                      <span className="text-base font-semibold text-slate-900 sm:text-lg">Total Amount</span>
                      <span className="text-xl font-semibold text-[#0f7b36] sm:text-2xl">
                        {formatCurrency(activeOrder.totalCost)}
                      </span>
                    </div>

                    {activeOrder.status === "AWAITING_PAYMENT" ? (
                      <div className="border-t border-[#edf1ee] pt-3">
                        <button
                          type="button"
                          disabled={isCancellingOrder}
                          onClick={cancelOrder}
                          className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                          {isCancellingOrder ? "Cancelling..." : "Cancel Transaction"}
                        </button>
                        <p className="mt-2 hidden text-xs font-semibold text-[#0f7b36] sm:block">
                          Payment details and proof upload are available here.
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-4 rounded-[18px] bg-[#fbfcfb] p-4 text-sm leading-6 text-slate-500">
                    Our team has been notified. Pricing will appear here once your request has been reviewed.
                  </p>
                )}
              </div>
            ) : null}

            {!showQuote && activeOrder.status !== "CANCELLED" ? (
              <div className={`${showPayment ? "" : "mt-5"} rounded-[22px] border border-[#edf1ee] bg-[#fbfcfb] p-5 text-sm leading-6 text-slate-500`}>
                Our team is reviewing your submitted product link. Quote and payment details will appear once ready.
              </div>
            ) : null}
            </div>

            {showPayment ? (
              <div className="rounded-[22px] border border-[#edf1ee] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">Make Payment</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Submit payment details once you have paid the quoted total.
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-semibold text-[#0f7b36] sm:text-xl">
                    {formatCurrency(activeOrder.totalCost) ?? formatCurrency(0)}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {paymentMethods.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(item)}
                      className={`rounded-[16px] border p-2.5 text-left transition-all duration-300 hover:border-[#c8ddd0] hover:bg-[#fbfdfb] ${
                        selectedPaymentMethod.label === item.label
                          ? "border-[#9bc8aa] bg-[#f8fbf8] shadow-[0_12px_24px_rgba(15,123,54,0.08)]"
                          : "border-[#e5ebe7] bg-white"
                      }`}
                    >
                      <span className={`inline-flex rounded-xl px-2.5 py-1 text-xs font-semibold ${item.accent}`}>
                        {item.short}
                      </span>
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-800 sm:text-sm">{item.label}</p>
                    </button>
                  ))}
                </div>

                <div className="mt-3 rounded-[20px] border border-[#dfeae3] bg-[#f8fbf8] p-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{selectedPaymentMethod.detailsTitle}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Selected method: {selectedPaymentMethod.label}
                      </p>
                    </div>
                    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${selectedPaymentMethod.accent}`}>
                      {selectedPaymentMethod.short}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {selectedPaymentMethod.details.map(([label, value]) => (
                      <div key={label} className="rounded-[16px] border border-[#e5ebe7] bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
                        <p className="mt-2 break-words text-sm font-semibold text-slate-900">{value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-slate-500">{selectedPaymentMethod.note}</p>
                </div>

                <div className="mt-3 rounded-[20px] border border-dashed border-[#d7e2db] bg-[#fcfdfc] px-4 py-5 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Icon name="upload" className="h-5 w-5" />
                  </div>
                  <label className="mt-3 block cursor-pointer text-sm font-medium text-slate-700">
                    Click to choose your payment screenshot
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleProofSelect(event.target.files?.[0])}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-1 text-xs text-slate-400">
                    {selectedProof?.name || "JPG, PNG or WebP (Max. 4MB)"}
                  </p>
                  {selectedProof ? (
                    <img
                      src={selectedProof.dataUrl}
                      alt={`${selectedProof.name} preview`}
                      className="mx-auto mt-3 max-h-28 rounded-2xl border border-[#e5ebe7] object-contain"
                    />
                  ) : null}
                </div>

                <button
                  type="button"
                  disabled={isSubmittingPayment}
                  onClick={submitPayment}
                  className="mt-3 w-full rounded-2xl bg-[#0f7b36] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingPayment ? "Submitting Payment..." : "Upload & Submit Payment"}
                </button>
              </div>
            ) : null}
            </div>

            {feedback ? (
              <p className="mt-5 rounded-2xl bg-[#f6faf7] px-4 py-3 text-sm text-slate-700">
                {feedback}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <TransactionSubmittedPopup
        content={submittedPopup}
        onClose={() => setSubmittedPopup(null)}
      />
    </section>
  );
}
