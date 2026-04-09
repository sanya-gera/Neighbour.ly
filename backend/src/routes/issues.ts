import { Router, Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { authenticate, requireAuthority } from "../middleware/auth.js";
import { uploadImage } from "../config/cloudinary.js";
import { sendStatusUpdateEmail } from "../config/email.js";
import { Category, IssueStatus } from "@prisma/client";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ── Validation ────────────────────────────────────────────────────────────────

const createIssueSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  category: z.enum(["ROAD", "STREETLIGHT", "GARBAGE", "WATER", "POLLUTION", "OTHER"]),
  location: z.string().min(3).max(300),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["REPORTED", "IN_PROGRESS", "FIXED"]),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatIssue(issue: any) {
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    category: capitalise(issue.category),
    location: issue.location,
    latitude: issue.latitude ?? null,
    longitude: issue.longitude ?? null,
    photos: issue.photos,
    status: issue.status === "IN_PROGRESS" ? "In Progress" : capitalise(issue.status),
    votes: issue.votes,
    reporter: issue.reporter?.name ?? "Unknown",
    reporterId: issue.reporterId,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
  };
}

function capitalise(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ── GET /api/issues ───────────────────────────────────────────────────────────

router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { category, status, search, page = "1", limit = "10", mine } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // "My Issues" filter
    if (mine === "true") {
      where.reporterId = req.user!.id;
    }

    if (category) {
      where.category = (category as string).toUpperCase() as Category;
    }

    if (status) {
      const statusMap: Record<string, IssueStatus> = {
        "reported": "REPORTED",
        "in progress": "IN_PROGRESS",
        "fixed": "FIXED",
      };
      where.status = statusMap[(status as string).toLowerCase()] ?? (status as string).toUpperCase();
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
        { location: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        include: { reporter: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.issue.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items: issues.map(formatIssue), page: pageNum, pageSize: limitNum, total },
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch issues" });
  }
});

// ── POST /api/issues — with optional photo upload ─────────────────────────────

router.post("/", authenticate, upload.single("photo"), async (req: Request, res: Response) => {
  try {
    const parsed = createIssueSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.errors[0].message });
      return;
    }

    // Upload photo to Cloudinary if provided
    let photos: string[] = [];
    if (req.file) {
      try {
        const url = await uploadImage(req.file.buffer);
        photos = [url];
      } catch (err) {
        console.error("Photo upload failed:", err);
        // Non-fatal — continue without photo
      }
    }

    const issue = await prisma.issue.create({
      data: {
        ...parsed.data,
        photos,
        reporterId: req.user!.id,
      },
      include: { reporter: { select: { id: true, name: true } } },
    });

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { points: { increment: 5 } },
    });

    res.status(201).json({
      success: true,
      data: formatIssue(issue),
      message: "Issue reported successfully! (+5 points)",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to create issue" });
  }
});

// ── POST /api/issues/:id/upvote ───────────────────────────────────────────────

router.post("/:id/upvote", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const issue = await prisma.issue.findUnique({ where: { id } });
    if (!issue) {
      res.status(404).json({ success: false, message: "Issue not found" });
      return;
    }

    try {
      await prisma.upvote.create({ data: { issueId: id, userId } });
    } catch {
      res.status(409).json({ success: false, message: "Already upvoted" });
      return;
    }

    await Promise.all([
      prisma.issue.update({ where: { id }, data: { votes: { increment: 1 } } }),
      prisma.user.update({ where: { id: userId }, data: { points: { increment: 2 } } }),
    ]);

    res.json({ success: true, data: null, message: "Upvoted successfully! (+2 points)" });
  } catch {
    res.status(500).json({ success: false, message: "Failed to upvote" });
  }
});

// ── PATCH /api/issues/:id/status — authority only ─────────────────────────────

router.patch("/:id/status", authenticate, requireAuthority, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.errors[0].message });
      return;
    }

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: { reporter: { select: { name: true, email: true } } },
    });
    if (!issue) {
      res.status(404).json({ success: false, message: "Issue not found" });
      return;
    }

    const updated = await prisma.issue.update({
      where: { id },
      data: { status: parsed.data.status },
      include: { reporter: { select: { id: true, name: true } } },
    });

    // Award points if fixed
    if (parsed.data.status === "FIXED") {
      await prisma.user.update({
        where: { id: issue.reporterId },
        data: { points: { increment: 10 } },
      });
    }

    // Send email notification to reporter (non-blocking)
    sendStatusUpdateEmail({
      to: issue.reporter.email,
      reporterName: issue.reporter.name,
      issueTitle: issue.title,
      newStatus: parsed.data.status,
    }).catch((err) => console.error("Email send failed:", err));

    res.json({
      success: true,
      data: formatIssue(updated),
      message: parsed.data.status === "FIXED"
        ? "Issue marked as fixed! Points awarded to reporter."
        : `Status updated to ${parsed.data.status}`,
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
});

export default router;
