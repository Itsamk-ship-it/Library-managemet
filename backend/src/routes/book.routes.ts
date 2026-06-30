import { Router } from "express";
import * as books from "../controllers/book.controller.js";
import * as borrow from "../controllers/borrow.controller.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// Public catalog browsing.
router.get("/", asyncHandler(books.listBooks));
router.get("/popular", asyncHandler(books.popularBooks));
router.get("/:id", asyncHandler(books.getBook));

// Borrow / return (authenticated users).
router.post("/:id/borrow", requireAuth, asyncHandler(borrow.borrowBook));
router.post("/:id/return", requireAuth, asyncHandler(borrow.returnBook));

// Admin CRUD.
router.post("/", requireAuth, requireRole("ADMIN"), asyncHandler(books.createBook));
router.put("/:id", requireAuth, requireRole("ADMIN"), asyncHandler(books.updateBook));
router.delete("/:id", requireAuth, requireRole("ADMIN"), asyncHandler(books.deleteBook));

export default router;
