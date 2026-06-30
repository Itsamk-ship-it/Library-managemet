import { Router } from "express";
import * as auth from "../controllers/auth.controller.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = Router();

// Throttle auth endpoints to slow down credential-stuffing.
const authLimiter = rateLimit({ windowSeconds: 60, max: 10, keyPrefix: "auth" });

router.post("/register", authLimiter, asyncHandler(auth.register));
router.post("/login", authLimiter, asyncHandler(auth.login));
router.get("/me", requireAuth, asyncHandler(auth.me));
router.post("/logout", requireAuth, asyncHandler(auth.logout));
router.post("/logout-all", requireAuth, asyncHandler(auth.logoutAll));

export default router;
