import crypto from "node:crypto";
import Razorpay from "razorpay";

import { env } from "../config/env.js";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { Restaurant } from "../models/Restaurant.js";
import { User } from "../models/User.js";

import {
  sendOrderConfirmationEmail,
} from "../services/email.service.js";

import {
  ok,
  fail,
} from "../utils/response.js";


// ============================================================
// CREATE PAYMENT ORDER
// ============================================================

export async function createPaymentOrder(req, res) {
  try {
    // Check Razorpay configuration
    if (
      !env.razorpayKeyId ||
      !env.razorpayKeySecret
    ) {
      return fail(
        res,
        "Online payment is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env.",
        503
      );
    }

    console.log(
      "Razorpay Key ID:",
      env.razorpayKeyId
    );

    console.log(
      "Razorpay Secret Loaded:",
      Boolean(env.razorpayKeySecret)
    );

    // Validate order ID
    const { orderId } = req.body;

    if (!orderId) {
      return fail(
        res,
        "Order ID is required",
        400
      );
    }

    // Find FoodGo order
    const order = await Order.findOne({
      _id: orderId,
      customerId: req.user._id,

      status: {
        $nin: [
          "CANCELLED",
          "REJECTED",
          "REFUNDED",
          "DELIVERED",
        ],
      },
    });

    if (!order) {
      return fail(
        res,
        "Order not found",
        404
      );
    }

    // Check already paid
    if (
      order.paymentStatus === "PAID"
    ) {
      return fail(
        res,
        "This order is already paid",
        409
      );
    }

    // Validate amount
    const totalAmount = Number(
      order?.pricing?.total
    );

    if (
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0
    ) {
      return fail(
        res,
        "Invalid order amount",
        400
      );
    }

    // Create Razorpay instance
    const razorpay = new Razorpay({
      key_id:
        env.razorpayKeyId,

      key_secret:
        env.razorpayKeySecret,
    });

    // Create Razorpay order
    let razorpayOrder;

    try {
      razorpayOrder =
        await razorpay.orders.create({
          amount:
            Math.round(
              totalAmount * 100
            ),

          currency:
            "INR",

          receipt:
            order._id.toString(),

          notes: {
            foodgoOrderId:
              order._id.toString(),

            customerId:
              req.user._id.toString(),
          },
        });

    } catch (error) {
      console.error(
        "RAZORPAY ORDER CREATION ERROR:",
        {
          statusCode:
            error?.statusCode,

          code:
            error?.error?.code,

          description:
            error?.error?.description,

          message:
            error?.message,
        }
      );

      return fail(
        res,
        error?.error?.description ||
          "Failed to create Razorpay order",
        error?.statusCode || 500
      );
    }

    // Save payment
    await Payment.findOneAndUpdate(
      {
        orderId:
          order._id,
      },

      {
        orderId:
          order._id,

        userId:
          req.user._id,

        provider:
          "razorpay",

        providerOrderId:
          razorpayOrder.id,

        amount:
          totalAmount,

        currency:
          "INR",

        status:
          "CREATED",

        signatureVerified:
          false,
      },

      {
        upsert:
          true,

        new:
          true,

        setDefaultsOnInsert:
          true,
      }
    );

    // Update FoodGo order
    order.razorpayOrderId =
      razorpayOrder.id;

    order.paymentStatus =
      "PENDING";

    await order.save();

    // Return to frontend
    return ok(
      res,
      {
        keyId:
          env.razorpayKeyId,

        razorpayOrder:
          razorpayOrder,

        orderId:
          order._id,

        amount:
          totalAmount,

        currency:
          "INR",
      },

      "Razorpay order created successfully"
    );

  } catch (error) {
    console.error(
      "CREATE PAYMENT ORDER ERROR:",
      error
    );

    return fail(
      res,
      "Internal server error while creating payment order",
      500
    );
  }
}


// ============================================================
// VERIFY PAYMENT
// ============================================================

export async function verifyPayment(req, res) {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // Check Razorpay secret
    if (!env.razorpayKeySecret) {
      return fail(
        res,
        "Online payment is not configured",
        503
      );
    }

    // Validate payment details
    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return fail(
        res,
        "Incomplete payment verification details",
        400
      );
    }

    // Find FoodGo order
    const order =
      await Order.findOne({
        _id:
          orderId,

        customerId:
          req.user._id,
      });

    if (!order) {
      return fail(
        res,
        "Order not found",
        404
      );
    }

    // Check Razorpay order ID
    if (
      order.razorpayOrderId !==
      razorpay_order_id
    ) {
      return fail(
        res,
        "Payment order does not match this FoodGo order",
        400
      );
    }

    // Generate signature
    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          env.razorpayKeySecret
        )
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex");

    // Compare signatures safely
    const expectedBuffer =
      Buffer.from(
        expectedSignature,
        "utf8"
      );

    const receivedBuffer =
      Buffer.from(
        razorpay_signature,
        "utf8"
      );

    let signatureMatched = false;

    if (
      expectedBuffer.length ===
      receivedBuffer.length
    ) {
      signatureMatched =
        crypto.timingSafeEqual(
          expectedBuffer,
          receivedBuffer
        );
    }

    // Signature failed
    if (!signatureMatched) {
      await Payment.findOneAndUpdate(
        {
          orderId:
            order._id,
        },

        {
          status:
            "FAILED",

          signatureVerified:
            false,
        }
      );

      order.paymentStatus =
        "FAILED";

      await order.save();

      return fail(
        res,
        "Payment signature verification failed",
        400
      );
    }

    // Payment successful
    order.paymentStatus =
      "PAID";

    order.paymentId =
      razorpay_payment_id;

    await order.save();

    // Update Payment collection
    await Payment.findOneAndUpdate(
      {
        orderId:
          order._id,
      },

      {
        provider:
          "razorpay",

        providerOrderId:
          razorpay_order_id,

        providerPaymentId:
          razorpay_payment_id,

        status:
          "PAID",

        signatureVerified:
          true,
      },

      {
        upsert:
          true,

        new:
          true,
      }
    );

    // Send confirmation email
    let confirmationEmailSent =
      Boolean(
        order.orderConfirmationEmailSent
      );

    let confirmationEmailReason =
      confirmationEmailSent
        ? "already-sent"
        : "not-sent";

    if (
      !confirmationEmailSent
    ) {
      try {
        const [
          customer,
          restaurant,
        ] = await Promise.all([
          User.findById(
            req.user._id
          ).select(
            "name email"
          ),

          Restaurant.findById(
            order.restaurantId
          ).select(
            "name deliveryTime"
          ),
        ]);

        if (
          customer?.email
        ) {
          const result =
            await sendOrderConfirmationEmail({
              to:
                customer.email,

              name:
                customer.name,

              order,

              restaurant,

              paymentMethod:
                "online",
            });

          confirmationEmailSent =
            !result?.skipped;

          confirmationEmailReason =
            result?.skipped
              ? (
                  result.reason ||
                  "email-skipped"
                )
              : "sent";

          if (
            confirmationEmailSent
          ) {
            order.orderConfirmationEmailSent =
              true;

            await order.save();
          }
        } else {
          confirmationEmailReason =
            "customer-email-not-found";
        }

      } catch (error) {
        console.error(
          "ONLINE ORDER CONFIRMATION EMAIL FAILED:",
          error.message
        );

        confirmationEmailReason =
          "email-error";
      }
    }

    // Return successful response
    return ok(
      res,
      {
        paid:
          true,

        confirmationEmailSent:
          Boolean(
            confirmationEmailSent
          ),

        confirmationEmailReason,

        orderConfirmationEmailSent:
          Boolean(
            order.orderConfirmationEmailSent
          ),

        order: {
          ...order.toObject(),

          confirmationEmailSent:
            Boolean(
              confirmationEmailSent
            ),
        },
      },

      "Payment verified"
    );

  } catch (error) {
    console.error(
      "VERIFY PAYMENT ERROR:",
      error
    );

    return fail(
      res,
      "Internal server error while verifying payment",
      500
    );
  }
}


// ============================================================
// FAIL PAYMENT
// ============================================================

export async function failPayment(req, res) {
  try {
    const { orderId } =
      req.body;

    // Validate order ID
    if (!orderId) {
      return fail(
        res,
        "Order ID is required",
        400
      );
    }

    // Find order
    const order =
      await Order.findOne({
        _id:
          orderId,

        customerId:
          req.user._id,
      });

    if (!order) {
      return fail(
        res,
        "Order not found",
        404
      );
    }

    // Already paid
    if (
      order.paymentStatus ===
      "PAID"
    ) {
      return ok(
        res,
        {
          failed:
            false,

          paid:
            true,
        },

        "Payment is already complete"
      );
    }

    // Update order
    order.paymentStatus =
      "FAILED";

    await order.save();

    // Update payment
    await Payment.findOneAndUpdate(
      {
        orderId:
          order._id,

        provider:
          "razorpay",
      },

      {
        status:
          "FAILED",
      }
    );

    return ok(
      res,
      {
        failed:
          true,
      },

      "Payment marked as failed"
    );

  } catch (error) {
    console.error(
      "FAIL PAYMENT ERROR:",
      error
    );

    return fail(
      res,
      "Internal server error while marking payment as failed",
      500
    );
  }
}