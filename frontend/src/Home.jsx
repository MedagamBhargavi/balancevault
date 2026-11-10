
import './App.css';

function App() {
  return (
    <div className="app">

      {/* Navbar */}
      <nav className="navbar">
        <a href="/" className="logo">
          <span className="logo-icon">B</span>
          BalanceVault
        </a>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#security">Security</a>
          <a href="/login">Login</a>
          <a href="/register" className="nav-button">
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">

        <div className="hero-content">
          <span className="tag">
            SECURE ACCOUNT MANAGEMENT
          </span>

          <h1>
            Your Money.
            <br />
            <span>Your Control.</span>
            <br />
            Your Security.
          </h1>

          <p>
            Manage your accounts securely with role-based access,
            transparent operations, and auditable account activity.
          </p>

          <div className="hero-buttons">
            <a href="/register" className="primary-btn">
              Create Account →
            </a>

            <a href="/login" className="secondary-btn">
              Sign In
            </a>
          </div>
        </div>

        {/* Account Card */}
        <div className="hero-card">

          <div className="card-header">
            <span>Account Overview</span>
            <span className="status">● Active</span>
          </div>

          <p className="balance-label">Demo Balance</p>

          <h2>₹25,000.00</h2>

          <p className="demo-text">Synthetic demo data</p>

          <div className="card-divider"></div>

          <div className="security-info">
            <span className="security-icon">✓</span>

            <div>
              <strong>Account Security Enabled</strong>
              <p>Your account is protected</p>
            </div>
          </div>

        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">

        <div className="section-heading">
          <span className="tag">OUR FEATURES</span>

          <h2>
            Everything you need to manage accounts
          </h2>

          <p>Security and transparency at every step.</p>
        </div>

        <div className="feature-grid">

          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Secure Authentication</h3>
            <p>Protected login and account access.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💳</div>
            <h3>Account Management</h3>
            <p>Organized account information and onboarding.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Audit Trail</h3>
            <p>Track account operations with auditable records.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Role-Based Access</h3>
            <p>Different permissions for users and administrators.</p>
          </div>

        </div>
      </section>

      {/* Security Section */}
      <section className="security-section" id="security">

        <h2>Your security comes first.</h2>

        <p>
          BalanceVault focuses on secure access, transparent
          operations, and responsible account management.
        </p>

        <a href="/register" className="primary-btn">
          Get Started →
        </a>

      </section>

      {/* Footer */}
      <footer>
        <p>© 2026 BalanceVault. All rights reserved.</p>
      </footer>

    </div>
  );
}

export default App;
