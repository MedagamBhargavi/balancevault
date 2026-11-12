
import { Router } from "express";
import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import prisma from "../prisma-client.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(72)
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

function generateAccountNumber() {
  return "BV" + randomInt(1000000000, 10000000000);
}

// Create a zero-balance account if the user has none.
async function ensureUserAccount(tx, userId) {
  const existingAccount = await tx.account.findFirst({
    where: { userId },
    select: { id: true }
  });

  if (existingAccount) return;

  await tx.account.create({
    data: {
      accountNumber: generateAccountNumber(),
      userId,
      balance: 0,
      currency: "INR"
    }
  });
}

// ======================================
// REGISTER
// POST /api/auth/register
// ======================================

router.post("/register", async (req, res) => {
  try {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        status: "error",
        message: "Please provide a valid name, email and password."
      });
    }

    const { fullName, email, password } = validation.data;
    const passwordHash = await bcrypt.hash(password, 12);

    // Create the user and first bank account together.
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          fullName,
          email: email.toLowerCase(),
          passwordHash
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          createdAt: true
        }
      });

      await ensureUserAccount(tx, newUser.id);

      return newUser;
    });

    return res.status(201).json({
      status: "success",
      message: "Registration successful! Your BalanceVault account has been created.",
      user
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        status: "error",
        message: "This email or account number is already registered."
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to register user."
    });
  }
});

// ======================================
// LOGIN
// POST /api/auth/login
// ======================================

router.post("/login", async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        status: "error",
        message: "Please provide a valid email and password."
      });
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password."
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password."
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }

    // Ensure older users also receive a bank account.
    await prisma.$transaction(async (tx) => {
      await ensureUserAccount(tx, user.id);
    });

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d"
      }
    );

    return res.status(200).json({
      status: "success",
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to login."
    });
  }
});

// ======================================
// GET USER PROFILE
// GET /api/auth/me
// ======================================

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found."
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Authenticated user profile",
      user
    });
  } catch (error) {
    console.error("Profile error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to retrieve profile."
    });
  }
});

export default router;
