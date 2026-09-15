import dotenv from "dotenv";
import "dotenv/config";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { MenuItem } from "../src/models/MenuItem.js";
import { Favorite } from "../src/models/Favorite.js";

const backendEnvPath = fileURLToPath(new URL("../.env", import.meta.url));
dotenv.config({ path: backendEnvPath });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

if (!process.env.MONGO_URI) {
  console.error("\nMONGO_URI is required.");
  console.error("Create backend/.env and add your existing MongoDB connection string:");
  console.error("MONGO_URI=mongodb://127.0.0.1:27017/foodgo\n");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI);

  const menuItems = await MenuItem.find({}).select("_id").lean();
  const ids = menuItems.map((item) => item._id);

  if (ids.length) {
    await Favorite.deleteMany({ menuItemId: { $in: ids } });
  }

  const result = await MenuItem.deleteMany({});

  console.log(`\nFoodGo menu reset completed.`);
  console.log(`Deleted ${result.deletedCount} existing dishes.`);
  console.log(`Restaurants and restaurant accounts were not deleted.`);
  console.log(`Favorites linked to deleted dishes were cleaned up.`);
  console.log(`\nYou can now add dishes from the Admin or Restaurant dashboard.\n`);
} catch (error) {
  console.error("\nFoodGo menu reset failed:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
