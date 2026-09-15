import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { getOrder, updateOrderStatus } from "../controllers/order.controller.js";
const router = Router();
router.use(authenticate);
router.get("/:id", getOrder);
router.patch("/:id/status", updateOrderStatus);
export default router;
