import React, { useEffect, useMemo, useState } from "react";
import {
  FaSearch,
  FaSlidersH,
  FaBolt,
  FaMapMarkerAlt,
} from "react-icons/fa";

import RestaurantCard from "../components/RestaurantCard";
import Map from "../components/Map";
import { getRestaurants, getRestaurantLocations } from "../api/foodApi";

// Add cache-busting version to restaurant images
const imageWithVersion = (url, updatedAt) => {
  if (!url || !updatedAt) return url;

  const separator = String(url).includes("?") ? "&" : "?";

  return `${url}${separator}fgv=${encodeURIComponent(updatedAt)}`;
};

// Convert backend restaurant data into frontend-friendly data
const normalize = (r) => ({
  ...r,

  id: r._id || r.id,

  image: imageWithVersion(
    r.images?.[0] ||
      r.image ||
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80",
    r.updatedAt
  ),

  cuisine: Array.isArray(r.cuisine)
    ? r.cuisine.join(" • ")
    : r.cuisine || "",

  tags: r.cuisine || r.tags || [],

  deliveryTime: `${r.deliveryTime || 30} mins`,
  deliveryMinutes: r.deliveryTime || 30,

  distance: "",
  distanceValue: 0,

  ratingCount: `${r.reviewCount || 0}`,

  veg: false,

  city: r.address?.city || "",

  deliveryAvailable: r.deliveryAvailable !== false,

  priceForTwo: r.priceRange || "₹300 for two",

  googleMapsUrl: r.googleMapsUrl || "",
  brandName: r.brandName || "",
  branchName: r.branchName || "",
  description: r.description || "",
  phone: r.phone || "",
  email: r.email || "",
  address: {
    street: r.address?.street || "",
    city: r.address?.city || "",
    state: r.address?.state || "",
    pincode: r.address?.pincode || "",
  },
  latitude: r.location?.coordinates?.[1] ?? r.latitude ?? "",
  longitude: r.location?.coordinates?.[0] ?? r.longitude ?? "",
});

// Keep every restaurant record as its own card.
const uniqueRestaurants = (items = []) => items;

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [locations, setLocations] = useState([]);

  const [q, setQ] = useState("");
  const [sort, setSort] = useState("rating");

  const [state, setState] = useState("all");
  const [city, setCity] = useState("all");

  const [fast, setFast] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load restaurants and locations
  useEffect(() => {
    setLoading(true);

    Promise.all([
      getRestaurants(),
      getRestaurantLocations(),
    ])
      .then(([data, locationData]) => {
        setRestaurants(
          uniqueRestaurants(
            Array.isArray(data)
              ? data.map(normalize)
              : []
          )
        );

        setLocations(
          Array.isArray(locationData)
            ? locationData
            : []
        );
      })
      .catch((e) => {
        setError(
          e.response?.data?.message ||
            "Unable to load restaurants."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Get available states
  const states = useMemo(
    () =>
      Array.from(
        new Set(
          locations
            .map((x) => x.state)
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [locations]
  );

  // Get cities based on selected state
  const cities = useMemo(
    () =>
      Array.from(
        new Set(
          locations
            .filter(
              (x) =>
                state === "all" ||
                x.state?.toLowerCase() ===
                  state.toLowerCase()
            )
            .map((x) => x.city)
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [locations, state]
  );

  // Search, filter and sort restaurants
  const list = useMemo(
    () =>
      restaurants
        .filter((r) => {
          const text =
            `${r.name} ${r.cuisine}`.toLowerCase();

          const rState = String(
            r.address?.state || ""
          ).toLowerCase();

          const rCity = String(
            r.address?.city || ""
          ).toLowerCase();

          return (
            (!q ||
              text.includes(q.toLowerCase())) &&
            (state === "all" ||
              rState === state.toLowerCase()) &&
            (city === "all" ||
              rCity === city.toLowerCase()) &&
            (!fast || r.deliveryMinutes <= 25)
          );
        })
        .sort((a, b) =>
          sort === "rating"
            ? (b.rating || 0) - (a.rating || 0)
            : (a.deliveryMinutes || 30) -
              (b.deliveryMinutes || 30)
        ),
    [restaurants, q, sort, state, city, fast]
  );

  // Change state
  const changeState = (value) => {
    setState(value);
    setCity("all");

    localStorage.setItem("foodgoState", value);
    localStorage.setItem("foodgoCity", "all");
  };

  // Change city
  const changeCity = (value) => {
    setCity(value);

    localStorage.setItem("foodgoCity", value);
  };

  return (
    <section className="fg-page">
      <div className="fg-shell">

        {/* Page heading */}
        <div className="fg-page-hero">
          <div>
            <span className="fg-section-kicker">
              <FaMapMarkerAlt /> NEAR YOU
            </span>

            <h1>
              Find your next favourite restaurant.
            </h1>

            <p>
              Restaurants and menus are loaded directly
              from MongoDB.
            </p>
          </div>

          <div className="fg-discovery-stats">
            <b>{list.length}</b>

            <span>
              approved restaurants
              {city !== "all"
                ? ` in ${city}`
                : state !== "all"
                ? ` in ${state}`
                : " across all locations"}
            </span>
          </div>
        </div>

        {/* Delivery location */}
        <div className="fg-city-picker">
          <span className="fg-section-kicker">
            <FaMapMarkerAlt /> DELIVERY LOCATION
          </span>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <select
              value={state}
              onChange={(e) =>
                changeState(e.target.value)
              }
            >
              <option value="all">All states</option>

              {states.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={city}
              onChange={(e) =>
                changeCity(e.target.value)
              }
            >
              <option value="all">All cities</option>

              {cities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search and sorting */}
        <div className="fg-discovery-bar">
          <div className="fg-big-search">
            <FaSearch />

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search restaurants or cuisines..."
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="rating">
              Top rated
            </option>

            <option value="delivery">
              Fastest delivery
            </option>
          </select>
        </div>

        {/* Fast delivery filter */}
        <div className="fg-chip-row">
          <button
            className={!fast ? "active" : ""}
            onClick={() => setFast(false)}
          >
            All
          </button>

          <button
            className={fast ? "active" : ""}
            onClick={() => setFast((v) => !v)}
          >
            <FaBolt /> Under 25 min
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="fg-empty-inline">
            Loading restaurants…
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="fg-inline-error">
            {error}
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <>
            <div className="fg-results-head">
              <div>
                <b>{list.length} restaurants</b>
                <span> available now</span>
              </div>

              <span>
                <FaSlidersH /> Live data
              </span>
            </div>

            {/* Restaurant cards */}
            <div className="fg-restaurant-grid">
              {list.map((r) => (
                <RestaurantCard
                  key={r.id}
                  restaurant={r}
                />
              ))}
            </div>

            {/* No results */}
            {!list.length && (
              <div className="fg-empty-inline">
                🍽️
                <h3>
                  No restaurants in this location yet
                </h3>

                <p>
                  FoodGo is ready for this city.
                  Add approved branches from the admin
                  dashboard and they will appear here
                  automatically.
                </p>
              </div>
            )}

            {/* Map */}
            <div style={{ marginTop: 30 }}>
              <h2>Restaurants on the map</h2>

              <Map
                restaurants={list}
                height={430}
              />
            </div>
          </>
        )}

      </div>
    </section>
  );
}