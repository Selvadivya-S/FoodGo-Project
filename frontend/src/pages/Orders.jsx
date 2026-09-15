import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaMotorcycle,
  FaCheck,
  FaClock,
  FaChevronRight,
} from "react-icons/fa";

import { getMyOrders } from "../api/foodApi";

const labels = {
  PLACED: "Order placed",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for pickup",
  PICKED_UP: "Picked up",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyOrders()
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        setError(
          e.response?.data?.message ||
            "Please sign in to view your orders."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <section className="fg-page">
      <div className="fg-shell">
        {/* Page Header */}
        <div className="fg-page-title">
          <span className="fg-section-kicker">ACCOUNT</span>

          <h1>Your orders</h1>

          <p>
            Every order is loaded from MongoDB.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="fg-empty-inline">
            Loading orders…
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="fg-empty-card">
            <h2>{error}</h2>

            <Link
              to="/login"
              className="fg-btn fg-btn-primary"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* No Orders */}
        {!loading && !error && !orders.length && (
          <div className="fg-empty-card">
            <h2>No orders yet</h2>

            <p>
              Your completed checkout orders will appear here.
            </p>

            <Link
              to="/restaurants"
              className="fg-btn fg-btn-primary"
            >
              Order food
            </Link>
          </div>
        )}

        {/* Orders List */}
        <div className="orders-modern">
          {orders.map((order) => {
            const id = order._id;

            const restaurant =
              order.restaurantId?.name ||
              "FoodGo Restaurant";

            const image =
              order.restaurantId?.images?.[0] ||
              "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80";

            const delivered =
              order.status === "DELIVERED";

            return (
              <article
                className="order-modern"
                key={id}
              >
                {/* Restaurant Image */}
                <img
                  src={image}
                  alt={restaurant}
                />

                {/* Order Information */}
                <div className="order-main">
                  <span>
                    ORDER #
                    {String(id)
                      .slice(-8)
                      .toUpperCase()}
                  </span>

                  <h3>{restaurant}</h3>

                  <p>
                    {new Date(
                      order.createdAt
                    ).toLocaleString()}
                  </p>

                  {/* Order Progress */}
                  <div className="order-progress">
                    <i className="done">
                      <FaCheck />
                    </i>

                    <span className="done" />

                    <i
                      className={
                        delivered
                          ? "done"
                          : "current"
                      }
                    >
                      {delivered ? (
                        <FaCheck />
                      ) : (
                        <FaMotorcycle />
                      )}
                    </i>

                    <span />

                    <i>
                      {delivered ? (
                        <FaCheck />
                      ) : (
                        <FaClock />
                      )}
                    </i>
                  </div>

                  {/* Current Status */}
                  <small>
                    {labels[order.status] ||
                      order.status}
                  </small>
                </div>

                {/* Order Summary */}
                <div className="order-side">
                  <b>
                    ₹
                    {Number(
                      order.pricing?.total || 0
                    ).toFixed(0)}
                  </b>

                  <span
                    className={
                      delivered
                        ? "status delivered"
                        : "status active"
                    }
                  >
                    {labels[order.status] ||
                      order.status}
                  </span>

                  {/* Track Order */}
                  <Link
                    to={`/track-order/${id}`}
                  >
                    Track order
                    <FaChevronRight />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}