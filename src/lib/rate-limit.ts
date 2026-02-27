const windowMs = 60_000; // 1 minute
const maxRequests = 5;

const requests = new Map<string, number[]>();

// Clean up old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of requests) {
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) {
      requests.delete(key);
    } else {
      requests.set(key, valid);
    }
  }
}, 5 * 60_000);

export function rateLimit(ip: string): { success: boolean } {
  const now = Date.now();
  const timestamps = requests.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= maxRequests) {
    return { success: false };
  }

  recent.push(now);
  requests.set(ip, recent);
  return { success: true };
}
