import mongoose from "mongoose";
const schema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: String,
  price: { type: Number, required: true, min: 0 },
  category: { type: String, index: true },
  image: String,
  isVeg: Boolean,
  isAvailable: { type: Boolean, default: true, index: true },
  preparationTime: { type: Number, default: 20 }
}, { timestamps: true });
schema.index({ restaurantId: 1, category: 1, isAvailable: 1 });
export const MenuItem = mongoose.model("MenuItem", schema);
