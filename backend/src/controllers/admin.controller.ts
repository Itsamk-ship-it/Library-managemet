import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

/** Aggregate stats for the admin dashboard. */
export async function dashboardStats(_req: Request, res: Response) {
  const [
    totalBooks,
    totalCopies,
    totalUsers,
    activeLoans,
    overdueLoans,
    totalCategories,
    recentBorrows,
    topBooks,
  ] = await Promise.all([
    prisma.book.count(),
    prisma.book.aggregate({ _sum: { totalCopies: true } }),
    prisma.user.count(),
    prisma.borrowRecord.count({ where: { status: { in: ["BORROWED", "OVERDUE"] } } }),
    prisma.borrowRecord.count({ where: { status: "BORROWED", dueAt: { lt: new Date() } } }),
    prisma.category.count(),
    prisma.borrowRecord.findMany({
      take: 10,
      orderBy: { borrowedAt: "desc" },
      include: {
        book: { select: { title: true, author: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.book.findMany({
      where: { borrowCount: { gt: 0 } },
      orderBy: { borrowCount: "desc" },
      take: 5,
      select: { id: true, title: true, author: true, borrowCount: true },
    }),
  ]);

  res.json({
    stats: {
      totalBooks,
      totalCopies: totalCopies._sum.totalCopies ?? 0,
      totalUsers,
      activeLoans,
      overdueLoans,
      totalCategories,
    },
    recentBorrows,
    topBooks,
  });
}

/** List all users (admin). */
export async function listUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { borrowRecords: true } },
    },
  });
  res.json({ users });
}

/** All active loans across the library (admin). */
export async function allActiveLoans(_req: Request, res: Response) {
  const records = await prisma.borrowRecord.findMany({
    where: { status: { in: ["BORROWED", "OVERDUE"] } },
    orderBy: { dueAt: "asc" },
    include: {
      book: { select: { title: true, author: true } },
      user: { select: { name: true, email: true } },
    },
  });
  const now = new Date();
  res.json({ records: records.map((r) => ({ ...r, overdue: r.dueAt < now })) });
}
