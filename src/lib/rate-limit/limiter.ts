import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

function createRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[rate-limit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set. Rate limiting is disabled.');
    return null;
  }

  return new Redis({ url, token });
}

const redis = createRedis();

function createLimiter(window: Parameters<typeof Ratelimit.slidingWindow>[0], duration: Parameters<typeof Ratelimit.slidingWindow>[1]) {
  if (!redis) {
    // Return a mock limiter that always allows requests
    return {
      limit: async () => ({ success: true, limit: 0, remaining: 0, reset: 0 }),
    };
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(window, duration),
    analytics: true,
  });
}

export const loginLimiter = createLimiter(5, '15 m');
export const registerLimiter = createLimiter(3, '60 m');
export const passwordLimiter = createLimiter(3, '60 m');
export const apiLimiter = createLimiter(100, '60 s');

export const chatLimiter = createLimiter(
  Number(process.env.CHAT_RATE_LIMIT_REQUESTS) || 20,
  `${process.env.CHAT_RATE_LIMIT_WINDOW_SECONDS || 3600} s` as any
);

export function getRealIP(request: Request): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return 'unknown';
}
