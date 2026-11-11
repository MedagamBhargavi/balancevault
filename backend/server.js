import auditRoutes from "./routes/audit.routes.js";
import transactionRoutes from "./routes/transactions.routes.js";
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import adminRoutes from "./routes/admin.routes.js";
import prisma from "./prisma-client.js";
import authRoutes from "./routes/auth.routes.js";
import accountRoutes from "./routes/accounts.routes.js";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// ======================================
// HOME ROUTE
// ======================================

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to BalanceVault API",
    status: "Server is running"
  });
});

// ======================================
// DATABASE HEALTH CHECK
// ======================================

app.get("/api/health/db", async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT current_database() AS database
    `;

    res.json({
      status: "success",
      message: "PostgreSQL connected successfully",
      database: result[0].database
    });

  } catch (error) {
    console.error("Database error:", error.message);

    res.status(500).json({
      status: "error",
      message: "Database connection failed"
    });
  }
});

// ======================================
// AUTHENTICATION ROUTES
// ======================================

app.use("/api/auth", authRoutes);

// ======================================
// ACCOUNT MANAGEMENT ROUTES
// ======================================

app.use("/api/accounts", accountRoutes);
// Transaction routes
app.use("/api/transactions", transactionRoutes);
// Audit log routes
app.use("/api/audit", auditRoutes);
app.use("/api/admin", adminRoutes);
// ======================================
// START SERVER
// ======================================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`BalanceVault server running on port ${PORT}`);
});

// Graceful shutdown
async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
