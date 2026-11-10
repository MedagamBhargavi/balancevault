
import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Login.css';

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert('Please enter your email and password.');
      return;
    }

    alert('Login form submitted. Backend authentication is not connected yet.');
  };

  return (
    <div className="login-page">

      {/* Left Side */}
      <div className="login-left">

        <Link to="/" className="login-brand">
          <span className="brand-symbol">B</span>
          BalanceVault
        </Link>

        <div className="login-left-content">
          <span className="login-tag">SECURE BANKING EXPERIENCE</span>

          <h1>
            Your finances.
            <br />
            <span>Your future.</span>
          </h1>

          <p>
            Experience smarter and more secure account management
            with BalanceVault.
          </p>

          <div className="login-benefits">
            <div>
              <span className="benefit-icon">✓</span>
              Secure account access
            </div>

            <div>
              <span className="benefit-icon">✓</span>
              Protected user information
            </div>

            <div>
              <span className="benefit-icon">✓</span>
              Transparent account activity
            </div>
          </div>
        </div>

        <p className="login-left-footer">
          © 2026 BalanceVault. All rights reserved.
        </p>

      </div>

      {/* Right Side */}
      <div className="login-right">

        <div className="login-card">

          <Link to="/" className="mobile-brand">
            <span className="brand-symbol">B</span>
            BalanceVault
          </Link>

          <div className="login-heading">
            <span className="welcome-tag">WELCOME BACK</span>

            <h2>Sign in to your account</h2>

            <p>
              Enter your details to access your BalanceVault account.
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>

              <div className="input-wrapper">
                <span className="input-icon">✉</span>

                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="input-wrapper">
                <span className="input-icon">🔒</span>

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit">
              Sign In <span>→</span>
            </button>

          </form>

          <div className="login-register">
            <p>New to BalanceVault?</p>

            <Link to="/register">
              Create an account
            </Link>
          </div>

          <div className="login-back">
            <Link to="/">
              ← Back to Home
            </Link>
          </div>

          <div className="login-security">
            <span>🛡️</span>
            Your security is our priority.
          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;
