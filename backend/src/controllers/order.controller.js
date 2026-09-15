import { Order } from "../models/Order.js";
import { MenuItem } from "../models/MenuItem.js";
import { Restaurant } from "../models/Restaurant.js";
import { Delivery } from "../models/Delivery.js";
import { ok, fail } from "../utils/response.js";
import { PlatformSetting } from "../models/PlatformSetting.js";
import { Payment } from "../models/Payment.js";
import { scheduleDeliveryMessage, scheduleDeliveredEmail, scheduleDemoDelivery } from "../services/order-automation.service.js";
import { sendOrderConfirmationEmail } from "../services/email.service.js";
import { User } from "../models/User.js";
export async function createOrder(req, res) {
  const { restaurantId, items = [], deliveryAddress = {}, paymentMethod = "cod" } = req.body;

  if (!["cod", "online"].includes(paymentMethod)) {
    return fail(res, "Invalid payment method", 400);
  }
  if (!restaurantId || !items.length) {
    return fail(res, "Restaurant and at least one dish are required", 400);
  }

  const restaurant = await Restaurant.findOne({ _id: restaurantId, isApproved: true });
  if (!restaurant) return fail(res, "Restaurant not found", 404);

  const ids = items.map((x) => x.menuItemId || x.id);
  const menuItems = await MenuItem.find({
    _id: { $in: ids },
    restaurantId,
    isAvailable: true
  });
  const byId = new Map(menuItems.map((x) => [String(x._id), x]));
  const normalized = [];

  for (const input of items) {
    const item = byId.get(String(input.menuItemId || input.id));
    const quantity = Math.max(1, Number(input.quantity || 1));
    if (!item) return fail(res, "One or more dishes are no longer available", 400);
    normalized.push({
      menuItemId: item._id,
      name: item.name,
      quantity,
      price: item.price
    });
  }

  const subtotal = normalized.reduce((sum, x) => sum + x.price * x.quantity, 0);
  const deliverySetting = await PlatformSetting.findOne({ key: "deliveryBaseFee" }).lean();
  const configuredDeliveryFee = Number(deliverySetting?.value ?? 40);
  const restaurantFee = Number(restaurant.deliveryFee);
  const deliveryFee = restaurant.freeDelivery === true
    ? 0
    : (Number.isFinite(restaurantFee) && restaurantFee >= 0 ? restaurantFee : configuredDeliveryFee);
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + deliveryFee + tax;

  const estimatedDeliveryTime = new Date(
    Date.now() + Number(restaurant.deliveryTime || 30) * 60 * 1000
  );

  const order = await Order.create({
    customerId: req.user._id,
    restaurantId,
    items: normalized,
    pricing: { subtotal, deliveryFee, tax, discount: 0, total },
    deliveryAddress,
    paymentStatus: "PENDING",
    estimatedDeliveryTime,
    status: "PLACED",
  });

  await Payment.create({
    orderId: order._id,
    userId: req.user._id,
    provider: paymentMethod === "cod" ? "cash_on_delivery" : "razorpay",
    amount: total,
    currency: "INR",
    status: paymentMethod === "cod" ? "PENDING" : "CREATED",
  });

  await Delivery.create({
    orderId: order._id,
    status: "UNASSIGNED",
    pickupLocation: {
      restaurantId: restaurant._id,
      coordinates: restaurant.location?.coordinates
    },
    dropLocation: deliveryAddress,
    estimatedMinutes: restaurant.deliveryTime || 30,
  });

  let confirmationEmailSent = false;
  let confirmationEmailReason = "not-applicable";

  // COD orders are complete at checkout, so send the confirmation after
  // the order, payment and delivery records have all been created.
  // Online orders send the confirmation only after Razorpay verification.
  if (paymentMethod === "cod") {
    const customer = await User.findById(req.user._id).select("name email");
    if (customer?.email) {
      try {
        const result = await sendOrderConfirmationEmail({
          to: customer.email,
          name: customer.name,
          order,
          restaurant,
          paymentMethod
        });
        confirmationEmailSent = !result?.skipped;
        confirmationEmailReason = result?.skipped ? (result.reason || "email-skipped") : "sent";

        if (confirmationEmailSent) {
          order.orderConfirmationEmailSent = true;
          await order.save();
        }
      } catch (error) {
        console.error("Order confirmation email failed:", error.message);
      }
    } else {
      confirmationEmailReason = "registered-customer-email-missing";
    }
  }

  const io = req.app.get("io");
  scheduleDeliveryMessage(order._id, order.createdAt, io);
  scheduleDemoDelivery(order._id, io);
  io?.to(`user:${req.user._id}`).emit("order:created", order);
  io?.to(`restaurant:${restaurantId}`).emit("order:created", order);

  return ok(
    res,
    { ...order.toObject(), confirmationEmailSent, confirmationEmailReason },
    "Order placed",
    201
  );
}

export async function customerOrders(req, res) {
  const orders = await Order.find({ customerId: req.user._id })
    .populate("restaurantId", "name images")
    .sort({ createdAt: -1 }).limit(100);
  return ok(res, orders);
}
export async function getOrder(req, res) {
  const filter = req.user.role === "customer"
    ? { _id: req.params.id, customerId: req.user._id }
    : req.user.role === "restaurant_owner"
      ? { _id: req.params.id, restaurantId: { $in: await Restaurant.find({ ownerId: req.user._id }).distinct("_id") } }
      : { _id: req.params.id };
  const order = await Order.findOne(filter).populate("restaurantId", "name images");
  if (!order) return fail(res, "Order not found", 404);
  return ok(res, order);
}
export async function updateOrderStatus(req, res) {
  const allowed = ["CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REJECTED"];
  if (!allowed.includes(req.body.status)) return fail(res, "Invalid order status", 400);
  const order = await Order.findById(req.params.id);
  if (!order) return fail(res, "Order not found", 404);
  if (req.user.role === "customer") return fail(res, "Customers cannot change order status", 403);
  if (req.user.role === "restaurant_owner") {
    const owned = await Restaurant.exists({ _id: order.restaurantId, ownerId: req.user._id });
    if (!owned) return fail(res, "Not authorized", 403);
    if (!["CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "CANCELLED", "REJECTED"].includes(req.body.status)) return fail(res, "Restaurant cannot set that status", 403);
  }
  if (req.user.role === "delivery_partner") {
    if (String(order.deliveryPartnerId) !== String(req.user._id)) return fail(res, "Not assigned to you", 403);
    if (!["PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(req.body.status)) return fail(res, "Invalid delivery status", 403);
  }
  order.status = req.body.status;
  if (req.user.role === "delivery_partner" && req.body.status === "DELIVERED") order.paymentStatus = order.paymentStatus === "PENDING" ? "PENDING" : order.paymentStatus;
  await order.save();
  await Delivery.findOneAndUpdate({ orderId: order._id }, { status: req.body.status === "PICKED_UP" ? "PICKED_UP" : req.body.status === "OUT_FOR_DELIVERY" ? "OUT_FOR_DELIVERY" : req.body.status === "DELIVERED" ? "DELIVERED" : "ASSIGNED", ...(req.body.status === "DELIVERED" ? { deliveredAt: new Date() } : {}) });
  if (req.body.status === "DELIVERED") {
    const deliveredAt = new Date();
    order.deliveredAt = deliveredAt;
    await order.save();
    scheduleDeliveredEmail(order._id, deliveredAt);
    await Payment.findOneAndUpdate(
      { orderId: order._id, provider: "cash_on_delivery" },
      { status: "PAID" }
    );
    await Order.findByIdAndUpdate(order._id, { paymentStatus: "PAID" });
  }
  req.app.get("io")?.to(`order:${order._id}`).emit("order:status", order);
  return ok(res, order, "Order status updated");
}
