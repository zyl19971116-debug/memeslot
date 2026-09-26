"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

export type RowAccent = "green" | "purple" | "cyan";

const ACCENTS: Record<RowAccent, { number: string; underline: string }> = {
  green: {
    number: "linear-gradient(135deg, #55FF6A 0%, #22D3EE 120%)",
    underline: "linear-gradient(90deg, #55FF6A, transparent)",
  },
  purple: {
    number: "linear-gradient(135deg, #D946EF 0%, #FB7185 120%)",
    underline: "linear-gradient(90deg, #D946EF, transparent)",
  },
  cyan: {
    number: "linear-gradient(135deg, #00D9FF 0%, #3B82F6 120%)",
    underline: "linear-gradient(90deg, #00D9FF, transparent)",
  },
};

interface SelectorRowProps {
  index: string;
  title: string;
  description: string;
  accent: RowAccent;
  children: ReactNode;
}

/**
 * One builder row: category label on the left, horizontally scrollable
 * cards on the right (mouse wheel / drag / touch + arrow button).
 */
export default function SelectorRow({
  index,
  title,
  description,
  accent,
  children,
}: SelectorRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollerId = useId();
  const [canScroll, setCanScroll] = useState(false);
  const [scrollMetrics, setScrollMetrics] = useState({ thumb: 24, left: 0 });
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const trackDrag = useRef(false);
  const a = ACCENTS[accent];

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const scrollable = el.scrollWidth > el.clientWidth + 8;
    setCanScroll(scrollable);
    const thumb = scrollable ? Math.max(18, (el.clientWidth / el.scrollWidth) * 100) : 100;
    const progress = el.scrollWidth === el.clientWidth ? 0 : el.scrollLeft / (el.scrollWidth - el.clientWidth);
    setScrollMetrics({ thumb, left: progress * (100 - thumb) });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const onWheel = (e: React.WheelEvent) => {
    const el = scrollerRef.current;
    if (!el) return;
    // vertical wheel scrolls the row horizontally (trackpads: natural deltaX)
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
      el.scrollLeft += e.deltaY;
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const el = scrollerRef.current;
    if (!el || e.pointerType === "touch") return; // touch uses native scrolling
    drag.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = scrollerRef.current;
    if (!el || !drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.startScroll - dx;
  };

  const endDrag = () => {
    drag.current.active = false;
  };

  const scrollNext = () => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.75, behavior: "smooth" });
  };

  const moveFromTrack = (clientX: number) => {
    const track = trackRef.current;
    const scroller = scrollerRef.current;
    if (!track || !scroller) return;
    const rect = track.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    scroller.scrollLeft = fraction * (scroller.scrollWidth - scroller.clientWidth);
  };

  return (
    <div
      className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6"
      style={{
        background: "rgba(248,250,252,0.75)",
        border: "1px solid rgba(15,23,42,0.06)",
        borderRadius: 28,
        padding: "18px 22px",
      }}
    >
      {/* left category label */}
      <div className="w-full shrink-0 lg:w-[140px]">
        <div
          className="font-display text-3xl leading-none"
          style={{
            background: a.number,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {index}
        </div>
        <div className="mt-1.5 text-sm font-black tracking-[0.14em] text-[#17181c]">
          {title}
        </div>
        <div
          className="mt-1.5 h-[3px] w-8 rounded-full"
          style={{ background: a.underline }}
        />
        <p className="mt-2 text-[11px] leading-relaxed text-black/45">{description}</p>
      </div>

      {/* right: scrollable cards */}
      <div className="relative min-w-0 flex-1">
        <div
          id={scrollerId}
          ref={scrollerRef}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onScroll={measure}
          className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-2"
          style={{ cursor: "grab" }}
        >
          {children}
          {/* end spacer so the last card can be fully scrolled into view */}
          <div className="w-1 shrink-0" />
        </div>

        {canScroll && (
          <div
            ref={trackRef}
            className="selector-track mt-2"
            role="scrollbar"
            aria-label={`${title} horizontal scrollbar`}
            aria-orientation="horizontal"
            aria-controls={scrollerId}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((scrollMetrics.left / Math.max(1, 100 - scrollMetrics.thumb)) * 100)}
            onPointerDown={(event) => {
              trackDrag.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              moveFromTrack(event.clientX);
            }}
            onPointerMove={(event) => {
              if (trackDrag.current) moveFromTrack(event.clientX);
            }}
            onPointerUp={(event) => {
              trackDrag.current = false;
              event.currentTarget.releasePointerCapture(event.pointerId);
            }}
          >
            <div
              className="selector-thumb"
              style={{ width: `${scrollMetrics.thumb}%`, left: `${scrollMetrics.left}%` }}
            />
          </div>
        )}

        {canScroll && (
          <button
            onClick={scrollNext}
            aria-label="Scroll right"
            className="absolute -right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white text-sm font-bold text-black/70 shadow-lg transition-all hover:scale-110 hover:text-black"
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
}
