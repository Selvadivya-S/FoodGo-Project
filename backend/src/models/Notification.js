import mongoose from "mongoose";
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: String,
  title: String,
  message: String,
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  isRead: { type: Boolean, default: false, index: true }
}, { timestamps: true });
export const Notification = mongoose.model("Notification", schema);
