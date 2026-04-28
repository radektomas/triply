"use client";

import { useEffect, useRef, useState } from "react";

const VARIANTS = [
  "€300 in June? Let's go.",
  "€450 in July? Let's go.",
  "€500 in August? Let's go.",
  "€700 in September? Let's go.",
  "€350 in October? Let's go.",
];

const TYPE_MS = 40;
const DELETE_MS = 25;
const HOLD_MS = 5000;
const EMPTY_MS = 400;

const SR_SUMMARY = "Triply finds trips for any budget and any month.";

type Phase = "typing" | "holding" | "deleting" | "empty";

export function TypewriterHeadline() {
  const containerRef = useRef<HTMLHeadingElement | null>(null);
  const [reduced, setReduced] = useState(false);
  const [variantIdx, setVariantIdx] = useState(0);
  const [text, setText] = useState(VARIANTS[0]);
  const [phase, setPhase] = useState<Phase>("holding");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || !visible) return;

    const variant = VARIANTS[variantIdx];
    let timer: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (text.length < variant.length) {
        timer = setTimeout(
          () => setText(variant.slice(0, text.length + 1)),
          TYPE_MS,
        );
      } else {
        setPhase("holding");
        return;
      }
    } else if (phase === "holding") {
      timer = setTimeout(() => setPhase("deleting"), HOLD_MS);
    } else if (phase === "deleting") {
      if (text.length > 0) {
        timer = setTimeout(
          () => setText(variant.slice(0, text.length - 1)),
          DELETE_MS,
        );
      } else {
        setPhase("empty");
        return;
      }
    } else {
      timer = setTimeout(() => {
        setVariantIdx((i) => (i + 1) % VARIANTS.length);
        setPhase("typing");
      }, EMPTY_MS);
    }

    return () => clearTimeout(timer);
  }, [phase, text, variantIdx, reduced, visible]);

  if (reduced) {
    return (
      <h2
        ref={containerRef}
        className="text-3xl md:text-4xl font-bold text-[#1A1A1A] min-h-[2.25rem] md:min-h-[2.5rem]"
      >
        {VARIANTS[0]}
        <span className="sr-only">{SR_SUMMARY}</span>
      </h2>
    );
  }

  const cursorBlinks = phase === "holding" || phase === "empty";

  return (
    <h2
      ref={containerRef}
      className="text-3xl md:text-4xl font-bold text-[#1A1A1A] min-h-[2.25rem] md:min-h-[2.5rem]"
    >
      <span aria-live="off">
        {text}
        <span
          aria-hidden="true"
          className={`inline-block text-accent-deep ${cursorBlinks ? "animate-cursor-blink" : ""}`}
          style={{ width: "0.5ch", marginLeft: "0.05em", willChange: "opacity" }}
        >
          |
        </span>
      </span>
      <span className="sr-only">{SR_SUMMARY}</span>
    </h2>
  );
}
