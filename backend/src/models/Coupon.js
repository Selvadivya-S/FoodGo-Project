import mongoose from "mongoose";
const schema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, index: true },
  discountType: { type: String, enum: ["PERCENTAGE", "FLAT"], required: true },
  discountValue: { type: Number, min: 0, required: true },
  maxDiscount: Number,
  minimumOrder: { type: Number, default: 0 },
  usageLimit: Number,
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, index: true },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });
export const Coupon = mongoose.model("Coupon", schema);
