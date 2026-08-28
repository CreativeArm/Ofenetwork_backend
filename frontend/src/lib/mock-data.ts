export type UserServiceSlug =
  | "dashboard"
  | "deriv"
  | "crypto"
  | "skrill"
  | "paypal"
  | "venmo"
  | "payoneer"
  | "buy4me";

type ManagedServiceSlug = Exclude<UserServiceSlug, "dashboard" | "buy4me">;

export interface ServiceConfig {
  slug: ManagedServiceSlug;
  name: string;
  icon: string;
  accent: string;
  description: string;
  depositTitle: string;
  depositSubtitle: string;
  depositMethodLabel: string;
  depositMethodValue: string;
  depositFields: Array<{
    label: string;
    placeholder: string;
    suffix?: string;
  }>;
  withdrawalTitle: string;
  withdrawalSubtitle: string;
  withdrawalMethodLabel: string;
  withdrawalMethodValue: string;
  withdrawalFields: Array<{
    label: string;
    placeholder: string;
  }>;
}

export const userNavigation = [
  { href: "/dashboard", label: "Dashboard", icon: "grid", slug: "dashboard" },
  { href: "/services/deriv", label: "Deriv", icon: "spark", slug: "deriv" },
  { href: "/services/crypto", label: "Crypto", icon: "coin", slug: "crypto" },
  { href: "/services/skrill", label: "Skrill", icon: "wallet", slug: "skrill" },
  { href: "/services/paypal", label: "PayPal", icon: "paypal", slug: "paypal" },
  { href: "/services/venmo", label: "Zelle", icon: "venmo", slug: "venmo" },
  { href: "/services/payoneer", label: "Payoneer", icon: "ring", slug: "payoneer" },
  { href: "/dashboard/buy4me", label: "Buy4Me", icon: "bag", slug: "buy4me" },
];

export const adminNavigation = [
  { href: "/admin", label: "Dashboard", icon: "grid", group: "main" },
  { href: "/admin/transactions", label: "Transactions", icon: "swap", group: "main" },
  { href: "/admin/buy4me", label: "Buy 4 Me Orders", icon: "bag", group: "main" },
  { href: "/admin/users", label: "Users", icon: "users", group: "main" },
  { href: "/admin/bonuses", label: "Bonuses", icon: "wallet", group: "main" },
  { href: "/admin/rates", label: "Exchange Rates", icon: "chart", group: "main" },
  { href: "/admin/services", label: "Services", icon: "spark", group: "main" },
  { href: "/admin/testimonials", label: "Testimonials", icon: "quote", group: "market" },
  { href: "/admin/tickets", label: "Support Tickets", icon: "chat", group: "market" },
  { href: "/admin/notifications", label: "Notifications", icon: "bell", group: "market" },
  { href: "/admin/kyc", label: "KYC Verification", icon: "shield", group: "market" },
  { href: "/admin/settings", label: "General Settings", icon: "gear", group: "settings" },
  { href: "/admin/payment", label: "Payment Details", icon: "bank", group: "settings" },
  { href: "/admin/security", label: "Security", icon: "lock", group: "settings" },
];

export const publicNavigation = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/buy4me", label: "Buy 4 Me" },
  { href: "/support", label: "Support" },
];

export const bonusBalance = "N24,560.50";

const ofeBankDepositDetails = "Kuda Microfinance Bank | Ofenetworks Solutions NG LTD | 3003193472";

export const serviceConfigs: ServiceConfig[] = [
  {
    slug: "deriv",
    name: "Deriv",
    icon: "spark",
    accent: "bg-rose-50 text-rose-600 border-rose-100",
    description: "Trade synthetic indices and fund your Deriv account with confidence.",
    depositTitle: "Make a Deposit",
    depositSubtitle: "Fund your account via bank transfer.",
    depositMethodLabel: "Ofenetworks Bank Account to Pay To",
    depositMethodValue: ofeBankDepositDetails,
    depositFields: [
      { label: "Amount (USD)", placeholder: "Enter amount in USD", suffix: "$" },
      { label: "Client Nickname", placeholder: "Enter client nickname" },
    ],
    withdrawalTitle: "Make a Withdrawal",
    withdrawalSubtitle: "Withdraw funds to your bank account.",
    withdrawalMethodLabel: "Withdraw to",
    withdrawalMethodValue: "Ofenetworks Solutions NG LTD",
    withdrawalFields: [
      { label: "Bank Name", placeholder: "Select your bank" },
      { label: "Account Name", placeholder: "Enter account name" },
      { label: "Account Number", placeholder: "Enter account number" },
    ],
  },
  {
    slug: "crypto",
    name: "Crypto",
    icon: "coin",
    accent: "bg-amber-50 text-amber-600 border-amber-100",
    description: "Buy, sell, and manage your cryptocurrency transactions.",
    depositTitle: "Make a Deposit",
    depositSubtitle: "Deposit USDT (TRC20) to fund your account.",
    depositMethodLabel: "USDT (TRC20) Wallet Details",
    depositMethodValue: "Network: Tron (TRC20) | Wallet: TJLZtrdyxUuE96zwj687S63Z2zVes8in73",
    depositFields: [
      { label: "Amount (USD/USDT)", placeholder: "Enter amount in USD or USDT", suffix: "$" },
      { label: "Crypto Address", placeholder: "Enter your crypto wallet address" },
    ],
    withdrawalTitle: "Make a Withdrawal",
    withdrawalSubtitle: "Make a withdrawal to your bank account.",
    withdrawalMethodLabel: "Withdrawal to USDT (TRC20) Wallet Address",
    withdrawalMethodValue: "Network: Tron (TRC20) | Wallet: TJLZtrdyxUuE96zwj687S63Z2zVes8in73",
    withdrawalFields: [
      { label: "Bank Name", placeholder: "Select your bank" },
      { label: "Account Name", placeholder: "Enter account name" },
      { label: "Account Number", placeholder: "Enter account number" },
    ],
  },
  {
    slug: "skrill",
    name: "Skrill",
    icon: "wallet",
    accent: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
    description: "Send and receive money securely with Skrill.",
    depositTitle: "Make a Deposit",
    depositSubtitle: "Fund your account via Skrill.",
    depositMethodLabel: "Ofenetworks Bank Account to Pay To",
    depositMethodValue: ofeBankDepositDetails,
    depositFields: [
      { label: "Amount (USD)", placeholder: "Enter amount in USD", suffix: "$" },
      { label: "Email Address", placeholder: "Enter your Skrill email address" },
    ],
    withdrawalTitle: "Make a Withdrawal",
    withdrawalSubtitle: "Withdraw funds to your bank account.",
    withdrawalMethodLabel: "Send your dollar amount to the details below",
    withdrawalMethodValue: "Name: OoreofeOluwa Oluwatise | Skrill Email: oreofeoluwatise@yahoo.com",
    withdrawalFields: [
      { label: "Bank Name", placeholder: "Select your bank" },
      { label: "Account Name", placeholder: "Enter account name" },
      { label: "Account Number", placeholder: "Enter account number" },
    ],
  },
  {
    slug: "paypal",
    name: "PayPal",
    icon: "paypal",
    accent: "bg-sky-50 text-sky-700 border-sky-100",
    description: "Send and receive money securely with PayPal.",
    depositTitle: "Make a Deposit",
    depositSubtitle: "Fund your account via PayPal.",
    depositMethodLabel: "Ofenetworks Bank Account to Pay To",
    depositMethodValue: ofeBankDepositDetails,
    depositFields: [
      { label: "Amount (USD)", placeholder: "Enter amount in USD", suffix: "$" },
      { label: "PayPal Email", placeholder: "Enter your PayPal email address" },
    ],
    withdrawalTitle: "Make a Withdrawal",
    withdrawalSubtitle: "Withdraw funds to your bank account.",
    withdrawalMethodLabel: "Send your dollar amount to the details below",
    withdrawalMethodValue: "PayPal Email: oreofeoluwatise@yahoo.com | Account Name: OreofeOluwa Oluwatise",
    withdrawalFields: [
      { label: "Bank Name", placeholder: "Select your bank" },
      { label: "Account Name", placeholder: "Enter account name" },
      { label: "Account Number", placeholder: "Enter account number" },
    ],
  },
  {
    slug: "venmo",
    name: "Zelle",
    icon: "venmo",
    accent: "bg-cyan-50 text-cyan-700 border-cyan-100",
    description: "Send and receive Zelle payments with clear manual review.",
    depositTitle: "Make a Deposit",
    depositSubtitle: "Fund your account via bank transfer.",
    depositMethodLabel: "Ofenetworks Bank Account to Pay To",
    depositMethodValue: ofeBankDepositDetails,
    depositFields: [
      { label: "Amount (USD)", placeholder: "Enter amount in USD", suffix: "$" },
      { label: "Your Zelle Phone or Email", placeholder: "Enter your Zelle phone number or email" },
    ],
    withdrawalTitle: "Make a Withdrawal",
    withdrawalSubtitle: "Receive funds through your Zelle account.",
    withdrawalMethodLabel: "Withdrawal to Zelle",
    withdrawalMethodValue: "Provide your Zelle phone number or email address.",
    withdrawalFields: [
      { label: "Zelle Phone or Email", placeholder: "Enter your Zelle phone number or email" },
      { label: "Account Name", placeholder: "Enter the account holder name" },
    ],
  },
  {
    slug: "payoneer",
    name: "Payoneer",
    icon: "ring",
    accent: "bg-orange-50 text-orange-600 border-orange-100",
    description: "Move funds through Payoneer with clear tracking and admin review.",
    depositTitle: "Make a Deposit",
    depositSubtitle: "Submit a Payoneer funding transaction.",
    depositMethodLabel: "Receiver Details",
    depositMethodValue: "Payoneer Email: payments@ofenetworks.ng",
    depositFields: [
      { label: "Amount (USD)", placeholder: "Enter amount in USD", suffix: "$" },
      { label: "Your Payoneer Email", placeholder: "Enter your Payoneer email" },
    ],
    withdrawalTitle: "Make a Withdrawal",
    withdrawalSubtitle: "Cash out to your bank after review.",
    withdrawalMethodLabel: "Send amount to",
    withdrawalMethodValue: "Payoneer Email: payments@ofenetworks.ng",
    withdrawalFields: [
      { label: "Bank Name", placeholder: "Select your bank" },
      { label: "Account Name", placeholder: "Enter account name" },
      { label: "Account Number", placeholder: "Enter account number" },
    ],
  },
];

export const serviceTabs = [
  "deriv",
  "crypto",
  "skrill",
  "paypal",
  "venmo",
  "payoneer",
  "buy4me",
] as const;

export const homeRates = [
  { name: "Deriv", deposit: "N1,650.00 / $1", withdrawal: "N1,720.00 / $1" },
  { name: "Crypto (USDT TRC20)", deposit: "N1,580.00 / $1", withdrawal: "N1,680.00 / $1" },
  { name: "Skrill", deposit: "N1,640.00 / $1", withdrawal: "N1,700.00 / $1" },
  { name: "PayPal", deposit: "N1,650.00 / $1", withdrawal: "N1,720.00 / $1" },
  { name: "Zelle", deposit: "N1,640.00 / $1", withdrawal: "N1,700.00 / $1" },
  { name: "Payoneer", deposit: "N1,645.00 / $1", withdrawal: "N1,710.00 / $1" },
  { name: "Buy 4 Me", deposit: "Custom Quote", withdrawal: "Custom Quote" },
];

export const homeOffers = [
  { title: "Deriv", description: "Trade synthetic indices and global markets with ease.", icon: "deriv" },
  { title: "Crypto", description: "Buy, sell, swap and manage top cryptocurrencies.", icon: "crypto" },
  { title: "PayPal", description: "Make and receive payments quickly and instantly.", icon: "paypal" },
  { title: "Skrill", description: "Fund your account and send money globally with Skrill.", icon: "skrill" },
  { title: "Buy 4 Me", description: "Can not pay for it yourself? We buy it for you.", icon: "buy4me" },
  { title: "More Services", description: "Discover more ways we can help you.", icon: "grid" },
];

export const testimonials = [
  {
    name: "Daniel E.",
    badge: "Verified User",
    quote: "Fast, reliable and trustworthy. My transactions are always successful and support is top-notch.",
  },
  {
    name: "Mary A.",
    badge: "Verified User",
    quote: "I love how easy it is to fund my accounts and swap crypto. Best platform so far.",
  },
  {
    name: "Kelvin O.",
    badge: "Verified User",
    quote: "The exchange rates are the best I have found. Super transparent and very professional.",
  },
];

export const dashboardTransactions: Array<{
  id: string;
  service: string;
  meta: string;
  amount: string;
  status: string;
}> = [];

export const adminMetrics = [
  { label: "Total Users", value: "0", trend: "Live platform count", tint: "emerald" },
  { label: "Total Transactions", value: "N0.00", trend: "Live transaction total", tint: "violet" },
  { label: "Total Deposits", value: "N0.00", trend: "Confirmed deposits volume", tint: "sky" },
  { label: "Total Withdrawals", value: "N0.00", trend: "Confirmed withdrawals volume", tint: "amber" },
  { label: "Buy 4 Me Orders", value: "0", trend: "Orders created on platform", tint: "pink" },
];

export const orderStatus = [
  { label: "Pending", value: 0, color: "bg-orange-500" },
  { label: "In Progress", value: 0, color: "bg-blue-600" },
  { label: "Completed", value: 0, color: "bg-emerald-600" },
];

export const systemSummary = [
  { label: "Pending Deposits", value: 0 },
  { label: "Pending Withdrawals", value: 0 },
  { label: "Open Support Tickets", value: 0 },
  { label: "Unverified Users", value: 0 },
  { label: "Bonus Qualification Alerts", value: 0 },
];

export const quickActions = [
  { label: "Add Exchange Rate", href: "/admin/rates" },
  { label: "Create Notification", href: "/admin/notifications" },
  { label: "Approve KYC", href: "/admin/kyc" },
  { label: "Manage Testimonials", href: "/admin/testimonials" },
  { label: "View All Orders", href: "/admin/buy4me" },
  { label: "System Settings", href: "/admin/settings" },
];

export const recentUsers: Array<{
  name: string;
  email: string;
  status: string;
  time: string;
}> = [];

export const buy4MeSteps = [
  {
    title: "Submit Link(s)",
    text: "Paste product links and send your request.",
  },
  {
    title: "We Confirm & Quote",
    text: "Our team confirms availability and calculates the total cost.",
  },
  {
    title: "Make Payment",
    text: "Review the total cost, pay and upload your receipt.",
  },
  {
    title: "We Buy & Ship",
    text: "We purchase, ship and deliver to your doorstep.",
  },
];

export const buy4MeCategories = [
  "Electronics (Phones, Laptops, Gadgets)",
  "Vehicles (Cars, Bikes, Trucks)",
  "Machinery & Equipment",
  "Fashion & Accessories",
  "Home Appliances",
  "Furniture",
  "And much more",
];

export const supportReasons = [
  "Transparent Pricing",
  "Real-time Updates",
  "Professional Support",
  "Safe & Secure",
];
