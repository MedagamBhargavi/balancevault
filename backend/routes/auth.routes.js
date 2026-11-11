
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import prisma from "../prisma-client.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

// ======================================
// VALIDATION SCHEMAS
// ======================================

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(72)
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

// ======================================
// REGISTER API
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

    // Hash password securely
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user in PostgreSQL
    const user = await prisma.user.create({
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

    return res.status(201).json({
      status: "success",
      message: "Account registered successfully!",
      user
    });

  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        status: "error",
        message: "This email is already registered."
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Unable to register user."
    });
  }
});

// ======================================
// LOGIN API
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

    // Find user
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase()
      }
    });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password."
      });
    }

    // Verify password
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

    // Check JWT secret
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }

    // Generate JWT token
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
    console.error("Login error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Unable to login."
    });
  }
});

// ======================================
// GET USER PROFILE API
// GET /api/auth/me
// PROTECTED ROUTE
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
    console.error("Profile error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Unable to retrieve profile."
    });
  }
});

// ======================================
// EXPORT ROUTER
// ======================================

export default router;
