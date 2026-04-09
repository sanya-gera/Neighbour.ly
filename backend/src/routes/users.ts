import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

const updateRoleSchema = z.object({
  role: z.enum(["citizen", "authority"]),
});

// ── PATCH /api/users/role ─────────────────────────────────────────────────────

router.patch("/role", authenticate, async (req: Request, res: Response) => {
  try {
    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid role" });
      return;
    }

    // Only allow switching TO authority if the user already has AUTHORITY role in the DB.
    // This prevents any citizen from self-promoting to authority.
    const currentUser = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (parsed.data.role === "authority" && currentUser?.role !== "AUTHORITY") {
      res.status(403).json({
        success: false,
        message: "You do not have authority permissions. Contact an admin to be granted authority access.",
      });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { role: parsed.data.role.toUpperCase() as "CITIZEN" | "AUTHORITY" },
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        points: user.points,
        role: parsed.data.role,
      },
      message: `Switched to ${parsed.data.role} view`,
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update role" });
  }
});

// ── POST /api/users/make-authority — admin endpoint to grant authority ─────────
// Protect this with a secret header in production

router.post("/make-authority", async (req: Request, res: Response) => {
  try {
    const adminSecret = req.headers["x-admin-secret"];
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }

    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: "Email required" });
      return;
    }

    const user = await prisma.user.update({
      where: { email },
      data: { role: "AUTHORITY" },
    });

    res.json({
      success: true,
      message: `${user.name} (${user.email}) is now an authority`,
    });
  } catch {
    res.status(404).json({ success: false, message: "User not found" });
  }
});

export default router;
