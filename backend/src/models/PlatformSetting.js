import mongoose from "mongoose";
const schema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  value: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });
export const PlatformSetting = mongoose.model("PlatformSetting", schema);
