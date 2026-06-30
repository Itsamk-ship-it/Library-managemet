import { Router } from "express";
import authRoutes from "./auth.routes.js";
import bookRoutes from "./book.routes.js";
import categoryRoutes from "./category.routes.js";
import borrowRoutes from "./borrow.routes.js";
import adminRoutes from "./admin.routes.js";

const router = Router();

router.get("/health", (_req, res) => res.json({ status: "ok" }));

router.use("/auth", authRoutes);
router.use("/books", bookRoutes);
router.use("/categories", categoryRoutes);
router.use("/borrows", borrowRoutes);
router.use("/admin", adminRoutes);

export default router;
