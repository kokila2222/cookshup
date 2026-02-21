import React, { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function SignUp() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const confirmRef = useRef();
  const displayNameRef = useRef();
  const { signup } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (passwordRef.current.value !== confirmRef.current.value) {
      return setError("Passwords do not match");
    }
    try {
      setError("");
      setLoading(true);
      await signup(emailRef.current.value, passwordRef.current.value, displayNameRef.current.value);
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Create your account</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Display Name</label>
            <input type="text" ref={displayNameRef} placeholder="How should we call you?" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" ref={emailRef} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" ref={passwordRef} placeholder="At least 6 characters" required />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" ref={confirmRef} placeholder="Re-enter your password" required />
          </div>
          <button disabled={loading} className="btn-success btn-block btn-lg">
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Log In</Link>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
