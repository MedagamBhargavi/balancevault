
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Register.css";

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      alert("Password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (!agreeTerms) {
      alert("Please accept the Terms and Conditions.");
      return;
    }

    alert("Registration form submitted! Backend integration is not connected yet.");
  };

  return (
    <div className="register-page">

      {/* Left Side */}
      <div className="register-left">
        <div className="register-brand">
          <div className="register-logo">B</div>
          <span>BalanceVault</span>
        </div>

        <div className="register-left-content">
          <span className="register-tag">YOUR FINANCIAL JOURNEY STARTS HERE</span>

          <h1>
            Take Control.
            <br />
            Build Your
            <br />
            <span>Financial Future.</span>
          </h1>

          <p>
            Create your BalanceVault account and experience
            a smarter, simpler and more secure way to manage
            your finances.
          </p>

          <div className="register-benefits">
            <div className="register-benefit">
              <span className="benefit-icon">✓</span>
              <div>
                <h4>Smart Money Management</h4>
                <p>Keep your finances organized in one place.</p>
              </div>
            </div>

            <div className="register-benefit">
              <span className="benefit-icon">✓</span>
              <div>
                <h4>Secure Account</h4>
                <p>Your financial information deserves protection.</p>
              </div>
            </div>

            <div className="register-benefit">
              <span className="benefit-icon">✓</span>
              <div>
                <h4>Better Financial Decisions</h4>
                <p>Stay informed and make confident decisions.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="register-footer">
          © 2026 BalanceVault. All rights reserved.
        </div>
      </div>

      {/* Right Side */}
      <div className="register-right">
        <div className="register-mobile-brand">
          <div className="register-logo">B</div>
          <span>BalanceVault</span>
        </div>

        <div className="register-card">
          <div className="register-heading">
            <span className="form-label">GET STARTED</span>
            <h2>Create your account</h2>
            <p>Join BalanceVault and take the first step towards better financial management.</p>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="register-input-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="register-input-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="register-input-group">
              <label>Password</label>
              <div className="register-password-box">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <small>Use at least 8 characters.</small>
            </div>

            <div className="register-input-group">
              <label>Confirm Password</label>
              <div className="register-password-box">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="register-terms">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <span>
                I agree to the Terms and Conditions and Privacy Policy.
              </span>
            </label>

            <button type="submit" className="register-submit">
              Create Account <span>→</span>
            </button>

          </form>

          <div className="register-login-link">
            Already have an account?
            <Link to="/login"> Sign In</Link>
          </div>

          <div className="register-home-link">
            <Link to="/">← Back to Home</Link>
          </div>
        </div>

        <div className="register-security-note">
          <span>🔒</span> Your security is our priority.
        </div>
      </div>
    </div>
  );
}

export default Register;
