import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../config/jwt.js";
import { prisma } from "../config/prisma.js";
import { User } from "@prisma/client";

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "No token provided" });
      return;
    }

    const token = authHeader.slice(7);

    // Verify JWT signature + expiry
    const payload = verifyToken(token);

    // Check session is still active in DB (allows logout to work immediately)
    const session = await prisma.session.findUnique({ where: { token } });
    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({ success: false, message: "Session expired" });
      return;
    }

    // Attach user to request
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    req.user = user;
    req.token = token;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
}

/** Only allows AUTHORITY role */
export function requireAuthority(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== "AUTHORITY") {
    res.status(403).json({ success: false, message: "Authority access required" });
    return;
  }
  next();
}
