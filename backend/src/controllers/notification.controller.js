import { Notification } from "../models/Notification.js";
import { ok } from "../utils/response.js";
export async function listNotifications(req, res) {
  return ok(res, await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100));
}
export async function markRead(req, res) {
  return ok(res, await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isRead: true }, { new: true }));
}
