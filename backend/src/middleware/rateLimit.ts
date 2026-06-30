import type { NextFunction, Request, Response } from "express";
import { redis } from "../lib/redis.js";

interface RateLimitOptions {
  windowSeconds: number;
  max: number;
  keyPrefix: string;
}

/**
 * Redis-backed fixed-window rate limiter. Uses INCR + EXPIRE so it works across
 * multiple API instances. Fails open if Redis is unavailable.
 */
export function rateLimit({ windowSeconds, max, keyPrefix }: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.user?.id ?? req.ip ?? "unknown";
    const key = `ratelimit:${keyPrefix}:${identifier}`;

    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      const ttl = await redis.ttl(key);
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - count));
      res.setHeader("X-RateLimit-Reset", ttl >= 0 ? ttl : windowSeconds);

      if (count > max) {
        res.setHeader("Retry-After", ttl >= 0 ? ttl : windowSeconds);
        return res.status(429).json({
          error: "Too many requests, please slow down.",
        });
      }

      next();
    } catch {
      // Redis down — don't block legitimate traffic.
      next();
    }
  };
}
