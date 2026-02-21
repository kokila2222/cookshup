import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

function Account({ userName, setUserName }) {
  const { currentUser, updateDisplayName, resetPassword } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || userName || "");
  const [email] = useState(currentUser?.email || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!currentUser) {
    return <div className="loading-screen">Loading your account...</div>;
  }

  async function handleUpdateName(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await updateDisplayName(displayName);
      setUserName(displayName);
      setMessage("Display name updated!");
    } catch (err) {
      setError("Failed to update display name.");
    }
    setLoading(false);
  }

  async function handleResetPassword() {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await resetPassword(email);
      setMessage("Password reset email sent!");
    } catch (err) {
      setError("Failed to send password reset email.");
    }
    setLoading(false);
  }

  return (
    <div className="account-page">
      <div className="page-header">
        <h2 className="page-title">My Account</h2>
        <p className="page-subtitle">Manage your profile settings</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem" }}>Email</label>
          <div style={{ fontSize: "1rem", fontWeight: 500, marginTop: 2 }}>{email}</div>
        </div>

        <form onSubmit={handleUpdateName}>
          <div className="form-group">
            <label>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            Update Name
          </button>
        </form>
      </div>

      <div className="card">
        <div className="form-section-title">Security</div>
        <p style={{ fontSize: "0.9375rem", color: "var(--color-text-secondary)", marginBottom: 16 }}>
          Need to change your password? We'll send a reset link to your email.
        </p>
        <button onClick={handleResetPassword} disabled={loading} className="btn-outline">
          Send Password Reset Email
        </button>
      </div>

      {message && <div className="auth-success" style={{ marginTop: 20 }}>{message}</div>}
      {error && <div className="auth-error" style={{ marginTop: 20 }}>{error}</div>}
    </div>
  );
}

export default Account;
