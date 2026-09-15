import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserPlus, FaCheck } from "react-icons/fa";
import api from "../api/axios";
export default function Register() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const firstName = form.firstName.value.trim();
    const lastName = form.lastName.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const phone = form.phone.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;
    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone,
        password,
        role: "customer",
      });
      setDone(true);
      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            email,
            message: "Account created successfully. Please sign in.",
          },
        });
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  if (done) {
    return (
      <section className="fg-page">
        <div className="fg-success-card">
          <span><FaCheck /></span>
          <span className="fg-section-kicker">WELCOME TO FOODGO</span>
          <h1>Account created!</h1>
          <p>You're ready to discover something delicious.</p>
        </div>
      </section>
    );
  }
  return (
    <section className="fg-page">
      <div className="fg-shell">
        <div className="fg-auth-modern">
          <div className="fg-auth-art">
            <span className="fg-live-chip"><i /> FOODGO MEMBERS</span>
            <h1>More food.<br /><span>More moments.</span></h1>
            <p>Save favourites, unlock offers and make every order feel personal.</p>
            <div>
              ✓ Personalised recommendations<br />
              ✓ Live order tracking<br />
              ✓ Exclusive member offers
            </div>
          </div>
          <div className="fg-form-card">
            <span className="fg-section-kicker">CREATE ACCOUNT</span>
            <h2>Join FoodGo</h2>
            {error && (
              <div className="fg-inline-error" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={submit}>
              <div className="fg-form-grid">
                <label>
                  First name
                  <input name="firstName" required placeholder="First name" />
                </label>
                <label>
                  Last name
                  <input name="lastName" required placeholder="Last name" />
                </label>
                <label className="wide">
                  Email
                  <input name="email" required type="email" placeholder="you@example.com" />
                </label>
                <label className="wide">
                  Phone
                  <input name="phone" required minLength="8" placeholder="+91" />
                </label>
                <label>
                  Password
                  <input name="password" required minLength="8" type="password" placeholder="Create password" />
                </label>
                <label>
                  Confirm password
                  <input name="confirmPassword" required minLength="8" type="password" placeholder="Confirm password" />
                </label>
              </div>
              <button
                type="submit"
                className="fg-btn fg-btn-primary"
                style={{ width: "100%", marginTop: 18 }}
                disabled={loading}
              >
                <FaUserPlus />
                {loading ? "Creating account..." : "Create my account"}
              </button>
            </form>
            <p style={{ fontSize: 10, color: "#888", textAlign: "center", marginTop: 18 }}>
              Already a member?{" "}
              <Link to="/login" style={{ color: "#ff5a1f", fontWeight: 800 }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
