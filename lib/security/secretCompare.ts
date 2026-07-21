import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Constant-time comparison of a request-supplied secret against the expected
 * value.
 *
 * JavaScript's `===` / `!==` on strings short-circuits at the first differing
 * byte, so the time it takes to reject a wrong value leaks how many leading
 * bytes were correct. That turns a 64-character secret from a search of the
 * whole keyspace into roughly 64 × 16 guesses, one byte at a time.
 *
 * The practical exploitability over the public internet is low — network
 * jitter dwarfs the signal, and Vercel's routing adds more — but these headers
 * guard the transactional-email sender and the Supabase lifecycle hooks, the
 * comparison is on a hot path an attacker can invoke at will, and the fix
 * costs nothing.
 *
 * Both values are hashed to a fixed length first. timingSafeEqual throws on
 * length mismatch, and length-checking beforehand would itself leak the
 * secret's length; comparing digests removes both problems.
 */
export function secretsMatch(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!provided || !expected) return false;

  // SHA-256 both sides so the compared buffers are always 32 bytes.
  const a = createHash("sha256").update(provided, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}
