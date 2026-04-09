import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// ── GET /api/leaderboard ──────────────────────────────────────────────────────

router.get("/", authenticate, async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, points: true, avatar: true },
      orderBy: { points: "desc" },
      take: 50,
    });

    res.json({ success: true, data: { users } });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch leaderboard" });
  }
});

export default router;
