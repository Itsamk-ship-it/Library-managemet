import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/token.js";
import { createSession, destroySession, destroyAllSessions } from "../lib/session.js";
import { ApiError } from "../lib/errors.js";
import { isProd } from "../config/env.js";
import { loginSchema, registerSchema } from "../validators.js";

function publicUser(user: { id: string; email: string; name: string; role: string }) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? ("none" as const) : ("lax" as const),
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw ApiError.conflict("An account with that email already exists");

  const hashed = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, password: hashed },
  });

  const sid = await createSession(user.id);
  const token = signToken({ sub: user.id, email: user.email, role: user.role, sid });

  res.cookie("token", token, cookieOptions);
  res.status(201).json({ token, user: publicUser(user) });
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw ApiError.unauthorized("Invalid email or password");

  const match = await bcrypt.compare(data.password, user.password);
  if (!match) throw ApiError.unauthorized("Invalid email or password");

  const sid = await createSession(user.id);
  const token = signToken({ sub: user.id, email: user.email, role: user.role, sid });

  res.cookie("token", token, cookieOptions);
  res.json({ token, user: publicUser(user) });
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw ApiError.notFound("User not found");
  res.json({ user: publicUser(user) });
}

export async function logout(req: Request, res: Response) {
  await destroySession(req.user!.sid, req.user!.id);
  res.clearCookie("token", { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
}

export async function logoutAll(req: Request, res: Response) {
  await destroyAllSessions(req.user!.id);
  res.clearCookie("token", { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
}
