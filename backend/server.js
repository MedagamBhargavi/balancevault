
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import prisma from "./prisma-client.js";

import authRoutes from "./routes/auth.routes.js";
import accountRoutes from "./routes/accounts.routes.js";
import transactionRoutes from "./routes/transactions.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to BalanceVault API",
    status: "Server is running"
  });
});

// Database health check
app.get("/api/health/db", async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT current_database() AS database
    `;

    console.log("Database connected successfully:", result);

    res.status(200).json({
      status: "success",
      message: "Database connected successfully",
      database: result[0].database
    });

  } catch (error) {
    // Detailed error appears in Render logs
    console.error("========== DATABASE CONNECTION ERROR ==========");
    console.error(error);
    console.error("Error name:", error.name);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Error metadata:", error.meta);
    console.error("================================================");

    // Do not expose database credentials to visitors
    res.status(500).json({
      status: "error",
      message: "Database connection failed. Check backend logs."
    });
  }
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "API endpoint not found"
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(error.status || 500).json({
    status: "error",
    message: "Internal server error"
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`BalanceVault server running on port ${PORT}`);
});

// Graceful shutdown
async function shutdown() {
  console.log("Shutting down BalanceVault server...");

  server.close(async () => {
    await prisma.$disconnect();
    console.log("Database disconnected.");
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
