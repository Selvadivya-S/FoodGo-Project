import mongoose from "mongoose";
const schema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", unique: true, index: true },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  status: { type: String, enum: ["UNASSIGNED", "ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"], default: "UNASSIGNED", index: true },
  pickupLocation: mongoose.Schema.Types.Mixed,
  dropLocation: mongoose.Schema.Types.Mixed,
  currentLocation: mongoose.Schema.Types.Mixed,
  distanceKm: Number,
  estimatedMinutes: Number,
  pickedUpAt: Date,
  deliveredAt: Date
}, { timestamps: true });
export const Delivery = mongoose.model("Delivery", schema);
