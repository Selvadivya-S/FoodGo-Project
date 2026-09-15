import mongoose from "mongoose";
const schema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  provider: { type: String, default: "razorpay" },
  providerOrderId: { type: String, index: true },
  providerPaymentId: String,
  amount: Number,
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["CREATED", "PENDING", "PAID", "FAILED", "REFUNDED"], default: "CREATED", index: true },
  signatureVerified: { type: Boolean, default: false }
}, { timestamps: true });
export const Payment = mongoose.model("Payment", schema);
