
import { Router } from "express";
import prisma from "../prisma-client.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

// ==========================================
// INPUT VALIDATION
// ==========================================

function validateAmount(value) {
  const amountText = String(value ?? "").trim();

  if (!/^\d+(\.\d{1,2})?$/.test(amountText)) {
    return null;
  }

  const amount = Number(amountText);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amountText;
}

function isValidUUID(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(value ?? "")
  );
}

function validateDescription(description) {
  return (
    description === undefined ||
    (typeof description === "string" && description.length <= 200)
  );
}

// ==========================================
// DEPOSIT
// POST /api/transactions/deposit
// ==========================================

router.post("/deposit", async (req, res) => {
  try {
    const { accountId, description } = req.body;
    const amountText = validateAmount(req.body.amount);

    if (!isValidUUID(accountId) || !amountText) {
      return res.status(400).json({
        status: "error",
        message: "Valid account ID and positive amount are required."
      });
    }

    if (!validateDescription(description)) {
      return res.status(400).json({
        status: "error",
        message: "Description must be a string of at most 200 characters."
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: {
          id: accountId,
          userId: req.user.userId
        }
      });

      if (!account) {
        throw new Error("ACCOUNT_NOT_FOUND");
      }

      if (account.status !== "ACTIVE") {
        throw new Error("ACCOUNT_NOT_ACTIVE");
      }

      const updatedAccount = await tx.account.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: amountText
          }
        }
      });

      const transaction = await tx.transaction.create({
        data: {
          type: "DEPOSIT",
          amount: amountText,
          status: "COMPLETED",
          description: description?.trim() || "Account deposit",
          toAccountId: accountId,
          userId: req.user.userId
        }
      });

      await tx.auditLog.create({
        data: {
          action: "DEPOSIT",
          entity: "TRANSACTION",
          entityId: transaction.id,
          details: {
            amount: amountText,
            accountNumber: account.accountNumber
          },
          userId: req.user.userId
        }
      });

      return {
        account: updatedAccount,
        transaction
      };
    });

    return res.status(201).json({
      status: "success",
      message: "Deposit completed successfully.",
      ...result
    });

  } catch (error) {
    console.error("Deposit error:", error.message);

    if (error.message === "ACCOUNT_NOT_FOUND") {
      return res.status(404).json({
        status: "error",
        message: "Account not found."
      });
    }

    if (error.message === "ACCOUNT_NOT_ACTIVE") {
      return res.status(400).json({
        status: "error",
        message: "Account is not active."
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Deposit failed."
    });
  }
});

// ==========================================
// WITHDRAWAL
// POST /api/transactions/withdraw
// ==========================================

router.post("/withdraw", async (req, res) => {
  try {
    const { accountId, description } = req.body;
    const amountText = validateAmount(req.body.amount);

    if (!isValidUUID(accountId) || !amountText) {
      return res.status(400).json({
        status: "error",
        message: "Valid account ID and positive amount are required."
      });
    }

    if (!validateDescription(description)) {
      return res.status(400).json({
        status: "error",
        message: "Description must be a string of at most 200 characters."
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: {
          id: accountId,
          userId: req.user.userId
        }
      });

      if (!account) {
        throw new Error("ACCOUNT_NOT_FOUND");
      }

      if (account.status !== "ACTIVE") {
        throw new Error("ACCOUNT_NOT_ACTIVE");
      }

      const debit = await tx.account.updateMany({
        where: {
          id: accountId,
          userId: req.user.userId,
          status: "ACTIVE",
          balance: {
            gte: amountText
          }
        },
        data: {
          balance: {
            decrement: amountText
          }
        }
      });

      if (debit.count !== 1) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const updatedAccount = await tx.account.findUnique({
        where: { id: accountId }
      });

      const transaction = await tx.transaction.create({
        data: {
          type: "WITHDRAWAL",
          amount: amountText,
          status: "COMPLETED",
          description: description?.trim() || "Account withdrawal",
          fromAccountId: accountId,
          userId: req.user.userId
        }
      });

      await tx.auditLog.create({
        data: {
          action: "WITHDRAWAL",
          entity: "TRANSACTION",
          entityId: transaction.id,
          details: {
            amount: amountText,
            accountNumber: account.accountNumber
          },
          userId: req.user.userId
        }
      });

      return {
        account: updatedAccount,
        transaction
      };
    });

    return res.status(201).json({
      status: "success",
      message: "Withdrawal completed successfully.",
      ...result
    });

  } catch (error) {
    console.error("Withdrawal error:", error.message);

    if (error.message === "ACCOUNT_NOT_FOUND") {
      return res.status(404).json({
        status: "error",
        message: "Account not found."
      });
    }

    if (error.message === "ACCOUNT_NOT_ACTIVE") {
      return res.status(400).json({
        status: "error",
        message: "Account is not active."
      });
    }

    if (error.message === "INSUFFICIENT_BALANCE") {
      return res.status(400).json({
        status: "error",
        message: "Insufficient account balance."
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Withdrawal failed."
    });
  }
});

// ==========================================
// TRANSFER
// POST /api/transactions/transfer
// Supports transfer between different users.
// Receiver is identified by account number.
// ==========================================

router.post("/transfer", async (req, res) => {
  try {
    const {
      fromAccountId,
      receiverAccountNumber,
      description
    } = req.body;

    const amountText = validateAmount(req.body.amount);

    const receiverNumber = String(
      receiverAccountNumber ?? ""
    ).trim().toUpperCase();

    if (!isValidUUID(fromAccountId) || !amountText) {
      return res.status(400).json({
        status: "error",
        message: "Valid sender account and positive amount are required."
      });
    }

    if (!/^BV\d{10}$/.test(receiverNumber)) {
      return res.status(400).json({
        status: "error",
        message: "Enter a valid receiver account number."
      });
    }

    if (!validateDescription(description)) {
      return res.status(400).json({
        status: "error",
        message: "Description must be a string of at most 200 characters."
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Sender must belong to the logged-in user.
      const sender = await tx.account.findFirst({
        where: {
          id: fromAccountId,
          userId: req.user.userId
        }
      });

      if (!sender) {
        throw new Error("SENDER_NOT_FOUND");
      }

      // Receiver can belong to any user.
      const receiver = await tx.account.findUnique({
        where: {
          accountNumber: receiverNumber
        }
      });

      if (!receiver) {
        throw new Error("RECEIVER_NOT_FOUND");
      }

      if (sender.id === receiver.id) {
        throw new Error("SAME_ACCOUNT");
      }

      if (
        sender.status !== "ACTIVE" ||
        receiver.status !== "ACTIVE"
      ) {
        throw new Error("ACCOUNT_NOT_ACTIVE");
      }

      // Debit sender only when sufficient balance exists.
      const debit = await tx.account.updateMany({
        where: {
          id: sender.id,
          userId: req.user.userId,
          status: "ACTIVE",
          balance: {
            gte: amountText
          }
        },
        data: {
          balance: {
            decrement: amountText
          }
        }
      });

      if (debit.count !== 1) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // Credit receiver.
      const credit = await tx.account.updateMany({
        where: {
          id: receiver.id,
          status: "ACTIVE"
        },
        data: {
          balance: {
            increment: amountText
          }
        }
      });

      if (credit.count !== 1) {
        throw new Error("RECEIVER_UPDATE_FAILED");
      }

      const updatedSender = await tx.account.findUnique({
        where: { id: sender.id }
      });

      const updatedReceiver = await tx.account.findUnique({
        where: { id: receiver.id }
      });

      // Create transfer transaction.
      const transaction = await tx.transaction.create({
        data: {
          type: "TRANSFER",
          amount: amountText,
          status: "COMPLETED",
          description: description?.trim() || "Money transfer",
          fromAccountId: sender.id,
          toAccountId: receiver.id,
          userId: req.user.userId
        }
      });

      // Create audit log.
      await tx.auditLog.create({
        data: {
          action: "TRANSFER",
          entity: "TRANSACTION",
          entityId: transaction.id,
          details: {
            amount: amountText,
            fromAccount: sender.accountNumber,
            toAccount: receiver.accountNumber
          },
          userId: req.user.userId
        }
      });

      return {
        sender: updatedSender,
        receiver: updatedReceiver,
        transaction
      };
    });

    return res.status(201).json({
      status: "success",
      message: "Money transferred successfully.",
      ...result
    });

  } catch (error) {
    console.error("Transfer error:", error.message);

    if (error.message === "SENDER_NOT_FOUND") {
      return res.status(404).json({
        status: "error",
        message: "Sender account not found."
      });
    }

    if (error.message === "RECEIVER_NOT_FOUND") {
      return res.status(404).json({
        status: "error",
        message: "Receiver account number not found."
      });
    }

    if (error.message === "SAME_ACCOUNT") {
      return res.status(400).json({
        status: "error",
        message: "You cannot transfer money to the same account."
      });
    }

    if (error.message === "ACCOUNT_NOT_ACTIVE") {
      return res.status(400).json({
        status: "error",
        message: "One or both accounts are not active."
      });
    }

    if (error.message === "INSUFFICIENT_BALANCE") {
      return res.status(400).json({
        status: "error",
        message: "Insufficient account balance."
      });
    }

    if (error.message === "RECEIVER_UPDATE_FAILED") {
      return res.status(400).json({
        status: "error",
        message: "Unable to credit receiver account."
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Transfer failed."
    });
  }
});

// ==========================================
// TRANSACTION HISTORY
// GET /api/transactions
// ==========================================

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
        message: "Invalid pagination values."
      });
    }

    const where = {
      userId: req.user.userId
    };

    if (req.query.type) {
      const type = String(req.query.type).toUpperCase();

      if (!["DEPOSIT", "WITHDRAWAL", "TRANSFER"].includes(type)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid transaction type."
        });
      }

      where.type = type;
    }

    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where,
        include: {
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
        },
        orderBy: {
          createdAt: "desc"
        },
        skip: (page - 1) * limit,
        take: limit
      }),

      prisma.transaction.count({ where })
    ]);

    return res.status(200).json({
      status: "success",
      message: "Transaction history retrieved successfully.",
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalTransactions: total,
        totalPages: Math.ceil(total / limit)
      },
      transactions
    });

  } catch (error) {
    console.error("Transaction history error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Unable to retrieve transaction history."
    });
  }
});

// ==========================================
// GET TRANSACTION BY ID
// GET /api/transactions/:id
// ==========================================

router.get("/:id", async (req, res) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid transaction ID."
      });
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.userId
      },
      include: {
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
    });

    if (!transaction) {
      return res.status(404).json({
        status: "error",
        message: "Transaction not found."
      });
    }

    return res.status(200).json({
      status: "success",
      transaction
    });

  } catch (error) {
    console.error("Get transaction error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Unable to retrieve transaction."
    });
  }
});

export default router;
