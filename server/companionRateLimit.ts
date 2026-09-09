type RequestLimitRecord = { count: number; resetAt: number };

/**
 * Small in-memory guard for public demo endpoints. Production client accounts
 * should use authenticated, durable quota records; this protects the temporary
 * fictional demo from accidental or automated bursts without storing content.
 */
export function createRequestLimiter(now: () => number = () => Date.now()) {
  const records = new Map<string, RequestLimitRecord>();

  return {
    allow(subject: string, scope: string, maxRequests: number, windowMs: number) {
      const timestamp = now();
      const key = `${scope}:${subject}`;
      const existing = records.get(key);
      const record = !existing || existing.resetAt <= timestamp
        ? { count: 0, resetAt: timestamp + windowMs }
        : existing;

      record.count += 1;
      records.set(key, record);
      return record.count <= maxRequests;
    },
  };
}
