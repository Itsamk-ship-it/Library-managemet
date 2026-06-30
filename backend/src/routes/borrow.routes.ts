import { Router } from "express";
import * as borrow from "../controllers/borrow.controller.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/active", asyncHandler(borrow.myActiveLoans));
router.get("/history", asyncHandler(borrow.myHistory));

export default router;
