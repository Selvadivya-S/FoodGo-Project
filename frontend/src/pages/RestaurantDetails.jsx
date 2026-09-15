import React, { useEffect, useMemo, useState } from "react";
import {
  useParams,
  Link,
  useNavigate,
} from "react-router-dom";

import {
  FaStar,
  FaClock,
  FaMapMarkerAlt,
  FaMotorcycle,
  FaHeart,
  FaSearch,
  FaArrowLeft,
} from "react-icons/fa";

import FoodCard from "../components/FoodCard";
import {
  getRestaurant,
  getMenu,
  getBranches,
  getCustomerFavourites,
  addCustomerFavourite,
  removeCustomerFavourite,
} from "../api/foodApi";

import GoogleMap from "../components/GoogleMap";


// Add a version to image URLs so updated images are loaded
// instead of an old browser-cached image.
const imageWithVersion = (url, updatedAt) => {
  if (!url || !updatedAt) return url;

  const separator = String(url).includes("?")
    ? "&"
    : "?";

  return `${url}${separator}fgv=${encodeURIComponent(
    updatedAt
  )}`;
};


export default function RestaurantDetails({
  addToCart,
}) {
  // Get restaurant ID from the URL
  const { id } = useParams();

  // Used to navigate between restaurant pages
  const navigate = useNavigate();

  // Restaurant information
  const [restaurant, setRestaurant] = useState(null);

  // Restaurant dishes
  const [foods, setFoods] = useState([]);

  // Menu search text
  const [q, setQ] = useState("");

  // Favourite state
  const [saved, setSaved] = useState(false);
  const [favouriteId, setFavouriteId] = useState(null);
  const [savingFavourite, setSavingFavourite] = useState(false);

  // Error message
  const [error, setError] = useState("");

  // Restaurant branches
  const [branches, setBranches] = useState([]);


  // Load restaurant, menu and branches
  useEffect(() => {
    Promise.all([
      getRestaurant(id),
      getMenu(id),
      getBranches(id),
    ])
      .then(([restaurantData, menu, branchList]) => {
        // Save restaurant information
        setRestaurant(restaurantData);

        // Save branches
        setBranches(
          Array.isArray(branchList)
            ? branchList
            : []
        );

        // Convert menu data into FoodCard format
        setFoods(
          Array.isArray(menu)
            ? menu.map((item) => ({
                ...item,

                // Use MongoDB ID as food ID
                id: item._id,

                // Connect dish to restaurant
                restaurantId: restaurantData._id,

                // Restaurant name
                restaurantName: restaurantData.name,

                // Delivery information
                restaurantDeliveryTime:
                  restaurantData.deliveryTime || 30,

                restaurantDeliveryFee:
                  Number.isFinite(
                    Number(restaurantData.deliveryFee)
                  )
                    ? Number(
                        restaurantData.deliveryFee
                      )
                    : 40,

                restaurantFreeDelivery:
                  restaurantData.freeDelivery === true,

                // Dish image
                image: imageWithVersion(
                  item.image ||
                    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
                  item.updatedAt
                ),

                // Convert isVeg into FoodCard's veg property
                veg: !!item.isVeg,
              }))
            : []
        );
      })
      .catch((e) => {
        setError(
          e.response?.data?.message ||
            "Unable to load restaurant."
        );
      });
  }, [id]);


  // Load permanent restaurant favourite from MongoDB.
  useEffect(() => {
    let active = true;

    const loadFavourite = async () => {
      let user = {};
      try {
        user = JSON.parse(
          localStorage.getItem("foodgo_user") ||
            localStorage.getItem("foodgoUser") ||
            "{}"
        );
      } catch {}

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
                ) === String(id)
            )
          : null;

        if (active) {
          setSaved(Boolean(row));
          setFavouriteId(row?._id || row?.id || null);
        }
      } catch {
        // Keep page usable when favourites are temporarily unavailable.
      }
    };

    loadFavourite();

    const onChanged = () => loadFavourite();
    window.addEventListener("foodgo:favourites-changed", onChanged);

    return () => {
      active = false;
      window.removeEventListener("foodgo:favourites-changed", onChanged);
    };
  }, [id]);

  const toggleRestaurantFavourite = async () => {
    let user = {};
    try {
      user = JSON.parse(
        localStorage.getItem("foodgo_user") ||
          localStorage.getItem("foodgoUser") ||
          "{}"
      );
    } catch {}

    if (!user?.role) {
      navigate("/login", { state: { from: `/restaurant/${id}` } });
      return;
    }

    if (user.role !== "customer") {
      window.alert("Please login with a customer account to save favourites.");
      return;
    }

    if (savingFavourite) return;

    setSavingFavourite(true);

    try {
      if (saved) {
        let rowId = favouriteId;

        if (!rowId) {
          const rows = await getCustomerFavourites();
          const row = rows?.find(
            (item) =>
              !item?.menuItemId &&
              String(
                item?.restaurantId?._id ||
                  item?.restaurantId ||
                  ""
              ) === String(id)
          );
          rowId = row?._id || row?.id;
        }

        if (rowId) {
          await removeCustomerFavourite(rowId);
        }

        setSaved(false);
        setFavouriteId(null);
      } else {
        const result = await addCustomerFavourite({
          restaurantId: restaurant?._id || id,
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
      setSavingFavourite(false);
    }
  };

  // Filter dishes based on search text
  const filtered = useMemo(() => {
    return foods.filter(
      (food) =>
        !q ||
        food.name
          .toLowerCase()
          .includes(q.toLowerCase())
    );
  }, [foods, q]);


  // Show error page
  if (error) {
    return (
      <section className="fg-page">
        <div className="fg-empty-card">
          <h2>{error}</h2>

          <Link
            to="/restaurants"
            className="fg-btn fg-btn-primary"
          >
            Browse restaurants
          </Link>
        </div>
      </section>
    );
  }


  // Show loading page
  if (!restaurant) {
    return (
      <section className="fg-page">
        <div className="fg-empty-card">
          <h2>Loading restaurant…</h2>
        </div>
      </section>
    );
  }


  // Restaurant image
  const image = imageWithVersion(
    restaurant.images?.[0] ||
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80",
    restaurant.updatedAt
  );


  return (
    <section className="fg-page">
      <div className="fg-shell">

        {/* Back button */}
        <Link
          to="/restaurants"
          className="fg-back-link"
        >
          <FaArrowLeft />
          Back to restaurants
        </Link>


        {/* Restaurant Hero */}
        <div className="restaurant-detail-hero">

          <img
            src={image}
            alt={restaurant.name}
          />

          <div className="restaurant-detail-overlay" />

          <div className="restaurant-detail-copy">

            {/* Open / Closed status */}
            <span>
              {restaurant.isOpen
                ? "● Open now"
                : "Closed"}
            </span>

            {/* Restaurant name */}
            <h1>{restaurant.name}</h1>

            {/* Cuisine */}
            <p>
              {(restaurant.cuisine || [])
                .join?.(" • ") ||
                restaurant.cuisine ||
                ""}
            </p>

            {/* Restaurant details */}
            <div>
              <b>
                <FaStar />
                {restaurant.rating || 0}
              </b>

              <b>
                <FaClock />
                {restaurant.deliveryTime || 30} mins
              </b>

              <b>
                <FaMapMarkerAlt />
                {restaurant.address?.city || ""}
              </b>
            </div>
          </div>


          {/* Favourite button */}
          <button
            type="button"
            className={`detail-save ${
              saved ? "saved" : ""
            }`}
            onClick={toggleRestaurantFavourite}
            disabled={savingFavourite}
            aria-label={
              saved
                ? "Remove from favourites"
                : "Add to favourites"
            }
          >
            <FaHeart />
          </button>

        </div>


        {/* Restaurant Information */}
        <div className="restaurant-detail-info">

          <span>
            <FaMotorcycle />

            {restaurant.deliveryTime <= 30
              ? "Fast delivery"
              : "Delivery available"}
          </span>

          <span>•</span>

          <span>
            {restaurant.address?.street || ""}
          </span>

          <span>•</span>

          <span>
            {restaurant.reviewCount || 0} ratings
          </span>

        </div>


        {/* Restaurant Location */}
        <div
          style={{
            margin: "24px 0",
          }}
        >
          <span className="fg-section-kicker">
            LOCATION
          </span>

          <h2>Restaurant location</h2>

          <GoogleMap
            latitude={
              restaurant.location
                ?.coordinates?.[1]
            }
            longitude={
              restaurant.location
                ?.coordinates?.[0]
            }
            address={[
              restaurant.address?.street,
              restaurant.address?.city,
              restaurant.address?.state,
              restaurant.address?.pincode,
            ]
              .filter(Boolean)
              .join(", ")}
            height={340}
            title={`${restaurant.name} location`}
          />

          {/* Exact Google Maps listing */}
          {restaurant.googleMapsUrl && (
            <div style={{ marginTop: 10 }}>
              <a
                className="fg-btn fg-btn-secondary"
                href={restaurant.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open exact Google Maps listing
              </a>
            </div>
          )}
        </div>


        {/* Branch Switcher */}
        {branches.length > 1 && (
          <div className="fg-branch-switcher">

            <div>
              <span className="fg-section-kicker">
                CHOOSE OUTLET
              </span>

              <h3>Choose an outlet</h3>
            </div>

            <select
              value={id}
              onChange={(e) =>
                navigate(
                  `/restaurant/${e.target.value}`
                )
              }
            >
              {branches.map((branch) => (
                <option
                  key={branch._id}
                  value={branch._id}
                >
                  {branch.branchName ||
                    branch.name}{" "}
                  —{" "}
                  {branch.address?.city || ""}
                </option>
              ))}
            </select>

          </div>
        )}


        {/* Menu Header and Search */}
        <div className="menu-toolbar">

          <div>
            <span className="fg-section-kicker">
              MENU
            </span>

            <h2>Popular dishes</h2>
          </div>

          <div className="fg-big-search compact">

            <FaSearch />

            <input
              value={q}
              onChange={(e) =>
                setQ(e.target.value)
              }
              placeholder="Search this menu"
            />

          </div>

        </div>


        {/* Food Cards */}
        <div className="fg-food-grid">
          {filtered.map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              addToCart={addToCart}
            />
          ))}
        </div>


        {/* No dishes */}
        {!filtered.length && (
          <div className="fg-empty-inline">
            No dishes available yet. The restaurant
            owner can add them from the dashboard.
          </div>
        )}

      </div>
    </section>
  );
}