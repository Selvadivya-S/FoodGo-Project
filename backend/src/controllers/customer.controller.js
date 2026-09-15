import { Favorite } from "../models/Favorite.js";
import { WalletTransaction } from "../models/WalletTransaction.js";
import { Coupon } from "../models/Coupon.js";
import { User } from "../models/User.js";
import { Restaurant } from "../models/Restaurant.js";
import { MenuItem } from "../models/MenuItem.js";
import { Order } from "../models/Order.js";
import { ok, fail } from "../utils/response.js";
export async function favourites(req, res) {
  // Ignore any legacy/invalid favourite rows that contain neither a restaurant nor a dish.
  const rows = await Favorite.find({
    customerId: req.user._id,
    $or: [
      { restaurantId: { $ne: null } },
      { menuItemId: { $ne: null } },
    ],
  })
    .populate("restaurantId")
    .populate({
      path: "menuItemId",
      populate: { path: "restaurantId", select: "name branchName images address" },
    });
  return ok(res, rows);
}
export async function addFavourite(req, res) {
  let { restaurantId = null, menuItemId = null, dishId = null } = req.body;

  // Accept dishId as a backward-compatible alias, but always store it as menuItemId.
  menuItemId = menuItemId || dishId || null;

  if (!restaurantId && !menuItemId) {
    return fail(res, "Select a restaurant or dish to favourite", 400);
  }

  let menuItem = null;

  if (menuItemId) {
    menuItem = await MenuItem.findById(menuItemId).select("restaurantId");
    if (!menuItem) return fail(res, "Dish not found", 404);

    // A dish always belongs to exactly one restaurant.
    // If the frontend does not send restaurantId, derive it here.
    if (!restaurantId) {
      restaurantId = menuItem.restaurantId;
    }

    if (String(menuItem.restaurantId) !== String(restaurantId)) {
      return fail(res, "Dish does not belong to this restaurant", 400);
    }
  }

  if (
    restaurantId &&
    !(await Restaurant.exists({
      _id: restaurantId,
      isApproved: true,
    }))
  ) {
    return fail(res, "Restaurant not found", 404);
  }

  const filter = {
    customerId: req.user._id,
    restaurantId: restaurantId || null,
    menuItemId: menuItemId || null,
  };

  const row = await Favorite.findOneAndUpdate(
    filter,
    filter,
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return ok(res, { favourite: row }, "Added to favourites", 201);
}
export async function removeFavourite(req, res) {
  const row = await Favorite.findOneAndDelete({ _id: req.params.id, customerId: req.user._id });
  if (!row) return fail(res, "Favourite not found", 404);
  return ok(res, null, "Removed from favourites");
}
export async function wallet(req, res) {
  const transactions = await WalletTransaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(200);
  const balance = transactions.reduce((sum, item) => {
    const credit = ["TOP_UP", "REFUND", "CASHBACK", "ADJUSTMENT"].includes(item.type);
    return sum + (credit ? Number(item.amount) : -Number(item.amount));
  }, 0);
  return ok(res, { balance, transactions });
}
export async function topUpWallet(req, res) {
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 50000) return fail(res, "Enter a wallet amount between ₹1 and ₹50,000", 400);
  const transaction = await WalletTransaction.create({
    userId: req.user._id,
    type: "TOP_UP",
    amount: Math.round(amount * 100) / 100,
    description: "Wallet top-up recorded by FoodGo",
    status: "COMPLETED",
  });
  return ok(res, transaction, "Wallet top-up recorded");
}
export async function offers(req, res) {
  const rows = await Coupon.find({ isActive: true, expiresAt: { $gt: new Date() } }).sort({ expiresAt: 1 }).limit(100);
  return ok(res, rows);
}
export async function validateOffer(req, res) {
  const code = String(req.body.code || "").trim().toUpperCase();
  const subtotal = Number(req.body.subtotal || 0);
  const coupon = await Coupon.findOne({ code, isActive: true, expiresAt: { $gt: new Date() } });
  if (!coupon) return fail(res, "Offer is invalid or expired", 404);
  if (subtotal < Number(coupon.minimumOrder || 0)) return fail(res, `Minimum order value is ₹${coupon.minimumOrder}`, 400);
  let discount = coupon.discountType === "PERCENTAGE" ? subtotal * coupon.discountValue / 100 : coupon.discountValue;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, subtotal);
  return ok(res, { coupon, discount: Math.round(discount * 100) / 100 }, "Offer is valid");
}
export async function updateProfile(req, res) {
  const { name, phone, avatar } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { $set: { ...(name !== undefined ? { name: String(name).trim() } : {}), ...(phone !== undefined ? { phone: String(phone).trim() } : {}), ...(avatar !== undefined ? { avatar: String(avatar).trim() } : {}) } }, { new: true, runValidators: true }).select("-passwordHash");
  return ok(res, user, "Profile updated");
}
export async function customerWalletOrderSync(req, res) {
  const orders = await Order.find({ customerId: req.user._id, paymentStatus: "PAID" }).sort({ createdAt: -1 }).limit(200);
  const existing = new Set((await WalletTransaction.find({ userId: req.user._id, orderId: { $ne: null } }).distinct("orderId")).map(String));
  const inserts = orders.filter(o => !existing.has(String(o._id))).map(o => ({ userId: req.user._id, type: "ORDER", amount: Number(o.pricing?.total || 0), description: `Payment for order #${String(o._id).slice(-8).toUpperCase()}`, orderId: o._id, status: "COMPLETED" }));
  if (inserts.length) await WalletTransaction.insertMany(inserts);
  return ok(res, { synced: inserts.length });
}
