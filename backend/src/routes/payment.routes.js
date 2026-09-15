import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";
import { createPaymentOrder, verifyPayment, failPayment } from "../controllers/payment.controller.js";

const router = Router();
router.use(authenticate, allowRoles("customer"));
router.post("/create-order", createPaymentOrder);
router.post("/verify", verifyPayment);
router.post("/fail", failPayment);

export default router;
