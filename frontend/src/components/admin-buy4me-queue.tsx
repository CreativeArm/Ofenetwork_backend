"use client";

import { useEffect, useMemo, useState } from "react";
import { useGlobalSearch } from "../lib/search-context";
import {
  fetchAdminBuy4MeOrders,
  fetchAdminUsers,
  priceBuy4MeOrder,
  updateBuy4MeStatus,
  type BackendAdminUser,
  type BackendBuy4MeOrder,
} from "../lib/admin-backend";
import { useBodyScrollLock } from "../lib/use-body-scroll-lock";
import { AdminStatusBadge } from "./admin-ui";
import { Icon } from "./icons";

type Buy4MeStatus =
  | "PROCESSING"
  | "AWAITING_PAYMENT"
  | "PAYMENT_SUBMITTED"
  | "PURCHASING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED"
  | "ISSUE";

export interface AdminBuy4MeOrderRecord extends BackendBuy4MeOrder {
  customer: string;
}

interface AdminBuy4MeQueueProps {
  items?: readonly AdminBuy4MeOrderRecord[];
}

const filters = [
  "All",
  "PROCESSING",
  "AWAITING_PAYMENT",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;

const statuses = [
  "PROCESSING",
  "AWAITING_PAYMENT",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
  "ISSUE",
] as const;

const timelineOptions = [
  "Request submitted. Admin review in progress.",
  "Quote ready. Awaiting customer payment.",
  "Payment submitted. Admin is confirming and preparing your order.",
  "Payment confirmed. We are purchasing your item.",
  "Item purchased. Preparing shipment.",
  "Order shipped. Delivery is in progress.",
  "Order delivered successfully.",
  "There is an issue with this order. Support will contact the customer.",
  "Order cancelled by customer.",
] as const;

function statusLabel(status: Buy4MeStatus) {
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

function toneForStatus(status: string) {
  const lower = status.toLowerCase();
  if (lower.includes("complete")) {
    return "success" as const;
  }
  if (lower.includes("issue") || lower.includes("cancel")) {
    return "danger" as const;
  }
  if (
    lower.includes("awaiting") ||
    lower.includes("processing") ||
    lower.includes("submitted") ||
    lower.includes("shipped") ||
    lower.includes("purchasing")
  ) {
    return "warning" as const;
  }
  return "neutral" as const;
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

function mapToAdminBuy4MeOrder(
  order: BackendBuy4MeOrder,
  users: BackendAdminUser[],
): AdminBuy4MeOrderRecord {
  const customer =
    users.find((user) => user.id === order.userId)?.fullName ?? "Unknown user";
  return {
    ...order,
    customer,
  };
}

export function AdminBuy4MeQueue({ items = [] }: AdminBuy4MeQueueProps) {
  const { searchQuery } = useGlobalSearch();
  const [orders, setOrders] = useState<AdminBuy4MeOrderRecord[]>([...items]);
  const [selectedFilter, setSelectedFilter] =
    useState<(typeof filters)[number]>("All");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<Buy4MeStatus>("PROCESSING");
  const [draftEta, setDraftEta] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [productCost, setProductCost] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [serviceCharge, setServiceCharge] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOrders = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setErrorMessage(null);
    try {
      const [fetchedOrders, users] = await Promise.all([
        fetchAdminBuy4MeOrders(),
        fetchAdminUsers(),
      ]);
      if (Array.isArray(fetchedOrders) && Array.isArray(users)) {
        setOrders(
          fetchedOrders.map((order) => mapToAdminBuy4MeOrder(order, users)),
        );
      }
    } catch (err) {
      if (!silent) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Failed to load Buy4Me orders from backend.",
        );
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = window.setInterval(() => loadOrders(true), 25000);
    const onFocus = () => loadOrders(true);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const activeOrder = useMemo(
    () => orders.find((item) => item.id === activeOrderId) ?? null,
    [activeOrderId, orders],
  );

  const filterCounts = useMemo(() => {
    const counts = {
      All: orders.length,
      PROCESSING: 0,
      AWAITING_PAYMENT: 0,
      SHIPPED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    orders.forEach((o) => {
      if (o.status === "PROCESSING" || o.status === "PAYMENT_SUBMITTED" || o.status === "PURCHASING") {
        counts.PROCESSING++;
      } else if (o.status === "AWAITING_PAYMENT") {
        counts.AWAITING_PAYMENT++;
      } else if (o.status === "SHIPPED") {
        counts.SHIPPED++;
      } else if (o.status === "COMPLETED") {
        counts.COMPLETED++;
      } else if (o.status === "CANCELLED") {
        counts.CANCELLED++;
      }
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return orders.filter((item) => {
      const matchesFilter =
        selectedFilter === "All" ||
        item.status === selectedFilter ||
        (selectedFilter === "PROCESSING" &&
          (item.status === "PAYMENT_SUBMITTED" || item.status === "PURCHASING"));
      if (!matchesFilter) return false;

      if (!query) return true;

      return (
        item.id.toLowerCase().includes(query) ||
        item.customer.toLowerCase().includes(query) ||
        item.productDetails?.toLowerCase().includes(query) ||
        item.productLink?.toLowerCase().includes(query)
      );
    });
  }, [orders, selectedFilter, searchQuery]);

  useBodyScrollLock(Boolean(activeOrder));

  const openOrder = (order: AdminBuy4MeOrderRecord) => {
    setActiveOrderId(order.id);
    setDraftStatus(order.status);
    setDraftEta(order.timelineUpdate ?? "");
    setDraftNote(order.adminNote ?? "");
    setProductCost(order.productCost?.toString() ?? "");
    setShippingCost(order.shippingCost?.toString() ?? "");
    setServiceCharge(order.serviceCharge?.toString() ?? "");
    setFeedback(null);
  };

  const closeOrder = () => {
    setActiveOrderId(null);
    setDraftStatus("PROCESSING");
    setDraftEta("");
    setDraftNote("");
    setProductCost("");
    setShippingCost("");
    setServiceCharge("");
    setFeedback(null);
  };

  const getActorId = () => {
    if (typeof window === "undefined") {
      return "admin-local";
    }

    try {
      const rawUser = window.localStorage.getItem("ofe_user");
      if (!rawUser) {
        return "admin-local";
      }
      const parsed = JSON.parse(rawUser) as { id?: string };
      return parsed.id ?? "admin-local";
    } catch {
      return "admin-local";
    }
  };

  const replaceOrder = (updated: BackendBuy4MeOrder) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === updated.id
          ? {
              ...order,
              ...updated,
            }
          : order,
      ),
    );
  };

  const saveOrder = async () => {
    if (!activeOrder) {
      return;
    }

    const actorId = getActorId();

    try {
      setIsSaving(true);
      setFeedback(null);

      const pricingValues = [productCost, shippingCost, serviceCharge];
      const hasAnyPricingField = pricingValues.some((value) => value.trim());
      const hasAllPricingFields = pricingValues.every((value) => value.trim());

      if (
        (draftStatus === "AWAITING_PAYMENT" || hasAnyPricingField) &&
        !hasAllPricingFields
      ) {
        setFeedback(
          "Enter product cost, shipping cost, and service charge before requesting payment.",
        );
        return;
      }

      const parsedProductCost = Number(productCost);
      const parsedShippingCost = Number(shippingCost);
      const parsedServiceCharge = Number(serviceCharge);

      if (
        hasAllPricingFields &&
        (!Number.isFinite(parsedProductCost) ||
          !Number.isFinite(parsedShippingCost) ||
          !Number.isFinite(parsedServiceCharge) ||
          parsedProductCost < 0 ||
          parsedShippingCost < 0 ||
          parsedServiceCharge < 0)
      ) {
        setFeedback("Enter valid Naira amounts for all quote fields.");
        return;
      }

      const needsPricing =
        hasAllPricingFields &&
        (activeOrder.productCost !== parsedProductCost ||
          activeOrder.shippingCost !== parsedShippingCost ||
          activeOrder.serviceCharge !== parsedServiceCharge ||
          activeOrder.totalCost == null);

      if (needsPricing) {
        const priced = await priceBuy4MeOrder(activeOrder.id, {
          actorId,
          productCost: parsedProductCost,
          shippingCost: parsedShippingCost,
          serviceCharge: parsedServiceCharge,
        });
        replaceOrder(priced);
      }

      const updated = await updateBuy4MeStatus(activeOrder.id, {
        actorId,
        status: draftStatus,
        timelineUpdate:
          draftEta.trim() ||
          (draftStatus === "AWAITING_PAYMENT"
            ? "Quote ready. Awaiting customer payment."
            : undefined),
        adminNote: draftNote.trim(),
      });

      replaceOrder(updated);
      await loadOrders(true);
      closeOrder();
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to update the order right now.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="mb-5 space-y-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold leading-tight">Order Pipeline ({orders.length})</h3>
            <button
              type="button"
              onClick={() => loadOrders()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe5df] bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-[#f4f7f5] disabled:opacity-60"
            >
              <Icon name="arrow" className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Review product links, price quotes, confirm payment, and update tracking stages.
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((filter) => {
            const count = filterCounts[filter];
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedFilter(filter)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedFilter === filter
                    ? "bg-[#0f7b36] text-white"
                    : "bg-[#f4f7f5] text-slate-600 hover:bg-[#eaf4ed]"
                }`}
              >
                {filter === "All" ? filter : statusLabel(filter)} {count > 0 ? `(${count})` : "(0)"}
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

      {isLoading && orders.length === 0 ? (
        <div className="rounded-[22px] border border-[#edf1ee] bg-[#fbfdfb] p-8 text-center text-sm text-slate-500">
          <Icon name="bag" className="mx-auto h-8 w-8 animate-pulse text-[#0f7b36]" />
          <p className="mt-3 font-semibold text-slate-700">Loading Buy4Me orders from backend...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[#dbe5df] bg-[#f8fbf8] p-8 text-center text-sm text-slate-500">
          <p className="font-semibold text-slate-700">No {selectedFilter !== "All" ? statusLabel(selectedFilter).toLowerCase() : ""} Buy4Me orders found.</p>
          <p className="mt-1 text-xs text-slate-400">When users submit sourcing requests, they will appear here in real time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="grid gap-4 rounded-[22px] border border-[#edf1ee] bg-white p-4 transition-all hover:border-[#cfe2d5] hover:shadow-[0_4px_20px_rgba(15,23,32,0.04)] md:grid-cols-[minmax(220px,1.2fr)_minmax(150px,0.7fr)_minmax(190px,0.85fr)_112px] md:items-center"
            >
              <div className="min-w-0">
                <p className="line-clamp-2 font-semibold leading-6 text-slate-900">{order.productDetails || order.productLink}</p>
                <p className="text-sm text-slate-500">{order.customer}</p>
                <p className="mt-1 text-xs text-slate-400">{order.id}</p>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {formatCurrency(order.totalCost) ?? "Quote pending"}
                </p>
                <p className="text-sm text-slate-500">{order.paymentMethod ?? "No payment yet"}</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {order.proofOfPaymentUrl ? "Proof uploaded" : "No proof uploaded"}
                </p>
              </div>
              <div className="min-w-0">
                <AdminStatusBadge
                  label={statusLabel(order.status)}
                  tone={toneForStatus(order.status)}
                />
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">
                  {order.timelineUpdate ?? "Awaiting admin action"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openOrder(order)}
                className="rounded-xl border border-[#dbe5df] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#f8fbf8] md:w-28"
              >
                Manage
              </button>
            </div>
          ))}
        </div>
      )}

      {activeOrder ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/25 px-4 py-6 backdrop-blur-[2px] sm:items-center"
          onClick={closeOrder}
        >
          <div
            className="w-full max-w-[620px] max-h-[90vh] overflow-y-auto rounded-[28px] border border-[#e5ebe7] bg-white p-4 shadow-[0_28px_80px_rgba(15,23,32,0.18)] sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Buy4Me Order Review
                </p>
                <h4 className="mt-2 text-xl font-semibold text-slate-900">
                  {activeOrder.productDetails || activeOrder.productLink}
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  {activeOrder.customer} {"|"} {activeOrder.id}
                </p>
              </div>
              <button
                type="button"
                onClick={closeOrder}
                className="rounded-full border border-[#dbe5df] px-3 py-1 text-sm font-semibold text-slate-500 transition hover:bg-[#f8fbf8]"
              >
                Close
              </button>
            </div>

            {feedback ? (
              <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {feedback}
              </p>
            ) : null}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="max-h-40 overflow-y-auto rounded-[18px] bg-[#f8fbf8] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Product Link
                </p>
                <a
                  href={activeOrder.productLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block break-all text-xs font-medium text-emerald-700 underline sm:text-sm"
                >
                  {activeOrder.productLink}
                </a>
              </div>
              <div className="rounded-[18px] bg-[#f8fbf8] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Payment Method
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {activeOrder.paymentMethod ?? "Awaiting customer payment"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[22px] border border-[#e5ebe7] bg-[#fbfdfb] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Submitted Payment Proof
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {activeOrder.proofOfPaymentUrl
                      ? "Review the uploaded screenshot before moving this order forward."
                      : "The customer has not uploaded payment proof yet."}
                  </p>
                </div>
                {activeOrder.proofOfPaymentUrl ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={activeOrder.proofOfPaymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-2xl border border-[#dbe5df] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#f8fbf8]"
                    >
                      View
                    </a>
                    <a
                      href={activeOrder.proofOfPaymentUrl}
                      download={`${activeOrder.id}-payment-proof`}
                      className="inline-flex items-center justify-center rounded-2xl border border-[#dbe5df] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#f8fbf8]"
                    >
                      Download
                    </a>
                  </div>
                ) : null}
              </div>
              {activeOrder.proofOfPaymentUrl ? (
                <a
                  href={activeOrder.proofOfPaymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block overflow-hidden rounded-[18px] border border-[#dbe5df] bg-white"
                >
                  <img
                    src={activeOrder.proofOfPaymentUrl}
                    alt={`${activeOrder.id} payment proof`}
                    className="max-h-64 w-full object-contain"
                  />
                </a>
              ) : (
                <div className="mt-4 rounded-[18px] border border-dashed border-[#dbe5df] bg-white px-4 py-8 text-center text-sm text-slate-400">
                  Awaiting customer upload
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Product Cost (NGN)
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={productCost}
                  onChange={(event) => setProductCost(event.target.value)}
                  className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                  placeholder="0.00"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Shipping Cost (NGN)
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={shippingCost}
                  onChange={(event) => setShippingCost(event.target.value)}
                  className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                  placeholder="0.00"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Service Charge (NGN)
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={serviceCharge}
                  onChange={(event) => setServiceCharge(event.target.value)}
                  className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                  placeholder="0.00"
                />
              </label>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Stage
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {statuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setDraftStatus(status)}
                    className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                      draftStatus === status
                        ? status === "COMPLETED"
                          ? "bg-emerald-600 text-white shadow-md"
                          : status === "ISSUE" || status === "CANCELLED"
                            ? "bg-rose-600 text-white shadow-md"
                            : "bg-[#0f7b36] text-white shadow-md"
                        : "border border-[#dbe5df] bg-white text-slate-700 hover:bg-[#f8fbf8]"
                    }`}
                  >
                    {statusLabel(status)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Timeline update
                </span>
                <select
                  value={draftEta}
                  onChange={(event) => setDraftEta(event.target.value)}
                  className="w-full rounded-2xl border border-[#e5ebe7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                >
                  <option value="">Choose timeline update</option>
                  {timelineOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Admin note
                </span>
                <textarea
                  value={draftNote}
                  onChange={(event) => setDraftNote(event.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm outline-none transition focus:border-[#9bc8aa]"
                  placeholder="Add the latest handling note for this order"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeOrder}
                className="rounded-2xl border border-[#dbe5df] px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-[#f8fbf8]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={saveOrder}
                className="rounded-2xl bg-[#0f7b36] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#116f34] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Update"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
