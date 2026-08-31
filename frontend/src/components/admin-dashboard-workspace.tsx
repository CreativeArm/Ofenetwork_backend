"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "./icons";
import { AdminCard, AdminSectionIntro, AdminStatusBadge } from "./admin-ui";
import { AdminLiveRatesBoard } from "./admin-live-rates-board";
import {
  fetchAdminBuy4MeOrders,
  fetchAdminDashboardMetrics,
  fetchAdminTransactions,
  fetchAdminUsers,
  formatCurrency,
  formatRelativeTime,
  getCachedApi,
  type BackendAdminUser,
  type BackendBuy4MeOrder,
  type BackendDashboardMetrics,
  type BackendTransaction,
} from "../lib/admin-backend";
import { quickActions, testimonials } from "../lib/mock-data";

const metricTints = ["emerald", "violet", "sky", "amber", "pink"] as const;

const buy4MeStatusSegments = [
  {
    label: "Processing",
    statuses: ["PROCESSING", "PAYMENT_SUBMITTED", "PURCHASING", "ISSUE"],
    color: "bg-orange-500",
    chartColor: "#f97316",
  },
  {
    label: "Awaiting Payment",
    statuses: ["AWAITING_PAYMENT"],
    color: "bg-blue-600",
    chartColor: "#2563eb",
  },
  {
    label: "Shipped",
    statuses: ["SHIPPED"],
    color: "bg-sky-500",
    chartColor: "#0ea5e9",
  },
  {
    label: "Delivered",
    statuses: ["COMPLETED"],
    color: "bg-emerald-600",
    chartColor: "#059669",
  },
  {
    label: "Cancelled",
    statuses: ["CANCELLED"],
    color: "bg-rose-500",
    chartColor: "#e11d48",
  },
] as const;

type MonthlyOverviewItem = {
  key: string;
  label: string;
  deposits: number;
  withdrawals: number;
  buy4me: number;
};

type Buy4MeStatusBreakdownItem = {
  label: string;
  value: number;
  color: string;
  chartColor: string;
};

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function buildMonthlyOverview(
  transactions: BackendTransaction[],
  buy4meOrders: BackendBuy4MeOrder[],
) {
  const now = new Date();
  const startDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1),
  );
  const formatter = new Intl.DateTimeFormat("en-NG", { month: "short" });
  const buckets = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(
      Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + index, 1),
    );

    return {
      key: monthKey(date),
      label: formatter.format(date),
      deposits: 0,
      withdrawals: 0,
      buy4me: 0,
    };
  });
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  transactions
    .filter(
      (transaction) =>
        transaction.status === "CONFIRMED" &&
        (transaction.type === "DEPOSIT" || transaction.type === "WITHDRAWAL"),
    )
    .forEach((transaction) => {
      const bucket = bucketMap.get(monthKey(new Date(transaction.createdAt)));
      if (!bucket) {
        return;
      }

      if (transaction.type === "DEPOSIT") {
        bucket.deposits += transaction.nairaEquivalent;
        return;
      }

      bucket.withdrawals += transaction.nairaEquivalent;
    });

  buy4meOrders
    .filter((order) => order.status !== "CANCELLED" && order.totalCost != null)
    .forEach((order) => {
      const bucket = bucketMap.get(monthKey(new Date(order.createdAt)));
      if (!bucket) {
        return;
      }

      bucket.buy4me += order.totalCost ?? 0;
    });

  return buckets.map((bucket) => ({
    ...bucket,
    deposits: Math.round(bucket.deposits * 100) / 100,
    withdrawals: Math.round(bucket.withdrawals * 100) / 100,
    buy4me: Math.round(bucket.buy4me * 100) / 100,
  }));
}

function buildBuy4MeStatusBreakdown(orders: BackendBuy4MeOrder[]) {
  return buy4MeStatusSegments.map((segment) => ({
    label: segment.label,
    value: orders.filter((order) =>
      (segment.statuses as readonly string[]).includes(order.status),
    ).length,
    color: segment.color,
    chartColor: segment.chartColor,
  }));
}

function buildPieGradient(items: Buy4MeStatusBreakdownItem[]) {
  const activeItems = items.filter((item) => item.value > 0);
  const total = activeItems.reduce((sum, item) => sum + item.value, 0);

  if (total <= 0) {
    return "#eef2f6";
  }

  let cursor = 0;
  const segments = activeItems.map((item) => {
    const start = cursor;
    const end = cursor + (item.value / total) * 100;
    cursor = end;
    return `${item.chartColor} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
  });

  return `conic-gradient(${segments.join(", ")})`;
}

function chartBarHeight(value: number, maxValue: number) {
  if (value <= 0 || maxValue <= 0) {
    return "0%";
  }

  return `${Math.max(8, Math.round((value / maxValue) * 100))}%`;
}

function getDynamicMetricFontSize(value: string) {
  const len = value.length;
  if (len > 18) {
    return "text-sm sm:text-base";
  }
  if (len > 14) {
    return "text-base sm:text-lg";
  }
  if (len > 11) {
    return "text-lg sm:text-xl";
  }
  if (len > 9) {
    return "text-xl sm:text-2xl";
  }
  return "text-2xl";
}

export function AdminDashboardWorkspace() {
  const [dashboardData, setDashboardData] = useState<BackendDashboardMetrics | null>(
    () => getCachedApi<BackendDashboardMetrics>("/admin/dashboard"),
  );
  const [transactions, setTransactions] = useState<BackendTransaction[]>(
    () => getCachedApi<BackendTransaction[]>("/transactions") ?? [],
  );
  const [users, setUsers] = useState<BackendAdminUser[]>(
    () => getCachedApi<BackendAdminUser[]>("/admin/search-users?query=") ?? [],
  );
  const [buy4meOrders, setBuy4meOrders] = useState<BackendBuy4MeOrder[]>(
    () => getCachedApi<BackendBuy4MeOrder[]>("/buy4me") ?? [],
  );
  // isLoading is true only when there is zero cached data to show
  const [isLoading, setIsLoading] = useState(() => {
    return !getCachedApi<BackendDashboardMetrics>("/admin/dashboard");
  });

  const loadData = async (silent = false) => {
    // Fire ALL requests in parallel — dashboard metrics + secondary data
    if (!silent && !dashboardData) setIsLoading(true);
    try {
      const [dashRes, txRes, b4mRes, usersRes] = await Promise.allSettled([
        fetchAdminDashboardMetrics(),
        fetchAdminTransactions(),
        fetchAdminBuy4MeOrders(),
        fetchAdminUsers(),
      ]);
      if (dashRes.status === "fulfilled") setDashboardData(dashRes.value);
      if (txRes.status === "fulfilled") setTransactions(txRes.value);
      if (b4mRes.status === "fulfilled") setBuy4meOrders(b4mRes.value);
      if (usersRes.status === "fulfilled") setUsers(usersRes.value);
    } catch {
      // Keep stale state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll every 60s (was 25s) — dashboard metrics are now cached 5 min on backend
    const interval = window.setInterval(() => loadData(true), 60_000);
    const onFocus = () => loadData(true);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const monthlyOverview: MonthlyOverviewItem[] = useMemo(() => {
    return dashboardData?.monthlyOverview?.length
      ? dashboardData.monthlyOverview
      : buildMonthlyOverview(transactions, buy4meOrders);
  }, [dashboardData, transactions, buy4meOrders]);

  const maxChartValue = Math.max(
    0,
    ...monthlyOverview.flatMap((item) => [
      item.deposits,
      item.withdrawals,
      item.buy4me,
    ]),
  );

  const hasChartData = monthlyOverview.some(
    (item) => item.deposits > 0 || item.withdrawals > 0 || item.buy4me > 0,
  );

  const chartTotals = monthlyOverview.reduce(
    (sum, item) => ({
      deposits: sum.deposits + item.deposits,
      withdrawals: sum.withdrawals + item.withdrawals,
      buy4me: sum.buy4me + item.buy4me,
    }),
    { deposits: 0, withdrawals: 0, buy4me: 0 },
  );

  const buy4meStatusBreakdown: Buy4MeStatusBreakdownItem[] = useMemo(() => {
    return dashboardData?.buy4meStatusBreakdown?.length
      ? dashboardData.buy4meStatusBreakdown
      : buildBuy4MeStatusBreakdown(buy4meOrders);
  }, [dashboardData, buy4meOrders]);

  const totalBuy4MeOrders =
    dashboardData?.totalBuy4MeOrders ??
    buy4meStatusBreakdown.reduce((sum, item) => sum + item.value, 0);
  const pieGradient = buildPieGradient(buy4meStatusBreakdown);

  const verifiedFromUsers = users.filter((u) => u.kycStatus === "APPROVED").length;
  const unverifiedFromUsers = users.filter((u) => u.kycStatus !== "APPROVED").length;

  const totalUsersCount =
    dashboardData?.totalUsers ?? (users.length > 0 ? users.length : 0);
  const verifiedUsersCount =
    dashboardData?.verifiedUsers ?? verifiedFromUsers;
  const unverifiedUsersCount =
    dashboardData?.unverifiedUsers ??
    (totalUsersCount > 0 ? Math.max(0, totalUsersCount - verifiedUsersCount) : unverifiedFromUsers);

  const totalTransactionsCount = dashboardData?.totalTransactions ?? transactions.length;
  const totalDepositsVolume =
    dashboardData?.totalDeposits ??
    transactions
      .filter((t) => t.type === "DEPOSIT" && t.status === "CONFIRMED")
      .reduce((sum, t) => sum + (t.nairaEquivalent || 0), 0);
  const totalWithdrawalsVolume =
    dashboardData?.totalWithdrawals ??
    transactions
      .filter((t) => t.type === "WITHDRAWAL" && t.status === "CONFIRMED")
      .reduce((sum, t) => sum + (t.nairaEquivalent || 0), 0);

  const pendingTransactionsCount =
    dashboardData?.pendingRequests ??
    transactions.filter((t) => t.status === "PENDING").length;

  const metrics = [
    {
      label: "Total Users",
      value: totalUsersCount.toLocaleString(),
      trend: `${verifiedUsersCount} verified · ${unverifiedUsersCount} unverified`,
      tint: metricTints[0],
    },
    {
      label: "Total Transactions",
      value: totalTransactionsCount.toLocaleString(),
      trend: `${pendingTransactionsCount} pending`,
      tint: metricTints[1],
    },
    {
      label: "Total Deposits",
      value: formatCurrency(totalDepositsVolume),
      trend: "Confirmed deposits volume",
      tint: metricTints[2],
    },
    {
      label: "Total Withdrawals",
      value: formatCurrency(totalWithdrawalsVolume),
      trend: "Confirmed withdrawals volume",
      tint: metricTints[3],
    },
    {
      label: "Buy 4 Me Orders",
      value: totalBuy4MeOrders.toLocaleString(),
      trend: "Orders created on platform",
      tint: metricTints[4],
    },
  ];

  // Use recentActivities from dashboard metrics (already fetched) instead of
  // requiring the full transactions list — much faster first render.
  const recentTransactions = dashboardData?.recentActivities?.length
    ? dashboardData.recentActivities.slice(0, 5).map((entry) => ({
        id: entry.id,
        service: entry.action.replace(/_/g, " "),
        meta: entry.entityType,
        amount: "",
        status: "Completed" as const,
      }))
    : transactions.slice(0, 5).map((item) => ({
        id: item.id,
        service: item.type === "DEPOSIT" ? `Deposit — ${item.service}` : `Withdrawal — ${item.service}`,
        meta: item.service,
        amount: formatCurrency(item.nairaEquivalent),
        status: (
          item.status === "CONFIRMED"
            ? "Completed"
            : item.status === "REJECTED"
              ? "Rejected"
              : "Pending"
        ) as "Completed" | "Rejected" | "Pending",
      }));

  const recentUsersData = (
    dashboardData?.recentUsers?.length
      ? dashboardData.recentUsers
      : users.slice(0, 5)
  ).map((user) => {
    const isApproved = user.kycStatus === "APPROVED";
    const isPending = user.kycStatus === "PENDING";
    const isRejected = user.kycStatus === "REJECTED";
    return {
      id: user.id,
      name: user.fullName || "Unnamed User",
      email: user.email,
      status: isApproved
        ? "Verified"
        : isPending
          ? "KYC Pending"
          : isRejected
            ? "KYC Rejected"
            : "Unverified",
      isVerified: isApproved,
      time: user.createdAt ? formatRelativeTime(user.createdAt) : "Recently",
    };
  });

  const pendingDeposits =
    dashboardData?.pendingDeposits ??
    transactions.filter(
      (item) => item.type === "DEPOSIT" && item.status === "PENDING",
    ).length;
  const pendingWithdrawals =
    dashboardData?.pendingWithdrawals ??
    transactions.filter(
      (item) => item.type === "WITHDRAWAL" && item.status === "PENDING",
    ).length;
  const pendingKycCount = dashboardData?.pendingKycCount ?? 0;
  const pendingBuy4MeCount =
    dashboardData?.pendingBuy4Me ??
    buy4meOrders.filter(
      (item) => item.status !== "COMPLETED" && item.status !== "CANCELLED",
    ).length;

  const liveSystemSummary = [
    { label: "Verified Users", value: verifiedUsersCount, href: "/admin/users", tone: "success" },
    { label: "Unverified Users", value: unverifiedUsersCount, href: "/admin/users", tone: "warning" },
    { label: "Pending KYC Reviews", value: pendingKycCount, href: "/admin/kyc", tone: "warning" },
    { label: "Pending Deposits", value: pendingDeposits, href: "/admin/transactions", tone: "warning" },
    { label: "Pending Withdrawals", value: pendingWithdrawals, href: "/admin/transactions", tone: "warning" },
    { label: "Active Buy 4 Me Orders", value: pendingBuy4MeCount, href: "/admin/buy4me", tone: "neutral" },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <AdminSectionIntro
          eyebrow="Admin Hub"
          title="Command center for approvals, users, KYC, and service operations."
          description="Live platform snapshot synced with your real database in real time."
        />
        <button
          type="button"
          onClick={() => loadData()}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 self-start rounded-full border border-[#dbe5df] bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-[#f4f7f5] disabled:opacity-60 sm:self-auto"
        >
          <Icon name="arrow" className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Syncing..." : "Refresh Data"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metrics.map((metric) => (
          <AdminCard key={metric.label} className="flex flex-col justify-between min-w-0 rounded-[24px] p-5 shadow-sm">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`shrink-0 rounded-2xl p-2.5 ${
                    metric.tint === "emerald"
                      ? "bg-emerald-50 text-emerald-600"
                      : metric.tint === "violet"
                        ? "bg-violet-50 text-violet-600"
                        : metric.tint === "sky"
                          ? "bg-sky-50 text-sky-600"
                          : metric.tint === "amber"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-pink-50 text-pink-600"
                  }`}
                >
                  <Icon
                    name={
                      metric.label.includes("Users")
                        ? "users"
                        : metric.label.includes("Transactions")
                          ? "swap"
                          : metric.label.includes("Deposits")
                            ? "bank"
                            : metric.label.includes("Withdrawals")
                              ? "arrow"
                              : "bag"
                    }
                    className="h-5 w-5"
                  />
                </span>
                <p className="min-w-0 truncate text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {metric.label}
                </p>
              </div>
              <div className="mt-3 min-w-0">
                <p
                  className={`font-bold tracking-tight text-slate-900 break-words leading-tight transition-all ${getDynamicMetricFontSize(
                    metric.value,
                  )}`}
                  title={metric.value}
                >
                  {metric.value}
                </p>
              </div>
            </div>
            {metric.label === "Total Users" ? (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-[#0f7b36] border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0f7b36]" />
                  {verifiedUsersCount} Verified
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {unverifiedUsersCount} Unverified
                </span>
              </div>
            ) : (
              <p className="mt-3 truncate text-xs font-semibold text-[#0f7b36]">{metric.trend}</p>
            )}
          </AdminCard>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <AdminCard>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Transaction Overview</h2>
                <p className="text-sm text-slate-500">
                  Confirmed deposits, withdrawals, and Buy4Me value over the last 12 months.
                </p>
              </div>
              <Link
                href="/admin/transactions"
                className="rounded-xl border border-[#d7e2db] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#f8fbf8]"
              >
                Open queue
              </Link>
            </div>
            <div className="rounded-[24px] bg-[#fbfcfb] p-5">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Deposits
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Withdrawals
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-violet-500" /> Buy 4 Me
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
                  <span className="rounded-full bg-white px-3 py-1 shadow-xs">
                    {formatCurrency(chartTotals.deposits)} deposits
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 shadow-xs">
                    {formatCurrency(chartTotals.withdrawals)} withdrawals
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 shadow-xs">
                    {formatCurrency(chartTotals.buy4me)} Buy4Me
                  </span>
                </div>
              </div>
              <div className="relative">
                <div className="grid h-[240px] grid-cols-12 items-end gap-2">
                  {monthlyOverview.map((item) => (
                    <div key={item.key} className="flex h-full min-w-0 flex-col justify-end gap-2">
                      <div className="flex flex-1 items-end justify-center gap-1">
                        <div
                          className="w-2 rounded-full bg-emerald-500/85 transition-all duration-500"
                          style={{ height: chartBarHeight(item.deposits, maxChartValue) }}
                          title={`${item.label} deposits: ${formatCurrency(item.deposits)}`}
                        />
                        <div
                          className="w-2 rounded-full bg-amber-400/85 transition-all duration-500"
                          style={{ height: chartBarHeight(item.withdrawals, maxChartValue) }}
                          title={`${item.label} withdrawals: ${formatCurrency(item.withdrawals)}`}
                        />
                        <div
                          className="w-2 rounded-full bg-violet-400/85 transition-all duration-500"
                          style={{ height: chartBarHeight(item.buy4me, maxChartValue) }}
                          title={`${item.label} Buy4Me: ${formatCurrency(item.buy4me)}`}
                        />
                      </div>
                      <span className="truncate text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
                {!hasChartData ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-[22px] bg-white/70 text-sm font-semibold text-slate-500 backdrop-blur-sm">
                    No confirmed transaction activity yet.
                  </div>
                ) : null}
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Live Exchange Rates</h2>
              <Link
                href="/admin/rates"
                className="rounded-xl bg-[#0f7b36] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#116f34]"
              >
                Edit Rates
              </Link>
            </div>
            <AdminLiveRatesBoard />
          </AdminCard>

          <AdminCard>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Latest Testimonials</h2>
              <Link
                href="/admin/testimonials"
                className="rounded-xl border border-[#d7e2db] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#f8fbf8]"
              >
                Manage All
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {testimonials.map((item) => (
                <div key={item.name} className="rounded-[22px] border border-[#edf1ee] bg-[#fbfdfb] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs font-semibold text-[#0f7b36]">{item.badge}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.quote}</p>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>

        <div className="space-y-5">
          <AdminCard>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Transactions</h2>
              <Link href="/admin/transactions" className="text-sm font-semibold text-[#0f7b36] hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-[#f0f4f1] p-3 transition-colors hover:bg-[#fbfdfb]"
                  >
                    <div className="flex gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <Icon name="arrow" className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.service}</p>
                        <p className="text-xs text-slate-500">{item.meta}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{item.amount}</p>
                      <div className="mt-1">
                        <AdminStatusBadge
                          label={item.status}
                          tone={
                            item.status === "Completed"
                              ? "success"
                              : item.status === "Rejected"
                                ? "danger"
                                : "warning"
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-slate-500">No transactions recorded yet.</p>
              )}
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="text-xl font-semibold">Order Status (Buy 4 Me)</h2>
            <div className="mt-6 flex items-center gap-5">
              <div
                className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full shadow-inner"
                style={{ background: pieGradient }}
              >
                <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white text-center shadow-xs">
                  <p className="text-2xl font-bold text-slate-900">{totalBuy4MeOrders.toLocaleString()}</p>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Orders</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {buy4meStatusBreakdown.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-sm">
                    <span className={`h-3 w-3 rounded-full ${item.color}`} />
                    <span className="w-28 text-slate-600">{item.label}</span>
                    <span className="font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link
              href="/admin/buy4me"
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#0f7b36] hover:underline"
            >
              Open order desk <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </AdminCard>

          <AdminCard>
            <h2 className="text-xl font-semibold">System Action Summary</h2>
            <div className="mt-4 space-y-2.5">
              {liveSystemSummary.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between rounded-xl p-2 text-sm transition hover:bg-[#f8fbf8]"
                >
                  <span className="text-slate-600">{item.label}</span>
                  <span
                    className={`font-semibold rounded-full px-2.5 py-0.5 text-xs ${
                      item.tone === "success"
                        ? "bg-emerald-100 text-[#0f7b36] font-bold"
                        : item.value > 0
                          ? "bg-amber-100 text-amber-800 font-bold"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {item.value}
                  </span>
                </Link>
              ))}
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="text-xl font-semibold">Quick Actions</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="rounded-2xl border border-[#e5ebe7] p-3 text-sm font-semibold text-slate-700 transition hover:border-[#c8ddd0] hover:text-[#0f7b36] hover:bg-[#f8fbf8]"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </AdminCard>

          <AdminCard>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Users{dashboardData?.totalUsers ? ` (${dashboardData.totalUsers.toLocaleString()} total)` : ""}</h2>
              <Link href="/admin/users" className="text-sm font-semibold text-[#0f7b36] hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentUsersData.length > 0 ? (
                recentUsersData.map((user) => (
                  <div
                    key={user.id || user.email}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#f0f4f1] p-3 transition hover:bg-[#fbfcfb]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                        {user.name.charAt(0)}
                        {user.isVerified ? (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#0f7b36] text-[9px] font-bold text-white ring-2 ring-white"
                            title="Verified Account"
                          >
                            ✓
                          </span>
                        ) : (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white ring-2 ring-white"
                            title="Unverified Account"
                          >
                            !
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                          {user.isVerified ? (
                            <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#0f7b36]">
                              Verified
                            </span>
                          ) : (
                            <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                              Unverified
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <AdminStatusBadge
                        label={user.status}
                        tone={
                          user.status === "Verified"
                            ? "success"
                            : user.status === "KYC Pending"
                              ? "warning"
                              : user.status === "KYC Rejected"
                                ? "danger"
                                : "neutral"
                        }
                      />
                      <p className="mt-1 text-[11px] text-slate-400">{user.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-slate-500">No registered users yet.</p>
              )}
            </div>
          </AdminCard>
        </div>
      </div>
    </section>
  );
}
