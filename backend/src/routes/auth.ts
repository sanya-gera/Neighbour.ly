import { Router, Request, Response } from "express";
import passport from "passport";
import { createSession, revokeSession } from "../config/jwt.js";
import { authenticate } from "../middleware/auth.js";
import { User } from "@prisma/client";

const router = Router();

// ── Google OAuth ──────────────────────────────────────────────────────────────

/** Step 1: Redirect to Google */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

/** Step 2: Google redirects back here */
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login?error=oauth_failed" }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const token = await createSession(user.id, user.email);

      // Redirect to frontend with token in query param
      // The frontend stores it in localStorage and strips it from the URL
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  }
);

// ── Current User ──────────────────────────────────────────────────────────────

router.get("/me", authenticate, (req: Request, res: Response) => {
  const user = req.user!;
  res.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      points: user.points,
      role: user.role.toLowerCase() as "citizen" | "authority",
    },
  });
});

// ── Sign Out ──────────────────────────────────────────────────────────────────

router.post("/signout", authenticate, async (req: Request, res: Response) => {
  try {
    await revokeSession(req.token!);
    res.json({ success: true, message: "Signed out successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to sign out" });
  }
});

export default router;
