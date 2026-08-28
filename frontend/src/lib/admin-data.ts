export type AdminSectionSlug =
  | "transactions"
  | "buy4me"
  | "users"
  | "bonuses"
  | "rates"
  | "services"
  | "testimonials"
  | "tickets"
  | "notifications"
  | "kyc"
  | "settings"
  | "payment"
  | "security";

function createProofDataUrl(id: string, service: string, amount: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760">
      <rect width="1200" height="760" rx="32" fill="#f4fbf6"/>
      <rect x="42" y="42" width="1116" height="676" rx="28" fill="#ffffff" stroke="#dce9df"/>
      <text x="88" y="116" fill="#0f7b36" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700">Payment Proof</text>
      <text x="88" y="166" fill="#64748b" font-family="Arial, Helvetica, sans-serif" font-size="24">Transaction ID: ${id}</text>
      <text x="88" y="216" fill="#64748b" font-family="Arial, Helvetica, sans-serif" font-size="24">Service: ${service}</text>
      <text x="88" y="266" fill="#64748b" font-family="Arial, Helvetica, sans-serif" font-size="24">Amount: ${amount}</text>
      <rect x="88" y="322" width="1024" height="262" rx="24" fill="#f8fbf8" stroke="#dce9df" stroke-dasharray="10 8"/>
      <text x="600" y="455" text-anchor="middle" fill="#0f172a" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="600">Uploaded receipt preview</text>
      <text x="600" y="500" text-anchor="middle" fill="#94a3b8" font-family="Arial, Helvetica, sans-serif" font-size="22">Mock attachment for admin review flow</text>
      <rect x="88" y="620" width="300" height="48" rx="16" fill="#eaf7ee"/>
      <text x="112" y="651" fill="#0f7b36" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">Verified by customer upload</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function createKycDocumentDataUrl(user: string, document: string, status: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760">
      <rect width="1200" height="760" rx="32" fill="#f5faf7"/>
      <rect x="48" y="48" width="1104" height="664" rx="28" fill="#ffffff" stroke="#dce9df"/>
      <text x="92" y="120" fill="#0f7b36" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700">KYC Document Preview</text>
      <text x="92" y="174" fill="#64748b" font-family="Arial, Helvetica, sans-serif" font-size="24">User: ${user}</text>
      <text x="92" y="220" fill="#64748b" font-family="Arial, Helvetica, sans-serif" font-size="24">Document: ${document}</text>
      <text x="92" y="266" fill="#64748b" font-family="Arial, Helvetica, sans-serif" font-size="24">Current status: ${status}</text>
      <rect x="92" y="322" width="1016" height="246" rx="22" fill="#f8fbf8" stroke="#dce9df" stroke-dasharray="10 8"/>
      <text x="600" y="442" text-anchor="middle" fill="#0f172a" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="600">Uploaded identity document snapshot</text>
      <text x="600" y="488" text-anchor="middle" fill="#94a3b8" font-family="Arial, Helvetica, sans-serif" font-size="22">Mock file for admin verification flow</text>
      <rect x="92" y="612" width="286" height="48" rx="16" fill="#eaf7ee"/>
      <text x="116" y="643" fill="#0f7b36" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">Identity verification attachment</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const adminSectionMeta: Record<
  AdminSectionSlug,
  { title: string; subtitle: string; eyebrow: string; description: string }
> = {
  transactions: {
    title: "Transactions",
    subtitle: "Review deposits, withdrawals, and manual confirmations.",
    eyebrow: "Operations",
    description: "Monitor all incoming proofs, pending payouts, and confirmation history from one clean queue.",
  },
  buy4me: {
    title: "Buy 4 Me Orders",
    subtitle: "Track sourcing, shipping, payment, and fulfilment updates.",
    eyebrow: "Orders",
    description: "Handle request intake, costing, payment approval, and customer delivery updates without leaving the admin workspace.",
  },
  users: {
    title: "Users",
    subtitle: "Search, review, and manage customer accounts.",
    eyebrow: "Accounts",
    description: "Keep an eye on user activity, verification state, referral performance, and account quality across the platform.",
  },
  bonuses: {
    title: "Bonuses",
    subtitle: "Manage manual referral and threshold bonus assignments.",
    eyebrow: "Rewards",
    description: "Control manual bonus assignments after referrals, transaction minimums, and admin checks are confirmed.",
  },
  rates: {
    title: "Exchange Rates",
    subtitle: "Update deposit and withdrawal rates across services.",
    eyebrow: "Pricing",
    description: "Maintain a transparent rate board for every supported service and publish changes quickly.",
  },
  services: {
    title: "Services",
    subtitle: "Review modules, availability, and operational status.",
    eyebrow: "Platform",
    description: "See which services are live, what needs attention, and where future expansion can slot into the platform.",
  },
  testimonials: {
    title: "Testimonials",
    subtitle: "Approve, reject, and publish customer feedback.",
    eyebrow: "Reputation",
    description: "Moderate reviews before they go live so the storefront stays trusted and professionally curated.",
  },
  tickets: {
    title: "Support Tickets",
    subtitle: "Respond to customer issues and escalations.",
    eyebrow: "Support",
    description: "Stay ahead of deposit disputes, delay complaints, and Buy4Me follow-ups with a clean queue and clear ownership.",
  },
  notifications: {
    title: "Notifications",
    subtitle: "Broadcast updates and keep admins informed.",
    eyebrow: "Messaging",
    description: "Review outgoing announcements, operational alerts, and customer-facing messages from one place.",
  },
  kyc: {
    title: "KYC Verification",
    subtitle: "Approve identities and reduce fraud risk.",
    eyebrow: "Compliance",
    description: "Track pending KYC submissions, flagged identities, and the documents needing review or escalation.",
  },
  settings: {
    title: "General Settings",
    subtitle: "Control platform defaults and admin preferences.",
    eyebrow: "Configuration",
    description: "Manage working hours, dashboard defaults, automation toggles, and brand-level operational settings.",
  },
  payment: {
    title: "Payment Details",
    subtitle: "Manage payout channels and receiving accounts.",
    eyebrow: "Finance",
    description: "Keep bank details, digital account handles, and service-specific receiving information up to date.",
  },
  security: {
    title: "Security",
    subtitle: "Track access, sessions, and high-risk actions.",
    eyebrow: "Protection",
    description: "Review login events, privileged actions, and any suspicious patterns that deserve immediate attention.",
  },
};

export const adminTransactionsData = [] as any[];

export const adminBuy4MeOrders = [] as any[];

export const adminUsersData = [] as any[];

export const adminBonusRules = [
  { tier: "Referral Bonus", minimum: "$30+ transaction", rate: "Manual", appliesTo: "Referred person must complete a transaction worth at least $30 before admin adds the bonus." },
  { tier: "Bonus Withdrawal", minimum: "No minimum", rate: "Any amount", appliesTo: "Users can request a bonus withdrawal for any available bonus balance." },
  { tier: "Threshold Bonus", minimum: "Admin verified", rate: "Manual", appliesTo: "Admin adds threshold bonuses manually after confirming the qualifying transaction." },
];

export const adminServiceHealth = [
  { service: "Deriv", uptime: "99.4%", volume: "High", status: "Live" },
  { service: "Crypto", uptime: "99.7%", volume: "High", status: "Live" },
  { service: "Skrill", uptime: "97.8%", volume: "Medium", status: "Watch" },
  { service: "PayPal", uptime: "98.9%", volume: "High", status: "Live" },
  { service: "Zelle", uptime: "96.6%", volume: "Medium", status: "Watch" },
  { service: "Payoneer", uptime: "98.1%", volume: "Medium", status: "Live" },
  { service: "Buy 4 Me", uptime: "100%", volume: "Growing", status: "Live" },
];

export const adminTestimonialsQueue = [] as any[];

export const adminTicketsData = [] as any[];

export const adminNotificationsData = [] as any[];

export const adminKycData = [] as any[];

export const adminSettingsData = [
  { label: "Business Hours", value: "08:00 - 22:00 WAT" },
  { label: "Default Review SLA", value: "15 minutes" },
  { label: "Notification Sound", value: "Enabled" },
  { label: "Auto Rate Refresh", value: "Every 30 minutes" },
];

export const adminPaymentData = [
  { channel: "Bank Transfer", details: "Kuda Microfinance Bank | Ofenetworks Solutions NG LTD | 3003193472 | Narration: payment for chicken feeds", usage: "All deposits", status: "Primary" },
  { channel: "USDT TRC20", details: "Tron wallet: TJLZtrdyxUuE96zwj687S63Z2zVes8in73", usage: "Crypto", status: "Active" },
  { channel: "PayPal", details: "oreofeoluwatise@yahoo.com", usage: "PayPal withdrawals", status: "Active" },
  { channel: "Zelle", details: "+12673998390 | Olaoluwa Oladele", usage: "Zelle payments", status: "Active" },
];

export const adminSecurityEvents = [
  { event: "Admin login", actor: "Admin", location: "Lagos, NG", status: "Successful", time: "5 mins ago" },
  { event: "Rate board updated", actor: "Admin", location: "Lagos, NG", status: "Tracked", time: "18 mins ago" },
  { event: "Suspicious password retry", actor: "Unknown", location: "Abuja, NG", status: "Blocked", time: "1 hour ago" },
];
