
import express from "express";
import prisma from "../prisma-client.js";
import authMiddleware from "../middleware/auth.middleware.js";
import adminMiddleware from "../middleware/admin.middleware.js";

const router = express.Router();

// Protect every admin route
router.use(authMiddleware);
router.use(adminMiddleware);

// Pagination helper
function getPagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 10)
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
}

// GET /api/admin/stats
// Overall system statistics
router.get("/stats", async (req, res) => {
  try {
    const [
      totalUsers,
      totalAccounts,
      totalTransactions,
      totalAuditLogs,
      balanceResult
    ] = await Promise.all([
      prisma.user.count(),
      prisma.account.count(),
      prisma.transaction.count(),
      prisma.auditLog.count(),
      prisma.account.aggregate({
        _sum: {
          balance: true
        }
      })
    ]);

    return res.json({
      status: "success",
      stats: {
        totalUsers,
        totalAccounts,
        totalTransactions,
        totalAuditLogs,
        totalBalance:
          balanceResult._sum.balance?.toString() || "0.00"
      }
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to load admin statistics."
    });
  }
});

// GET /api/admin/users
// View all users without exposing password hashes
router.get("/users", async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc"
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              accounts: true,
              transactions: true
            }
          }
        }
      }),
      prisma.user.count()
    ]);

    return res.json({
      status: "success",
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Admin users error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to load users."
    });
  }
});

// GET /api/admin/accounts
// View all accounts
router.get("/accounts", async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc"
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      }),
      prisma.account.count()
    ]);

    return res.json({
      status: "success",
      accounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Admin accounts error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to load accounts."
    });
  }
});

// GET /api/admin/transactions
// View all transactions
router.get("/transactions", async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc"
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          fromAccount: {
            select: {
              accountNumber: true
            }
          },
          toAccount: {
            select: {
              accountNumber: true
            }
          }
        }
      }),
      prisma.transaction.count()
    ]);

    return res.json({
      status: "success",
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Admin transactions error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to load transactions."
    });
  }
});

// GET /api/admin/audit
// View all audit logs
router.get("/audit", async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc"
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      }),
      prisma.auditLog.count()
    ]);

    return res.json({
      status: "success",
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Admin audit error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to load audit logs."
    });
  }
});

export default router;
