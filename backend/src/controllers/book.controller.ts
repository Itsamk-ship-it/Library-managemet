import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { cached, invalidate } from "../lib/redis.js";
import { ApiError } from "../lib/errors.js";
import { bookSchema, bookUpdateSchema, listBooksQuerySchema } from "../validators.js";

const POPULAR_CACHE_KEY = "books:popular";
const POPULAR_CACHE_TTL = 60; // seconds

const bookInclude = { category: true } satisfies Prisma.BookInclude;

export async function listBooks(req: Request, res: Response) {
  const { q, category, page, limit, sort } = listBooksQuerySchema.parse(req.query);

  const where: Prisma.BookWhereInput = {};

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { author: { contains: q, mode: "insensitive" } },
      { isbn: { contains: q, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = { slug: category };
  }

  const orderBy: Prisma.BookOrderByWithRelationInput =
    sort === "title"
      ? { title: "asc" }
      : sort === "popular"
        ? { borrowCount: "desc" }
        : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy,
      include: bookInclude,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.book.count({ where }),
  ]);

  res.json({
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
}

export async function getBook(req: Request, res: Response) {
  const book = await prisma.book.findUnique({
    where: { id: req.params.id },
    include: bookInclude,
  });
  if (!book) throw ApiError.notFound("Book not found");
  res.json({ book });
}

export async function popularBooks(_req: Request, res: Response) {
  // Cached in Redis: most-borrowed books, refreshed every minute.
  const books = await cached(POPULAR_CACHE_KEY, POPULAR_CACHE_TTL, () =>
    prisma.book.findMany({
      where: { borrowCount: { gt: 0 } },
      orderBy: { borrowCount: "desc" },
      include: bookInclude,
      take: 8,
    })
  );
  res.json({ books });
}

export async function createBook(req: Request, res: Response) {
  const data = bookSchema.parse(req.body);

  const book = await prisma.book.create({
    data: {
      title: data.title,
      author: data.author,
      isbn: data.isbn || null,
      description: data.description || null,
      coverUrl: data.coverUrl || null,
      publishedAt: data.publishedAt ?? null,
      totalCopies: data.totalCopies,
      available: data.totalCopies,
      categoryId: data.categoryId || null,
    },
    include: bookInclude,
  });

  await invalidate(POPULAR_CACHE_KEY);
  res.status(201).json({ book });
}

export async function updateBook(req: Request, res: Response) {
  const data = bookUpdateSchema.parse(req.body);

  const existing = await prisma.book.findUnique({ where: { id: req.params.id } });
  if (!existing) throw ApiError.notFound("Book not found");

  // Keep `available` consistent when totalCopies changes.
  let available = existing.available;
  if (data.totalCopies !== undefined) {
    const borrowed = existing.totalCopies - existing.available;
    available = Math.max(0, data.totalCopies - borrowed);
  }

  const book = await prisma.book.update({
    where: { id: req.params.id },
    data: {
      title: data.title,
      author: data.author,
      isbn: data.isbn === undefined ? undefined : data.isbn || null,
      description: data.description === undefined ? undefined : data.description || null,
      coverUrl: data.coverUrl === undefined ? undefined : data.coverUrl || null,
      publishedAt: data.publishedAt,
      totalCopies: data.totalCopies,
      available: data.totalCopies !== undefined ? available : undefined,
      categoryId: data.categoryId === undefined ? undefined : data.categoryId || null,
    },
    include: bookInclude,
  });

  await invalidate(POPULAR_CACHE_KEY);
  res.json({ book });
}

export async function deleteBook(req: Request, res: Response) {
  const active = await prisma.borrowRecord.count({
    where: { bookId: req.params.id, status: { in: ["BORROWED", "OVERDUE"] } },
  });
  if (active > 0) {
    throw ApiError.conflict("Cannot delete a book that is currently borrowed");
  }

  await prisma.book.delete({ where: { id: req.params.id } });
  await invalidate(POPULAR_CACHE_KEY);
  res.json({ ok: true });
}
