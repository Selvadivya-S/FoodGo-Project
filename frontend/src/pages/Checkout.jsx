import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaMapMarkerAlt,
  FaCreditCard,
  FaMoneyBillWave,
  FaShieldAlt,
  FaArrowRight,
  FaEnvelope,
  FaCheckCircle,
} from "react-icons/fa";

import {
  createOrder,
  createPaymentOrder,
  verifyPayment,
  failPayment,
} from "../api/foodApi";

import {
  getCurrentUser,
  ROLE_DASHBOARD_PATHS,
} from "../auth";

// Load Razorpay checkout script
function loadRazorpay() {
  return new Promise((resolve, reject) => {
    // Razorpay is already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    // Check if Razorpay script is already being loaded
    const existing = document.querySelector(
      'script[data-razorpay="true"]'
    );

    if (existing) {
      existing.addEventListener(
        "load",
        () => resolve(true),
        { once: true }
      );

      existing.addEventListener(
        "error",
        () =>
          reject(
            new Error(
              "Unable to load the Razorpay checkout."
            )
          ),
        { once: true }
      );

      return;
    }

    // Create Razorpay script dynamically
    const script = document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;
    script.dataset.razorpay = "true";

    script.onload = () => resolve(true);

    script.onerror = () =>
      reject(
        new Error(
          "Unable to load the Razorpay checkout. " +
            "Check your internet connection and try again."
        )
      );

    document.body.appendChild(script);
  });
}

export default function Checkout({
  cartItems,
  clearCart,
}) {
  const navigate = useNavigate();

  const [payment, setPayment] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "Chennai",
    pincode: "",
  });

  // Calculate subtotal
  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) =>
          sum +
          Number(item.price) *
            Number(item.quantity || 1),
        0
      ),
    [cartItems]
  );

  // Restaurant delivery settings
  const restaurantDeliveryFee = Number(
    cartItems[0]?.restaurantDeliveryFee
  );

  const restaurantFreeDelivery =
    cartItems[0]?.restaurantFreeDelivery === true;

  const delivery = cartItems.length
    ? restaurantFreeDelivery
      ? 0
      : Number.isFinite(restaurantDeliveryFee)
        ? restaurantDeliveryFee
        : 40
    : 0;

  // 5% tax
  const tax = subtotal * 0.05;

  // Final total
  const total = subtotal + delivery + tax;

  // Get unique restaurant IDs
  const restaurantIds = [
    ...new Set(
      cartItems.map((item) =>
        String(
          item.restaurantId?._id ||
            item.restaurantId ||
            ""
        )
      )
    ),
  ].filter(Boolean);

  const currentUser = getCurrentUser();

  // Update form fields
  const setField = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // Finish order
  const finishOrder = (
    order,
    message,
    emailSent = false
  ) => {
    clearCart();

    setSuccessMessage(message);

    navigate(
      `/track-order/${order._id || order.id}`,
      {
        state: {
          order,
          emailSent,
        },
      }
    );
  };

  // Online payment
  const payOnline = async (order) => {
    await loadRazorpay();

    const paymentData =
      await createPaymentOrder(
        order._id || order.id
      );

    const razorpayOrder =
      paymentData.razorpayOrder;

    if (
      !razorpayOrder?.id ||
      !paymentData.keyId
    ) {
      throw new Error(
        "Online payment could not be initialized."
      );
    }

    await new Promise((resolve, reject) => {
      let settled = false;

      const succeed = (value) => {
        if (settled) return;

        settled = true;
        resolve(value);
      };

      const fail = (reason) => {
        if (settled) return;

        settled = true;

        reject(
          reason instanceof Error
            ? reason
            : new Error(
                String(
                  reason ||
                    "Payment was not completed."
                )
              )
        );
      };

      const options = {
        key: paymentData.keyId,

        amount: razorpayOrder.amount,

        currency:
          razorpayOrder.currency || "INR",

        name: "FoodGo",

        description: `FoodGo order #${String(
          order._id || order.id
        )
          .slice(-8)
          .toUpperCase()}`,

        order_id: razorpayOrder.id,

        prefill: {
          name:
            currentUser?.name ||
            `${form.firstName} ${form.lastName}`.trim(),

          email: currentUser?.email || "",

          contact:
            form.phone ||
            currentUser?.phone ||
            "",
        },

        notes: {
          foodgo_order_id: String(
            order._id || order.id
          ),
        },

        theme: {
          color: "#ff5a1f",
        },

        // Payment successful
        handler: async (response) => {
          try {
            const verification =
              await verifyPayment({
                orderId:
                  order._id || order.id,

                razorpay_order_id:
                  response.razorpay_order_id,

                razorpay_payment_id:
                  response.razorpay_payment_id,

                razorpay_signature:
                  response.razorpay_signature,
              });

            succeed(verification);
          } catch (verificationError) {
            fail(
              new Error(
                verificationError.response?.data
                  ?.message ||
                  "Payment succeeded but FoodGo " +
                    "could not verify it. Please " +
                    "contact support with your payment ID."
              )
            );
          }
        },

        // Payment window closed
        modal: {
          ondismiss: async () => {
            try {
              await failPayment(
                order._id || order.id
              );
            } catch {
              // Order remains available for retry
            }

            fail(
              new Error(
                "Online payment was cancelled. " +
                  "Your cart is still saved so you " +
                  "can try again."
              )
            );
          },
        },
      };

      const checkout =
        new window.Razorpay(options);

      // Razorpay payment failed
      checkout.on(
        "payment.failed",
        async (response) => {
          try {
            await failPayment(
              order._id || order.id
            );
          } catch {
            // Keep original payment error
          }

          fail(
            new Error(
              response.error?.description ||
                "Online payment failed. Please try again."
            )
          );
        }
      );

      checkout.open();
    });
  };

  // Submit checkout form
  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccessMessage("");

    // Check login
    if (!currentUser?.loggedIn) {
      navigate("/login", {
        state: {
          from: "/checkout",
        },
      });

      return;
    }

    // Only customers can order
    if (currentUser.role !== "customer") {
      setError(
        "Only customer accounts can place food orders. " +
          "Restaurant, delivery and admin accounts " +
          "must use their own dashboards."
      );

      return;
    }

    // Only one restaurant per order
    if (restaurantIds.length !== 1) {
      setError(
        "Please order from one restaurant at a time."
      );

      return;
    }

    setLoading(true);

    try {
      // Create order in backend
      const order = await createOrder({
        restaurantId: restaurantIds[0],

        items: cartItems.map((item) => ({
          menuItemId:
            item._id || item.id,

          quantity: item.quantity,
        })),

        paymentMethod: payment,

        deliveryAddress: form,
      });

      // Online payment
      if (payment === "online") {
        const verification =
          await payOnline(order);

        const verificationData =
          verification?.data ??
          verification ??
          {};

        const emailSent = Boolean(
          verificationData.confirmationEmailSent ??
            verificationData.order
              ?.confirmationEmailSent ??
            order.confirmationEmailSent
        );

        const paidOrder = {
          ...order,
          paymentStatus: "PAID",
          orderConfirmationEmailSent:
            emailSent,
          confirmationEmailSent:
            emailSent,
        };

        finishOrder(
          paidOrder,

          emailSent
            ? `Payment successful. A confirmation email was sent to ${currentUser.email}.`
            : "Payment successful. Your order is confirmed, " +
              "but the confirmation email could not be sent. " +
              "Check the backend SMTP settings.",

          emailSent
        );
      }

      // Cash on Delivery
      else {
        const emailSent = Boolean(
          order?.confirmationEmailSent ??
            order?.orderConfirmationEmailSent
        );

        finishOrder(
          {
            ...order,
            confirmationEmailSent:
              emailSent,
          },

          emailSent
            ? `Order placed successfully. A confirmation email was sent to ${currentUser.email}.`
            : "Order placed successfully, but the confirmation " +
              "email could not be sent. Check the backend SMTP settings.",

          emailSent
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to place your order."
      );
    } finally {
      setLoading(false);
    }
  };

  // Empty cart
  if (!cartItems.length) {
    return (
      <section className="fg-page">
        <div className="fg-empty-card">
          <h2>Your cart is empty</h2>

          <Link
            to="/restaurants"
            className="fg-btn fg-btn-primary"
          >
            Browse food
          </Link>
        </div>
      </section>
    );
  }

  // Block non-customer accounts
  if (
    currentUser?.loggedIn &&
    currentUser.role !== "customer"
  ) {
    return (
      <section className="fg-page">
        <div className="fg-shell">
          <div className="fg-empty-card">

            <span className="fg-section-kicker">
              CUSTOMER CHECKOUT
            </span>

            <h2>
              You're signed in as a{" "}
              {currentUser.role ===
              "restaurant_owner"
                ? "restaurant partner"
                : currentUser.role ===
                  "delivery_partner"
                  ? "delivery partner"
                  : "administrator"}
              .
            </h2>

            <p>
              Only customer accounts can place food
              orders. Please sign out and sign in
              with a customer account to continue
              checkout.
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                to={
                  ROLE_DASHBOARD_PATHS[
                    currentUser.role
                  ] || "/"
                }
                className="fg-btn fg-btn-secondary"
              >
                Open your dashboard
              </Link>

              <Link
                to="/login"
                state={{
                  from: "/checkout",
                }}
                className="fg-btn fg-btn-primary"
              >
                Sign in as customer
              </Link>
            </div>

          </div>
        </div>
      </section>
    );
  }

  // Main checkout page
  return (
    <section className="fg-page">
      <div className="fg-shell">

        {/* Page heading */}
        <div className="fg-page-title">
          <span className="fg-section-kicker">
            SECURE CHECKOUT
          </span>

          <h1>Complete your order</h1>

          <p>
            Your order is saved in MongoDB and your
            confirmation is sent to your registered
            FoodGo email address after successful
            checkout.
          </p>
        </div>

        <form
          className="fg-checkout-layout"
          onSubmit={submit}
        >
          <div>

            {/* Delivery details */}
            <div className="fg-form-card">
              <h2>
                <FaMapMarkerAlt />
                Delivery details
              </h2>

              <div className="fg-form-grid">

                <label>
                  First name

                  <input
                    required
                    value={form.firstName}
                    onChange={(e) =>
                      setField(
                        "firstName",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Last name

                  <input
                    required
                    value={form.lastName}
                    onChange={(e) =>
                      setField(
                        "lastName",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label className="wide">
                  Phone

                  <input
                    required
                    value={form.phone}
                    onChange={(e) =>
                      setField(
                        "phone",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label className="wide">
                  Address

                  <textarea
                    required
                    rows="3"
                    value={form.address}
                    onChange={(e) =>
                      setField(
                        "address",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  City

                  <input
                    required
                    value={form.city}
                    onChange={(e) =>
                      setField(
                        "city",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  PIN code

                  <input
                    required
                    value={form.pincode}
                    onChange={(e) =>
                      setField(
                        "pincode",
                        e.target.value
                      )
                    }
                  />
                </label>

              </div>
            </div>

            {/* Payment method */}
            <div className="fg-form-card">
              <h2>Payment method</h2>

              {/* COD */}
              <label
                className={`payment-card ${
                  payment === "cod"
                    ? "selected"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={payment === "cod"}
                  onChange={() =>
                    setPayment("cod")
                  }
                />

                <FaMoneyBillWave />

                <span>
                  <b>Cash on Delivery</b>

                  <small>
                    Pay the delivery partner when
                    your food arrives.
                  </small>
                </span>

                {payment === "cod" && (
                  <FaCheckCircle className="payment-selected-icon" />
                )}
              </label>

              {/* Online payment */}
              <label
                className={`payment-card ${
                  payment === "online"
                    ? "selected"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={payment === "online"}
                  onChange={() =>
                    setPayment("online")
                  }
                />

                <FaCreditCard />

                <span>
                  <b>Online Payment</b>

                  <small>
                    Pay securely with Razorpay using
                    UPI, card, net banking or wallet.
                  </small>
                </span>

                {payment === "online" && (
                  <FaCheckCircle className="payment-selected-icon" />
                )}
              </label>

              {/* Email information */}
              <div className="checkout-email-note">
                <FaEnvelope />

                <span>
                  Confirmation email will be sent to{" "}
                  <strong>
                    {currentUser?.email}
                  </strong>
                  .
                </span>
              </div>

              {/* Messages */}
              {successMessage && (
                <div className="fg-inline-success">
                  {successMessage}
                </div>
              )}

              {error && (
                <div className="fg-inline-error">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                disabled={loading}
                className="fg-btn fg-btn-primary checkout-submit"
                type="submit"
              >
                {loading
                  ? payment === "online"
                    ? "Opening secure payment…"
                    : "Placing order…"
                  : payment === "online"
                    ? `Pay online · ₹${total.toFixed(0)}`
                    : `Place COD order · ₹${total.toFixed(0)}`}

                <FaArrowRight />
              </button>
            </div>
          </div>

          {/* Order summary */}
          <aside className="fg-summary">
            <span className="fg-section-kicker">
              YOUR FOOD
            </span>

            <h2>Order summary</h2>

            {cartItems.map((item) => (
              <div
                className="checkout-line"
                key={item._id || item.id}
              >
                <span>
                  {item.name} × {item.quantity}
                </span>

                <b>
                  ₹
                  {(
                    item.price * item.quantity
                  ).toFixed(0)}
                </b>
              </div>
            ))}

            <hr />

            <div>
              <span>Subtotal</span>
              <b>
                ₹{subtotal.toFixed(0)}
              </b>
            </div>

            <div>
              <span>
                Delivery{" "}
                {restaurantFreeDelivery
                  ? "(Free)"
                  : "fee"}
              </span>

              <b>
                ₹{delivery.toFixed(0)}
              </b>
            </div>

            <div>
              <span>Taxes</span>

              <b>
                ₹{tax.toFixed(0)}
              </b>
            </div>

            <hr />

            <div className="summary-total">
              <span>Total</span>

              <b>
                ₹{total.toFixed(0)}
              </b>
            </div>

            <div className="summary-safe">
              <FaShieldAlt />

              Secure checkout with server-side
              price validation
            </div>
          </aside>
        </form>
      </div>
    </section>
  );
}