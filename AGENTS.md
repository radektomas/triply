<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Animations — performance rules (READ BEFORE writing any animation)

This project uses Motion (`motion/react`, formerly Framer Motion), already installed. Use it for animations that change layout. Do not hand-roll layout animations with CSS height/grid transitions.

### Core rule
Only `transform` and `opacity` animate cheaply (GPU/compositor, no reflow). Animating any layout property — height, width, max-height, grid-template-rows, margin, top, padding, flex sizing — forces a reflow every frame and causes jank, worst on mobile. This is the #1 cause of janky animations here.

### What to do instead
- Collapse/expand/resize/reflowing layout: use Motion's `layout` prop. Add `layout` to the motion.* element and change size/position via style or className — Motion animates it via transforms (FLIP), not the raw CSS property. Change layout via style/className, NOT via animate/whileHover props.
- Use `<LayoutGroup>` when sibling elements affect each other's layout but don't re-render together.
- Use `<AnimatePresence>` for elements animating OUT as they leave the DOM.
- Fades/moves/scale/press feedback: animate opacity, scale, x, y — never width/height/margin to fake it.
- If a visual seems to need animating a layout property directly, STOP and use the `layout` prop instead.

### Accessibility
Always respect prefers-reduced-motion via useReducedMotion(); end state must be identical, just without animation.

### Before shipping any non-trivial animation
- Verify nothing animates a layout property; if it does, convert to `layout` prop or transform/opacity.
- Test at 4x CPU throttle (≈90% of traffic is mobile).
