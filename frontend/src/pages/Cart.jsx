import React from "react";
import { Link } from "react-router-dom";
import {
  FaTrash,
  FaMinus,
  FaPlus,
  FaShieldAlt,
  FaArrowRight,
} from "react-icons/fa";

export default function Cart({
  cartItems,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
}) {
  // Calculate cart values
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const delivery = cartItems.length ? 40 : 0;
  const tax = subtotal * 0.05;
  const total = subtotal + delivery + tax;

  // Show empty cart
  if (!cartItems.length) {
    return (
      <section className="fg-page">
        <div className="fg-empty-card">
          <div className="fg-empty-icon">🛍️</div>

          <span className="fg-section-kicker">
            YOUR BAG IS WAITING
          </span>

          <h1>Nothing here yet.</h1>

          <p>
            Explore restaurants and add something delicious.
          </p>

          <Link
            to="/restaurants"
            className="fg-btn fg-btn-primary"
          >
            Browse restaurants <FaArrowRight />
          </Link>
        </div>
      </section>
    );
  }

  // Show cart with items
  return (
    <section className="fg-page">
      <div className="fg-shell">

        {/* Page heading */}
        <div className="fg-page-title">
          <span className="fg-section-kicker">
            YOUR ORDER
          </span>

          <h1>Your FoodGo cart</h1>

          <p>
            {cartItems.reduce(
              (sum, item) => sum + item.quantity,
              0
            )}{" "}
            items ready for checkout.
          </p>
        </div>

        <div className="fg-cart-layout">

          {/* Cart items */}
          <div className="fg-cart-list">
            {cartItems.map((item) => (
              <article
                className="fg-cart-item"
                key={item.id}
              >
                <img
                  src={item.image}
                  alt={item.name}
                />

                <div>
                  <span className="fg-veg-label">
                    {item.veg ? "VEG" : "NON-VEG"}
                  </span>

                  <h3>{item.name}</h3>

                  <p>{item.description}</p>

                  <strong>₹{item.price}</strong>
                </div>

                {/* Quantity controls */}
                <div className="fg-qty">
                  <button
                    type="button"
                    onClick={() =>
                      decreaseQuantity(item.id)
                    }
                  >
                    <FaMinus />
                  </button>

                  <b>{item.quantity}</b>

                  <button
                    type="button"
                    onClick={() =>
                      increaseQuantity(item.id)
                    }
                  >
                    <FaPlus />
                  </button>
                </div>

                {/* Item total and delete */}
                <div className="fg-cart-total">
                  ₹{item.price * item.quantity}

                  <button
                    type="button"
                    onClick={() =>
                      removeFromCart(item.id)
                    }
                    aria-label={`Remove ${item.name}`}
                  >
                    <FaTrash />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Order summary */}
          <aside className="fg-summary">
            <span className="fg-section-kicker">
              PRICE DETAILS
            </span>

            <h2>Order summary</h2>

            <div>
              <span>Subtotal</span>
              <b>₹{subtotal.toFixed(0)}</b>
            </div>

            <div>
              <span>Delivery</span>
              <b>
                {delivery ? "₹40" : "Free"}
              </b>
            </div>

            <div>
              <span>Taxes & fees</span>
              <b>₹{tax.toFixed(0)}</b>
            </div>

            <hr />

            <div className="summary-total">
              <span>Total</span>
              <b>₹{total.toFixed(0)}</b>
            </div>

            <div className="summary-safe">
              <FaShieldAlt />
              Secure checkout
            </div>

            <Link
              to="/checkout"
              className="fg-btn fg-btn-primary"
            >
              Proceed to checkout <FaArrowRight />
            </Link>
          </aside>

        </div>
      </div>
    </section>
  );
}