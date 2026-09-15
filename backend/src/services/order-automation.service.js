import { Order } from "../models/Order.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { notify } from "./notification.service.js";
import { sendEmail } from "./email.service.js";

const DELIVERY_UPDATE_DELAY = 5 * 60 * 1000;
const DELIVERY_EMAIL_DELAY = Number(process.env.DELIVERY_SUCCESS_EMAIL_DELAY_MINUTES || 45) * 60 * 1000;
const timers = new Map();

const DEMO_AUTO_DELIVERY = String(process.env.FOODGO_DEMO_AUTO_DELIVERY || "false").toLowerCase() === "true";
const DEMO_STAGE_DELAY = Math.max(2, Number(process.env.FOODGO_DEMO_STAGE_DELAY_SECONDS || 8)) * 1000;

async function advanceDemoOrder(orderId, io) {
  const order = await Order.findById(orderId);
  if (!order || !DEMO_AUTO_DELIVERY || ["DELIVERED", "CANCELLED", "REJECTED", "REFUNDED"].includes(order.status)) return;
  const sequence = ["PLACED", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"];
  const index = sequence.indexOf(order.status);
  const next = sequence[index + 1];
  if (!next) return;
  order.status = next;
  if (next === "DELIVERED") {
    order.deliveredAt = new Date();
    if (order.paymentStatus === "PENDING") order.paymentStatus = "PAID";
    await order.save();
    await sendDeliveredEmail(order._id);
  } else {
    order.deliveryMessage = buildMessage(order);
    order.deliveryMessageAt = new Date();
    order.deliveryMessageSent = true;
    await order.save();
  }
  io?.to(`order:${order._id}`).emit("order:status", order);
  if (next !== "DELIVERED") {
    setTimeout(() => advanceDemoOrder(order._id, io).catch(e => console.error("Demo delivery progression failed:", e.message)), DEMO_STAGE_DELAY);
  }
}

export function scheduleDemoDelivery(orderId, io) {
  if (!DEMO_AUTO_DELIVERY) return;
  setTimeout(() => advanceDemoOrder(orderId, io).catch(e => console.error("Demo delivery progression failed:", e.message)), DEMO_STAGE_DELAY);
}

function buildMessage(order) {
  if (["PLACED", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP"].includes(order.status))
    return "Delivery update: your order is being prepared. We’ll keep tracking it and show the next delivery update here.";
  if (["PICKED_UP", "OUT_FOR_DELIVERY"].includes(order.status))
    return "Delivery update: your order has been picked up and is on the way. You can follow the delivery progress here.";
  if (order.status === "DELIVERED") return "Delivery update: your order has been delivered. Enjoy your meal!";
  return "Delivery update: your FoodGo order is still being processed. We’ll keep you updated here.";
}

async function sendDeliveryMessage(orderId, io) {
  timers.delete(`update:${orderId}`);
  const order = await Order.findById(orderId);
  if (!order || order.deliveryMessageSent || ["DELIVERED", "CANCELLED", "REJECTED", "REFUNDED"].includes(order.status)) return;
  const message = buildMessage(order);
  order.deliveryMessage = message;
  order.deliveryMessageAt = new Date();
  order.deliveryMessageSent = true;
  await order.save();
  await notify(io, { userId: order.customerId, type: "DELIVERY_UPDATE", title: "FoodGo delivery update", message, orderId: order._id });
  io?.to(`order:${order._id}`).emit("order:delivery-message", { orderId: order._id, message, createdAt: order.deliveryMessageAt });
}

async function sendDeliveredEmail(orderId) {
  timers.delete(`email:${orderId}`);
  const order = await Order.findById(orderId);
  if (!order || order.deliverySuccessEmailSent || order.status !== "DELIVERED" || !order.deliveredAt) return;
  const user = await User.findById(order.customerId).select("name email");
  if (!user?.email) return;
  await sendEmail({
    to: user.email,
    subject: `FoodGo Order ${order._id} — Delivered successfully`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h2>Delivered successfully</h2><p>Hello ${user.name || "Customer"},</p><p>Your FoodGo order <strong>#${order._id}</strong> has been delivered successfully.</p><p>Thank you for ordering with FoodGo.</p></div>`
  });
  order.deliverySuccessEmailSent = true;
  order.deliverySuccessEmailAt = new Date();
  await order.save();
}

export function scheduleDeliveryMessage(orderId, createdAt, io) {
  const key = `update:${orderId}`;
  if (timers.has(key)) return;
  const elapsed = Date.now() - new Date(createdAt).getTime();
  const delay = Math.max(0, DELIVERY_UPDATE_DELAY - elapsed);
  timers.set(key, setTimeout(() => sendDeliveryMessage(orderId, io).catch(e => console.error("Delivery message automation failed:", e.message)), delay));
}

export function scheduleDeliveredEmail(orderId, deliveredAt) {
  const key = `email:${orderId}`;
  if (timers.has(key)) return;
  const delay = Math.max(0, DELIVERY_EMAIL_DELAY - (Date.now() - new Date(deliveredAt).getTime()));
  timers.set(key, setTimeout(() => sendDeliveredEmail(orderId).catch(e => console.error("Delivered email automation failed:", e.message)), delay));
}

export async function schedulePendingDeliveryMessages(io) {
  const pending = await Order.find({
    deliveryMessageSent: { $ne: true },
    status: { $nin: ["DELIVERED", "CANCELLED", "REJECTED", "REFUNDED"] }
  }).select("_id createdAt");
  for (const order of pending) scheduleDeliveryMessage(order._id, order.createdAt, io);

  const delivered = await Order.find({
    status: "DELIVERED",
    deliveredAt: { $ne: null },
    deliverySuccessEmailSent: { $ne: true }
  }).select("_id deliveredAt");
  for (const order of delivered) scheduleDeliveredEmail(order._id, order.deliveredAt);
}
