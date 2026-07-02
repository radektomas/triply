"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { buildGygUrl } from "@/lib/gyg";
import type { TopPlace } from "@/lib/types/trip";

function GygTicketIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
      <path d="M9 7v10" strokeDasharray="2 2" />
    </svg>
  );
}

interface Props {
  topPlaces: TopPlace[];
  destinationName: string;
}

const CARD_BORDER = "1px solid rgba(13,115,119,0.06)";
const CARD_SHADOW =
  "0 1px 2px rgba(0,0,0,0.04), 0 12px 32px -12px rgba(13,115,119,0.10)";
const CARD_SHADOW_HOVER =
  "0 2px 4px rgba(0,0,0,0.05), 0 20px 40px -12px rgba(13,115,119,0.18)";

// Three soft gradients matching the warm Triply palette. Used as the photo-
// area fallback (cycled by index) when a place has no Pexels photo.
const CARD_GRADIENTS = [
  "linear-gradient(135deg, #FFF4E8 0%, #FFE4CC 100%)", // peach
  "linear-gradient(135deg, #FCE8F3 0%, #F5D7E5 100%)", // rose
  "linear-gradient(135deg, #E8F4F0 0%, #D4E9DD 100%)", // mint
] as const;

const parentVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const childVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
  },
};

export function TopPlaces({ topPlaces, destinationName }: Props) {
  if (!topPlaces || topPlaces.length === 0) return null;

  return (
    <section>
      <div className="mb-6">
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#0D7377] mb-1.5">
          Must-see · {topPlaces.length} {topPlaces.length === 1 ? "spot" : "spots"}
        </p>
        <div className="h-0.5 w-10 bg-[#FF6B47] mb-3" />
        <h2
          className="font-display font-semibold text-[#1A1A1A] leading-tight mb-1"
          style={{ fontSize: "clamp(1.5rem, 3vw, 1.75rem)" }}
        >
          Top places to visit
        </h2>
        <p className="text-[15px]" style={{ color: "rgba(13,115,119,0.65)" }}>
          The 3 spots not to miss in {destinationName}
        </p>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-7"
        variants={parentVariants}
        initial="hidden"
        animate="show"
      >
        {topPlaces.map((place, idx) => {
          const fallbackGradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
          return (
            <motion.div
              key={place.id ?? `${place.name}-${idx}`}
              variants={childVariants}
              whileHover={{ y: -3, boxShadow: CARD_SHADOW_HOVER }}
              className="relative overflow-hidden rounded-3xl flex flex-col bg-white"
              style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
            >
              {/* Photo — fixed 4:3 box so there's no layout shift on load */}
              <div className="relative aspect-[4/3] overflow-hidden shrink-0">
                {place.photo ? (
                  <>
                    <Image
                      src={place.photo.url}
                      alt={place.photo.alt || place.name}
                      fill
                      sizes="(min-width: 768px) 300px, 100vw"
                      className="object-cover"
                    />
                    {/* Subtle bottom gradient — polish + keeps attribution legible */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 45%, transparent 70%)",
                      }}
                    />
                    {/* Pexels attribution — unobtrusive */}
                    <a
                      href={place.photo.photographerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-1.5 right-2.5 text-[10px] text-white/55 hover:text-white/90 transition-colors"
                    >
                      Photo: {place.photo.photographer}
                    </a>
                  </>
                ) : (
                  // No photo — gradient fallback with the emoji centered so the
                  // card still looks intentional.
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: fallbackGradient }}
                  >
                    <span
                      aria-hidden="true"
                      className="text-6xl leading-none drop-shadow-sm"
                    >
                      {place.emoji}
                    </span>
                  </div>
                )}
              </div>

              {/* Text area */}
              <div className="flex flex-col flex-1 p-5">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="text-2xl leading-none shrink-0"
                  >
                    {place.emoji}
                  </span>
                  <h3 className="font-semibold text-lg text-[#1A1A1A]">
                    {place.name}
                  </h3>
                </div>
                <p className="text-sm text-[#1A1A1A]/70 mt-2 leading-relaxed">
                  {place.description}
                </p>
                <a
                  href={buildGygUrl(`${place.name} ${destinationName}`)}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 self-start text-[12px] text-[#0D7377]/70 hover:text-[#FF6B4A] transition-colors"
                >
                  <GygTicketIcon size={12} />
                  <span>Book on GetYourGuide →</span>
                </a>
                {place.tip && (
                  <div className="mt-auto pt-4 flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className="inline-flex items-center justify-center text-[#0D7377] shrink-0 mt-0.5"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 18h6" />
                        <path d="M10 22h4" />
                        <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
                      </svg>
                    </span>
                    <p className="text-[12px] italic text-[#1A1A1A]/60 leading-relaxed">
                      {place.tip}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
