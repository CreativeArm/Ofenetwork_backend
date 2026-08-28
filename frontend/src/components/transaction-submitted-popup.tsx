"use client";

import { useBodyScrollLock } from "../lib/use-body-scroll-lock";
import { Icon } from "./icons";

export type TransactionSubmittedPopupContent = {
  title: string;
  message: string;
  detail?: string;
};

export function TransactionSubmittedPopup({
  content,
  onClose,
}: {
  content: TransactionSubmittedPopupContent | null;
  onClose: () => void;
}) {
  useBodyScrollLock(Boolean(content));

  if (!content) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-submitted-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 px-4 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] translate-y-0 rounded-[30px] border border-emerald-100 bg-white p-6 text-center shadow-[0_24px_80px_rgba(15,23,32,0.18)] transition-all duration-300 ease-out"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-[#0f7b36] ring-8 ring-emerald-50/60">
          <Icon name="check" className="h-8 w-8" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Transaction Submitted
        </p>
        <h2 id="transaction-submitted-title" className="mt-2 text-2xl font-semibold text-slate-950">
          {content.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{content.message}</p>
        {content.detail ? (
          <p className="mt-4 rounded-2xl bg-[#f6faf7] px-4 py-3 text-sm leading-6 text-slate-600">
            {content.detail}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-[#0f7b36] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#116f34]"
        >
          Okay, got it
        </button>
      </div>
    </div>
  );
}
