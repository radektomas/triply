// Daily generation caps — soft anti-spam ceilings, tune here.
//
// These are NOT the hard request rate limit (that's per-IP in proxy.ts). They
// cap how many trip generations one visitor can trigger per UTC day:
//   • Anonymous  → tracked client-side in localStorage (see GenerateMore.tsx)
//   • Logged-in  → counted server-side in Supabase (see generationLimits.ts)
//
// 1 generation = 1 result set (the first search counts too). Plain module (no
// `server-only`) so both the server helper and the client UI can share them.
export const DAILY_GENERATION_LIMIT_ANON = 20;
export const DAILY_GENERATION_LIMIT_USER = 20;
