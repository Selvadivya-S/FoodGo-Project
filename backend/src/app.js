import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import publicRoutes from "./routes/public.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import restaurantRoutes from "./routes/restaurant.routes.js";
import deliveryRoutes from "./routes/delivery.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import mongoose from "mongoose";
import { User } from "./models/User.js";
import { Restaurant } from "./models/Restaurant.js";
import { MenuItem } from "./models/MenuItem.js";
import { Order } from "./models/Order.js";
import { Payment } from "./models/Payment.js";
import { Delivery } from "./models/Delivery.js";
import { Notification } from "./models/Notification.js";
const app = express();
app.use(helmet());
const allowedOrigins = new Set(
  (process.env.CLIENT_URL || "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    try {
      const url = new URL(origin);
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        return callback(null, true);
      }
    } catch {}
    return callback(new Error("CORS origin not allowed"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(compression());
app.use(cookieParser());
app.get("/api/health", (req, res) => res.json({
  success: true,
  service: "FoodGo API",
  status: "healthy",
  timestamp: new Date().toISOString(),
}));
app.get("/api/health/db", async (req, res) => {
  try {
    const collections = {
      users: await User.countDocuments(),
      restaurants: await Restaurant.countDocuments(),
      menuitems: await MenuItem.countDocuments(),
      orders: await Order.countDocuments(),
      payments: await Payment.countDocuments(),
      deliveries: await Delivery.countDocuments(),
      notifications: await Notification.countDocuments(),
    };
    res.json({
      success: true,
      database: mongoose.connection.name || "unknown",
      state: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      collections,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api", publicRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.get("/", (req, res) => res.json({ success: true, service: "FoodGo API", message: "FoodGo backend is running" }));
app.use((req, res) => res.status(404).json({
  success: false,
  message: `Route not found: ${req.method} ${req.originalUrl}`,
}));
app.use((error, req, res, next) => {
  console.error("SERVER ERROR:", error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});
export default app;
