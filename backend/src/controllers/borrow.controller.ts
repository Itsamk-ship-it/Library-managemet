import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { invalidate } from "../lib/redis.js";
import { ApiError } from "../lib/errors.js";
import { env } from "../config/env.js";

/** Borrow a book — transactional so two users can't grab the last copy. */
export async function borrowBook(req: Request, res: Response) {
  const userId = req.user!.id;
  const bookId = req.params.id;

  const record = await prisma.$transaction(async (tx) => {
    const book = await tx.book.findUnique({ where: { id: bookId } });
    if (!book) throw ApiError.notFound("Book not found");
    if (book.available < 1) throw ApiError.conflict("No copies currently available");

    // Prevent borrowing the same book twice concurrently.
    const alreadyHas = await tx.borrowRecord.findFirst({
      where: { userId, bookId, status: { in: ["BORROWED", "OVERDUE"] } },
    });
    if (alreadyHas) throw ApiError.conflict("You already have this book borrowed");

    // Enforce per-user concurrent borrow limit.
    const activeCount = await tx.borrowRecord.count({
      where: { userId, status: { in: ["BORROWED", "OVERDUE"] } },
    });
    if (activeCount >= env.maxConcurrentBorrows) {
      throw ApiError.conflict(
        `You can borrow at most ${env.maxConcurrentBorrows} books at a time`
      );
    }

    await tx.book.update({
      where: { id: bookId },
      data: { available: { decrement: 1 }, borrowCount: { increment: 1 } },
    });

    const dueAt = new Date(Date.now() + env.loanPeriodDays * 24 * 60 * 60 * 1000);

    return tx.borrowRecord.create({
      data: { userId, bookId, dueAt },
      include: { book: { include: { category: true } } },
    });
  });

  await invalidate("books:popular");
  res.status(201).json({ record });
}

/** Return a borrowed book. */
export async function returnBook(req: Request, res: Response) {
  const userId = req.user!.id;
  const bookId = req.params.id;

  const record = await prisma.$transaction(async (tx) => {
    const active = await tx.borrowRecord.findFirst({
      where: { userId, bookId, status: { in: ["BORROWED", "OVERDUE"] } },
    });
    if (!active) throw ApiError.badRequest("You have no active loan for this book");

    await tx.book.update({
      where: { id: bookId },
      data: { available: { increment: 1 } },
    });

    return tx.borrowRecord.update({
      where: { id: active.id },
      data: { status: "RETURNED", returnedAt: new Date() },
      include: { book: { include: { category: true } } },
    });
  });

  res.json({ record });
}

/** Current user's active loans. */
export async function myActiveLoans(req: Request, res: Response) {
  const now = new Date();
  const records = await prisma.borrowRecord.findMany({
    where: { userId: req.user!.id, status: { in: ["BORROWED", "OVERDUE"] } },
    orderBy: { borrowedAt: "desc" },
    include: { book: { include: { category: true } } },
  });

  // Annotate overdue flag on the fly.
  const withOverdue = records.map((r) => ({ ...r, overdue: r.dueAt < now }));
  res.json({ records: withOverdue });
}

/** Current user's full reading history (returned + active). */
export async function myHistory(req: Request, res: Response) {
  const records = await prisma.borrowRecord.findMany({
    where: { userId: req.user!.id },
    orderBy: { borrowedAt: "desc" },
    include: { book: { include: { category: true } } },
  });
  res.json({ records });
}
