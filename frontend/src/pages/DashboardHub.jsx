import React from "react";
import { Navigate } from "react-router-dom";
import {
  FaArrowRight,
  FaChartLine,
  FaMotorcycle,
  FaStore,
  FaUser,
  FaUsers,
} from "react-icons/fa";

import "../styles/DashboardHub.css";

import {
  getCurrentUser,
  ROLE_DASHBOARD_PATHS,
  ROLE_LABELS,
} from "../auth";

export default function DashboardHub() {
  const user = getCurrentUser();

  const hasToken = Boolean(
    localStorage.getItem("foodgo_access_token") ||
      localStorage.getItem("accessToken")
  );

  // Protect the dashboard hub
  if (!user?.role || (!user.loggedIn && !hasToken)) {
    return <Navigate to="/login" replace />;
  }

  // Find the dashboard based on the user's role
  const destination = ROLE_DASHBOARD_PATHS[user.role] || "/";

  return (
    <section className="dashboard-hub-page">
      <div className="dashboard-hub-shell">

        {/* Hero Section */}
        <div className="dashboard-hub-hero">
          <div>
            <span className="dashboard-hub-kicker">
              PRIVATE FOODGO WORKSPACE
            </span>

            <h1>
              Welcome,{" "}
              <span>
                {user.name?.split(" ")[0] || "Member"}.
              </span>
            </h1>

            <p>
              You are signed in as{" "}
              <strong>{ROLE_LABELS[user.role]}</strong>.
              Your dashboard is private and only the workspace
              assigned to this account can be opened.
            </p>
          </div>

          <div className="dashboard-hub-badge">
            <FaChartLine />

            <div>
              <strong>Private access</strong>
              <span>{user.id}</span>
            </div>
          </div>
        </div>

        {/* Dashboard Card */}
        <div className="dashboard-hub-grid">
          <div
            className={`dashboard-hub-card dashboard-hub-${user.role}`}
          >
            <div className="dashboard-hub-card-top">
              <span className="dashboard-hub-icon">
                {user.role === "customer" ? (
                  <FaUser />
                ) : user.role === "restaurant" ? (
                  <FaStore />
                ) : user.role === "delivery" ? (
                  <FaMotorcycle />
                ) : (
                  <FaUsers />
                )}
              </span>
            </div>

            <span className="dashboard-hub-eyebrow">
              YOUR ROLE
            </span>

            <h2>{ROLE_LABELS[user.role]}</h2>

            <p>
              This is the only FoodGo dashboard available to this
              account. Other role dashboards are protected and
              cannot be opened with this login.
            </p>

            <div className="dashboard-hub-features">
              <span>Role protected</span>
              <span>Private workspace</span>
              <span>Secure navigation</span>
            </div>

            <button
              type="button"
              className="dashboard-hub-open"
              onClick={() => {
                window.location.href = destination;
              }}
            >
              Open my dashboard
              <FaArrowRight />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}