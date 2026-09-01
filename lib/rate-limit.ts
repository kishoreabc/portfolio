/**
 * In-memory rate limiter for the contact form API.
 * Limits to 5 submissions per IP per hour.
 *
 * Note: This resets on cold starts (Vercel serverless).
 * For a portfolio with low traffic, this is sufficient.
 * For high traffic, replace with Upstash Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp ms
}

const store = new Map<string, RateLimitEntry>();

const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Cleanup old entries periodically to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000); // clean up every 5 minutes

/**
 * Checks if the given IP is rate-limited.
 * Returns { limited: false } if allowed, or { limited: true, retryAfter: seconds } if blocked.
 */
export function checkRateLimit(ip: string): {
  limited: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    // First request or window expired — reset
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { limited: false };
  }

  if (entry.count >= LIMIT) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { limited: true, retryAfter };
  }

  // Increment count
  entry.count++;
  return { limited: false };
}
