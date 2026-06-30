import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../lib/errors.js";
import { categorySchema } from "../validators.js";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function listCategories(_req: Request, res: Response) {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { books: true } } },
  });
  res.json({ categories });
}

export async function createCategory(req: Request, res: Response) {
  const { name } = categorySchema.parse(req.body);
  const slug = slugify(name);
  if (!slug) throw ApiError.badRequest("Invalid category name");

  const category = await prisma.category.create({ data: { name, slug } });
  res.status(201).json({ category });
}

export async function deleteCategory(req: Request, res: Response) {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
}
