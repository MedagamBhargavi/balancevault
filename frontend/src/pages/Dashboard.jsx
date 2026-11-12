
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  LayoutDashboard,
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  ShieldCheck,
  LogOut,
  RefreshCw,
  User,
  Menu,
  X
} from "lucide-react";

import {
  authAPI,
  accountAPI,
  transactionAPI,
  auditAPI
} from "../services/api";

import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [accountId, setAccountId] = useState("");
  const [toAccountNumber, setToAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  // LOAD DASHBOARD DATA
  const loadDashboard = useCallback(async () => {
    try {
      setError("");

      const [
        profileResponse,
        accountResponse,
        historyResponse,
        auditResponse
      ] = await Promise.all([
        authAPI.getProfile(),
        accountAPI.getAccounts(),
        transactionAPI.getHistory(1, 10),
        auditAPI.getLogs(1, 10)
      ]);

      setUser(profileResponse.user);
      setAccounts(accountResponse.accounts || []);
      setTransactions(historyResponse.transactions || []);
      setAuditLogs(auditResponse.logs || []);

      const firstAccount = accountResponse.accounts?.[0];

      if (firstAccount) {
        setAccountId((current) => current || firstAccount.id);
      }
    } catch (err) {
      localStorage.removeItem("balancevault_token");
      localStorage.removeItem("balancevault_user");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // CHECK LOGIN AND LOAD DATA
  useEffect(() => {
    if (!localStorage.getItem("balancevault_token")) {
      navigate("/login");
      return;
    }

    loadDashboard();
  }, [navigate, loadDashboard]);

  // TOTAL BALANCE
  const totalBalance = accounts.reduce(
    (total, account) => total + Number(account.balance || 0),
    0
  );

  // CURRENCY FORMAT
  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2
    }).format(Number(value || 0));

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("balancevault_token");
    localStorage.removeItem("balancevault_user");
    navigate("/login");
  };

  // CLEAR MESSAGES
  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  // DEPOSIT / WITHDRAW / TRANSFER
  const handleTransaction = async (event) => {
    event.preventDefault();
    resetMessages();

    if (!accountId) {
      setError("Please select an account.");
      return;
    }

    if (
      !amount ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
      setError("Amount can have a maximum of two decimal places.");
      return;
    }

    try {
      setSubmitting(true);

      const data = {
        accountId,
        amount,
        description: description.trim()
      };

      // DEPOSIT
      if (activeTab === "deposit") {
        await transactionAPI.deposit(data);
        setSuccess("Deposit completed successfully!");
      }

      // WITHDRAW
      else if (activeTab === "withdraw") {
        await transactionAPI.withdraw(data);
        setSuccess("Withdrawal completed successfully!");
      }

      // TRANSFER TO ANOTHER USER
      else if (activeTab === "transfer") {
        const receiverNumber = toAccountNumber.trim().toUpperCase();

        if (!/^BV\d{10}$/.test(receiverNumber)) {
          setError(
            "Please enter a valid account number. Example: BV1651515475"
          );
          return;
        }

        const senderAccount = accounts.find(
          (account) => account.id === accountId
        );

        if (
          senderAccount?.accountNumber?.toUpperCase() === receiverNumber
        ) {
          setError("You cannot transfer money to your own account.");
          return;
        }

        await transactionAPI.transfer({
          fromAccountId: accountId,
          receiverAccountNumber: receiverNumber,
          amount,
          description: description.trim()
        });

        setSuccess("Money transferred successfully!");
        setToAccountNumber("");
      }

      setAmount("");
      setDescription("");

      await loadDashboard();

    } catch (err) {
      setError(err.message || "Transaction failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // SIDEBAR NAVIGATION
  const navigation = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "deposit", label: "Deposit", icon: ArrowDownToLine },
    { id: "withdraw", label: "Withdraw", icon: ArrowUpFromLine },
    { id: "transfer", label: "Transfer", icon: ArrowLeftRight },
    { id: "transactions", label: "Transactions", icon: History },
    { id: "audit", label: "Audit Logs", icon: ShieldCheck }
  ];

  const selectTab = (tab) => {
    setActiveTab(tab);
    resetMessages();
    setMobileMenu(false);
  };

  // LOADING SCREEN
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your BalanceVault dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside
        className={`dashboard-sidebar ${
          mobileMenu ? "sidebar-open" : ""
        }`}
      >
        <div className="dashboard-brand">
          <span className="dashboard-brand-icon">B</span>
          <span>alanceVault</span>
        </div>

        <p className="sidebar-label">MAIN MENU</p>

        <nav className="dashboard-navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`nav-item ${
                  activeTab === item.id ? "active" : ""
                }`}
                onClick={() => selectTab(item.id)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-security">
            <ShieldCheck size={21} />
            <div>
              <strong>Secure Banking</strong>
              <span>Your account is protected</span>
            </div>
          </div>

          <button className="logout-button" onClick={logout}>
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {mobileMenu && (
        <div
          className="dashboard-overlay"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <main className="dashboard-main">

        {/* HEADER */}
        <header className="dashboard-header">
          <div className="header-left">
            <button
              className="mobile-menu-button"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X /> : <Menu />}
            </button>

            <div>
              <span className="header-small">
                BALANCEVAULT / SECURE BANKING
              </span>

              <h1>
                {navigation.find(
                  (item) => item.id === activeTab
                )?.label}
              </h1>
            </div>
          </div>

          <div className="header-user">
            <div className="user-avatar">
              <User size={20} />
            </div>

            <div className="user-details">
              <strong>{user?.fullName || "User"}</strong>
              <span>{user?.email || ""}</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content">

          {/* ERROR MESSAGE */}
          {error && (
            <div className="dashboard-alert error-alert" role="alert">
              {error}
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {success && (
            <div className="dashboard-alert success-alert" role="status">
              {success}
            </div>
          )}

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <>
              <div className="welcome-section">
                <div>
                  <h2>Hello, {user?.fullName || "there"}!</h2>
                  <p>
                    Here's an overview of your accounts and activity.
                  </p>
                </div>

                <button
                  className="refresh-button"
                  onClick={loadDashboard}
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>

              <div className="overview-cards">

                {/* BALANCE CARD */}
                <div className="balance-card">
                  <div className="balance-card-top">
                    <span>Total Account Balance</span>
                    <Wallet size={23} />
                  </div>

                  <h2>{formatCurrency(totalBalance)}</h2>

                  <p>Combined balance across your accounts</p>

                  <div className="balance-card-footer">
                    <span>BalanceVault Account</span>
                    <ShieldCheck size={18} />
                  </div>
                </div>

                {/* ACCOUNT COUNT */}
                <div className="stat-card">
                  <div className="stat-icon green">
                    <Wallet size={21} />
                  </div>

                  <span>Total Accounts</span>
                  <h2>{accounts.length}</h2>
                  <p>Your registered accounts</p>
                </div>

                {/* TRANSACTION COUNT */}
                <div className="stat-card">
                  <div className="stat-icon blue">
                    <History size={21} />
                  </div>

                  <span>Recent Transactions</span>
                  <h2>{transactions.length}</h2>
                  <p>Latest transaction records</p>
                </div>

              </div>

              {/* MY ACCOUNTS */}
              <section className="dashboard-section">
                <div className="section-heading">
                  <div>
                    <h2>My Accounts</h2>
                    <p>View your account details and balances.</p>
                  </div>
                </div>

                <div className="account-grid">
                  {accounts.map((account) => (
                    <div className="account-card" key={account.id}>
                      <div className="account-card-top">
                        <div className="account-icon">
                          <Wallet size={21} />
                        </div>

                        <span
                          className={`account-status ${
                            account.status?.toLowerCase()
                          }`}
                        >
                          {account.status}
                        </span>
                      </div>

                      <span className="account-label">
                        ACCOUNT NUMBER
                      </span>

                      <h3>{account.accountNumber}</h3>

                      <span className="account-label">
                        AVAILABLE BALANCE
                      </span>

                      <h2>{formatCurrency(account.balance)}</h2>

                      <span className="account-currency">
                        Currency: {account.currency || "INR"}
                      </span>
                    </div>
                  ))}

                  {accounts.length === 0 && (
                    <p>No accounts found.</p>
                  )}
                </div>
              </section>

              {/* RECENT TRANSACTIONS */}
              <section className="dashboard-section">
                <div className="section-heading">
                  <div>
                    <h2>Recent Transactions</h2>
                    <p>Your latest account activities.</p>
                  </div>

                  <button
                    className="text-button"
                    onClick={() => selectTab("transactions")}
                  >
                    View All
                  </button>
                </div>

                <TransactionTable
                  transactions={transactions.slice(0, 5)}
                  formatCurrency={formatCurrency}
                />
              </section>
            </>
          )}

          {/* DEPOSIT / WITHDRAW / TRANSFER */}
          {["deposit", "withdraw", "transfer"].includes(activeTab) && (
            <section className="operation-section">

              <div className="operation-intro">
                <div className="operation-icon">
                  {activeTab === "deposit" && (
                    <ArrowDownToLine size={26} />
                  )}

                  {activeTab === "withdraw" && (
                    <ArrowUpFromLine size={26} />
                  )}

                  {activeTab === "transfer" && (
                    <ArrowLeftRight size={26} />
                  )}
                </div>

                <h2>
                  {activeTab === "deposit" && "Deposit Money"}
                  {activeTab === "withdraw" && "Withdraw Money"}
                  {activeTab === "transfer" && "Transfer Money"}
                </h2>

                <p>
                  {activeTab === "deposit" &&
                    "Add demo funds to your account."}

                  {activeTab === "withdraw" &&
                    "Withdraw demo funds from your account."}

                  {activeTab === "transfer" &&
                    "Transfer demo funds between different users."}
                </p>
              </div>

              <form
                className="operation-form"
                onSubmit={handleTransaction}
              >

                {/* SENDER ACCOUNT */}
                <label htmlFor="accountId">
                  {activeTab === "transfer"
                    ? "From Account"
                    : "Select Account"}
                </label>

                <select
                  id="accountId"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  required
                >
                  <option value="">Choose an account</option>

                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountNumber} —{" "}
                      {formatCurrency(account.balance)}
                    </option>
                  ))}
                </select>

                {/* RECEIVER ACCOUNT NUMBER INPUT */}
                {activeTab === "transfer" && (
                  <>
                    <label htmlFor="toAccountNumber">
                      Receiver Account Number
                    </label>

                    <input
                      id="toAccountNumber"
                      name="toAccountNumber"
                      type="text"
                      placeholder="Example: BV1651515475"
                      value={toAccountNumber}
                      onChange={(e) =>
                        setToAccountNumber(
                          e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "")
                        )
                      }
                      maxLength={12}
                      autoComplete="off"
                      required
                    />

                    <small className="transfer-help">
                      Enter the account number of the person receiving
                      the money. Format: BV followed by 10 digits.
                    </small>
                  </>
                )}

                {/* AMOUNT */}
                <label htmlFor="amount">
                  Amount (INR)
                </label>

                <input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />

                {/* DESCRIPTION */}
                <label htmlFor="description">
                  Description (optional)
                </label>

                <input
                  id="description"
                  type="text"
                  maxLength={200}
                  placeholder="Enter a description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                {/* SUBMIT */}
                <button
                  type="submit"
                  className="operation-submit"
                  disabled={submitting || accounts.length === 0}
                >
                  {submitting
                    ? "Processing..."
                    : activeTab === "deposit"
                    ? "Confirm Deposit"
                    : activeTab === "withdraw"
                    ? "Confirm Withdrawal"
                    : "Confirm Transfer"}
                </button>

              </form>
            </section>
          )}

          {/* TRANSACTION HISTORY */}
          {activeTab === "transactions" && (
            <section className="dashboard-section">

              <div className="section-heading">
                <div>
                  <h2>Transaction History</h2>
                  <p>
                    Review your recent deposits, withdrawals and transfers.
                  </p>
                </div>

                <button
                  className="refresh-button"
                  onClick={loadDashboard}
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>

              <TransactionTable
                transactions={transactions}
                formatCurrency={formatCurrency}
              />

            </section>
          )}

          {/* AUDIT LOGS */}
          {activeTab === "audit" && (
            <section className="dashboard-section">

              <div className="section-heading">
                <div>
                  <h2>Audit Activity</h2>
                  <p>Review recorded activities on your account.</p>
                </div>

                <button
                  className="refresh-button"
                  onClick={loadDashboard}
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>

              <div className="audit-list">
                {auditLogs.map((log) => (
                  <div className="audit-item" key={log.id}>
                    <div className="audit-icon">
                      <ShieldCheck size={20} />
                    </div>

                    <div className="audit-info">
                      <strong>{log.action}</strong>

                      <span>
                        {log.entity} · {log.entityId || "N/A"}
                      </span>

                      <small>
                        {new Date(log.createdAt).toLocaleString("en-IN")}
                      </small>
                    </div>
                  </div>
                ))}

                {auditLogs.length === 0 && (
                  <p className="empty-state">
                    No audit records found yet.
                  </p>
                )}
              </div>

            </section>
          )}

          {/* FOOTER */}
          <footer className="dashboard-footer">
            <span>© 2026 BalanceVault</span>
            <span>
              Secure Account Management · Hackathon Demo
            </span>
          </footer>

        </div>
      </main>
    </div>
  );
}

// TRANSACTION TABLE
function TransactionTable({ transactions, formatCurrency }) {
  if (!transactions.length) {
    return (
      <div className="empty-state">
        No transactions available.
      </div>
    );
  }

  return (
    <div className="transaction-table-wrapper">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>
                <strong>{transaction.type}</strong>
              </td>

              <td>
                {transaction.description || "Account activity"}
              </td>

              <td className="transaction-amount">
                {formatCurrency(transaction.amount)}
              </td>

              <td>
                <span
                  className={`transaction-status ${
                    transaction.status?.toLowerCase()
                  }`}
                >
                  {transaction.status}
                </span>
              </td>

              <td>
                {new Date(
                  transaction.createdAt
                ).toLocaleDateString("en-IN")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;
