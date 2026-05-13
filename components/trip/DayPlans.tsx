"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TripDetail } from "@/lib/types/trip";

interface Props {
  dayPlans: NonNullable<TripDetail["dayPlans"]>;
  destinationName: string;
}

const SLOT_ORDER = ["Morning", "Midday", "Afternoon", "Evening"] as const;
type SlotTime = (typeof SLOT_ORDER)[number];

const parentVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const childVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};

function getVibeGradient(vibe: string): string {
  const v = vibe.toLowerCase();
  if (
    v.includes("hik") ||
    v.includes("adventur") ||
    v.includes("natur") ||
    v.includes("mountain") ||
    v.includes("outdoor")
  ) {
    return "linear-gradient(135deg, #FFF4E8 0%, #FFE4CC 100%)";
  }
  if (
    v.includes("spa") ||
    v.includes("relax") ||
    v.includes("wellness") ||
    v.includes("chill") ||
    v.includes("cozy")
  ) {
    return "linear-gradient(135deg, #E8F4F0 0%, #D4E9DD 100%)";
  }
  if (v.includes("romant") || v.includes("couples")) {
    return "linear-gradient(135deg, #FCE8F3 0%, #F5D7E5 100%)";
  }
  if (v.includes("food") || v.includes("foodie") || v.includes("culinary")) {
    return "linear-gradient(135deg, #FFF8E1 0%, #FFE8B0 100%)";
  }
  if (v.includes("nightlife") || v.includes("party") || v.includes("bars")) {
    return "linear-gradient(135deg, #E8E4F8 0%, #D4CCED 100%)";
  }
  if (
    v.includes("explorer") ||
    v.includes("culture") ||
    v.includes("history") ||
    v.includes("city") ||
    v.includes("art")
  ) {
    return "linear-gradient(135deg, #E4EEF8 0%, #CCDDED 100%)";
  }
  return "linear-gradient(135deg, #FFF5EC 0%, #FFE4D0 100%)";
}

const CARD_BORDER = "1px solid rgba(13,115,119,0.06)";
const CARD_SHADOW =
  "0 1px 2px rgba(0,0,0,0.04), 0 12px 32px -12px rgba(13,115,119,0.10)";
const CARD_SHADOW_HOVER =
  "0 2px 4px rgba(0,0,0,0.05), 0 20px 40px -12px rgba(13,115,119,0.18)";

const TIME_META = {
  Morning:   { icon: "☀️", bg: "linear-gradient(135deg, #FFE5B4 0%, #FFCB8C 100%)" },
  Midday:    { icon: "🌞", bg: "linear-gradient(135deg, #FFF4D6 0%, #FFE08A 100%)" },
  Afternoon: { icon: "🌇", bg: "linear-gradient(135deg, #FFD9B8 0%, #FFB088 100%)" },
  Evening:   { icon: "🌙", bg: "linear-gradient(135deg, #D9C7F0 0%, #B89DD9 100%)" },
} as const satisfies Record<SlotTime, { icon: string; bg: string }>;

const TIMELINE_BG =
  "linear-gradient(to right, rgba(255,228,182,0.35) 0%, rgba(255,247,224,0.4) 33%, rgba(255,224,196,0.35) 66%, rgba(214,196,232,0.3) 100%)";
const TIMELINE_RAIL =
  "linear-gradient(to right, #FF6B47 0%, #FFB07A 33%, #FF8A5C 66%, #8B6FB3 100%)";
const CIRCLE_SHADOW = "0 4px 12px rgba(0,0,0,0.08), 0 0 0 4px white";
const CIRCLE_BORDER = "1px solid rgba(0,0,0,0.04)";

export function DayPlans({ dayPlans, destinationName }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!dayPlans || dayPlans.length === 0) return null;

  const expandedPlan = dayPlans.find((p) => p.id === expandedId) ?? null;
  const scheduleBySlot = new Map<SlotTime, NonNullable<typeof expandedPlan>["schedule"][number]>();
  if (expandedPlan) {
    for (const item of expandedPlan.schedule) {
      scheduleBySlot.set(item.time, item);
    }
  }

  return (
    <section>
      <div className="mb-6">
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#0D7377] mb-1.5">
          Curated · 3 Days
        </p>
        <div className="h-0.5 w-10 bg-[#FF6B47] mb-3" />
        <h2
          className="font-semibold text-[#1A1A1A] leading-tight mb-1"
          style={{ fontSize: "clamp(1.5rem, 3vw, 1.75rem)" }}
        >
          Pick your day
        </h2>
        <p className="text-[15px]" style={{ color: "rgba(13,115,119,0.65)" }}>
          3 ways to spend a day in {destinationName}
        </p>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5"
        variants={parentVariants}
        initial="hidden"
        animate="show"
      >
        {dayPlans.map((plan) => {
          const isExpanded = expandedId === plan.id;
          return (
            <motion.div
              key={plan.id}
              variants={childVariants}
              whileHover={
                !isExpanded
                  ? { y: -3, boxShadow: CARD_SHADOW_HOVER }
                  : undefined
              }
              className="relative overflow-hidden rounded-3xl min-h-[200px] flex flex-col"
              style={{
                background: getVibeGradient(plan.vibe),
                border: CARD_BORDER,
                boxShadow: CARD_SHADOW,
              }}
            >
              <span
                aria-hidden="true"
                className="absolute -right-4 -bottom-6 text-[180px] leading-none select-none pointer-events-none"
                style={{
                  opacity: 0.12,
                  transform: "rotate(-12deg)",
                  filter: "saturate(1.2)",
                }}
              >
                {plan.emoji}
              </span>

              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                aria-expanded={isExpanded}
                aria-controls="dayplans-expanded-panel"
                className="relative z-10 flex-1 flex flex-col w-full text-left cursor-pointer p-6"
              >
                <div className="text-3xl leading-none drop-shadow-sm">{plan.emoji}</div>
                <h3
                  id={`dayplan-label-${plan.id}`}
                  className="font-semibold text-lg text-[#1A1A1A] mt-3"
                >
                  {plan.vibe}
                </h3>
                <p className="text-sm text-[#1A1A1A]/65 mt-1 max-w-[90%]">
                  {plan.tagline}
                </p>

                <div className="mt-auto pt-4 flex items-center gap-1 text-sm font-medium text-[#0D7377]">
                  <span>{isExpanded ? "Hide day" : "View day"}</span>
                  <motion.span
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }}
                    className="inline-flex"
                    aria-hidden="true"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </motion.span>
                </div>
              </button>
            </motion.div>
          );
        })}
      </motion.div>

      <AnimatePresence mode="wait">
        {expandedPlan && (
          <motion.div
            key={expandedPlan.id}
            layout
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            className="mt-5 overflow-hidden"
          >
            <div
              id="dayplans-expanded-panel"
              role="region"
              aria-labelledby={`dayplan-label-${expandedPlan.id}`}
              className="relative overflow-hidden bg-white rounded-3xl p-6 sm:p-8"
              style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
            >
              <div
                aria-hidden="true"
                className="absolute top-0 left-0 right-0 h-1"
                style={{ background: getVibeGradient(expandedPlan.vibe) }}
              />

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap min-w-0">
                  <span className="text-2xl leading-none" aria-hidden="true">
                    {expandedPlan.emoji}
                  </span>
                  <h3 className="font-semibold text-lg text-[#1A1A1A]">
                    {expandedPlan.vibe}
                  </h3>
                  <p className="text-sm text-[#1A1A1A]/65">
                    {expandedPlan.tagline}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedId(null)}
                  aria-label="Close day plan"
                  className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#1A1A1A]/5 transition-colors text-[#1A1A1A]/60 hover:text-[#1A1A1A] cursor-pointer"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="border-t border-black/5 my-5" />

              <div className="relative">
                <div
                  aria-hidden="true"
                  className="hidden md:block absolute inset-x-0 top-8 bottom-0 rounded-2xl"
                  style={{ background: TIMELINE_BG, opacity: 0.6 }}
                />
                <div
                  aria-hidden="true"
                  className="hidden md:block absolute left-[7%] right-[7%] top-[42px] h-px"
                  style={{ background: TIMELINE_RAIL, opacity: 0.4 }}
                />

                <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4 pt-2 pb-6 px-4 md:px-6">
                  {SLOT_ORDER.map((slot) => {
                    const item = scheduleBySlot.get(slot);
                    if (!item) return null;
                    const meta = TIME_META[slot];
                    return (
                      <div
                        key={slot}
                        className="flex md:block items-start gap-4 md:gap-0 text-left md:text-center"
                      >
                        <div
                          className="shrink-0 md:mx-auto w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                          style={{
                            background: meta.bg,
                            border: CIRCLE_BORDER,
                            boxShadow: CIRCLE_SHADOW,
                          }}
                          aria-hidden="true"
                        >
                          {meta.icon}
                        </div>
                        <div className="flex-1 md:flex-none md:mt-3 min-w-0">
                          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#0D7377]">
                            {item.time}
                          </p>
                          <p className="text-[14px] text-[#1A1A1A] leading-relaxed font-medium mt-2">
                            {item.activity}
                          </p>
                          {item.tip && (
                            <p className="text-[12px] italic text-[#1A1A1A]/55 leading-relaxed mt-1.5">
                              {item.tip}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
