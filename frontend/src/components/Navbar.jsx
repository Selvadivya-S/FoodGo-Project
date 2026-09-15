import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBars, FaTimes, FaSearch, FaMapMarkerAlt, FaChevronDown, FaUser,
  FaSignInAlt, FaSignOutAlt, FaShoppingBag, FaHeart, FaBell,
  FaMapMarkedAlt, FaCog, FaUserPlus, FaLocationArrow
} from "react-icons/fa";
import { getRestaurantLocations } from "../api/foodApi";
import FoodGoMark from "./FoodGoMark";
import { ROLE_DASHBOARD_PATHS, ROLE_LABELS, logoutSession } from "../auth";
import "./Navbar.css";
export default function Navbar({ cartCount = 0 }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [dashboardMenuOpen, setDashboardMenuOpen] = useState(false);
  const [location, setLocation] = useState(localStorage.getItem("foodgoLocation") || "All India");
  const [locations, setLocations] = useState([]);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("foodgo_user") ||
        localStorage.getItem("foodgoUser") ||
        "null"
      );
    } catch {
      return null;
    }
  });
  const userMenuRef = useRef(null);
  const dashboardMenuRef = useRef(null);
  useEffect(() => {
    const sync = () => {
      try {
        setUser(JSON.parse(
          localStorage.getItem("foodgo_user") ||
          localStorage.getItem("foodgoUser") ||
          "null"
        ));
      } catch {
        setUser(null);
      }
      setLocation(localStorage.getItem("foodgoLocation") || "All India");
    };
    window.addEventListener("foodgo:user-changed", sync);
    window.addEventListener("foodgo:location-changed", sync);
    return () => {
      window.removeEventListener("foodgo:user-changed", sync);
      window.removeEventListener("foodgo:location-changed", sync);
    };
  }, []);
  useEffect(() => {
    getRestaurantLocations().then(data => setLocations(Array.isArray(data) ? data : [])).catch(() => setLocations([]));
  }, []);
  useEffect(() => {
    const outside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target))
        setUserMenuOpen(false);
      if (dashboardMenuRef.current && !dashboardMenuRef.current.contains(event.target))
        setDashboardMenuOpen(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);
  const closeMenu = () => {
    setMenuOpen(false);
    setUserMenuOpen(false);
    setDashboardMenuOpen(false);
  };
  const chooseLocation = (city, displayName = city) => {
    setLocation(city);
    localStorage.setItem("foodgoLocation", city);
    window.dispatchEvent(new Event("foodgo:location-changed"));
    setLocationOpen(false);
  };
  const detectLocation = () => {
    if (!navigator.geolocation) return setLocationOpen(true);
    navigator.geolocation.getCurrentPosition(
      () => setLocationOpen(true),
      () => setLocationOpen(true)
    );
  };
  const logout = () => {
    logoutSession();
    setUser(null);
    setUserMenuOpen(false);
    navigate("/");
  };
  const openSearch = () => {
    window.dispatchEvent(new Event("foodgo:open-search"));
    setMenuOpen(false);
  };
  const isStaff = ["admin", "delivery_partner", "restaurant_owner"].includes(user?.role);
  const staffDashboardPath = ROLE_DASHBOARD_PATHS[user?.role] || "/";

  const dashboardIcon = {
    customer: "👤",
    restaurant_owner: "🍽️",
    delivery_partner: "🛵"
  };
  return (
    <>
      <header className="foodgo-navbar">
        <div className="navbar-container">
          <Link
            to={isStaff ? staffDashboardPath : "/"}
            className="foodgo-logo"
            onClick={closeMenu}
            aria-label={isStaff ? "FoodGo Dashboard" : "FoodGo Home"}
          >
            <span className="logo-icon" aria-hidden="true">
              <FoodGoMark light />
              <span className="logo-speed-line speed-one"></span>
              <span className="logo-speed-line speed-two"></span>
            </span>
            <span className="foodgo-name">
              <span className="food-text">Food</span>
              <span className="go-text">Go</span>
            </span>
          </Link>
          <button type="button" className="navbar-location" onClick={() => setLocationOpen(true)}>
            <span className="location-pin"><FaMapMarkerAlt /></span>
            <span className="location-copy">
              <small>DELIVERING TO</small>
              <strong>{location === "All India" ? "All India" : String(location).includes("|") ? String(location).split("|").filter(Boolean).join(", ") : location}</strong>
            </span>
            <FaChevronDown className="location-chevron" />
          </button>
          <nav className={`navbar-links ${menuOpen ? "mobile-open" : ""}`}>
            {!isStaff && (
              <>
                <Link to="/" onClick={closeMenu}>Home</Link>
                <Link to="/restaurants" onClick={closeMenu}>Restaurants</Link>
                <Link to="/about" onClick={closeMenu}>About</Link>
              </>
            )}
            <div className="dashboard-nav-wrap" ref={dashboardMenuRef}>
              <button
                type="button"
                className={`dashboard-nav-trigger ${dashboardMenuOpen ? "open" : ""}`}
                onClick={() => setDashboardMenuOpen(value => !value)}
                aria-expanded={dashboardMenuOpen}
                aria-haspopup="menu"
              >
                Dashboard <FaChevronDown />
              </button>
              {dashboardMenuOpen && (
                <div className="dashboard-nav-dropdown" role="menu">
                  <div className="dashboard-nav-heading">
                    <span>FOODGO WORKSPACES</span>
                    <small>Choose a role to continue</small>
                  </div>
                  {Object.entries(ROLE_DASHBOARD_PATHS).map(([role, path]) => (
                    <Link
                      key={role}
                      to={path}
                      role="menuitem"
                      className={`dashboard-nav-item dashboard-nav-${role}`}
                      onClick={() => setDashboardMenuOpen(false)}
                    >
                      <span className="dashboard-nav-item-icon">
                        {dashboardIcon[role] || "🛡️"}
                      </span>
                      <span className="dashboard-nav-item-copy">
                        <strong>{ROLE_LABELS[role]}</strong>
                        <small>
                          {user?.role === role && user?.loggedIn
                            ? "Your private dashboard"
                            : "Login required"}
                        </small>
                      </span>
                      <span className="dashboard-nav-arrow">→</span>
                    </Link>
                  ))}
                  {!user?.loggedIn && (
                    <div className="dashboard-nav-note">
                      Sign in with the correct role account to open a dashboard.
                    </div>
                  )}
                </div>
              )}
            </div>
            {!isStaff && <Link to="/orders" onClick={closeMenu}>Orders</Link>}
            {!isStaff && <Link to="/cart" onClick={closeMenu} className="nav-cart-text">Cart</Link>}
          </nav>
          <div className="navbar-actions">
            <button
              type="button"
              className="navbar-icon-button"
              onClick={openSearch}
              aria-label="Search"
            >
              <FaSearch />
            </button>
            {!isStaff && (
              <Link
                to="/cart"
                className="navbar-cart"
                aria-label={`Cart with ${cartCount} items`}
              >
                <FaShoppingBag />
                {cartCount > 0 && <span>{cartCount > 9 ? "9+" : cartCount}</span>}
              </Link>
            )}
            {!user ? (
              <div className="navbar-auth">
                <Link to="/login" className="navbar-signin-link">
                  <FaSignInAlt /><span>Sign in</span>
                </Link>
                <Link to="/register" className="navbar-create-account">
                  <FaUserPlus /><span>Create account</span>
                </Link>
              </div>
            ) : (
              <div className="navbar-user" ref={userMenuRef}>
                <button
                  type="button"
                  className="navbar-user-button"
                  onClick={() => setUserMenuOpen(value => !value)}
                >
                  <span className="navbar-avatar">
                    {user.avatar || user.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                  <span className="navbar-user-name">{user.name || "Account"}</span>
                  <FaChevronDown className={userMenuOpen ? "rotate" : ""} />
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <div className="large-avatar">
                        {user.avatar || user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <strong>{user.name || "FoodGo Member"}</strong>
                        <small>{user.email}</small>
                      </div>
                    </div>
                    <div className="dropdown-divider" />
                    <Link to="/profile" onClick={closeMenu}>
                      <FaUser /> My Profile
                    </Link>
                    <Link to="/orders" onClick={closeMenu}>
                      <FaShoppingBag /> My Orders
                    </Link>
                    <Link to="/cart" onClick={closeMenu}>
                      <FaHeart /> Favourites & Cart
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setLocationOpen(true);
                      }}
                    >
                      <FaMapMarkedAlt /> Delivery location
                    </button>
                    <Link to="/contact" onClick={closeMenu}>
                      <FaBell /> Help & support
                    </Link>
                    <Link to="/about" onClick={closeMenu}>
                      <FaCog /> About FoodGo
                    </Link>
                    <div className="dropdown-divider" />
                    <button type="button" className="logout-dropdown" onClick={logout}>
                      <FaSignOutAlt /> Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMenuOpen(value => !value)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </header>
      {locationOpen && (
        <div className="location-overlay" onClick={() => setLocationOpen(false)}>
          <div className="location-modal" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="location-close"
              onClick={() => setLocationOpen(false)}
              aria-label="Close location selector"
            >
              <FaTimes />
            </button>
            <div className="location-modal-icon">
              <FaMapMarkerAlt />
            </div>
            <span className="location-kicker">DELIVERY LOCATION</span>
            <h2>Where should we deliver?</h2>
            <p>
              Choose your city to see restaurants, offers and delivery times near you.
            </p>
            <button type="button" className="detect-location" onClick={detectLocation}>
              <FaLocationArrow /> Use my current location
            </button>
            <div className="location-grid">
              <button type="button" className={location === "All India" ? "selected" : ""} onClick={() => chooseLocation("All India")}><FaMapMarkerAlt /><span>All India</span>{location === "All India" && <b>✓</b>}</button>
              {locations.map(item => { const key = `${item.city}|${item.state}`; return <button type="button" key={key} className={key === location ? "selected" : ""} onClick={() => chooseLocation(key, `${item.city}, ${item.state}`)}><FaMapMarkerAlt /><span>{item.city}, {item.state}</span>{key === location && <b>✓</b>}</button>; })}
            </div>
            <small className="location-note">
              FoodGo will personalise your feed for the selected city.
            </small>
          </div>
        </div>
      )}
    </>
  );
}
