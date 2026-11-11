
import { Router } from "express";
import prisma from "../prisma-client.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

// Protect all audit log routes
router.use(authMiddleware);

// ======================================
// GET AUDIT LOGS
// GET /api/audit
// ======================================

router.get("/", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 50
    ) {
      return res.status(400).json({
        status: "error",
        message: "Page must be positive and limit must be between 1 and 50."
      });
    }

    // Normal users can view only their own logs.
    // Admin users can view all audit logs.
    const where = {};

    if (req.user.role !== "ADMIN") {
      where.userId = req.user.userId;
    }

    // Optional action filter
    if (req.query.action) {
      where.action = String(req.query.action).trim();
    }

    // Optional entity filter
    if (req.query.entity) {
      where.entity = String(req.query.entity).trim();
    }

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ]);

    return res.status(200).json({
      status: "success",
      message: "Audit logs retrieved successfully.",
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalLogs: total,
        totalPages: Math.ceil(total / limit)
      },
      logs
    });

  } catch (error) {
    console.error("Audit log error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Unable to retrieve audit logs."
    });
  }
});

// ======================================
// GET AUDIT LOG BY ID
// GET /api/audit/:id
// ======================================

router.get("/:id", async (req, res) => {
  try {
    const where = {
      id: req.params.id
    };

    // Normal users can view only their own logs.
    if (req.user.role !== "ADMIN") {
      where.userId = req.user.userId;
    }

    const log = await prisma.auditLog.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    if (!log) {
      return res.status(404).json({
        status: "error",
        message: "Audit log not found."
      });
    }

    return res.status(200).json({
      status: "success",
      log
    });

  } catch (error) {
    console.error("Get audit log error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Unable to retrieve audit log."
    });
  }
});

export default router;
