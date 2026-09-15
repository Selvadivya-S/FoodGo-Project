import { User } from "../models/User.js";
import { Order } from "../models/Order.js";
import { Restaurant } from "../models/Restaurant.js";
import { MenuItem } from "../models/MenuItem.js";
import { ok } from "../utils/response.js";
export async function customerDashboard(req, res) {
  const [orders, activeOrders, spent, recent, completed, averageOrder] = await Promise.all([
    Order.countDocuments({ customerId: req.user._id }),
    Order.countDocuments({ customerId: req.user._id, status: { $nin: ["DELIVERED", "CANCELLED", "REJECTED", "REFUNDED"] } }),
    Order.aggregate([{ $match: { customerId: req.user._id, paymentStatus: "PAID" } }, { $group: { _id: null, total: { $sum: "$pricing.total" } } }]),
    Order.find({ customerId: req.user._id }).sort({ createdAt: -1 }).limit(6).populate("restaurantId", "name images rating"),
    Order.countDocuments({ customerId: req.user._id, status: "DELIVERED" }),
    Order.aggregate([{ $match: { customerId: req.user._id, paymentStatus: "PAID" } }, { $group: { _id: null, average: { $avg: "$pricing.total" } } }]),
  ]);
  return ok(res, {
    orders,
    activeOrders,
    completedOrders: completed,
    totalSpent: spent[0]?.total || 0,
    averageOrderValue: averageOrder[0]?.average || 0,
    recentOrders: recent,
  });
}
export async function restaurantDashboard(req, res) {
  const restaurants = await Restaurant.find({ ownerId: req.user._id, isApproved: true }).sort({ createdAt: -1 }).lean();
  if (!restaurants.length) return ok(res, { restaurants: [], restaurant: null, totalOrders: 0, todayOrders: 0, todayRevenue: 0, menuItems: 0, recentOrders: [] });
  const requestedId = req.query.restaurantId;
  const restaurant = restaurants.find((r) => String(r._id) === String(requestedId)) || restaurants[0];
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const [totalOrders, todayOrders, revenue, menuItems, recentOrders] = await Promise.all([
    Order.countDocuments({ restaurantId: restaurant._id }),
    Order.countDocuments({ restaurantId: restaurant._id, createdAt: { $gte: start } }),
    Order.aggregate([{ $match: { restaurantId: restaurant._id, paymentStatus: "PAID" } }, { $group: { _id: null, total: { $sum: "$pricing.total" } } }]),
    MenuItem.countDocuments({ restaurantId: restaurant._id }),
    Order.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 }).limit(10),
  ]);
  return ok(res, { restaurants, restaurant, totalOrders, todayOrders, todayRevenue: revenue[0]?.total || 0, menuItems, recentOrders });
}
export async function deliveryDashboard(req, res) {
  const [active, delivered, completedFees, nextDelivery] = await Promise.all([
    Order.countDocuments({ deliveryPartnerId: req.user._id, status: { $in: ["READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY"] } }),
    Order.countDocuments({ deliveryPartnerId: req.user._id, status: "DELIVERED" }),
    Order.aggregate([
      { $match: { deliveryPartnerId: req.user._id, status: "DELIVERED" } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$pricing.deliveryFee", 0] } } } },
    ]),
    Order.findOne({ deliveryPartnerId: req.user._id, status: { $in: ["READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY"] } })
      .sort({ createdAt: 1 }).populate("restaurantId", "name address"),
  ]);
  return ok(res, { activeDeliveries: active, delivered, totalEarnings: completedFees[0]?.total || 0, nextDelivery });
}
export async function adminDashboard(req, res) {
  const [users, restaurants, orders, revenue, pendingRestaurants, liveOrders, customers, restaurantOwners, deliveryPartners, recentOrders] = await Promise.all([
    User.countDocuments(),
    Restaurant.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $match: { paymentStatus: "PAID" } }, { $group: { _id: null, total: { $sum: "$pricing.total" } } }]),
    Restaurant.countDocuments({ isApproved: false }),
    Order.countDocuments({ status: { $nin: ["DELIVERED", "CANCELLED", "REJECTED", "REFUNDED"] } }),
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "restaurant_owner" }),
    User.countDocuments({ role: "delivery_partner" }),
    Order.find().sort({ createdAt: -1 }).limit(6).populate("customerId", "name").populate("restaurantId", "name"),
  ]);
  return ok(res, { users, restaurants, orders, revenue: revenue[0]?.total || 0, pendingRestaurants, liveOrders, roleCounts: { customers, restaurantOwners, deliveryPartners }, recentOrders });
}
