import React, { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { setPersistence, browserLocalPersistence } from "firebase/auth";
import { auth } from "../firebase";

function Login({ showToast }) {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { login, resetPassword } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await setPersistence(auth, browserLocalPersistence);
      await login(emailRef.current.value, passwordRef.current.value);
      showToast && showToast("Logged in!");
      navigate("/");
    } catch (err) {
      setError("Failed to log in. Please check your credentials.");
    }

    setLoading(false);
  }

  async function handleReset(e) {
    e.preventDefault();
    setError("");
    setResetSent(false);
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (err) {
      setError("Failed to send password reset email.");
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Welcome back</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" ref={emailRef} placeholder="you@example.com" required disabled={loading} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" ref={passwordRef} placeholder="Your password" required disabled={loading} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary btn-block btn-lg">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={() => setShowReset(!showReset)} className="btn-ghost btn-sm">
            Forgot Password?
          </button>
        </div>

        {showReset && (
          <form onSubmit={handleReset} style={{ marginTop: 16 }}>
            <div className="form-group">
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <button type="submit" className="btn-outline btn-block">
              Send Reset Link
            </button>
            {resetSent && <div className="auth-success" style={{ marginTop: 12 }}>Reset email sent! Check your inbox.</div>}
          </form>
        )}

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
