import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaStar,
  FaClock,
  FaHeart,
  FaMotorcycle,
  FaChevronRight,
} from "react-icons/fa";
import {
  getCustomerFavourites,
  addCustomerFavourite,
  removeCustomerFavourite,
} from "../api/foodApi";

export default function RestaurantCard({ restaurant }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [favouriteId, setFavouriteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const getStoredUser = () => {
    try {
      return JSON.parse(
        localStorage.getItem("foodgo_user") ||
        localStorage.getItem("foodgoUser") ||
        "{}"
      );
    } catch {
      return {};
    }
  };

  useEffect(() => {
    let active = true;

    const loadFavourite = async () => {
      const user = getStoredUser();
      if (user?.role !== "customer") return;

      try {
        const rows = await getCustomerFavourites();
        const row = Array.isArray(rows)
          ? rows.find(
              (item) =>
                !item?.menuItemId &&
                String(
                  item?.restaurantId?._id ||
                    item?.restaurantId ||
                    ""
                ) === String(restaurant.id)
            )
          : null;

        if (active) {
          setSaved(Boolean(row));
          setFavouriteId(row?._id || row?.id || null);
        }
      } catch {
        // Keep the card usable if favourites cannot be loaded.
      }
    };

    loadFavourite();
    return () => {
      active = false;
    };
  }, [restaurant.id]);

  const toggleFavourite = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const user = getStoredUser();

    if (!user?.role) {
      navigate("/login", {
        state: { from: window.location.pathname },
      });
      return;
    }

    if (user.role !== "customer") {
      window.alert("Please login with a customer account to save favourites.");
      return;
    }

    if (saving) return;

    setSaving(true);

    try {
      if (saved) {
        let id = favouriteId;

        if (!id) {
          const rows = await getCustomerFavourites();
          const row = rows?.find(
            (item) =>
              !item?.menuItemId &&
              String(
                item?.restaurantId?._id ||
                  item?.restaurantId ||
                  ""
              ) === String(restaurant.id)
          );
          id = row?._id || row?.id;
        }

        if (id) {
          await removeCustomerFavourite(id);
          setSaved(false);
          setFavouriteId(null);
        }
      } else {
        const result = await addCustomerFavourite({
          restaurantId: restaurant.id,
        });

        const row =
          result?.favourite ||
          result?.data?.favourite ||
          result?.data ||
          result;

        setSaved(true);
        setFavouriteId(row?._id || row?.id || null);
      }

      window.dispatchEvent(new Event("foodgo:favourites-changed"));
    } catch (error) {
      console.error("Restaurant favourite update failed:", error);
      window.alert(
        error?.response?.data?.message ||
          "Unable to update favourite. Please login again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="restaurant-card">
      <Link
        to={`/restaurant/${restaurant.id}`}
        className="restaurant-image-wrapper"
      >
        <img src={restaurant.image} alt={restaurant.name} loading="lazy" />

        {restaurant.promoted && <span className="promoted">PROMOTED</span>}
        {restaurant.offer && <span className="offer-badge">{restaurant.offer}</span>}

        <span className={`restaurant-open ${restaurant.isOpen ? "open" : ""}`}>
          <i />
          {restaurant.isOpen ? "Open now" : "Closed"}
        </span>
      </Link>

      <button
        type="button"
        className={`restaurant-save ${saved ? "saved" : ""}`}
        onClick={toggleFavourite}
        disabled={saving}
        aria-label={saved ? "Remove restaurant from favourites" : "Add restaurant to favourites"}
        aria-pressed={saved}
        title={saved ? "Remove from favourites" : "Add to favourites"}
      >
        <FaHeart />
      </button>

      <div className="restaurant-info">
        <div className="restaurant-head">
          <h3>{restaurant.name}</h3>
          <span className="restaurant-rating">
            <FaStar />
            {restaurant.rating}
          </span>
        </div>

        {restaurant.brandName && (
          <p className="restaurant-brand">
            <strong>Brand:</strong> {restaurant.brandName}
          </p>
        )}

        {restaurant.cuisine && (
          <p className="restaurant-cuisine">{restaurant.cuisine}</p>
        )}

        {restaurant.branchName && (
          <p className="restaurant-branch">📍 {restaurant.branchName}</p>
        )}

        {restaurant.description && (
          <p className="restaurant-description restaurant-description-short">
            {restaurant.description}
          </p>
        )}

        {restaurant.address?.city && (
          <p className="restaurant-card-location">
            📍 {restaurant.address.city}
            {restaurant.address?.state ? `, ${restaurant.address.state}` : ""}
          </p>
        )}

        <div className="restaurant-meta">
          <span>
            <FaClock />
            {restaurant.deliveryTime}
          </span>
          <span>•</span>
          <span>{restaurant.priceForTwo}</span>
          {restaurant.distance && (
            <>
              <span>•</span>
              <span>{restaurant.distance}</span>
            </>
          )}
        </div>

        <div className="restaurant-footer">
          <span className={restaurant.deliveryAvailable === false ? "" : "free"}>
            <FaMotorcycle />
            {restaurant.deliveryAvailable === false
              ? "Delivery unavailable"
              : "Delivery available"}
          </span>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link to={`/restaurant/${restaurant.id}`}>
              View menu
              <FaChevronRight />
            </Link>

            {restaurant.googleMapsUrl && (
              <a
                href={restaurant.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${restaurant.name} in Google Maps`}
                title="Open in Google Maps"
              >
                📍
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
