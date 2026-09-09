"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useReducedMotion } from "framer-motion";
import { geoCentroid, geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { Feature, Geometry } from "geojson";
import { COUNTRY_BY_NUMERIC } from "@/lib/data/countryCodes";

// A spinnable SVG globe (orthographic d3-geo projection over world-atlas
// 110m country outlines). No WebGL, no three.js — ~180 <path>s that are
// re-projected on each rotation frame. Drag to spin, tap a country to toggle
// it. Rotation state lives in a ref and is flushed to React once per frame
// so a fast drag never queues more renders than the display can show.

export interface GlobeCountry {
  /** ISO 3166-1 numeric id (world-atlas feature id). */
  id: string;
  /** ISO 3166-1 alpha-2. */
  alpha2: string;
  name: string;
  /** Centroid, degrees. */
  lat: number;
  lng: number;
}

interface CountryShape extends GlobeCountry {
  feature: Feature<Geometry>;
}

interface Props {
  /** alpha-2 codes currently selected. */
  selected: ReadonlySet<string>;
  onToggle: (country: GlobeCountry) => void;
  /** Called once with every tappable country (for the search box). */
  onReady?: (countries: GlobeCountry[]) => void;
  /** Set to an alpha-2 to animate the globe to that country. */
  focusAlpha2?: string | null;
  className?: string;
}

const SIZE = 400;
const R = 192;
const CENTER = SIZE / 2;
const DRAG_DEG_PER_PX = 0.35;
const CLICK_MAX_PX = 6;
const IDLE_RESUME_MS = 3500;
const AUTO_SPIN_DEG_PER_S = 4;
const FOCUS_MS = 750;

type Topo = Topology<{ countries: GeometryCollection }>;

function shortestDelta(from: number, to: number): number {
  let d = ((to - from + 540) % 360) - 180;
  if (d < -180) d += 360;
  return d;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function CountryGlobe({ selected, onToggle, onReady, focusAlpha2, className = "" }: Props) {
  const reduceMotion = useReducedMotion();
  const [shapes, setShapes] = useState<CountryShape[] | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  // Rendered rotation. Updated at most once per animation frame.
  const [rotation, setRotation] = useState<[number, number]>([-15, -35]);
  const rotRef = useRef<[number, number]>([-15, -35]);
  const frameRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    moved: boolean;
  }>({ active: false, startX: 0, startY: 0, lastX: 0, lastY: 0, moved: false });
  const lastInteractionRef = useRef<number>(0);
  const hoverRef = useRef<string | null>(null);
  const focusAnimRef = useRef<number | null>(null);
  const inViewRef = useRef(true);

  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  });

  // ── data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mod = await import("world-atlas/countries-110m.json");
      const topo = (mod.default ?? mod) as unknown as Topo;
      const fc = feature(topo, topo.objects.countries);
      const list: CountryShape[] = [];
      for (const f of fc.features) {
        const id = String(f.id ?? "");
        const meta = COUNTRY_BY_NUMERIC[id];
        if (!meta) continue; // Antarctica-less atlas still has a few unmapped disputed areas
        const [lng, lat] = geoCentroid(f);
        list.push({ id, alpha2: meta[0], name: meta[1], lat, lng, feature: f });
      }
      if (cancelled) return;
      setShapes(list);
      onReadyRef.current?.(list.map(({ id, alpha2, name, lat, lng }) => ({ id, alpha2, name, lat, lng })));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── rotation plumbing ───────────────────────────────────────────────────
  const flush = useCallback(() => {
    frameRef.current = null;
    setRotation([rotRef.current[0], rotRef.current[1]]);
  }, []);

  const scheduleFlush = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(flush);
  }, [flush]);

  const setRot = useCallback(
    (lambda: number, phi: number) => {
      rotRef.current = [lambda, Math.max(-75, Math.min(75, phi))];
      scheduleFlush();
    },
    [scheduleFlush],
  );

  // Idle auto-spin. Pauses while dragging / hovering / focusing / off-screen,
  // and entirely under reduced motion. Re-projecting ~175 outlines costs
  // ~10ms on a laptop and 3–4× that on a throttled phone, so touch devices
  // get a still globe (drag to spin) and desktops spin at ~30fps, not 60.
  useEffect(() => {
    if (reduceMotion || !shapes) return;
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      acc += dt;
      if (acc < 32) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const stepMs = acc;
      acc = 0;
      const idle =
        !dragRef.current.active &&
        hoverRef.current === null &&
        focusAnimRef.current === null &&
        inViewRef.current &&
        now - lastInteractionRef.current > IDLE_RESUME_MS &&
        document.visibilityState === "visible";
      if (idle) {
        setRot(rotRef.current[0] + (AUTO_SPIN_DEG_PER_S * stepMs) / 1000, rotRef.current[1]);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, shapes, setRot]);

  // Pause when scrolled away.
  useEffect(() => {
    const el = svgRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      inViewRef.current = e.isIntersecting;
    });
    io.observe(el);
    return () => io.disconnect();
  }, [shapes]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    if (focusAnimRef.current !== null) cancelAnimationFrame(focusAnimRef.current);
  }, []);

  // Animate to a country when asked.
  useEffect(() => {
    if (!focusAlpha2 || !shapes) return;
    const target = shapes.find((s) => s.alpha2 === focusAlpha2);
    if (!target) return;
    const from: [number, number] = [rotRef.current[0], rotRef.current[1]];
    const to: [number, number] = [-target.lng, -target.lat];
    const dl = shortestDelta(from[0], to[0]);
    const dp = to[1] - from[1];
    lastInteractionRef.current = performance.now();
    if (reduceMotion) {
      setRot(to[0], to[1]);
      return;
    }
    if (focusAnimRef.current !== null) cancelAnimationFrame(focusAnimRef.current);
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / FOCUS_MS);
      const k = easeOutCubic(t);
      setRot(from[0] + dl * k, from[1] + dp * k);
      if (t < 1) {
        focusAnimRef.current = requestAnimationFrame(step);
      } else {
        focusAnimRef.current = null;
        lastInteractionRef.current = performance.now();
      }
    };
    focusAnimRef.current = requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusAlpha2, shapes]);

  // ── pointer handling ────────────────────────────────────────────────────
  function scaleFactor(): number {
    const el = svgRef.current;
    if (!el) return 1;
    const w = el.getBoundingClientRect().width || SIZE;
    return SIZE / w;
  }

  function onPointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      moved: false,
    };
    if (focusAnimRef.current !== null) {
      cancelAnimationFrame(focusAnimRef.current);
      focusAnimRef.current = null;
    }
    lastInteractionRef.current = performance.now();
  }

  function onPointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    const d = dragRef.current;
    if (!d.active) return;
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > CLICK_MAX_PX) d.moved = true;
    const k = DRAG_DEG_PER_PX * scaleFactor();
    setRot(rotRef.current[0] + dx * k, rotRef.current[1] - dy * k);
    lastInteractionRef.current = performance.now();
  }

  function endDrag(e: ReactPointerEvent<SVGSVGElement>) {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
    lastInteractionRef.current = performance.now();
    if (d.moved || !shapes) return;
    // A tap: find the country under the pointer.
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const id = el?.closest<SVGPathElement>("path[data-id]")?.dataset.id;
    if (!id) return;
    const c = shapes.find((s) => s.id === id);
    if (c) onToggle({ id: c.id, alpha2: c.alpha2, name: c.name, lat: c.lat, lng: c.lng });
  }

  // ── projection ──────────────────────────────────────────────────────────
  const projection = useMemo(
    () =>
      geoOrthographic()
        .scale(R)
        .translate([CENTER, CENTER])
        .clipAngle(90)
        .rotate([rotation[0], rotation[1]]),
    [rotation],
  );
  const path = useMemo(() => geoPath(projection), [projection]);
  const graticule = useMemo(() => geoGraticule10(), []);
  const graticuleD = useMemo(() => path(graticule) ?? "", [path, graticule]);
  const paths = useMemo(
    () => (shapes ?? []).map((s) => ({ s, d: path(s.feature) ?? "" })).filter((p) => p.d),
    [shapes, path],
  );

  const hoverName = hover ? shapes?.find((s) => s.id === hover)?.name ?? null : null;

  return (
    <div className={`relative select-none ${className}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full h-auto block cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
        role="img"
        aria-label="World globe. Drag to spin, tap a country to mark it visited."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={(e) => {
          if (dragRef.current.active) endDrag(e);
          hoverRef.current = null;
          setHover(null);
        }}
      >
        <defs>
          <radialGradient id="globe-ocean" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#9ED8D6" />
            <stop offset="55%" stopColor="#3FA8A8" />
            <stop offset="100%" stopColor="#0D7377" />
          </radialGradient>
          <radialGradient id="globe-glow" cx="50%" cy="50%" r="50%">
            <stop offset="80%" stopColor="rgba(13,115,119,0.22)" />
            <stop offset="100%" stopColor="rgba(13,115,119,0)" />
          </radialGradient>
          <radialGradient id="globe-shade" cx="35%" cy="30%" r="80%">
            <stop offset="60%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.28)" />
          </radialGradient>
        </defs>

        {/* atmosphere */}
        <circle cx={CENTER} cy={CENTER} r={R + 14} fill="url(#globe-glow)" />
        {/* ocean */}
        <circle cx={CENTER} cy={CENTER} r={R} fill="url(#globe-ocean)" />
        <path d={graticuleD} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={0.5} />

        {shapes === null ? (
          <text
            x={CENTER}
            y={CENTER}
            textAnchor="middle"
            fill="rgba(255,255,255,0.8)"
            fontSize={14}
            fontWeight={600}
          >
            Loading the world…
          </text>
        ) : (
          <g>
            {paths.map(({ s, d }) => {
              const isSel = selected.has(s.alpha2);
              const isHover = hover === s.id;
              return (
                <path
                  key={s.id}
                  data-id={s.id}
                  d={d}
                  fill={isSel ? "#FF6B47" : isHover ? "#FFB088" : "#FFF6EA"}
                  stroke={isSel ? "#FFFFFF" : "rgba(13,115,119,0.55)"}
                  strokeWidth={isSel ? 0.9 : 0.5}
                  strokeLinejoin="round"
                  style={{ transition: "fill 140ms ease" }}
                  onPointerEnter={(e) => {
                    if (e.pointerType !== "mouse") return;
                    hoverRef.current = s.id;
                    setHover(s.id);
                  }}
                  onPointerLeave={(e) => {
                    if (e.pointerType !== "mouse") return;
                    if (hoverRef.current === s.id) {
                      hoverRef.current = null;
                      setHover(null);
                    }
                  }}
                >
                  <title>{s.name}</title>
                </path>
              );
            })}
          </g>
        )}

        {/* shading + rim */}
        <circle cx={CENTER} cy={CENTER} r={R} fill="url(#globe-shade)" pointerEvents="none" />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1.5}
          pointerEvents="none"
        />
      </svg>

      {/* hover label (mouse only) */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-3 rounded-full bg-[#1a1a1a]/85 text-white text-xs font-semibold px-3 py-1 transition-opacity duration-150"
        style={{ opacity: hoverName ? 1 : 0 }}
        aria-hidden="true"
      >
        {hoverName ?? " "}
      </div>
    </div>
  );
}
