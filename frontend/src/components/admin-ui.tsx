import type { ReactNode } from "react";

export function AdminCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[28px] border border-[#e7ece8] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,32,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function AdminStatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  const toneClasses =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "bg-amber-50 text-amber-700"
        : tone === "danger"
          ? "bg-rose-50 text-rose-700"
          : tone === "info"
            ? "bg-sky-50 text-sky-700"
            : "bg-slate-100 text-slate-700";

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClasses}`}>{label}</span>;
}

export function AdminSectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[30px] bg-[linear-gradient(135deg,#123b27,#0f7b36)] p-6 text-white shadow-[0_20px_60px_rgba(15,123,54,0.16)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold leading-tight">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-emerald-50/90">{description}</p>
    </div>
  );
}
