import { randomUUID } from "node:crypto";
import { redis } from "./redis.js";

// Redis-backed session storage. A session id is embedded in the JWT; the
// session record lets us revoke tokens server-side (logout / "log out
// everywhere") even though the JWT itself is stateless.

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days, matches JWT lifetime
const sessionKey = (sid: string) => `session:${sid}`;
const userSessionsKey = (userId: string) => `user:${userId}:sessions`;

export async function createSession(userId: string): Promise<string> {
  const sid = randomUUID();
  await redis
    .multi()
    .set(sessionKey(sid), userId, "EX", SESSION_TTL_SECONDS)
    .sadd(userSessionsKey(userId), sid)
    .expire(userSessionsKey(userId), SESSION_TTL_SECONDS)
    .exec();
  return sid;
}

export async function isSessionValid(sid: string, userId: string): Promise<boolean> {
  const stored = await redis.get(sessionKey(sid));
  return stored === userId;
}

export async function destroySession(sid: string, userId: string): Promise<void> {
  await redis.del(sessionKey(sid));
  await redis.srem(userSessionsKey(userId), sid);
}

export async function destroyAllSessions(userId: string): Promise<void> {
  const sids = await redis.smembers(userSessionsKey(userId));
  if (sids.length) {
    await redis.del(...sids.map(sessionKey));
  }
  await redis.del(userSessionsKey(userId));
}
