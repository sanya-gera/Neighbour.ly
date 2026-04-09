import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface JwtPayload {
  userId: string;
  email: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/** Create a session record in DB and return a signed JWT */
export async function createSession(userId: string, email: string): Promise<string> {
  const token = signToken({ userId, email });

  // Store session in DB so we can invalidate on sign-out
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // match JWT_EXPIRES_IN

  await prisma.session.create({
    data: { userId, token, expiresAt },
  });

  return token;
}

/** Invalidate a session token */
export async function revokeSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}
