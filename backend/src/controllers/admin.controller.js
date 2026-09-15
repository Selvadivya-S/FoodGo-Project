import { User } from "../models/User.js";
import { Restaurant } from "../models/Restaurant.js";
import { Order } from "../models/Order.js";
import { MenuItem } from "../models/MenuItem.js";
import { Delivery } from "../models/Delivery.js";
import bcrypt from "bcryptjs";
import { ok, fail } from "../utils/response.js";
export async function users(req, res) {
  return ok(res, await User.find().select("-passwordHash").sort({ createdAt: -1 }).limit(500));
}
export async function createUser(req, res) {
  const { name, email, password, phone = "", role } = req.body;
  if (!name || !email || !password || !role) return fail(res, "Name, email, password and role are required", 400);
  if (!["restaurant_owner", "delivery_partner"].includes(role)) return fail(res, "Admin can create restaurant owners or delivery partners", 400);
  if (password.length < 6) return fail(res, "Password must be at least 6 characters", 400);
  const normalizedEmail = email.toLowerCase().trim();
  if (await User.findOne({ email: normalizedEmail })) return fail(res, "An account with this email already exists", 409);
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name: name.trim(), email: normalizedEmail, phone, passwordHash, role, isActive: true });
  return ok(res, { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, isActive: user.isActive }, "User created", 201);
}
export async function restaurants(req, res) {
  return ok(res, await Restaurant.find().sort({ createdAt: -1 }).limit(500));
}
export async function orders(req, res) {
  return ok(res, await Order.find()
    .populate("customerId", "name email phone")
    .populate("restaurantId", "name")
    .populate("deliveryPartnerId", "name phone")
    .sort({ createdAt: -1 }).limit(500));
}
export async function approveRestaurant(req, res) {
  const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
  if (!restaurant) return fail(res, "Restaurant not found", 404);
  return ok(res, restaurant, "Restaurant approved");
}
export async function createRestaurant(req, res) {
  const { ownerId } = req.body;
  if (!ownerId) {
    return fail(
      res,
      "Select a restaurant owner before creating the restaurant",
      400
    );
  }
  const owner = await User.findOne({
    _id: ownerId,
    role: "restaurant_owner",
    isActive: true,
  });
  if (!owner) {
    return fail(res, "Selected restaurant owner was not found", 404);
  }
  req.body.isApproved = true;
  const { createRestaurant } = await import("./restaurant.controller.js");
  return createRestaurant(req, res);
}
export async function assignDelivery(req, res) {
  const { deliveryPartnerId } = req.body;
  const partner = await User.findOne({ _id: deliveryPartnerId, role: "delivery_partner", isActive: true });
  if (!partner) return fail(res, "Delivery partner not found", 404);
  const order = await Order.findById(req.params.orderId);
  if (!order) return fail(res, "Order not found", 404);
  order.deliveryPartnerId = partner._id;
  if (["PLACED", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP"].includes(order.status)) order.status = "READY_FOR_PICKUP";
  await order.save();
  await Delivery.findOneAndUpdate(
    { orderId: order._id },
    { orderId: order._id, deliveryPartnerId: partner._id, status: "ASSIGNED", pickupLocation: { restaurantId: order.restaurantId }, dropLocation: order.deliveryAddress },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  req.app.get("io")?.to(`order:${order._id}`).emit("order:status", order);
  return ok(res, order, "Delivery partner assigned");
}
export async function menu(req, res) {
  const items = await MenuItem.find({ restaurantId: req.params.restaurantId }).sort({ category: 1, name: 1 });
  return ok(res, items);
}
