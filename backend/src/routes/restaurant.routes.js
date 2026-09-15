import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/roles.js";
import { restaurantDashboard } from "../controllers/dashboard.controller.js";
import { listNotifications, markRead } from "../controllers/notification.controller.js";
import { restaurantAnalytics } from "../controllers/analytics.controller.js";
import {
  myRestaurant, createRestaurant, updateRestaurant, listMenu,
  createMenuItem, updateMenuItem, deleteMenuItem, restaurantOrders, updateOrderStatus
} from "../controllers/restaurant.controller.js";
const router = Router();
router.use(authenticate, allowRoles("restaurant_owner", "admin"));
router.get("/dashboard", restaurantDashboard);
router.get("/analytics", restaurantAnalytics);
router.get("/notifications", listNotifications);
router.patch("/notifications/:id/read", markRead);
router.get("/profile", myRestaurant);
router.post("/", createRestaurant);
router.patch("/:id", updateRestaurant);
router.get("/:restaurantId/menu", listMenu);
router.post("/:restaurantId/menu", createMenuItem);
router.patch("/menu/:id", updateMenuItem);
router.delete("/menu/:id", deleteMenuItem);
router.get("/:restaurantId/orders", restaurantOrders);
router.patch("/:restaurantId/orders/:orderId/status", updateOrderStatus);
export default router;
