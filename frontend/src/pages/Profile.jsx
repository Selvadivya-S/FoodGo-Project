import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUser,
  FaMapMarkerAlt,
  FaHeart,
  FaShoppingBag,
  FaShieldAlt,
} from "react-icons/fa";

export default function Profile() {
  const saved = JSON.parse(
    localStorage.getItem("foodgoUser") || "null"
  );

  const [name, setName] = useState(
    saved?.name || "FoodGo User"
  );

  const [savedMsg, setSavedMsg] = useState("");

  const save = () => {
    localStorage.setItem(
      "foodgoUser",
      JSON.stringify({
        ...saved,
        name,
        loggedIn: true,
      })
    );

    setSavedMsg("Profile updated successfully");

    setTimeout(() => {
      setSavedMsg("");
    }, 2000);
  };

  return (
    <section className="fg-page">
      <div className="fg-shell">

        {/* Page Header */}
        <div className="fg-page-title">
          <span className="fg-section-kicker">
            ACCOUNT
          </span>

          <h1>My profile</h1>

          <p>
            Manage your account, preferences and saved details.
          </p>
        </div>

        <div className="profile-layout">

          {/* Profile Sidebar */}
          <aside className="profile-side">

            <div className="profile-avatar">
              {name.charAt(0).toUpperCase()}
            </div>

            <h2>{name}</h2>

            <p>
              {saved?.email || "guest@foodgo.com"}
            </p>

            <Link to="/orders">
              <FaShoppingBag />
              My orders
            </Link>

            <a href="#saved">
              <FaHeart />
              Favourites
            </a>

            <a href="#security">
              <FaShieldAlt />
              Security
            </a>

          </aside>

          {/* Profile Form */}
          <div className="fg-form-card">

            <span className="fg-section-kicker">
              PERSONAL DETAILS
            </span>

            <h2>Profile information</h2>

            {/* Name */}
            <label>
              Full name

              <input
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />
            </label>

            {/* Email */}
            <label>
              Email

              <input
                value={
                  saved?.email ||
                  "guest@foodgo.com"
                }
                readOnly
              />
            </label>

            {/* Phone */}
            <label>
              Phone

              <input
                defaultValue="+91 98765 43210"
              />
            </label>

            {/* Address */}
            <label>
              Default address

              <textarea
                defaultValue="Chennai, Tamil Nadu"
              />
            </label>

            {/* Save Button */}
            <button
              type="button"
              onClick={save}
              className="fg-btn fg-btn-primary"
            >
              Save changes
            </button>

            {/* Success Message */}
            {savedMsg && (
              <div className="fg-inline-success">
                ✓ {savedMsg}
              </div>
            )}

            {/* Profile Features */}
            <div className="profile-feature-grid">

              <div>
                <FaMapMarkerAlt />
                <b>Saved addresses</b>
                <small>2 addresses</small>
              </div>

              <div>
                <FaHeart />
                <b>Favourites</b>
                <small>12 saved places</small>
              </div>

              <div>
                <FaShieldAlt />
                <b>Account safety</b>
                <small>Protected</small>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
}