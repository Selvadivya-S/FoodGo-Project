import { Delivery } from "../models/Delivery.js";
import { Order } from "../models/Order.js";
import { ok, fail } from "../utils/response.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";
import { sendEmail } from "../services/email.service.js";
export async function myDeliveries(req, res) {
  return ok(res, await Delivery.find({ deliveryPartnerId: req.user._id }).populate({ path: "orderId", populate: [{ path: "restaurantId", select: "name address images" }, { path: "customerId", select: "name phone" }] }).sort({ createdAt: -1 }).limit(100));
}
export async function updateDeliveryStatus(req, res) {
  const { orderId, status } = req.body;
  const allowed = ["PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
  if (!allowed.includes(status)) return fail(res, "Invalid delivery status", 400);
  const delivery = await Delivery.findOne({ orderId, deliveryPartnerId: req.user._id });
  if (!delivery) return fail(res, "Delivery not found", 404);
  delivery.status = status;
  if (status === "PICKED_UP") delivery.pickedUpAt = new Date();
  if (status === "DELIVERED") delivery.deliveredAt = new Date();
  await delivery.save();
  const order = await Order.findById(orderId);
  if (order) {
    order.status = status;
    if (status === "DELIVERED") {
      order.deliveredAt = new Date();
      if (order.paymentStatus === "PENDING") order.paymentStatus = "PAID";
      await Payment.findOneAndUpdate(
        { orderId: order._id, provider: "cash_on_delivery" },
        { status: "PAID" }
      );
    }
    await order.save();

    if (status === "DELIVERED" && !order.deliverySuccessEmailSent) {
      try {
        const user = await User.findById(order.customerId).select("name email");
        if (user?.email) {
          await sendEmail({
            to: user.email,
            subject: `FoodGo Order ${order._id} — Delivered successfully`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h2 style="color:#ff5a1f">Delivered successfully 🎉</h2><p>Hello ${user.name || "Customer"},</p><p>Your FoodGo order <strong>#${order._id}</strong> has been delivered successfully.</p><p>Thank you for ordering with FoodGo.</p></div>`
          });
          order.deliverySuccessEmailSent = true;
          order.deliverySuccessEmailAt = new Date();
          await order.save();
        }
      } catch (error) {
        console.error("Delivery success email failed:", error.message);
      }
    }

    req.app.get("io")?.to(`order:${orderId}`).emit("order:status", order);
  }
  return ok(res, { ...delivery.toObject(), orderStatus: order?.status }, "Delivery status updated");
}
export async function updateLocation(req, res) {
  const { orderId, latitude, longitude } = req.body;
  const delivery = await Delivery.findOneAndUpdate(
    { orderId, deliveryPartnerId: req.user._id },
    { currentLocation: { type: "Point", coordinates: [Number(longitude), Number(latitude)] } },
    { new: true }
  );
  if (!delivery) return fail(res, "Delivery not found", 404);
  req.app.get("io")?.to(`order:${orderId}`).emit("delivery:location", { orderId, latitude, longitude });
  return ok(res, delivery);
}
