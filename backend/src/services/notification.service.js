import { Notification } from "../models/Notification.js";
export async function notify(io, { userId, type, title, message, orderId }) {
  const notification = await Notification.create({ userId, type, title, message, orderId });
  io?.to(`user:${userId}`).emit("notification:new", notification);
  return notification;
}
