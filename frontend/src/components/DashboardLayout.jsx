import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaShoppingBag,
  FaChartLine,
  FaUtensils,
  FaUsers,
  FaCog,
  FaBell,
  FaHeart,
  FaWallet,
  FaMapMarkedAlt,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaChevronRight,
  FaBolt,
  FaStore,
  FaMotorcycle,
  FaUserShield,
} from "react-icons/fa";
import "../styles/Dashboard.css";
import { logoutSession } from "../auth";
import { getNotifications, markNotificationRead } from "../api/foodApi";
const DashboardLayout = ({
  children,
  role = "customer",
  name = "FoodGo User",
  section = "overview",
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();
  useEffect(() => {
    let active = true;
    getNotifications(role).then((rows) => { if (active) setNotifications(Array.isArray(rows) ? rows : []); }).catch(() => {});
    return () => { active = false; };
  }, [role, location.pathname]);
  const menus = {
    customer: [
      { label: "Overview", icon: <FaHome />, path: "/customer-dashboard" },
      { label: "My Orders", icon: <FaShoppingBag />, path: "/customer-dashboard/orders" },
      { label: "Live Tracking", icon: <FaMapMarkedAlt />, path: "/customer-dashboard/tracking" },
      { label: "Favourites", icon: <FaHeart />, path: "/customer-dashboard/favourites" },
      { label: "Food Wallet", icon: <FaWallet />, path: "/customer-dashboard/wallet" },
      { label: "Offers", icon: <FaBolt />, path: "/customer-dashboard/offers" },
    ],
    restaurant: [
      {
        label: "Overview",
        icon: <FaHome />,
        path: "/restaurant-dashboard",
      },
      {
        label: "Orders",
        icon: <FaShoppingBag />,
        path: "/restaurant-dashboard/orders",
      },
      {
        label: "Menu",
        icon: <FaUtensils />,
        path: "/restaurant-dashboard/menu",
      },
      {
        label: "Analytics",
        icon: <FaChartLine />,
        path: "/restaurant-dashboard/analytics",
      },
      {
        label: "Restaurant",
        icon: <FaStore />,
        path: "/restaurant-dashboard/profile",
      },
    ],
    delivery: [
      {
        label: "Overview",
        icon: <FaHome />,
        path: "/delivery-dashboard",
      },
      {
        label: "Active Delivery",
        icon: <FaMotorcycle />,
        path: "/delivery-dashboard/active",
      },
      {
        label: "Delivery History",
        icon: <FaShoppingBag />,
        path: "/delivery-dashboard/history",
      },
      {
        label: "Earnings",
        icon: <FaWallet />,
        path: "/delivery-dashboard/earnings",
      },
      {
        label: "Performance",
        icon: <FaChartLine />,
        path: "/delivery-dashboard/performance",
      },
    ],
    admin: [
      {
        label: "Overview",
        icon: <FaHome />,
        path: "/admin-dashboard",
      },
      {
        label: "Users",
        icon: <FaUsers />,
        path: "/admin-dashboard/users",
      },
      {
        label: "Restaurants",
        icon: <FaStore />,
        path: "/admin-dashboard/restaurants",
      },
      {
        label: "Orders",
        icon: <FaShoppingBag />,
        path: "/admin-dashboard/orders",
      },
      {
        label: "Analytics",
        icon: <FaChartLine />,
        path: "/admin-dashboard/analytics",
      },
      {
        label: "Settings",
        icon: <FaCog />,
        path: "/admin-dashboard/settings",
      },
    ],
  };
  const currentMenu = menus[role] || menus.customer;
  const accountPath = `/${role === "admin" ? "admin-dashboard" : role + "-dashboard"}/account`;
  const roleTitle = {
    customer: "Customer",
    restaurant: "Restaurant",
    delivery: "Delivery Partner",
    admin: "Administrator",
  };
  const roleIcon = {
    customer: <FaHome />,
    restaurant: <FaStore />,
    delivery: <FaMotorcycle />,
    admin: <FaUserShield />,
  };
  const logout = () => {
    logoutSession();
    window.location.href = "/login";
  };
  return (
    <div className="dashboard-app">
      {/* MOBILE BUTTON */}
      <button
        className="dashboard-mobile-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <FaTimes /> : <FaBars />}
      </button>
      {/* SIDEBAR */}
      <aside
        className={`dashboard-sidebar ${
          sidebarOpen ? "dashboard-sidebar-open" : ""
        }`}
      >
        <div className="dashboard-brand">
          <div className="brand-logo">
            F
          </div>
          <div>
            <strong>FoodGo</strong>
            <span>Smart Delivery</span>
          </div>
        </div>
        <div className="dashboard-role">
          <div className="role-icon">
            {roleIcon[role]}
          </div>
          <div>
            <small>LOGGED IN AS</small>
            <strong>{roleTitle[role]}</strong>
          </div>
        </div>
        <nav className="dashboard-nav">
          {currentMenu.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={active ? "dashboard-nav-active" : ""}
              >
                <span>{item.icon}</span>
                {item.label}
                {active && <FaChevronRight />}
              </Link>
            );
          })}
        </nav>
        <div className="dashboard-sidebar-bottom">
          <Link to={accountPath}>
            <FaCog />
            Account Settings
          </Link>
          <button onClick={logout}>
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </aside>
      {/* MAIN */}
      <main className="dashboard-main">
        {/* TOP BAR */}
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-breadcrumb">
              FoodGo / {roleTitle[role]}
            </span>
            <h1>
              {getGreeting()}, {name.split(" ")[0]} 👋
            </h1>
          </div>
          <div className="dashboard-top-actions">
            <div className="dashboard-notification-wrap">
              <button className="dashboard-icon-btn" onClick={() => setNotificationsOpen((v) => !v)} aria-label="Notifications">
                <FaBell />
                {notifications.some((n) => !n.isRead) && <i />}
              </button>
              {notificationsOpen && (
                <div className="dashboard-notification-menu">
                  <div className="dashboard-notification-head"><strong>Notifications</strong><span>{notifications.filter((n) => !n.isRead).length} unread</span></div>
                  {!notifications.length ? <p>No notifications yet.</p> : notifications.slice(0, 8).map((item) => (
                    <button key={item._id} className={!item.isRead ? "unread" : ""} onClick={async () => { if (!item.isRead) { try { await markNotificationRead(role, item._id); setNotifications((rows) => rows.map((row) => row._id === item._id ? { ...row, isRead: true } : row)); } catch {} } }}>
                      <strong>{item.title || "FoodGo update"}</strong><span>{item.message || "You have a new update."}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" className="dashboard-profile" onClick={() => { window.location.href = accountPath; }}>
              <div className="profile-avatar">
                {name.charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>{name}</strong>
                <small>{roleTitle[role]}</small>
              </div>
            </button>
          </div>
        </header>
        {/* CONTENT */}
        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
};
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};
export default DashboardLayout;
