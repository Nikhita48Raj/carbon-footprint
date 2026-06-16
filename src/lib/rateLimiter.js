const tracker = new Map();

/**
 * Generic in-memory token-bucket rate limiter helper.
 * Returns true if request is allowed, false otherwise.
 * @param {string} ip - IP address of requester
 * @param {number} limit - Maximum allowed requests in window
 * @param {number} windowMs - Time window in milliseconds (default 1 minute)
 */
export function rateLimit(ip, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const meta = tracker.get(ip) || { count: 0, reset: now + windowMs };

  if (now > meta.reset) {
    meta.count = 1;
    meta.reset = now + windowMs;
  } else {
    meta.count++;
  }

  tracker.set(ip, meta);
  return meta.count <= limit;
}
