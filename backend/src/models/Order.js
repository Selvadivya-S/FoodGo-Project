import mongoose from "mongoose";
const itemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
  name: String,
  quantity: { type: Number, min: 1 },
  price: { type: Number, min: 0 }
}, { _id: false });
const schema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  items: { type: [itemSchema], required: true },
  pricing: {
    subtotal: Number, deliveryFee: Number, tax: Number, discount: Number, total: Number
  },
  status: {
    type: String,
    enum: ["PLACED", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REJECTED", "REFUNDED"],
    default: "PLACED",
    index: true
  },
  paymentStatus: {
    type: String, enum: ["PENDING", "PAID", "FAILED", "REFUNDED"], default: "PENDING", index: true
  },
  paymentId: String,
  razorpayOrderId: String,
  deliveryAddress: mongoose.Schema.Types.Mixed,
  estimatedDeliveryTime: Date,
  deliveryMessage: { type: String, default: "" },
  deliveryMessageAt: { type: Date, default: null },
  deliveryMessageSent: { type: Boolean, default: false, index: true },
  deliveredAt: { type: Date, default: null },
  orderConfirmationEmailSent: { type: Boolean, default: false, index: true },
  deliverySuccessEmailSent: { type: Boolean, default: false, index: true },
  deliverySuccessEmailAt: { type: Date, default: null }
}, { timestamps: true });
schema.index({ customerId: 1, createdAt: -1 });
schema.index({ restaurantId: 1, status: 1, createdAt: -1 });
schema.index({ deliveryPartnerId: 1, status: 1 });
export const Order = mongoose.model("Order", schema);
