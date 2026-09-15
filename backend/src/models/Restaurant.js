import mongoose from "mongoose";
const restaurantSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, index: true },
  brandName: { type: String, trim: true, index: true },
  branchName: { type: String, trim: true },
  citySlug: { type: String, trim: true, lowercase: true, index: true },
  sourceUrl: { type: String, trim: true, default: "" },
  menuSourceUrl: { type: String, trim: true, default: "" },
  menuSourceType: { type: String, enum: ["official", "public_catalogue", "owner_entered", "pending_verification"], default: "pending_verification" },
  priceRange: { type: String, trim: true, default: "" },
  description: String,
  phone: String,
  email: String,
  cuisine: [{ type: String, index: true }],
  images: [String],
  googleMapsUrl: { type: String, trim: true, default: "" },
  address: {
    street: String, city: String, state: String, pincode: String
  },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }
  },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  deliveryTime: { type: Number, default: 30 },
  deliveryAvailable: { type: Boolean, default: true, index: true },
  deliveryFee: { type: Number, default: 40, min: 0 },
  freeDelivery: { type: Boolean, default: false, index: true },
  isOpen: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false, index: true }
}, { timestamps: true });
restaurantSchema.index({ location: "2dsphere" });
restaurantSchema.index({ name: "text", cuisine: "text" });
export const Restaurant = mongoose.model("Restaurant", restaurantSchema);
