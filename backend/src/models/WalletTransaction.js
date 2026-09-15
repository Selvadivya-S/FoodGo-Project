import mongoose from "mongoose";
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["TOP_UP", "ORDER", "REFUND", "CASHBACK", "ADJUSTMENT"], required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: "" },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  status: { type: String, enum: ["COMPLETED", "PENDING", "FAILED"], default: "COMPLETED" },
}, { timestamps: true });
schema.index({ userId: 1, createdAt: -1 });
export const WalletTransaction = mongoose.model("WalletTransaction", schema);
