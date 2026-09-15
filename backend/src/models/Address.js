import mongoose from "mongoose";
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  label: { type: String, enum: ["Home", "Work", "Other"], default: "Home" },
  line1: String, line2: String, city: String, state: String, pincode: String,
  location: { type: { type: String, enum: ["Point"] }, coordinates: [Number] },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });
schema.index({ location: "2dsphere" });
export const Address = mongoose.model("Address", schema);
