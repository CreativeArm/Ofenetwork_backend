import type { SVGProps } from "react";

interface IconProps extends SVGProps<SVGSVGElement> {
  name:
    | "logo"
    | "grid"
    | "spark"
    | "coin"
    | "wallet"
    | "paypal"
    | "venmo"
    | "ring"
    | "bag"
    | "swap"
    | "users"
    | "chart"
    | "quote"
    | "chat"
    | "bell"
    | "shield"
    | "gear"
    | "bank"
    | "lock"
    | "menu"
    | "x"
    | "search"
    | "eye"
    | "upload"
    | "mail"
    | "pin"
    | "check"
    | "arrow";
}

export function Icon({ name, className, ...props }: IconProps) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
    className,
    ...props,
  };

  switch (name) {
    case "logo":
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <img
          src="/logo.png"
          alt="Ofenetworks logo"
          className={className}
          style={{ objectFit: "contain" }}
        />
      );
    case "grid":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="6" height="6" rx="1.5" />
          <rect x="14" y="4" width="6" height="6" rx="1.5" />
          <rect x="4" y="14" width="6" height="6" rx="1.5" />
          <rect x="14" y="14" width="6" height="6" rx="1.5" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path d="M12 3l1.8 4.8L19 9.5l-4.2 2.5L13 17l-1.8-5-4.2-2.5 5.2-1.7L12 3z" />
        </svg>
      );
    case "coin":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M10 9.5c.5-.7 1.2-1 2-1 1.4 0 2.5.8 2.5 2s-1 1.7-2.5 2c-1.5.3-2.5.8-2.5 2 0 1.1 1 2 2.5 2 .9 0 1.7-.3 2.2-.9" />
          <path d="M12 7v10" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...common}>
          <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h10A2.5 2.5 0 0 1 19 8.5V10H8a2 2 0 0 0 0 4h11v1.5A2.5 2.5 0 0 1 16.5 18h-10A2.5 2.5 0 0 1 4 15.5v-7z" />
          <path d="M19 10h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1" />
        </svg>
      );
    case "paypal":
      return (
        <svg {...common}>
          <path d="M8 18l1.5-12H15c2.4 0 4 1.3 4 3.6 0 3.1-2.2 5.2-5.4 5.2H11L10.4 18H8z" />
          <path d="M6 20l1.3-9H11" />
        </svg>
      );
    case "venmo":
      return (
        <svg {...common}>
          <path d="M6 6l4.2 12h3.1L18 6" />
          <path d="M14.3 6c.5 2.6-.1 5.2-2.8 8.3" />
        </svg>
      );
    case "ring":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M4 12a8 8 0 0 1 8-8" className="text-orange-500" />
        </svg>
      );
    case "bag":
      return (
        <svg {...common}>
          <path d="M6.5 8h11l-.7 10.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6.5 8z" />
          <path d="M9 9V7a3 3 0 0 1 6 0v2" />
        </svg>
      );
    case "swap":
      return (
        <svg {...common}>
          <path d="M7 7h10" />
          <path d="M13 3l4 4-4 4" />
          <path d="M17 17H7" />
          <path d="M11 13l-4 4 4 4" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <path d="M16 19a4 4 0 0 0-8 0" />
          <circle cx="12" cy="11" r="3" />
          <path d="M19 19a3 3 0 0 0-2-2.8" />
          <path d="M5 19a3 3 0 0 1 2-2.8" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common}>
          <path d="M5 18l4-5 3 3 6-8" />
          <path d="M5 5v14h14" />
        </svg>
      );
    case "quote":
      return (
        <svg {...common}>
          <path d="M9 10H6v3a3 3 0 0 0 3 3V10z" />
          <path d="M18 10h-3v3a3 3 0 0 0 3 3V10z" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M6 18l-2 2V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6z" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path d="M15 17H5l1.2-1.2A2 2 0 0 0 7 14.4V10a5 5 0 1 1 10 0v4.4a2 2 0 0 0 .6 1.4L19 17h-4" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3l7 3v5c0 4.2-2.7 8-7 10-4.3-2-7-5.8-7-10V6l7-3z" />
          <path d="M9.5 12l1.7 1.7L14.8 10" />
        </svg>
      );
    case "gear":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1 1 0 0 1 0 1.4l-1 1a1 1 0 0 1-1.4 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1 1 0 0 1-1.4 0l-1-1a1 1 0 0 1 0-1.4l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a1 1 0 0 1-1-1v-1.5a1 1 0 0 1 1-1h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1 1 0 0 1 0-1.4l1-1a1 1 0 0 1 1.4 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a1 1 0 0 1 1-1h1.5a1 1 0 0 1 1 1v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1 1 0 0 1 1.4 0l1 1a1 1 0 0 1 0 1.4l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a1 1 0 0 1 1 1V13a1 1 0 0 1-1 1h-.2a1 1 0 0 0-.9.6z" />
        </svg>
      );
    case "bank":
      return (
        <svg {...common}>
          <path d="M3 9l9-5 9 5" />
          <path d="M4 10h16" />
          <path d="M6 10v8" />
          <path d="M10 10v8" />
          <path d="M14 10v8" />
          <path d="M18 10v8" />
          <path d="M3 20h18" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 1 1 8 0v3" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      );
    case "eye":
      return (
        <svg {...common}>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case "upload":
      return (
        <svg {...common}>
          <path d="M12 16V6" />
          <path d="M8.5 9.5L12 6l3.5 3.5" />
          <path d="M5 18.5h14" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <path d="M5 8l7 5 7-5" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12.5l2.5 2.5 4.5-5" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      );
    default:
      return null;
  }
}
