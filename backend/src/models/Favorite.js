import mongoose from "mongoose";
const schema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", default: null, index: true },
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", default: null, index: true },
}, { timestamps: true });
schema.index({ customerId: 1, restaurantId: 1, menuItemId: 1 }, { unique: true });
export const Favorite = mongoose.model("Favorite", schema);
