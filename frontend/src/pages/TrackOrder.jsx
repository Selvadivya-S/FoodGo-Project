import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { io } from "socket.io-client";

import {
  FaMotorcycle,
  FaCheck,
  FaMapMarkerAlt,
  FaArrowLeft,
  FaBell,
} from "react-icons/fa";

import { getOrder } from "../api/foodApi";
import GoogleMap from "../components/GoogleMap";

const steps = [
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const apiBase =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const socketUrl = apiBase.replace(/\/api\/?$/, "");

export default function TrackOrder() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    // Load order from backend
    const loadOrder = () => {
      getOrder(id)
        .then((data) => {
          if (!cancelled) {
            setOrder(data);
          }
        })
        .catch((e) => {
          if (!cancelled) {
            setError(
              e.response?.data?.message ||
                "Order not found."
            );
          }
        });
    };

    // Initial order load
    loadOrder();

    // Refresh order every 10 seconds
    const timer = setInterval(loadOrder, 10000);

    // Connect to Socket.IO server
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
    });

    // Join the specific order room
    socket.on("connect", () => {
      socket.emit("join:order", id);
    });

    // Listen for order status changes
    socket.on("order:status", (updated) => {
      if (!cancelled) {
        setOrder((current) =>
          current
            ? { ...current, ...updated }
            : updated
        );
      }
    });

    // Listen for delivery messages
    socket.on(
      "order:delivery-message",
      (payload) => {
        if (
          !cancelled &&
          String(payload?.orderId) === String(id)
        ) {
          setOrder((current) =>
            current
              ? {
                  ...current,
                  deliveryMessage:
                    payload.message,

                  deliveryMessageAt:
                    payload.createdAt ||
                    new Date().toISOString(),

                  deliveryMessageSent: true,
                }
              : current
          );
        }
      }
    );

    // Cleanup
    return () => {
      cancelled = true;
      clearInterval(timer);
      socket.disconnect();
    };
  }, [id]);

  // Error screen
  if (error) {
    return (
      <section className="fg-page">
        <div className="fg-empty-card">
          <h2>{error}</h2>

          <Link to="/orders">
            Back to orders
          </Link>
        </div>
      </section>
    );
  }

  // Loading screen
  if (!order) {
    return (
      <section className="fg-page">
        <div className="fg-empty-card">
          <h2>Loading order…</h2>
        </div>
      </section>
    );
  }

  // Find current order step
  const current = steps.indexOf(order.status);

  // Restaurant information
  const restaurant = order.restaurantId;

  // GeoJSON coordinates:
  // [longitude, latitude]
  const coords =
    restaurant?.location?.coordinates || [];

  const latitude =
    coords.length === 2
      ? coords[1]
      : undefined;

  const longitude =
    coords.length === 2
      ? coords[0]
      : undefined;

  // Create delivery address text
  const deliveryText = [
    order.deliveryAddress?.address,
    order.deliveryAddress?.city,
    order.deliveryAddress?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="fg-page">
      <div className="fg-shell">

        {/* Back button */}
        <Link
          to="/orders"
          className="fg-back-link"
        >
          <FaArrowLeft /> My orders
        </Link>

        <div className="tracking-modern">

          {/* Map */}
          <div className="tracking-map">
            <GoogleMap
              latitude={latitude}
              longitude={longitude}
              address={deliveryText}
              height={430}
              title="FoodGo restaurant and delivery location"
            />
          </div>

          {/* Tracking information */}
          <div className="tracking-copy">

            <span className="fg-section-kicker">
              ORDER #
              {String(id)
                .slice(-8)
                .toUpperCase()}
            </span>

            <h1>
              {order.status === "DELIVERED"
                ? "Your food has arrived."
                : "Your order is moving."}
            </h1>

            {/* Order total */}
            <div className="eta">
              <b>
                ₹
                {Number(
                  order.pricing?.total || 0
                ).toFixed(0)}
              </b>

              <span>
                order total
                <br />

                <small>
                  {order.deliveryAddress?.city ||
                    ""}
                </small>
              </span>
            </div>

            {/* Delivery message */}
            {order.deliveryMessage && (
              <div
                className="tracking-delivery-message"
                role="status"
              >
                <div>
                  <FaBell />
                </div>

                <span>
                  <b>Delivery update</b>

                  <small>
                    {order.deliveryMessage}
                  </small>

                  {order.deliveryMessageAt && (
                    <em>
                      {new Date(
                        order.deliveryMessageAt
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </em>
                  )}
                </span>
              </div>
            )}

            {/* Order timeline */}
            <div className="tracking-timeline">
              {steps.map((step, index) => (
                <div
                  className={
                    index <= current
                      ? "active"
                      : ""
                  }
                  key={step}
                >
                  <i>
                    {index <= current ? (
                      <FaCheck />
                    ) : (
                      index + 1
                    )}
                  </i>

                  <span>
                    <b>
                      {step.replaceAll(
                        "_",
                        " "
                      )}
                    </b>

                    <small>
                      {index <= current
                        ? "Completed"
                        : "Waiting"}
                    </small>
                  </span>
                </div>
              ))}
            </div>

            {/* Delivery address */}
            <div style={{ marginTop: 18 }}>
              <b>
                <FaMapMarkerAlt /> Delivery to
              </b>

              <p>
                {order.deliveryAddress?.address},{" "}
                {order.deliveryAddress?.city} -{" "}
                {order.deliveryAddress?.pincode}
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}