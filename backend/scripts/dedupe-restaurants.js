// This is a MANUAL cleanup utility only. It is NOT used by restaurant creation.
// Adding a restaurant through POST /admin/restaurants or POST /restaurant/...
// always creates an independent restaurant and never calls this script.

import "dotenv/config";
import mongoose from "mongoose";
import { Restaurant } from "../src/models/Restaurant.js";
import { MenuItem } from "../src/models/MenuItem.js";
import { Order } from "../src/models/Order.js";
import { Review } from "../src/models/Review.js";
import { Favorite } from "../src/models/Favorite.js";

if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required.");

const keyFor = (r) => [
  String(r.name || "").trim().toLowerCase().replace(/\s+/g, " "),
  String(r.address?.city || r.citySlug || "").trim().toLowerCase(),
  String(r.address?.state || "").trim().toLowerCase(),
].join("|");

await mongoose.connect(process.env.MONGO_URI);
const restaurants = await Restaurant.find({}).sort({ createdAt: 1 }).lean();
const groups = new Map();

for (const r of restaurants) {
  const key = keyFor(r);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(r);
}

let removed = 0;
let merged = 0;

for (const [key, group] of groups) {
  if (group.length < 2) continue;

  // Keep the oldest record as the canonical restaurant.
  // Prefer an approved record if available, while retaining the oldest tie-breaker.
  const canonical = [...group].sort((a, b) =>
    Number(Boolean(b.isApproved)) - Number(Boolean(a.isApproved)) ||
    new Date(a.createdAt) - new Date(b.createdAt)
  )[0];

  for (const duplicate of group) {
    if (String(duplicate._id) === String(canonical._id)) continue;

    const [menuResult, orderResult, reviewResult, favoriteResult] = await Promise.all([
      MenuItem.updateMany({ restaurantId: duplicate._id }, { $set: { restaurantId: canonical._id } }),
      Order.updateMany({ restaurantId: duplicate._id }, { $set: { restaurantId: canonical._id } }),
      Review.updateMany({ restaurantId: duplicate._id }, { $set: { restaurantId: canonical._id } }),
      Favorite.updateMany({ restaurantId: duplicate._id }, { $set: { restaurantId: canonical._id } }),
    ]);

    // A favorite unique-index collision can occur when both duplicate records
    // were favorited by the same customer. Remove exact duplicate favorites.
    const favorites = await Favorite.find({ restaurantId: canonical._id }).lean();
    const seenFavorites = new Set();
    const duplicateFavoriteIds = [];
    for (const fav of favorites) {
      const k = `${fav.customerId}|${fav.restaurantId}|${fav.menuItemId || ""}`;
      if (seenFavorites.has(k)) duplicateFavoriteIds.push(fav._id);
      else seenFavorites.add(k);
    }
    if (duplicateFavoriteIds.length) await Favorite.deleteMany({ _id: { $in: duplicateFavoriteIds } });

    await Restaurant.deleteOne({ _id: duplicate._id });
    removed++;
    merged += (menuResult.modifiedCount || 0);
    console.log(`Merged duplicate "${duplicate.name}" (${duplicate._id}) -> ${canonical._id}`);
  }
}

console.log(`Done. Duplicate restaurant records removed: ${removed}. Menu items reassigned: ${merged}.`);
await mongoose.disconnect();
