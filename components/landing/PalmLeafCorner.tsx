import Image from "next/image";

// Two decorative watercolor leaves peeking in from the top corners of the
// hero. Standalone decoration — no connection to the logo, no connector line.
// Each leaf is a different PNG at a different size / rotation / opacity, so
// the composition reads as two distinct plants framing the page rather than
// a mirrored stencil.
//
// Stem (originally bottom-center of each PNG) lands at the inner-corner of
// the wrapper's rotated bbox — upper-right for the left leaf at 215°,
// upper-left for the right leaf at 145° — so both leaves "lean into" the page
// from their respective corners.

interface LeafProps {
  src: string;
  /** PNG native pixel dimension (square) */
  intrinsic: number;
  /** Tailwind classes for top/left/right offsets */
  positionClass: string;
  /** Tailwind classes for responsive width */
  widthClass: string;
  /** Rotation in degrees (CW from upright) */
  rotation: number;
  opacity: number;
  /** Pre-paint hint, only on the primary corner */
  priority?: boolean;
  /** Tuned to the leaf's actual displayed width so srcset picks correctly */
  sizes: string;
}

function CornerLeaf({
  src,
  intrinsic,
  positionClass,
  widthClass,
  rotation,
  opacity,
  priority,
  sizes,
}: LeafProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 ${positionClass} ${widthClass}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center",
        opacity,
      }}
    >
      <Image
        src={src}
        alt=""
        width={intrinsic}
        height={intrinsic}
        priority={priority}
        sizes={sizes}
        className="w-full h-auto"
      />
    </div>
  );
}

export function PalmLeafCorner() {
  return (
    <>
      {/* Top-left — original watercolor monstera, larger and more opaque */}
      <CornerLeaf
        src="/illustrations/tropical-leaf.png"
        intrinsic={2000}
        positionClass="top-[-50px] md:top-[-100px] left-[-50px] md:left-[-100px]"
        widthClass="w-[180px] md:w-[320px]"
        rotation={215}
        opacity={0.9}
        priority
        sizes="(min-width: 768px) 320px, 180px"
      />

      {/* Top-right — same watercolor PNG as the left, but mirror-tilted, smaller,
          and more translucent so it reads as the same plant viewed from another
          angle rather than a second species. */}
      <CornerLeaf
        src="/illustrations/tropical-leaf.png"
        intrinsic={2000}
        positionClass="top-[-60px] md:top-[-120px] right-[-30px] md:right-[-60px]"
        widthClass="w-[160px] md:w-[280px]"
        rotation={145}
        opacity={0.85}
        sizes="(min-width: 768px) 280px, 160px"
      />
    </>
  );
}
