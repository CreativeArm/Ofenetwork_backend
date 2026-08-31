"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminBuy4MeQueue } from "../../../components/admin-buy4me-queue";
import { AdminKycQueue } from "../../../components/admin-kyc-queue";
import { AdminNotificationCenter } from "../../../components/admin-notification-center";
import { AdminPaymentMethodsManager } from "../../../components/admin-payment-methods-manager";
import { AdminRatesEditor } from "../../../components/admin-rates-editor";
import { AdminSupportQueue } from "../../../components/admin-support-queue";
import { AdminTestimonialsQueue } from "../../../components/admin-testimonials-queue";
import { AdminUsersBonusManager } from "../../../components/admin-users-bonus-manager";
import { AppShell } from "../../../components/shell";
import { AdminTransactionsQueue } from "../../../components/admin-transactions-queue";
import { AdminCard, AdminSectionIntro, AdminStatusBadge } from "../../../components/admin-ui";
import {
  adminBonusRules,
  adminNotificationsData,
  adminPaymentData,
  adminSectionMeta,
  adminSecurityEvents,
  adminServiceHealth,
  adminSettingsData,
  type AdminSectionSlug,
} from "../../../lib/admin-data";

const sections = Object.keys(adminSectionMeta) as AdminSectionSlug[];

function toneForStatus(status: string) {
  const lower = status.toLowerCase();
  if (
    lower.includes("confirm") ||
    lower.includes("approved") ||
    lower.includes("live") ||
    lower.includes("active") ||
    lower.includes("successful") ||
    lower.includes("resolved") ||
    lower.includes("primary") ||
    lower.includes("vip")
  ) {
    return "success" as const;
  }
  if (
    lower.includes("pending") ||
    lower.includes("watch") ||
    lower.includes("scheduled") ||
    lower.includes("review") ||
    lower.includes("awaiting") ||
    lower.includes("medium")
  ) {
    return "warning" as const;
  }
  if (lower.includes("reject") || lower.includes("flagged") || lower.includes("blocked")) {
    return "danger" as const;
  }
  if (lower.includes("tracked") || lower.includes("sent")) {
    return "info" as const;
  }
  return "neutral" as const;
}

export default function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const resolvedParams = use(params);
  const section = resolvedParams.section;

  if (!sections.includes(section as AdminSectionSlug)) {
    notFound();
  }

  const meta = adminSectionMeta[section as AdminSectionSlug];

  return (
    <AppShell admin activeSlug={section} title={meta.title} subtitle={meta.subtitle}>
      <section className="space-y-6">
        <AdminSectionIntro eyebrow={meta.eyebrow} title={meta.title} description={meta.description} />
        {renderSection(section as AdminSectionSlug)}
      </section>
    </AppShell>
  );
}

function renderSection(section: AdminSectionSlug) {
  switch (section) {
    case "transactions":
      return (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <AdminCard>
            <AdminTransactionsQueue />
          </AdminCard>
          <div className="space-y-6">
            <AdminCard>
              <h3 className="text-xl font-semibold">Review Rules</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>Check uploaded proof, amount, service, and payment reference before any confirmation.</p>
                <p>Duplicate proofs and mismatched payer details should be flagged before final action.</p>
                <p>Rejected requests remain visible in the audit trail for accountability.</p>
              </div>
            </AdminCard>
            <AdminCard>
              <h3 className="text-xl font-semibold">Fast Links</h3>
              <div className="mt-4 grid gap-3">
                <Link
                  href="/admin/rates"
                  className="rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm font-semibold text-slate-700 hover:text-[#0f7b36]"
                >
                  Update rates
                </Link>
                <Link
                  href="/admin/notifications"
                  className="rounded-2xl border border-[#e5ebe7] px-4 py-3 text-sm font-semibold text-slate-700 hover:text-[#0f7b36]"
                >
                  Send transaction notice
                </Link>
              </div>
            </AdminCard>
          </div>
        </div>
      );
    case "buy4me":
      return (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <AdminCard>
            <AdminBuy4MeQueue />
          </AdminCard>
          <AdminCard>
            <h3 className="text-xl font-semibold">Fulfilment Notes</h3>
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <p>Confirm sourcing country, shipping expectation, and service fee before requesting payment.</p>
              <p>Use status changes consistently: `Awaiting Payment`, `Processing`, `Shipped`, `Completed`.</p>
              <p>Where delays happen, update the customer through the notifications page immediately.</p>
            </div>
          </AdminCard>
        </div>
      );
    case "users":
      return (
        <AdminCard>
          <AdminUsersBonusManager />
        </AdminCard>
      );
    case "bonuses":
      return (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <AdminCard>
            <h3 className="text-xl font-semibold">Bonus Rules</h3>
            <div className="mt-4 space-y-3">
              {adminBonusRules.map((rule) => (
                <div key={rule.tier} className="rounded-[22px] border border-[#edf1ee] p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{rule.tier}</p>
                    <span className="text-lg font-semibold text-[#0f7b36]">{rule.rate}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Requirement: {rule.minimum}</p>
                  <p className="mt-1 text-sm text-slate-500">{rule.appliesTo}</p>
                </div>
              ))}
            </div>
          </AdminCard>
          <AdminCard>
            <h3 className="text-xl font-semibold">How assignment works</h3>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
              <p>Referral bonuses are added manually after the referred person completes a transaction worth at least $30.</p>
              <p>Users can request a bonus withdrawal for any available bonus balance with no minimum amount restriction.</p>
              <p>This section is ready for future API-backed rule editing once the backend logic is connected.</p>
            </div>
          </AdminCard>
        </div>
      );
    case "rates":
      return (
        <AdminCard>
          <AdminRatesEditor />
        </AdminCard>
      );
    case "services":
      return (
        <AdminCard>
          <div className="mb-5">
            <h3 className="text-xl font-semibold">Service Health</h3>
            <p className="text-sm text-slate-500">Availability, uptime, and operational load across modules.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {adminServiceHealth.map((service) => (
              <div key={service.service} className="rounded-[22px] border border-[#edf1ee] p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{service.service}</p>
                  <AdminStatusBadge label={service.status} tone={toneForStatus(service.status)} />
                </div>
                <p className="mt-4 text-sm text-slate-500">Uptime</p>
                <p className="text-2xl font-semibold text-slate-900">{service.uptime}</p>
                <p className="mt-2 text-sm text-slate-500">Current volume: {service.volume}</p>
              </div>
            ))}
          </div>
        </AdminCard>
      );
    case "testimonials":
      return (
        <AdminCard>
          <AdminTestimonialsQueue />
        </AdminCard>
      );
    case "tickets":
      return (
        <AdminCard>
          <AdminSupportQueue liveMode={true} />
        </AdminCard>
      );
    case "notifications":
      return (
        <AdminCard>
          <AdminNotificationCenter items={adminNotificationsData} />
        </AdminCard>
      );
    case "kyc":
      return (
        <AdminCard>
          <AdminKycQueue />
        </AdminCard>
      );
    case "settings":
      return (
        <AdminCard>
          <div className="mb-5">
            <h3 className="text-xl font-semibold">Platform Defaults</h3>
            <p className="text-sm text-slate-500">These settings shape how the admin team works day to day.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {adminSettingsData.map((item) => (
              <div key={item.label} className="rounded-[22px] border border-[#edf1ee] p-4">
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </AdminCard>
      );
    case "payment":
      return (
        <AdminCard>
          <AdminPaymentMethodsManager items={adminPaymentData} />
        </AdminCard>
      );
    case "security":
      return (
        <AdminCard>
          <div className="mb-5">
            <h3 className="text-xl font-semibold">Recent Security Events</h3>
            <p className="text-sm text-slate-500">Watch privileged activity and suspicious access attempts.</p>
          </div>
          <div className="space-y-3">
            {adminSecurityEvents.map((event) => (
              <div
                key={event.event + event.time}
                className="grid gap-4 rounded-[22px] border border-[#edf1ee] p-4 md:grid-cols-[1fr_0.7fr_0.7fr_0.5fr] md:items-center"
              >
                <div>
                  <p className="font-semibold text-slate-900">{event.event}</p>
                  <p className="text-sm text-slate-500">{event.actor}</p>
                </div>
                <p className="text-sm text-slate-600">{event.location}</p>
                <p className="text-sm text-slate-400">{event.time}</p>
                <AdminStatusBadge label={event.status} tone={toneForStatus(event.status)} />
              </div>
            ))}
          </div>
        </AdminCard>
      );
    default:
      return null;
  }
}
