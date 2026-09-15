import { Restaurant } from "../models/Restaurant.js";
import { MenuItem } from "../models/MenuItem.js";
import { Order } from "../models/Order.js";
import { ok, fail } from "../utils/response.js";
const ownerFilter = (req, restaurantId) =>
  req.user.role === "admin"
    ? { _id: restaurantId }
    : { _id: restaurantId, ownerId: req.user._id };
export async function listRestaurants(req, res) {
  const { q, cuisine, city, state, lat, lng, radius = 10000 } = req.query;
  const filter = { isApproved: true };
  if (cuisine) filter.cuisine = cuisine;
  if (city) {
    const normalizedCity = String(city).trim().toLowerCase();
    const cityRegex = new RegExp(`^${normalizedCity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    filter.$or = [{ citySlug: normalizedCity }, { "address.city": cityRegex }];
  }
  if (state) {
    const normalizedState = String(state).trim().toLowerCase();
    const stateRegex = new RegExp(`^${normalizedState.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    filter["address.state"] = stateRegex;
  }
  if (q) filter.$text = { $search: q };
  if (lat && lng) {
    filter.location = {
      $near: {
        $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Number(radius),
      },
    };
  }

  const restaurants = await Restaurant.find(filter).sort({ rating: -1, createdAt: -1 }).limit(500).lean();
  return ok(res, restaurants);
}
export async function listCityMenu(req, res) {
  const { city, state, limit = 12 } = req.query;
  const restaurantFilter = { isApproved: true };
  if (city) {
    const normalizedCity = String(city).trim().toLowerCase();
    const cityRegex = new RegExp(`^${normalizedCity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    restaurantFilter.$or = [{ citySlug: normalizedCity }, { "address.city": cityRegex }];
  }
  if (state) {
    const normalizedState = String(state).trim().toLowerCase();
    const stateRegex = new RegExp(`^${normalizedState.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    restaurantFilter["address.state"] = stateRegex;
  }
  const restaurants = await Restaurant.find(restaurantFilter)
    .select("_id name brandName images deliveryTime deliveryFee freeDelivery address rating")
    .sort({ rating: -1, createdAt: 1 })
    .lean();
  const uniqueRestaurants = restaurants;
  const restaurantIds = uniqueRestaurants.map((restaurant) => restaurant._id);
  if (!restaurantIds.length) return ok(res, []);
  const restaurantMap = new Map(uniqueRestaurants.map((restaurant) => [String(restaurant._id), restaurant]));
  const requestedLimit = Math.min(Number(limit) || 20, 50);
  const menuRows = await MenuItem.find({
    restaurantId: { $in: restaurantIds },
    isAvailable: true,
  }).sort({ createdAt: -1 }).lean();
  const perRestaurant = new Map();
  const menu = [];
  for (const item of menuRows) {
    const key = String(item.restaurantId);
    const count = perRestaurant.get(key) || 0;
    if (count >= 3) continue;
    perRestaurant.set(key, count + 1);
    menu.push(item);
    if (menu.length >= requestedLimit) break;
  }
  return ok(res, menu.map((item) => {
    const restaurant = restaurantMap.get(String(item.restaurantId));
    return {
      ...item,
      id: item._id,
      restaurantId: restaurant?._id,
      restaurantName: restaurant?.name || "",
      restaurantDeliveryTime: restaurant?.deliveryTime || 30,
      restaurantDeliveryFee: Number.isFinite(Number(restaurant?.deliveryFee)) ? Number(restaurant.deliveryFee) : 40,
      restaurantFreeDelivery: restaurant?.freeDelivery === true,
      restaurantImage: restaurant?.images?.[0] || "",
      rating: restaurant?.rating || 4.5,
      veg: !!item.isVeg,
      image: item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
      description: item.description || `${item.name} from ${restaurant?.name || "FoodGo"}.`,
      bestseller: false,
    };
  }));
}
export async function listRestaurantLocations(req, res) {
  const rows = await Restaurant.find({ isApproved: true })
    .select("address.city address.state citySlug")
    .lean();
  const unique = new Map();
  for (const row of rows) {
    const city = String(row.address?.city || "").trim();
    const state = String(row.address?.state || "").trim();
    if (!city && !state) continue;
    const key = `${city.toLowerCase()}|${state.toLowerCase()}`;
    if (!unique.has(key)) unique.set(key, { city, state, citySlug: normalizeCitySlug(city) });
  }
  return ok(res, Array.from(unique.values()).sort((a, b) => `${a.state} ${a.city}`.localeCompare(`${b.state} ${b.city}`)));
}
export async function getRestaurant(req, res) {
  const restaurant = await Restaurant.findOne({ _id: req.params.id, isApproved: true });
  if (!restaurant) return fail(res, "Restaurant not found", 404);
  return ok(res, restaurant);
}
export async function listBranches(req, res) {
  const restaurant = await Restaurant.findOne({ _id: req.params.id, isApproved: true }).lean();
  if (!restaurant) return fail(res, "Restaurant not found", 404);
  if (!restaurant.brandName) return ok(res, [restaurant]);
  const branches = await Restaurant.find({
    brandName: restaurant.brandName,
    isApproved: true,
  }).sort({ "address.city": 1, branchName: 1, name: 1 }).lean();
  return ok(res, branches);
}
export async function myRestaurant(req, res) {
  const restaurants = await Restaurant.find({ ownerId: req.user._id }).sort({ createdAt: -1 }).lean();
  return ok(res, restaurants);
}
const normalizeCitySlug = (value) =>
  value
    ? String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    : "";

const normalizeAddress = (body = {}) => {
  const source = body.address && typeof body.address === "object" ? body.address : {};
  return {
    street: source.street ?? body.street ?? "",
    city: source.city ?? body.city ?? "",
    state: source.state ?? body.state ?? "",
    pincode: source.pincode ?? body.pincode ?? "",
  };
};

export async function createRestaurant(req, res) {
  // Every create request is an independent restaurant.
  // DO NOT find, replace, merge, or delete an existing restaurant here.
  // MenuItem.restaurantId is a real foreign reference to this newly created
  // document, so dishes added later stay isolated to this restaurant.
  const { name, brandName = "", branchName = "", description, phone, email, cuisine = [], images = [], googleMapsUrl = "", sourceUrl = "", menuSourceUrl = "", menuSourceType = "pending_verification", priceRange = "", latitude, longitude, ownerId } = req.body;
  if (!name) return fail(res, "Restaurant name is required", 400);
  const address = normalizeAddress(req.body);
  const cleanName = String(name).trim();
  const restaurant = await Restaurant.create({
    ownerId: ownerId || req.user._id,
    name: cleanName, brandName, branchName, description, phone, email, cuisine, images, googleMapsUrl, sourceUrl, menuSourceUrl, menuSourceType, priceRange, address,
    citySlug: normalizeCitySlug(address.city),
    location: {
      type: "Point",
      coordinates: [Number.isFinite(Number(longitude)) ? Number(longitude) : 80.2707, Number.isFinite(Number(latitude)) ? Number(latitude) : 13.0827],
    },
    isApproved: req.user.role === "admin",
  });
  return ok(res, restaurant, "Restaurant created", 201);
}
export async function updateRestaurant(req, res) {
  const update = { ...req.body };
  if (req.body.address || Object.prototype.hasOwnProperty.call(req.body, "city") || Object.prototype.hasOwnProperty.call(req.body, "street") || Object.prototype.hasOwnProperty.call(req.body, "state") || Object.prototype.hasOwnProperty.call(req.body, "pincode")) {
    const address = normalizeAddress(req.body);
    update.address = address;
    update.citySlug = normalizeCitySlug(address.city);
    delete update.city;
    delete update.street;
    delete update.state;
    delete update.pincode;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "latitude") || Object.prototype.hasOwnProperty.call(req.body, "longitude")) {
    const current = await Restaurant.findOne(ownerFilter(req, req.params.id)).select("location");
    if (!current) return fail(res, "Restaurant not found or not owned by you", 404);
    const latitude = Number(req.body.latitude ?? current.location?.coordinates?.[1] ?? 13.0827);
    const longitude = Number(req.body.longitude ?? current.location?.coordinates?.[0] ?? 80.2707);
    update.location = { type: "Point", coordinates: [longitude, latitude] };
    delete update.latitude;
    delete update.longitude;
  }
  const restaurant = await Restaurant.findOneAndUpdate(
    ownerFilter(req, req.params.id),
    { $set: update },
    { new: true, runValidators: true }
  );
  if (!restaurant) return fail(res, "Restaurant not found or not owned by you", 404);
  return ok(res, restaurant, "Restaurant updated");
}
export async function listMenu(req, res) {
  // Public restaurant pages receive only available dishes.
  // Authenticated restaurant/admin dashboards receive the complete menu so
  // paused dishes can be edited/re-enabled, while deleted dishes stay gone.
  const filter = { _id: req.params.restaurantId };
  if (!req.user) filter.isApproved = true;
  if (req.user) {
    const owned = await Restaurant.findOne({ ...ownerFilter(req, req.params.restaurantId), isApproved: true }).select("_id");
    if (!owned) return fail(res, "Restaurant is not approved yet or not owned by you", 403);
  }
  const restaurant = await Restaurant.findOne(filter).select("_id");
  if (!restaurant) return fail(res, "Restaurant not found", 404);

  const menuFilter = { restaurantId: restaurant._id };
  if (!req.user) menuFilter.isAvailable = true;
  const menu = await MenuItem.find(menuFilter).sort({ category: 1, name: 1 });

  return ok(res, menu);
}
export async function createMenuItem(req, res) {
  const restaurant = await Restaurant.findOne({ ...ownerFilter(req, req.params.restaurantId), isApproved: true });
  if (!restaurant) return fail(res, "Restaurant is not approved yet or not owned by you", 403);
  const { name, price, isVeg } = req.body;
  if (!name || price === undefined) return fail(res, "Dish name and price are required", 400);
  if (typeof isVeg !== "boolean") return fail(res, "Please select whether the dish is Veg or Non-Veg", 400);
  const item = await MenuItem.create({ ...req.body, restaurantId: restaurant._id });
  return ok(res, item, "Dish added", 201);
}
export async function updateMenuItem(req, res) {
  const item = await MenuItem.findOne({ _id: req.params.id });
  if (!item) return fail(res, "Dish not found", 404);
  const restaurant = await Restaurant.findOne({ ...ownerFilter(req, item.restaurantId), isApproved: true });
  if (!restaurant) return fail(res, "Restaurant is not approved yet or not authorized", 403);
  const { restaurantId, _id, createdAt, updatedAt, ...safeUpdate } = req.body || {};
  if (safeUpdate.isVeg !== undefined && typeof safeUpdate.isVeg !== "boolean") return fail(res, "Please select whether the dish is Veg or Non-Veg", 400);
  Object.assign(item, safeUpdate);
  await item.save();
  return ok(res, item, "Dish updated");
}
export async function deleteMenuItem(req, res) {
  const item = await MenuItem.findById(req.params.id);
  if (!item) return fail(res, "Dish not found", 404);
  const restaurant = await Restaurant.findOne({ ...ownerFilter(req, item.restaurantId), isApproved: true });
  if (!restaurant) return fail(res, "Restaurant is not approved yet or not authorized", 403);
  await item.deleteOne();
  return ok(res, null, "Dish deleted");
}
export async function restaurantOrders(req, res) {
  const restaurant = await Restaurant.findOne(ownerFilter(req, req.params.restaurantId));
  if (!restaurant) return fail(res, "Restaurant not found", 404);
  const orders = await Order.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 }).limit(200);
  return ok(res, orders);
}
export async function updateOrderStatus(req, res) {
  const restaurant = await Restaurant.findOne(ownerFilter(req, req.params.restaurantId));
  if (!restaurant) return fail(res, "Restaurant not found", 404);
  const order = await Order.findOneAndUpdate(
    { _id: req.params.orderId, restaurantId: restaurant._id },
    { status: req.body.status },
    { new: true, runValidators: true }
  );
  if (!order) return fail(res, "Order not found", 404);
  req.app.get("io")?.to(`order:${order._id}`).emit("order:status", order);
  return ok(res, order, "Order status updated");
}
