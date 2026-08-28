"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { fetchTestimonials } from "../lib/admin-backend";
import { Icon } from "./icons";

export interface TestimonialCarouselItem {
  name: string;
  badge: string;
  quote: string;
}

interface TestimonialsCarouselProps {
  items: TestimonialCarouselItem[];
}

export function TestimonialsCarousel({ items }: TestimonialsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reviews, setReviews] = useState(items);

  useEffect(() => {
    setReviews(items);
  }, [items]);

  useEffect(() => {
    let active = true;

    const loadApprovedReviews = async () => {
      try {
        const approved = await fetchTestimonials("APPROVED");
        if (active && approved.length > 0) {
          setReviews(
            approved.map((item) => ({
              name: item.name,
              badge: item.service,
              quote: item.text,
            })),
          );
        }
      } catch {
        return;
      }
    };

    void loadApprovedReviews();
    const interval = window.setInterval(() => void loadApprovedReviews(), 60_000);
    const onFocus = () => void loadApprovedReviews();
    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (reviews.length === 0) {
    return null;
  }

  const previousIndex = (activeIndex - 1 + reviews.length) % reviews.length;
  const nextIndex = (activeIndex + 1) % reviews.length;

  const scrollReviews = (
    direction: "previous" | "next",
    event?: MouseEvent<HTMLAnchorElement>,
  ) => {
    const scroller = scrollerRef.current;
    if (!scroller || reviews.length <= 1) {
      return;
    }

    event?.preventDefault();
    const nextIndex =
      direction === "next"
        ? (activeIndex + 1) % reviews.length
        : (activeIndex - 1 + reviews.length) % reviews.length;
    const cards = scroller.querySelectorAll<HTMLElement>("[data-review-card]");
    const targetCard = cards[nextIndex];

    setActiveIndex(nextIndex);
    targetCard?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  };

  return (
    <div className="relative mt-8">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((item, index) => (
          <article
            key={`${item.name}-${item.badge}`}
            id={`review-${index}`}
            data-review-card
            className="min-h-[180px] w-[88%] shrink-0 snap-start rounded-[26px] border border-[#edf1ee] bg-[#fcfdfc] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,32,0.07)] sm:w-[420px] lg:w-[calc((100%_-_40px)/3)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700">
                {item.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs font-medium text-[#0f7b36]">
                  {item.badge}
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-600">
              {item.quote}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <a
          href={`#review-${previousIndex}`}
          onClick={(event) => scrollReviews("previous", event)}
          aria-disabled={reviews.length <= 1}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#dce7e0] bg-white text-slate-700 shadow-[0_10px_24px_rgba(15,23,32,0.05)] transition hover:border-[#b8d7c5] hover:text-[#0f7b36] aria-disabled:pointer-events-none aria-disabled:opacity-50"
          aria-label="See previous review"
        >
          <Icon name="arrow" className="h-4 w-4 rotate-180" />
        </a>
        <a
          href={`#review-${nextIndex}`}
          onClick={(event) => scrollReviews("next", event)}
          aria-disabled={reviews.length <= 1}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#dce7e0] bg-white text-slate-700 shadow-[0_10px_24px_rgba(15,23,32,0.05)] transition hover:border-[#b8d7c5] hover:text-[#0f7b36] aria-disabled:pointer-events-none aria-disabled:opacity-50"
          aria-label="See next review"
        >
          <Icon name="arrow" className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
