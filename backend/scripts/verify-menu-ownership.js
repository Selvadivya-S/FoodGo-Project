import mongoose from "mongoose";
import dotenv from "dotenv";
import MenuItem from "../models/MenuItem.js";

dotenv.config();

if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required.");

await mongoose.connect(process.env.MONGO_URI);

const missing = await MenuItem.countDocuments({
  $or: [{ restaurantId: { $exists: false } }, { restaurantId: null }]
});

const total = await MenuItem.countDocuments();

console.log(`Total menu items: ${total}`);
console.log(`Menu items without restaurantId: ${missing}`);

if (missing) {
  console.log("These items cannot safely be assigned to a restaurant automatically.");
  console.log("Assign each one to its correct restaurant before making it public.");
}

await mongoose.disconnect();
