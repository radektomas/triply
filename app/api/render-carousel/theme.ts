// Design tokens for the carousel render endpoint.
// Self contained on purpose: tweak values here, nothing else needs to change.
// All values are placeholders eyeballed from the reference posts.

export const theme = {
  colors: {
    cream: "#F5E6D0",
    orange: "#E4612A",
    ink: "#1A1A1A",
    teal: "#1C7A6A",
    bubbleBg: "#FBF4EA",
    white: "#FFFFFF",
  },
  fonts: {
    headline: "Anton",
    body: "Inter",
  },
  canvas: {
    width: 1080,
    height: 1350,
    safePadding: 72,
  },
  sizes: {
    counter: 32,
    bigNumber: 300,
    numberHeadline: 120,
    ctaHeadline: 110,
    coverHeadline: 92,
    bubbleText: 44,
    mascotHeight: 520,
    logoWidth: 360,
  },
} as const;

export type Theme = typeof theme;
