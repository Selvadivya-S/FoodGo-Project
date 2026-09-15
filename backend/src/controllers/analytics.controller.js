import { Order } from "../models/Order.js";
import { Restaurant } from "../models/Restaurant.js";
import { MenuItem } from "../models/MenuItem.js";
import { User } from "../models/User.js";
import { Delivery } from "../models/Delivery.js";
import { PlatformSetting } from "../models/PlatformSetting.js";
import { ok, fail } from "../utils/response.js";
const dayStart = (offset = 0) => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - offset); return d; };
const money = (n) => Math.round(Number(n || 0) * 100) / 100;
export async function restaurantAnalytics(req, res) {
  const restaurant = req.query.restaurantId
    ? await Restaurant.findOne({ _id: req.query.restaurantId, ownerId: req.user._id })
    : await Restaurant.findOne({ ownerId: req.user._id }).sort({ createdAt: -1 });
  if (!restaurant) return ok(res, { restaurant: null, totalRevenue: 0, totalOrders: 0, rating: 0, repeatCustomers: 0, daily: [], topDishes: [] });
  const [totalOrders, revenue, daily, topDishes, uniqueCustomers, repeatAgg] = await Promise.all([
    Order.countDocuments({ restaurantId: restaurant._id }),
    Order.aggregate([{ $match: { restaurantId: restaurant._id, paymentStatus: "PAID" } }, { $group: { _id: null, total: { $sum: "$pricing.total" } } }]),
    Order.aggregate([{ $match: { restaurantId: restaurant._id, createdAt: { $gte: dayStart(6) } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, orders: { $sum: 1 }, revenue: { $sum: { $ifNull: ["$pricing.total", 0] } } } }, { $sort: { _id: 1 } }]),
    Order.aggregate([{ $match: { restaurantId: restaurant._id } }, { $unwind: "$items" }, { $group: { _id: "$items.menuItemId", name: { $first: "$items.name" }, quantity: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } } } }, { $sort: { revenue: -1 } }, { $limit: 10 }]),
    Order.distinct("customerId", { restaurantId: restaurant._id }),
    Order.aggregate([{ $match: { restaurantId: restaurant._id } }, { $group: { _id: "$customerId", orders: { $sum: 1 } } }, { $match: { orders: { $gt: 1 } } }, { $count: "count" }]),
  ]);
  return ok(res, { restaurant, totalOrders, totalRevenue: money(revenue[0]?.total), rating: restaurant.rating || 0, repeatCustomers: uniqueCustomers.length ? Math.round((Number(repeatAgg[0]?.count || 0) / uniqueCustomers.length) * 100) : 0, daily, topDishes });
}
export async function deliveryAnalytics(req, res) {
  const deliveries = await Delivery.find({ deliveryPartnerId: req.user._id }).populate({ path: "orderId", select: "pricing status createdAt restaurantId" }).sort({ createdAt: -1 }).limit(500);
  const completed = deliveries.filter(d => d.status === "DELIVERED");
  const active = deliveries.filter(d => ["ASSIGNED","PICKED_UP","OUT_FOR_DELIVERY"].includes(d.status));
  const totalFees = completed.reduce((sum, d) => sum + Number(d.orderId?.pricing?.deliveryFee || 0), 0);
  const today = dayStart(0).getTime();
  const todayFees = completed.filter(d => new Date(d.createdAt).getTime() >= today).reduce((sum, d) => sum + Number(d.orderId?.pricing?.deliveryFee || 0), 0);
  const weekly = Array.from({ length: 7 }, (_, i) => { const start = dayStart(6 - i); const end = new Date(start); end.setDate(end.getDate()+1); const rows = completed.filter(d => new Date(d.createdAt) >= start && new Date(d.createdAt) < end); return { label: start.toLocaleDateString("en-IN", { weekday: "short" }), deliveries: rows.length, earnings: money(rows.reduce((s,d) => s + Number(d.orderId?.pricing?.deliveryFee || 0), 0)) }; });
  const acceptanceBase = deliveries.length;
  const acceptance = acceptanceBase ? Math.round((deliveries.filter(d => d.status !== "CANCELLED").length / acceptanceBase) * 100) : 0;
  const completion = deliveries.length ? Math.round((completed.length / deliveries.length) * 100) : 0;
  return ok(res, { active: active.length, delivered: completed.length, totalEarnings: money(totalFees), todayEarnings: money(todayFees), weekly, acceptanceRate: acceptance, completionRate: completion, onlineHours: 0, deliveries });
}
export async function adminAnalytics(req, res) {
  const [users, restaurants, orders, revenue, liveOrders, daily, roleCounts, restaurantCities] = await Promise.all([
    User.countDocuments(), Restaurant.countDocuments(), Order.countDocuments(),
    Order.aggregate([{ $match: { paymentStatus: "PAID" } }, { $group: { _id: null, total: { $sum: "$pricing.total" } } }]),
    Order.countDocuments({ status: { $nin: ["DELIVERED","CANCELLED","REJECTED","REFUNDED"] } }),
    Order.aggregate([{ $match: { createdAt: { $gte: dayStart(6) } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, orders: { $sum: 1 }, revenue: { $sum: { $ifNull: ["$pricing.total", 0] } } } }, { $sort: { _id: 1 } }]),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Restaurant.aggregate([{ $group: { _id: "$address.city", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
  ]);
  return ok(res, { users, restaurants, orders, revenue: money(revenue[0]?.total), liveOrders, daily, roleCounts, restaurantCities });
}
const DEFAULT_SETTINGS = { restaurantCommission: 18, deliveryBaseFee: 40, supportSlaMinutes: 15, autoCancelMinutes: 10, approvalMode: "MANUAL", liveTracking: true, paymentGateway: "RAZORPAY", notifications: true, maintenanceMode: false, fraudMonitoring: true };
export async function adminSettings(req, res) {
  const rows = await PlatformSetting.find({});
  const settings = { ...DEFAULT_SETTINGS };
  rows.forEach(row => { settings[row.key] = row.value; });
  return ok(res, settings);
}
export async function updateAdminSettings(req, res) {
  const allowed = Object.keys(DEFAULT_SETTINGS);
  const updates = {};
  for (const key of allowed) if (Object.prototype.hasOwnProperty.call(req.body, key)) updates[key] = req.body[key];
  await Promise.all(Object.entries(updates).map(([key, value]) => PlatformSetting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true, setDefaultsOnInsert: true })));
  return adminSettings(req, res);
}
