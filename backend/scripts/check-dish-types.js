import "dotenv/config";
import mongoose from "mongoose";
import { MenuItem } from "../src/models/MenuItem.js";

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI is required.");
await mongoose.connect(uri);
const items = await MenuItem.find({ $or: [{ isVeg: { $exists: false } }, { isVeg: null }] }).select("_id name restaurantId isVeg").lean();
console.log(`Dishes without a Veg/Non-Veg classification: ${items.length}`);
for (const item of items) console.log(`${item._id} | ${item.name} | restaurant ${item.restaurantId}`);
await mongoose.disconnect();
