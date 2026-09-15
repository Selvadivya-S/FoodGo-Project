import mongoose from "mongoose";
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tokenId: { type: String, required: true, unique: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  revokedAt: Date,
  userAgent: String,
  ip: String
}, { timestamps: true });
export const RefreshToken = mongoose.model("RefreshToken", schema);
