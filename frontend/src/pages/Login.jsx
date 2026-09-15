import React, { useEffect, useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaGoogle,
  FaFacebookF,
  FaApple,
  FaMotorcycle,
  FaStar,
  FaCheckCircle,
  FaShieldAlt,
  FaUtensils,
  FaUser,
} from "react-icons/fa";

import "../styles/Login.css";

import FoodGoMark from "../components/FoodGoMark";

import {
  ROLE_LABELS,
  ROLE_DASHBOARD_PATHS,
  saveSession,
} from "../auth";

import api from "../api/axios";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: location.state?.email || "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({});

  const [message, setMessage] = useState("");

  const [passwordStrength, setPasswordStrength] = useState(0);

  /* =========================================================
     SHOW MESSAGE PASSED FROM OTHER PAGE
  ========================================================= */

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }
  }, [location.state]);

  /* =========================================================
     PASSWORD STRENGTH
  ========================================================= */

  useEffect(() => {
    const password = formData.password;

    let strength = 0;

    if (password.length >= 6) {
      strength++;
    }

    if (/[A-Z]/.test(password)) {
      strength++;
    }

    if (/[0-9]/.test(password)) {
      strength++;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      strength++;
    }

    setPasswordStrength(strength);
  }, [formData.password]);

  /* =========================================================
     HANDLE INPUT CHANGE
  ========================================================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setMessage("");
  };

  /* =========================================================
     VALIDATE FORM
  ========================================================= */

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email
      )
    ) {
      newErrors.email =
        "Enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password =
        "Password is required";
    } else if (
      formData.password.length < 6
    ) {
      newErrors.password =
        "Password must contain at least 6 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /* =========================================================
     LOGIN SUBMIT
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    setErrors({});

    try {
      /* =====================================================
         SEND LOGIN REQUEST TO BACKEND
      ===================================================== */

      const response = await api.post(
        "/auth/login",
        {
          email: formData.email
            .trim()
            .toLowerCase(),

          password: formData.password,
        }
      );

      /* =====================================================
         GET API RESPONSE
      ===================================================== */

      const payload =
        response.data?.data ||
        response.data;

      /* =====================================================
         CHECK LOGIN RESPONSE
      ===================================================== */

      if (
        !payload?.accessToken ||
        !payload?.user
      ) {
        throw new Error(
          "Invalid login response from FoodGo API."
        );
      }

      /* =====================================================
         SAVE USER SESSION
      ===================================================== */

      const session = saveSession(
        payload.user,
        {
          accessToken:
            payload.accessToken,

          refreshToken:
            payload.refreshToken,
        },
        rememberMe
      );

      /* =====================================================
         SUCCESS MESSAGE
      ===================================================== */

      setMessage(
        `Signed in as ${
          ROLE_LABELS[session.role] ||
          "FoodGo User"
        }. Redirecting to your dashboard...`
      );

      /* =====================================================
         REDIRECT BASED ON USER ROLE
      ===================================================== */

      setTimeout(() => {
        navigate(
          ROLE_DASHBOARD_PATHS[
            session.role
          ] || "/",
          {
            replace: true,
          }
        );
      }, 700);
    } catch (error) {
      console.error(
        "FoodGo Login Error:",
        error
      );

      const apiMessage =
        error.response?.data?.message ||
        "Unable to sign in. Please check your email and password.";

      setErrors({
        email: apiMessage,

        password:
          "Please use a valid FoodGo account.",
      });

      setMessage(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     SOCIAL LOGIN
  ========================================================= */

  const handleSocialLogin = (provider) => {
    setMessage(
      `${provider} login is ready for backend integration.`
    );
  };

  /* =========================================================
     PASSWORD STRENGTH LABEL
  ========================================================= */

  const getStrengthLabel = () => {
    if (!formData.password) {
      return "";
    }

    if (passwordStrength <= 1) {
      return "Weak";
    }

    if (passwordStrength === 2) {
      return "Fair";
    }

    if (passwordStrength === 3) {
      return "Good";
    }

    return "Strong";
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="foodgo-login-page">

      {/* ==================================================
          LEFT BRAND PANEL
      ================================================== */}

      <section className="login-brand-panel">

        <div className="brand-overlay"></div>

        {/* ==================================================
            TOP BRAND
        ================================================== */}

        <div className="brand-header">

          <Link
            to="/"
            className="foodgo-logo"
          >
            <span
              className="logo-icon"
              aria-hidden="true"
            >
              <FoodGoMark light />
            </span>

            <span>
              Food
              <span>Go</span>
            </span>
          </Link>

          <Link
            to="/"
            className="brand-home-link"
          >
            Back to home
          </Link>

        </div>


        {/* ==================================================
            HERO CONTENT
        ================================================== */}

        <div className="brand-content">

          <div className="live-badge">

            <span className="live-indicator"></span>

            LIVE DELIVERY

          </div>


          <h1>
            Your cravings.
            <br />
            <span>Delivered.</span>
          </h1>


          <p>
            Discover delicious food from your
            favorite restaurants and get it
            delivered right to your doorstep.
          </p>


          {/* ==================================================
              BENEFITS
          ================================================== */}

          <div className="brand-benefits">

            {/* BENEFIT 1 */}

            <div className="brand-benefit">

              <div className="benefit-icon">
                <FaMotorcycle />
              </div>

              <div>

                <strong>
                  Lightning-fast delivery
                </strong>

                <span>
                  Fresh food at your doorstep
                </span>

              </div>

            </div>


            {/* BENEFIT 2 */}

            <div className="brand-benefit">

              <div className="benefit-icon">
                <FaUtensils />
              </div>

              <div>

                <strong>
                  10,000+ restaurants
                </strong>

                <span>
                  Everything you love, in one place
                </span>

              </div>

            </div>


            {/* BENEFIT 3 */}

            <div className="brand-benefit">

              <div className="benefit-icon">
                <FaShieldAlt />
              </div>

              <div>

                <strong>
                  Safe & secure
                </strong>

                <span>
                  Your data and payments are protected
                </span>

              </div>

            </div>

          </div>

        </div>


        {/* ==================================================
            DECORATION
        ================================================== */}

        <div className="brand-circle circle-one"></div>

        <div className="brand-circle circle-two"></div>

      </section>


      {/* ==================================================
          RIGHT LOGIN PANEL
      ================================================== */}

      <section className="login-form-panel">

        <div className="login-form-wrapper">

          {/* ==================================================
              MOBILE LOGO
          ================================================== */}

          <div className="mobile-logo">

            <Link
              to="/"
              className="foodgo-logo"
            >

              <span
                className="logo-icon"
                aria-hidden="true"
              >
                <FoodGoMark light />
              </span>

              Food
              <span>Go</span>

            </Link>

          </div>


          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="login-header">

            <div className="welcome-icon">
              <FaUser />
            </div>

            <span className="login-eyebrow">
              WELCOME BACK
            </span>

            <h2>
              Sign in to FoodGo
            </h2>

            <p>
              Your favorite meals are waiting
              for you.
            </p>

          </div>


          {/* ==================================================
              SUCCESS / ERROR MESSAGE
          ================================================== */}

          {message && (
            <div className="login-message">

              <FaCheckCircle />

              <span>
                {message}
              </span>

            </div>
          )}


          {/* ==================================================
              LOGIN FORM
          ================================================== */}

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >

            {/* ==================================================
                EMAIL
            ================================================== */}

            <div
              className={`login-field ${
                errors.email
                  ? "field-error"
                  : ""
              }`}
            >

              <label htmlFor="email">
                Email address
              </label>

              <div className="login-input-wrapper">

                <FaEnvelope className="field-icon" />

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />

              </div>


              {errors.email && (
                <small className="error-text">
                  {errors.email}
                </small>
              )}

            </div>


            {/* ==================================================
                PASSWORD
            ================================================== */}

            <div
              className={`login-field ${
                errors.password
                  ? "field-error"
                  : ""
              }`}
            >

              <div className="label-row">

                <label htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    setMessage(
                      "Password reset flow can be connected to your backend."
                    )
                  }
                >
                  Forgot password?
                </button>

              </div>


              <div className="login-input-wrapper">

                <FaLock className="field-icon" />

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />


                {/* SHOW / HIDE PASSWORD */}

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}

                </button>

              </div>


              {/* ==================================================
                  PASSWORD STRENGTH
              ================================================== */}

              {formData.password && (
                <div className="password-strength">

                  <div className="strength-bars">

                    {[1, 2, 3, 4].map(
                      (bar) => (
                        <span
                          key={bar}
                          className={
                            bar <=
                            passwordStrength
                              ? "active"
                              : ""
                          }
                        ></span>
                      )
                    )}

                  </div>

                  <small>
                    Password strength:{" "}

                    <strong>
                      {getStrengthLabel()}
                    </strong>
                  </small>

                </div>
              )}


              {/* PASSWORD ERROR */}

              {errors.password && (
                <small className="error-text">
                  {errors.password}
                </small>
              )}

            </div>


            {/* ==================================================
                LOGIN OPTIONS
            ================================================== */}

            <div className="login-options">

              <label className="remember-option">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(
                      e.target.checked
                    )
                  }
                />

                <span className="custom-checkbox">
                  <FaCheckCircle />
                </span>

                Remember me

              </label>


              <span className="secure-login">

                <FaShieldAlt />

                Secure login

              </span>

            </div>


            {/* ==================================================
                LOGIN BUTTON
            ================================================== */}

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="login-spinner"></span>

                  Signing you in...
                </>
              ) : (
                <>
                  Sign in to FoodGo

                  <FaArrowRight />

                </>
              )}

            </button>

          </form>


          {/* ==================================================
              DIVIDER
          ================================================== */}

          <div className="login-divider">

            <span>
              OR CONTINUE WITH
            </span>

          </div>


          {/* ==================================================
              SOCIAL BUTTONS
          ================================================== */}

          <div className="social-login-grid">

            {/* GOOGLE */}

            <button
              type="button"
              className="social-button google"
              onClick={() =>
                handleSocialLogin(
                  "Google"
                )
              }
            >

              <FaGoogle />

              <span>
                Google
              </span>

            </button>


            {/* APPLE */}

            <button
              type="button"
              className="social-button apple"
              onClick={() =>
                handleSocialLogin(
                  "Apple"
                )
              }
            >

              <FaApple />

              <span>
                Apple
              </span>

            </button>


            {/* FACEBOOK */}

            <button
              type="button"
              className="social-button facebook"
              onClick={() =>
                handleSocialLogin(
                  "Facebook"
                )
              }
            >

              <FaFacebookF />

              <span>
                Facebook
              </span>

            </button>

          </div>


          {/* ==================================================
              REGISTER
          ================================================== */}

          <div className="register-section">

            <p>
              New to FoodGo?
            </p>

            <Link
              to="/register"
              className="register-link"
            >

              Create your account

              <FaArrowRight />

            </Link>

          </div>


          {/* ==================================================
              SECURITY FOOTER
          ================================================== */}

          <div className="login-security">

            <FaShieldAlt />

            <span>
              Your information is encrypted and
              securely protected.
            </span>

          </div>

        </div>

      </section>

    </div>
  );
};

export default Login;