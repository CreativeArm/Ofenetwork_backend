"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "./icons";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:4000/api";

const supportTopics = [
  "Deposit issue",
  "Withdrawal delay",
  "Buy4Me request",
  "Rate question",
  "General support",
] as const;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export function SupportRequestForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!name.trim() || !email.trim() || !topic || !message.trim()) {
      setErrorMessage("Please complete your name, email, topic, and message.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/support/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          topic,
          message: message.trim(),
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | {
            message?: string | string[];
            ticket?: { id?: string };
          }
        | null;

      if (!response.ok) {
        const error = Array.isArray(data?.message)
          ? data.message[0]
          : data?.message ?? "Unable to send your support request.";
        throw new Error(error);
      }

      const reference = data?.ticket?.id ? ` Reference: ${data.ticket.id}` : "";
      setSuccessMessage(
        `${data?.message ?? "Support request sent successfully."}${reference}`,
      );
      setTopic("");
      setMessage("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-6 space-y-4 sm:mt-8 sm:space-y-5" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="support-name"
          className="mb-2 block text-sm font-medium text-slate-600"
        >
          Name
        </label>
        <input
          id="support-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Jane Smith"
          className="w-full rounded-2xl border border-[#e7eee9] bg-[#f8fbf8] px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-3 focus:ring-emerald-50"
        />
      </div>

      <div>
        <label
          htmlFor="support-email"
          className="mb-2 block text-sm font-medium text-slate-600"
        >
          Email
        </label>
        <input
          id="support-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email address"
          className="w-full rounded-2xl border border-[#e7eee9] bg-[#f8fbf8] px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-3 focus:ring-emerald-50"
        />
      </div>

      <div>
        <label
          htmlFor="support-topic"
          className="mb-2 block text-sm font-medium text-slate-600"
        >
          Support topic
        </label>
        <select
          id="support-topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          className="w-full rounded-2xl border border-[#e7eee9] bg-[#f8fbf8] px-4 py-3 pr-12 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-3 focus:ring-emerald-50"
        >
          <option value="" disabled>
            Select...
          </option>
          {supportTopics.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="support-message"
          className="mb-2 block text-sm font-medium text-slate-600"
        >
          Message
        </label>
        <textarea
          id="support-message"
          rows={6}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Tell us what happened and include any transaction reference if available."
          className="w-full resize-none rounded-2xl border border-[#e7eee9] bg-[#f8fbf8] px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-3 focus:ring-emerald-50"
        />
      </div>

      {errorMessage ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#0f7b36] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,123,54,0.2)] transition hover:-translate-y-0.5 hover:bg-[#0d6b2f] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 sm:w-auto"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0f7b36]">
          <Icon name="arrow" className="h-4 w-4" />
        </span>
        {isSubmitting ? "Sending request..." : "Send Request"}
      </button>
    </form>
  );
}
