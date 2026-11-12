
import { Router } from "express";
import { randomInt } from "node:crypto";

import prisma from "../prisma-client.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

function generateAccountNumber() {
  return "BV" + randomInt(1000000000, 10000000000);
}

// ======================================
// CREATE ACCOUNT
// POST /api/accounts
// ======================================

router.post("/", async (req, res) => {
  try {
    const account = await prisma.account.create({
      data: {
        accountNumber: generateAccountNumber(),
        userId: req.user.userId,
        balance: 0,
        currency: "INR"
      }
    });

    return res.status(201).json({
      status: "success",
      message: "Bank account created successfully!",
      account
    });
  } catch (error) {
    console.error("Create account error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        status: "error",
        message: "Account number conflict. Please try again."
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Unable to create account."
    });
  }
});

// ======================================
// GET ALL USER ACCOUNTS
// GET /api/accounts
// ======================================

router.get("/", async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: {
        userId: req.user.userId
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.status(200).json({
      status: "success",
      count: accounts.length,
      accounts
    });
  } catch (error) {
    console.error("Get accounts error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to retrieve accounts."
    });
  }
});

// ======================================
// GET ACCOUNT BY ID
// GET /api/accounts/:id
// ======================================

router.get("/:id", async (req, res) => {
  try {
    const account = await prisma.account.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (!account) {
      return res.status(404).json({
        status: "error",
        message: "Account not found."
      });
    }

    return res.status(200).json({
      status: "success",
      account
    });
  } catch (error) {
    console.error("Get account error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to retrieve account."
    });
  }
});

export default router;
