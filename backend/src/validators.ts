import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const bookSchema = z.object({
  title: z.string().min(1).max(255),
  author: z.string().min(1).max(255),
  isbn: z.string().max(20).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  coverUrl: z.string().url().max(1000).optional().nullable().or(z.literal("")),
  publishedAt: z.number().int().min(0).max(3000).optional().nullable(),
  totalCopies: z.number().int().min(1).max(10000).default(1),
  categoryId: z.string().uuid().optional().nullable(),
});

export const bookUpdateSchema = bookSchema.partial();

export const categorySchema = z.object({
  name: z.string().min(1).max(80),
});

export const listBooksQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(), // category slug
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  sort: z.enum(["recent", "title", "popular"]).default("recent"),
});
