import React, { useEffect, useState } from "react";
import {
  FaBolt,
  FaDrumstickBite,
  FaFire,
  FaHeart,
  FaLeaf,
  FaPlus,
  FaStar,
} from "react-icons/fa";
import {
  getCustomerFavourites,
  addCustomerFavourite,
  removeCustomerFavourite,
} from "../api/foodApi";

export default function FoodCard({ food, addToCart, restaurantId }) {
  const [saved, setSaved] = useState(false);
  const [favouriteId, setFavouriteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState(false);

  const dishId = food?._id || food?.id;
  const restId =
    restaurantId ||
    food?.restaurantId?._id ||
    food?.restaurantId ||
    food?.restaurant?._id ||
    food?.restaurant?.id;

  const token =
    localStorage.getItem("foodgo_access_token") ||
    localStorage.getItem("accessToken");

  const isVeg = food?.veg ?? food?.isVeg === true;

  // Load permanent favourite from MongoDB
  useEffect(() => {
    if (!token || !dishId) return;

    let active = true;

    const loadFavourite = async () => {
      try {
        const favourites = await getCustomerFavourites();

        const favourite = Array.isArray(favourites)
          ? favourites.find((item) => {
              const id =
                item?.menuItemId?._id ||
                item?.menuItemId?.id ||
                item?.menuItemId ||
                item?.dishId?._id ||
                item?.dishId?.id ||
                item?.dishId ||
                item?.foodId?._id ||
                item?.foodId?.id ||
                item?.foodId;

              return String(id) === String(dishId);
            })
          : null;

        if (!active) return;

        setSaved(!!favourite);
        setFavouriteId(
          favourite?._id || favourite?.id || null
        );
      } catch (error) {
        console.error("Failed to load favourite:", error);
      }
    };

    loadFavourite();

    return () => {
      active = false;
    };
  }, [dishId, token]);

  // Add/remove favourite
  const toggleFavourite = async (e) => {
    e.stopPropagation();

    if (saving) return;

    let user = {};
    try {
      user = JSON.parse(
        localStorage.getItem("foodgo_user") ||
          localStorage.getItem("foodgoUser") ||
          "{}"
      );
    } catch {}

    if (!token || !user?.role) {
      window.location.href = "/login";
      return;
    }

    if (user.role !== "customer") {
      alert("Please login with a customer account to save favourites.");
      return;
    }

    if (!dishId) {
      alert("Dish ID is missing.");
      return;
    }

    try {
      setSaving(true);

      if (saved) {
        let id = favouriteId;

        // Find ID again if it wasn't stored
        if (!id) {
          const favourites = await getCustomerFavourites();

          const favourite = favourites?.find((item) => {
            const itemDishId =
              item?.menuItemId?._id ||
              item?.menuItemId ||
              item?.dishId?._id ||
              item?.dishId ||
              item?.foodId?._id ||
              item?.foodId;

            return String(itemDishId) === String(dishId);
          });

          id = favourite?._id || favourite?.id;
        }

        if (!id) {
          throw new Error("Favourite record not found.");
        }

        await removeCustomerFavourite(id);

        setSaved(false);
        setFavouriteId(null);
        window.dispatchEvent(new Event("foodgo:favourites-changed"));
      } else {
        const result = await addCustomerFavourite({
          menuItemId: dishId,
          restaurantId: restId,
        });

        const favourite =
          result?.favourite ||
          result?.data?.favourite ||
          result?.data ||
          result;

        const id = favourite?._id || favourite?.id;

        setSaved(true);
        setFavouriteId(id || null);
        window.dispatchEvent(new Event("foodgo:favourites-changed"));
      }
    } catch (error) {
      console.error("Favourite update failed:", error);

      alert(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Unable to update favourite."
      );
    } finally {
      setSaving(false);
    }
  };

  // Add food to cart
  const add = () => {
    addToCart?.(food);
    setAdded(true);
    setTimeout(() => setAdded(false), 900);
  };

  return (
    <article className={`food-card ${added ? "is-added" : ""}`}>
      <div className="food-image">
        <img
          src={food?.image}
          alt={food?.name || "Food"}
          loading="lazy"
        />

        {food?.bestseller && (
          <span className="bestseller">
            <FaFire /> Bestseller
          </span>
        )}

        {/* Permanent Favourite */}
        <button
          type="button"
          className={`food-save ${saved ? "saved" : ""}`}
          onClick={toggleFavourite}
          disabled={saving}
          aria-label={
            saved ? "Remove from favourites" : "Add to favourites"
          }
          aria-pressed={saved}
          title={
            saved
              ? "Remove from favourites"
              : "Add to favourites"
          }
        >
          <FaHeart />
        </button>

        <div className="food-image-bottom">
          <span>
            <FaBolt />
            {food?.spicy ? "Popular pick" : "Fresh pick"}
          </span>

          {food?.calories && (
            <span>{food.calories} kcal</span>
          )}
        </div>
      </div>

      <div className="food-content">
        <div className="food-title-row">
          <div>
            <h3>{food?.name}</h3>
            <small>{food?.category}</small>
          </div>

          <span className="food-rating">
            <FaStar /> {food?.rating ?? 0}
          </span>
        </div>

        <p>{food?.description}</p>

        <div className="food-bottom">
          <div>
            <strong>₹{food?.price}</strong>

            {food?.originalPrice && (
              <del>₹{food.originalPrice}</del>
            )}
          </div>

          <button
            type="button"
            className={`food-add ${added ? "added" : ""}`}
            onClick={add}
          >
            {added ? (
              "ADDED ✓"
            ) : (
              <>
                <FaPlus /> ADD
              </>
            )}
          </button>
        </div>

        <div className="food-meta">
          <span
            className={`food-type ${
              isVeg ? "veg" : "nonveg"
            }`}
          >
            {isVeg ? <FaLeaf /> : <FaDrumstickBite />}
            {isVeg ? "Veg" : "Non-Veg"}
          </span>

          <span>Free customization</span>
        </div>
      </div>
    </article>
  );
}