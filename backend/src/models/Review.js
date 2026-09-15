import mongoose from "mongoose";
const schema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
  foodRating: { type: Number, min: 1, max: 5 },
  restaurantRating: { type: Number, min: 1, max: 5 },
  deliveryRating: { type: Number, min: 1, max: 5 },
  comment: { type: String, maxlength: 1000 }
}, { timestamps: true });
export const Review = mongoose.model("Review", schema);
