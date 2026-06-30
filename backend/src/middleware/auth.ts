import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { verifyToken } from "../lib/token.js";
import { isSessionValid } from "../lib/session.js";
import { ApiError } from "../lib/errors.js";

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  if (req.cookies?.token) return req.cookies.token as string;
  return null;
}

/** Requires a valid JWT backed by an active Redis session. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) throw ApiError.unauthorized("Authentication required");

    const payload = verifyToken(token);
    const valid = await isSessionValid(payload.sid, payload.sub);
    if (!valid) throw ApiError.unauthorized("Session expired, please log in again");

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      sid: payload.sid,
    };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.unauthorized("Invalid or expired token"));
  }
}

/** Requires the authenticated user to have one of the given roles. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden("You do not have permission to do this"));
    }
    next();
  };
}
