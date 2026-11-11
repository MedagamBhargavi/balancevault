
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Wallet,
  ArrowLeftRight,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Menu,
  X
} from "lucide-react";

import { adminAPI } from "../services/api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "accounts", label: "Accounts", icon: Wallet },
    { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
    { id: "audit", label: "Audit Logs", icon: ShieldCheck }
  ];

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        statsData,
        usersData,
        accountsData,
        transactionsData,
        auditData
      ] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getAccounts(),
        adminAPI.getTransactions(),
        adminAPI.getAuditLogs()
      ]);

      setStats(statsData.stats);
      setUsers(usersData.users || []);
      setAccounts(accountsData.accounts || []);
      setTransactions(transactionsData.transactions || []);
      setLogs(auditData.logs || []);
    } catch (err) {
      setError(err.message || "Unable to load admin information.");

      if (
        err.message?.toLowerCase().includes("unauthorized") ||
        err.message?.toLowerCase().includes("access denied")
      ) {
        localStorage.removeItem("balancevault_token");
        localStorage.removeItem("balancevault_user");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("balancevault_token")) {
      navigate("/login");
      return;
    }

    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("balancevault_token");
    localStorage.removeItem("balancevault_user");
    navigate("/login");
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-IN");
  };

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR"
    });
  };

  const renderTable = () => {
    if (loading) return <p className="admin-message">Loading data...</p>;

    if (error) {
      return (
        <div className="admin-error">
          {error}
          <button onClick={loadData}>Try Again</button>
        </div>
      );
    }

    if (activeTab === "users") {
      return (
        <div className="admin-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Accounts</th>
                <th>Transactions</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className="admin-status">{user.role}</span>
                  </td>
                  <td>{user._count?.accounts ?? 0}</td>
                  <td>{user._count?.transactions ?? 0}</td>
                  <td>{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p>No users found.</p>}
        </div>
      );
    }

    if (activeTab === "accounts") {
      return (
        <div className="admin-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Account Number</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Balance</th>
                <th>Currency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.accountNumber}</td>
                  <td>{account.user?.fullName}</td>
                  <td>{account.user?.email}</td>
                  <td>{formatMoney(account.balance)}</td>
                  <td>{account.currency}</td>
                  <td>{account.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {accounts.length === 0 && <p>No accounts found.</p>}
        </div>
      );
    }

    if (activeTab === "transactions") {
      return (
        <div className="admin-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Description</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.type}</td>
                  <td>{transaction.user?.fullName}</td>
                  <td>{formatMoney(transaction.amount)}</td>
                  <td>{transaction.status}</td>
                  <td>{transaction.description || "—"}</td>
                  <td>{formatDate(transaction.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && <p>No transactions found.</p>}
        </div>
      );
    }

    if (activeTab === "audit") {
      return (
        <div className="admin-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Entity</th>
                <th>User</th>
                <th>Entity ID</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.action}</td>
                  <td>{log.entity}</td>
                  <td>{log.user?.email || "System / Deleted User"}</td>
                  <td>{log.entityId || "—"}</td>
                  <td>{formatDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <p>No audit logs found.</p>}
        </div>
      );
    }

    return null;
  };

  const statCards = [
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users
    },
    {
      label: "Total Accounts",
      value: stats?.totalAccounts ?? 0,
      icon: Wallet
    },
    {
      label: "Transactions",
      value: stats?.totalTransactions ?? 0,
      icon: ArrowLeftRight
    },
    {
      label: "Audit Logs",
      value: stats?.totalAuditLogs ?? 0,
      icon: ShieldCheck
    }
  ];

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-brand">
          <span className="admin-brand-icon">B</span>
          BalanceVault
          <button
            className="admin-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <p className="admin-menu-title">ADMIN MENU</p>

        <nav>
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`admin-nav-item ${
                  activeTab === item.id ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={19} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <button className="admin-logout" onClick={handleLogout}>
          <LogOut size={19} />
          Logout
        </button>
      </aside>

      {sidebarOpen && (
        <div
          className="admin-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-mobile-menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div>
            <p>BalanceVault / Administration</p>
            <h2>Admin Dashboard</h2>
          </div>

          <button
            className="admin-refresh"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </header>

        <section className="admin-content">
          {error && <div className="admin-error">{error}</div>}

          {activeTab === "overview" && (
            <>
              <div className="admin-welcome">
                <div>
                  <span>ADMIN CONTROL PANEL</span>
                  <h1>Welcome, Administrator!</h1>
                  <p>Monitor users, accounts and system activities.</p>
                </div>
                <ShieldCheck size={55} />
              </div>

              {loading ? (
                <p className="admin-message">Loading statistics...</p>
              ) : (
                <>
                  <div className="admin-stat-grid">
                    {statCards.map((card) => {
                      const Icon = card.icon;

                      return (
                        <div className="admin-stat-card" key={card.label}>
                          <div className="admin-stat-icon">
                            <Icon size={23} />
                          </div>
                          <p>{card.label}</p>
                          <h2>{card.value}</h2>
                        </div>
                      );
                    })}
                  </div>

                  <div className="admin-balance-card">
                    <p>Total Account Balance</p>
                    <h2>{formatMoney(stats?.totalBalance)}</h2>
                    <span>Combined balance across all customer accounts</span>
                  </div>
                </>
              )}
            </>
          )}

          <section className="admin-data-section">
            <div className="admin-section-heading">
              <div>
                <h2>
                  {menuItems.find((item) => item.id === activeTab)?.label}
                </h2>
                <p>BalanceVault system records and information</p>
              </div>
            </div>

            {activeTab !== "overview" && renderTable()}
          </section>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
