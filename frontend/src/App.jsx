import React, { useEffect, useMemo, useState } from "react";
import {
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
} from "react-router-dom";
import {
  FaArrowUp,
  FaShoppingBag,
} from "react-icons/fa";
import { getHealth } from "./api/testApi";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { getCurrentUser, ROLE_DASHBOARD_PATHS } from "./auth";
import Home from "./pages/Home";
import Restaurants from "./pages/Restaurants";
import RestaurantDetails from "./pages/RestaurantDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import TrackOrder from "./pages/TrackOrder";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Contact from "./pages/Contact";
import DashboardHub from "./pages/DashboardHub";
import CustomerDashboard from "./dashboards/CustomerDashboard";
import RestaurantDashboard from "./dashboards/RestaurantDashboard";
import DeliveryDashboard from "./dashboards/DeliveryDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";
import "./styles/index.css";
import "./styles/App.css";
import "./styles/Premium.css";
import "./styles/Dashboard.css";
import "./styles/Login.css";
import "./styles/DashboardHub.css";
function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return null;
}
function NotFound() {
  return (
    <section className="fg-page fg-empty-page">
      <div className="fg-empty-card">
        <span className="fg-empty-number">
          404
        </span>
        <span className="fg-kicker">
          WRONG TURN
        </span>
        <h1>
          This page isn't on our menu.
        </h1>
        <p>
          Let's get you back to something delicious.
        </p>
        <Link
          to="/"
          className="fg-btn fg-btn-primary"
        >
          Back to FoodGo
        </Link>
      </div>
    </section>
  );
}
function StaffNavigationGuard() {
  const location = useLocation();
  const user = getCurrentUser();
  const staffRoles = ["admin", "delivery_partner", "restaurant_owner"];

  if (!user || !staffRoles.includes(user.role)) {
    return null;
  }

  const dashboardPath = ROLE_DASHBOARD_PATHS[user.role] || "/";
  const isDashboardPath =
    location.pathname === dashboardPath ||
    location.pathname.startsWith(`${dashboardPath}/`);

  const isAuthPath =
    location.pathname === "/login" ||
    location.pathname === "/register";

  if (!isDashboardPath && !isAuthPath) {
    return <Navigate to={dashboardPath} replace />;
  }

  return null;
}

export default function App() {
  useEffect(() => {
    getHealth().then((data) => {
      console.log("FoodGo API:", data?.success ? "connected" : "unavailable");
    }).catch((error) => {
      console.error("FoodGo backend connection failed:", error);
    });
  }, []);
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart =
        localStorage.getItem("foodgoCart");
      return savedCart
        ? JSON.parse(savedCart)
        : [];
    } catch (error) {
      console.error(
        "Unable to load cart:",
        error
      );
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(
        "foodgoCart",
        JSON.stringify(cartItems)
      );
    } catch (error) {
      console.error(
        "Unable to save cart:",
        error
      );
    }
  }, [cartItems]);
  const addToCart = (food) => {
    if (!food || !food.id) {
      console.warn(
        "Invalid food item:",
        food
      );
      return;
    }
    setCartItems((currentItems) => {
      const incomingRestaurantId = String(
        food.restaurantId?._id || food.restaurantId || ""
      );
      const currentRestaurantId = currentItems[0]
        ? String(
            currentItems[0].restaurantId?._id ||
              currentItems[0].restaurantId ||
              ""
          )
        : "";
      if (
        currentItems.length &&
        incomingRestaurantId &&
        currentRestaurantId &&
        incomingRestaurantId !== currentRestaurantId
      ) {
        const replace = window.confirm(
          "Your cart contains items from another restaurant. Clear the cart and add this item instead?"
        );
        if (!replace) return currentItems;
        return [{ ...food, quantity: 1 }];
      }
      const existingItem =
        currentItems.find(
          (item) => item.id === food.id
        );
      if (existingItem) {
        return currentItems.map((item) =>
          item.id === food.id
            ? {
                ...item,
                quantity:
                  (item.quantity || 1) + 1,
              }
            : item
        );
      }
      return [
        ...currentItems,
        {
          ...food,
          quantity: 1,
        },
      ];
    });
  };
  const increaseQuantity = (id) => {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity:
                (item.quantity || 1) + 1,
            }
          : item
      )
    );
  };
  const decreaseQuantity = (id) => {
    setCartItems((currentItems) =>
      currentItems
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity:
                  (item.quantity || 1) - 1,
              }
            : item
        )
        .filter(
          (item) => item.quantity > 0
        )
    );
  };
  const removeFromCart = (id) => {
    setCartItems((currentItems) =>
      currentItems.filter(
        (item) => item.id !== id
      )
    );
  };
  const cartCount = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    );
  }, [cartItems]);
  const clearCart = () => {
    setCartItems([]);
  };
  return (
    <div className="app">
      {/* =====================================================
          ROUTE SCROLL
      ===================================================== */}
      <ScrollToTop />
      <StaffNavigationGuard />
      {/* =====================================================
          NAVBAR
      ===================================================== */}
      <Navbar
        cartCount={cartCount}
      />
      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}
      <main className="main-content">
        <Routes>
          {/* =================================================
              HOME
          ================================================= */}
          <Route
            path="/"
            element={
              <Home
                addToCart={addToCart}
              />
            }
          />
          {/* =================================================
              RESTAURANTS
          ================================================= */}
          <Route
            path="/restaurants"
            element={
              <Restaurants
                addToCart={addToCart}
              />
            }
          />
          {/* =================================================
              RESTAURANT DETAILS
          ================================================= */}
          <Route
            path="/restaurant/:id"
            element={
              <RestaurantDetails
                addToCart={addToCart}
              />
            }
          />
          {/* =================================================
              CART
          ================================================= */}
          <Route
            path="/cart"
            element={
              <Cart
                cartItems={cartItems}
                increaseQuantity={
                  increaseQuantity
                }
                decreaseQuantity={
                  decreaseQuantity
                }
                removeFromCart={
                  removeFromCart
                }
                clearCart={
                  clearCart
                }
              />
            }
          />
          {/* =================================================
              CHECKOUT
          ================================================= */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRole="customer">
                <Checkout
                  cartItems={cartItems}
                  clearCart={clearCart}
                />
              </ProtectedRoute>
            }
          />
          {/* =================================================
              ORDERS
          ================================================= */}
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRole="customer">
                <Orders />
              </ProtectedRoute>
            }
          />
          {/* =================================================
              TRACK ORDER
          ================================================= */}
          <Route
            path="/track-order/:id"
            element={
              <ProtectedRoute allowedRole="customer">
                <TrackOrder />
              </ProtectedRoute>
            }
          />
          {/* =================================================
              LOGIN
          ================================================= */}
          <Route
            path="/login"
            element={
              <Login />
            }
          />
          {/* =================================================
              REGISTER
          ================================================= */}
          <Route
            path="/register"
            element={
              <Register />
            }
          />
          {/* =================================================
              PROFILE
          ================================================= */}
          <Route
            path="/profile"
            element={
              <Profile />
            }
          />
          {/* =================================================
              ABOUT
          ================================================= */}
          <Route
            path="/about"
            element={
              <About />
            }
          />
          {/* =================================================
              CONTACT
          ================================================= */}
          <Route
            path="/contact"
            element={
              <Contact />
            }
          />
          {/* =================================================
              PRIVATE DASHBOARD HUB
          ================================================= */}
          <Route
            path="/dashboards"
            element={
              <ProtectedRoute
                allowedRole={null}
              >
                <DashboardHub />
              </ProtectedRoute>
            }
          />
          {/* =================================================
              CUSTOMER DASHBOARD
          ================================================= */}
          <Route
            path="/customer-dashboard"
            element={
              <ProtectedRoute
                allowedRole="customer"
              >
                <CustomerDashboard
                  section="overview"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer-dashboard/orders"
            element={
              <ProtectedRoute
                allowedRole="customer"
              >
                <CustomerDashboard
                  section="orders"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer-dashboard/tracking"
            element={
              <ProtectedRoute
                allowedRole="customer"
              >
                <CustomerDashboard
                  section="tracking"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer-dashboard/favourites"
            element={
              <ProtectedRoute
                allowedRole="customer"
              >
                <CustomerDashboard
                  section="favourites"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer-dashboard/wallet"
            element={
              <ProtectedRoute
                allowedRole="customer"
              >
                <CustomerDashboard
                  section="wallet"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer-dashboard/offers"
            element={
              <ProtectedRoute
                allowedRole="customer"
              >
                <CustomerDashboard
                  section="offers"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer-dashboard/account"
            element={
              <ProtectedRoute
                allowedRole="customer"
              >
                <CustomerDashboard
                  section="account"
                />
              </ProtectedRoute>
            }
          />
          {/* =================================================
              RESTAURANT DASHBOARD
          ================================================= */}
          <Route
            path="/restaurant-dashboard"
            element={
              <ProtectedRoute
                allowedRole="restaurant_owner"
              >
                <RestaurantDashboard
                  section="overview"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/restaurant-dashboard/orders"
            element={
              <ProtectedRoute
                allowedRole="restaurant_owner"
              >
                <RestaurantDashboard
                  section="orders"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/restaurant-dashboard/menu"
            element={
              <ProtectedRoute
                allowedRole="restaurant_owner"
              >
                <RestaurantDashboard
                  section="menu"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/restaurant-dashboard/analytics"
            element={
              <ProtectedRoute
                allowedRole="restaurant_owner"
              >
                <RestaurantDashboard
                  section="analytics"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/restaurant-dashboard/profile"
            element={
              <ProtectedRoute
                allowedRole="restaurant_owner"
              >
                <RestaurantDashboard
                  section="profile"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/restaurant-dashboard/account"
            element={
              <ProtectedRoute
                allowedRole="restaurant_owner"
              >
                <RestaurantDashboard
                  section="account"
                />
              </ProtectedRoute>
            }
          />
          {/* =================================================
              DELIVERY DASHBOARD
          ================================================= */}
          <Route
            path="/delivery-dashboard"
            element={
              <ProtectedRoute
                allowedRole="delivery_partner"
              >
                <DeliveryDashboard
                  section="overview"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery-dashboard/active"
            element={
              <ProtectedRoute
                allowedRole="delivery_partner"
              >
                <DeliveryDashboard
                  section="active"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery-dashboard/history"
            element={
              <ProtectedRoute
                allowedRole="delivery_partner"
              >
                <DeliveryDashboard
                  section="history"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery-dashboard/earnings"
            element={
              <ProtectedRoute
                allowedRole="delivery_partner"
              >
                <DeliveryDashboard
                  section="earnings"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery-dashboard/performance"
            element={
              <ProtectedRoute
                allowedRole="delivery_partner"
              >
                <DeliveryDashboard
                  section="performance"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery-dashboard/account"
            element={
              <ProtectedRoute
                allowedRole="delivery_partner"
              >
                <DeliveryDashboard
                  section="account"
                />
              </ProtectedRoute>
            }
          />
          {/* =================================================
              ADMIN DASHBOARD
          ================================================= */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute
                allowedRole="admin"
              >
                <AdminDashboard
                  section="overview"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard/users"
            element={
              <ProtectedRoute
                allowedRole="admin"
              >
                <AdminDashboard
                  section="users"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard/restaurants"
            element={
              <ProtectedRoute
                allowedRole="admin"
              >
                <AdminDashboard
                  section="restaurants"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard/orders"
            element={
              <ProtectedRoute
                allowedRole="admin"
              >
                <AdminDashboard
                  section="orders"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard/analytics"
            element={
              <ProtectedRoute
                allowedRole="admin"
              >
                <AdminDashboard
                  section="analytics"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard/settings"
            element={
              <ProtectedRoute
                allowedRole="admin"
              >
                <AdminDashboard
                  section="settings"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard/account"
            element={
              <ProtectedRoute
                allowedRole="admin"
              >
                <AdminDashboard
                  section="account"
                />
              </ProtectedRoute>
            }
          />
          {/* =================================================
              FALLBACK
          ================================================= */}
          <Route
            path="*"
            element={
              <NotFound />
            }
          />
        </Routes>
      </main>
      {/* =====================================================
          FLOATING CART
      ===================================================== */}
      {cartCount > 0 && (
        <Link
          to="/cart"
          className="fg-floating-cart"
          aria-label="Open shopping cart"
        >
          <FaShoppingBag />
          <span>
            {cartCount}{" "}
            {cartCount === 1
              ? "item"
              : "items"}
          </span>
        </Link>
      )}
      {/* =====================================================
          BACK TO TOP
      ===================================================== */}
      <button
        type="button"
        className="fg-back-top"
        aria-label="Back to top"
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          })
        }
      >
        <FaArrowUp />
      </button>
      {/* =====================================================
          FOOTER
      ===================================================== */}
      <Footer />
    </div>
  );
}
