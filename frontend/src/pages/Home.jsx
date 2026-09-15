import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBolt,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaFire,
  FaLocationArrow,
  FaMapMarkerAlt,
  FaMotorcycle,
  FaPercent,
  FaSearch,
  FaShieldAlt,
  FaStar,
  FaTimes,
  FaUser,
  FaUserPlus,
  FaEnvelope,
  FaLock,
  FaCopy,
  FaPlus,
  FaLeaf,
  FaAward,
  FaGift,
  FaRocket,
  FaUsers,
} from "react-icons/fa";
/* =========================================================
   DATA
========================================================= */
import {
  categories,
  offers,
  searchSuggestions,
  liveDelivery,
  testimonials,
} from "../data";
/* =========================================================
   COMPONENTS
========================================================= */
import RestaurantCard from "../components/RestaurantCard";
import { getRestaurants, getCityMenu, getRestaurantLocations } from "../api/foodApi";
import FoodCard from "../components/FoodCard";
/* =========================================================
   CSS
========================================================= */
import "../styles/Home.css";
/* =========================================================
   HERO SLIDES
========================================================= */
const slides = [
  {
    kicker: "FOODGO SMART DELIVERY",
    title: "Your favourite food,",
    highlight: "at your doorstep.",
    text:
      "Discover highly-rated restaurants, personalised offers and live delivery tracking in one beautiful experience.",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1500&q=90",
    badge: "30 MIN",
    badgeText: "average delivery",
  },
  {
    kicker: "WEEKEND CRAVINGS",
    title: "Big flavours.",
    highlight: "Bigger savings.",
    text:
      "From biryani to pizza, discover dishes everyone is talking about with exclusive FoodGo deals.",
    image:
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1500&q=90",
    badge: "50% OFF",
    badgeText: "first-order offer",
  },
  {
    kicker: "LIVE ORDER TRACKING",
    title: "Hungry now?",
    highlight: "Watch it arrive.",
    text:
      "Follow your order from restaurant acceptance to doorstep handoff with live status updates.",
    image:
      "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=1500&q=90",
    badge: "LIVE",
    badgeText: "delivery tracking",
  },
];
/* =========================================================
   HOME COMPONENT
========================================================= */
const imageWithVersion = (url, updatedAt) => {
  if (!url || !updatedAt) return url;
  const separator = String(url).includes("?") ? "&" : "?";
  return `${url}${separator}fgv=${encodeURIComponent(updatedAt)}`;
};

// Keep every restaurant record as its own card.
const uniqueRestaurants = (items = []) => items;

export default function Home({ addToCart }) {
  /* =====================================================
     STATE
  ===================================================== */
  const [location, setLocation] = useState(
    localStorage.getItem("foodgoLocation") || "All India"
  );
  const [search, setSearch] = useState("");
  const [liveRestaurants, setLiveRestaurants] = useState([]);
  const [liveMenu, setLiveMenu] = useState([]);
  const [liveLocations, setLiveLocations] = useState([]);
  const [liveLoaded, setLiveLoaded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [category, setCategory] = useState("All");
  const [foodType, setFoodType] = useState("all");
  const [deliveryType, setDeliveryType] = useState("all");
  const [sort, setSort] = useState("relevance");
  const [liveOrders, setLiveOrders] = useState(
    liveDelivery?.activeOrders || 1247
  );
  const [onlinePartners, setOnlinePartners] = useState(
    liveDelivery?.deliveryPartners || 356
  );
  const [toast, setToast] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const normalizeLiveRestaurant = (r) => ({
    ...r,
    id: r._id || r.id,
    image: imageWithVersion(r.images?.[0] || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=85", r.updatedAt),
    cuisine: Array.isArray(r.cuisine) ? r.cuisine.join(" • ") : (r.cuisine || ""),
    tags: Array.isArray(r.cuisine) ? r.cuisine : [],
    location: `${r.address?.street || ""}, ${r.address?.city || ""}`.replace(/^, |, $/g, ""),
    city: r.address?.city || "",
    state: r.address?.state || "",
    ratingCount: `${r.reviewCount || 0}`,
    deliveryTime: `${r.deliveryTime || 30} mins`,
    deliveryMinutes: r.deliveryTime || 30,
    priceForTwo: r.priceRange || "₹300 for two",
    offer: "LIVE RESTAURANT",
    promoted: false,
    veg: (r.cuisine || []).some((x) => /vegetarian|veg/i.test(x)),
    distance: "", distanceValue: 0, isOpen: r.isOpen !== false, deliveryAvailable: r.deliveryAvailable !== false, freeDelivery: r.freeDelivery === true, deliveryFee: Number.isFinite(Number(r.deliveryFee)) ? Number(r.deliveryFee) : 40, popular: (r.rating || 0) >= 4.3,
    brandName: r.brandName || "",
    branchName: r.branchName || "",
    description: r.description || "",
    phone: r.phone || "",
    email: r.email || "",
    address: { street: r.address?.street || "", city: r.address?.city || "", state: r.address?.state || "", pincode: r.address?.pincode || "" },
    latitude: r.location?.coordinates?.[1] ?? r.latitude ?? "",
    longitude: r.location?.coordinates?.[0] ?? r.longitude ?? "",
    googleMapsUrl: r.googleMapsUrl || "",
  });
  const restaurants = liveLoaded ? uniqueRestaurants(liveRestaurants) : [];
  /* =====================================================
     EFFECTS
  ===================================================== */
  useEffect(() => {
    let cancelled = false;
    setLiveLoaded(false);
    Promise.all([
      getRestaurants(),
      getCityMenu("", 20),
      getRestaurantLocations(),
    ])
      .then(([restaurantData, menuData, locationData]) => {
        if (!cancelled) {
          setLiveRestaurants(
            uniqueRestaurants(
              Array.isArray(restaurantData)
                ? restaurantData.map(normalizeLiveRestaurant)
                : []
            )
          );
          setLiveLocations(Array.isArray(locationData) ? locationData : []);
          setLiveMenu(
            Array.isArray(menuData)
              ? menuData.map((item) => ({
                  ...item,
                  id: item._id || item.id,
                  image: imageWithVersion(item.image || "", item.updatedAt),
                  restaurantId: item.restaurantId?._id || item.restaurantId,
                  restaurantName: item.restaurantName || "",
                  restaurantDeliveryFee: Number.isFinite(Number(item.restaurantDeliveryFee)) ? Number(item.restaurantDeliveryFee) : 40,
                  restaurantFreeDelivery: item.restaurantFreeDelivery === true,
                  veg: !!item.isVeg,
                }))
              : []
          );
          setLiveLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLiveRestaurants([]);
          setLiveMenu([]);
          setLiveLoaded(false);
        }
      });
    return () => { cancelled = true; };
  }, [location]);
  useEffect(() => {
    const timer = setInterval(() => {
      setSlide(
        (current) =>
          (current + 1) % slides.length
      );
    }, 6500);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveOrders((value) =>
        Math.max(
          900,
          value +
            Math.floor(
              Math.random() * 17
            ) -
            8
        )
      );
      setOnlinePartners((value) =>
        Math.max(
          150,
          value +
            Math.floor(
              Math.random() * 9
            ) -
            4
        )
      );
    }, 2500);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const openSearch = () =>
      setSearchOpen(true);
    const openLocation = () =>
      setLocationOpen(true);
    window.addEventListener(
      "foodgo:open-search",
      openSearch
    );
    window.addEventListener(
      "foodgo:open-location",
      openLocation
    );
    return () => {
      window.removeEventListener(
        "foodgo:open-search",
        openSearch
      );
      window.removeEventListener(
        "foodgo:open-location",
        openLocation
      );
    };
  }, []);
  /* =====================================================
     HELPERS
  ===================================================== */
  const notify = (message) => {
    setToast(message);
    clearTimeout(
      window.__foodgoToast
    );
    window.__foodgoToast =
      setTimeout(() => {
        setToast("");
      }, 2200);
  };
  const chooseLocation = (city, displayName = city) => {
    setLocation(city);
    localStorage.setItem(
      "foodgoLocation",
      city
    );
    localStorage.setItem(
      "foodgoLocationChanged",
      Date.now().toString()
    );
    window.dispatchEvent(
      new Event(
        "foodgo:location-changed"
      )
    );
    setLocationOpen(false);
    notify(
      `Delivering to ${displayName}`
    );
  };
  const copyOffer = async (code) => {
    try {
      await navigator.clipboard.writeText(
        code
      );
      notify(
        `${code} copied to clipboard`
      );
    } catch {
      notify(
        `Use coupon ${code}`
      );
    }
  };
  const chooseCategory = (name) => {
    setCategory(name);
    setTimeout(() => {
      document
        .getElementById("restaurants")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 50);
  };
  const handleAddFood = (food) => {
    if (addToCart) {
      addToCart(food);
    }
    notify(
      `${food.name} added to cart`
    );
  };
  /* =====================================================
     FILTERING
  ===================================================== */
  const filteredRestaurants = useMemo(() => {
    const query =
      search.trim().toLowerCase();
    let list = restaurants.filter(
      (restaurant) => {
        const searchableText = `
          ${restaurant.name}
          ${restaurant.cuisine}
          ${(restaurant.tags || []).join(" ")}
        `.toLowerCase();
        const locationMatch = (() => {
          if (!location || location === "All India" || location === "all") return true;
          const parts = String(location).split("|");
          const selectedCity = (parts[0] || "").toLowerCase();
          const selectedState = (parts[1] || "").toLowerCase();
          const rCity = String(restaurant.city || "").toLowerCase();
          const rState = String(restaurant.state || "").toLowerCase();
          return rCity === selectedCity && (!selectedState || rState === selectedState);
        })();
        const categoryMatch =
          category === "All" ||
          restaurant.tags?.some(
            (tag) =>
              tag.toLowerCase() ===
              category.toLowerCase()
          );
        const foodMatch =
          foodType === "all" ||
          (foodType === "veg" &&
            restaurant.veg) ||
          (foodType === "nonveg" &&
            !restaurant.veg);
        const deliveryMatch =
          deliveryType === "all" ||
          (deliveryType === "fast" &&
            restaurant.deliveryMinutes <=
              25) ||
          (deliveryType === "free" &&
            restaurant.freeDelivery);
        return (
          (!query ||
            searchableText.includes(
              query
            )) &&
          locationMatch &&
          categoryMatch &&
          foodMatch &&
          deliveryMatch
        );
      }
    );
    if (sort === "rating") {
      list.sort(
        (a, b) =>
          b.rating - a.rating
      );
    }
    if (sort === "delivery") {
      list.sort(
        (a, b) =>
          a.deliveryMinutes -
          b.deliveryMinutes
      );
    }
    if (sort === "distance") {
      list.sort(
        (a, b) =>
          a.distanceValue -
          b.distanceValue
      );
    }
    return uniqueRestaurants(list);
  }, [
    search,
    location,
    category,
    foodType,
    deliveryType,
    sort,
    restaurants,
  ]);
  /* =====================================================
     FOOD SECTIONS
  ===================================================== */
  // Home dishes come only from the database. Show a small curated selection
  // from several restaurants instead of dumping every restaurant menu here.
  const selectHomeDishes = (items, maxItems) => {
    const selected = [];
    const perRestaurant = new Map();
    for (const item of items) {
      const key = String(item.restaurantId?._id || item.restaurantId || item.restaurantName || "unknown");
      const count = perRestaurant.get(key) || 0;
      if (count >= 3) continue;
      perRestaurant.set(key, count + 1);
      selected.push(item);
      if (selected.length >= maxItems) break;
    }
    return selected;
  };
  const trending = useMemo(
    () => (liveLoaded ? selectHomeDishes(liveMenu, 10) : []),
    [liveLoaded, liveMenu]
  );
  const recommendations = useMemo(() => {
    if (!liveLoaded) return [];
    const list =
      category === "All"
        ? liveMenu
        : liveMenu.filter(
            (item) =>
              String(item.category || "").toLowerCase() ===
              String(category).toLowerCase()
          );
    return selectHomeDishes(list, 6);
  }, [category, liveLoaded, liveMenu]);
  const hero = slides[slide];
  const locationLabel = location === "All India" ? "all locations" : String(location).includes("|") ? String(location).split("|").filter(Boolean).join(", ") : location;
  /* =====================================================
     RENDER
  ===================================================== */
  return (
    <div className="fg-home">
      {/* =================================================
          HERO
      ================================================= */}
      <section className="fg-hero-v4">
        <div className="fg-hero-background">
          <div className="fg-hero-glow glow-one" />
          <div className="fg-hero-glow glow-two" />
          <div className="fg-hero-grid-pattern" />
        </div>
        <div className="fg-shell fg-hero-grid">
          {/* LEFT */}
          <div className="fg-hero-copy">
            <div className="fg-live-chip">
              <i />
              LIVE IN{" "}
              {location.toUpperCase()}
            </div>
            <span className="fg-eyebrow">
              {hero.kicker}
            </span>
            <h1>
              {hero.title}
              <br />
              <span>
                {hero.highlight}
              </span>
            </h1>
            <p>
              {hero.text}
            </p>
            {/* SEARCH */}
            <button
              className="fg-hero-search"
              onClick={() =>
                setSearchOpen(true)
              }
            >
              <FaSearch />
              <span>
                Search restaurants,
                dishes or cuisines...
              </span>
              <b>
                Search
              </b>
            </button>
            {/* TRUST */}
            <div className="fg-hero-trust">
              <span>
                <FaStar />
                4.7 average rating
              </span>
              <span>
                <FaShieldAlt />
                Safe checkout
              </span>
              <span>
                <FaBolt />
                Fast delivery
              </span>
            </div>
            {/* QUICK STATS */}
            <div className="fg-hero-mini-stats">
              <div>
                <strong>
                  {restaurants.filter((r) => {
                    if (!location || location === "All India" || location === "all") return true;
                    const [selectedCity, selectedState] = String(location).split("|");
                    return String(r.city || "").toLowerCase() === String(selectedCity || "").toLowerCase() &&
                      (!selectedState || String(r.state || "").toLowerCase() === String(selectedState).toLowerCase());
                  }).length}
                  +
                </strong>
                <span>
                  Restaurants near you
                </span>
              </div>
              <div>
                <strong>
                  30 min
                </strong>
                <span>
                  Avg delivery
                </span>
              </div>
              <div>
                <strong>
                  4.7★
                </strong>
                <span>
                  Customer rating
                </span>
              </div>
            </div>
          </div>
          {/* RIGHT */}
          <div className="fg-hero-visual">
            <div className="hero-orbit orbit-a" />
            <div className="hero-orbit orbit-b" />
            <div className="hero-photo">
              <img
                src={hero.image}
                alt="FoodGo food"
              />
            </div>
            {/* RATING */}
            <div className="hero-float hero-rating">
              <FaStar />
              <div>
                <b>
                  4.8
                </b>
                <small>
                  Top rated
                </small>
              </div>
            </div>
            {/* DELIVERY */}
            <div className="hero-float hero-delivery">
              <FaMotorcycle />
              <div>
                <b>
                  {hero.badge}
                </b>
                <small>
                  {hero.badgeText}
                </small>
              </div>
            </div>
            {/* LIVE */}
            <div className="hero-float hero-live">
              <i />
              <div>
                <b>
                  {liveOrders.toLocaleString()}
                </b>
                <small>
                  orders happening now
                </small>
              </div>
            </div>
            {/* FLOATING OFFER */}
            <div className="fg-floating-offer">
              <FaPercent />
              <div>
                <b>
                  50% OFF
                </b>
                <small>
                  New users
                </small>
              </div>
            </div>
            {/* CONTROLS */}
            <div className="hero-controls">
              <button
                onClick={() =>
                  setSlide(
                    (slide -
                      1 +
                      slides.length) %
                      slides.length
                  )
                }
              >
                <FaChevronLeft />
              </button>
              {slides.map(
                (_, index) => (
                  <button
                    key={index}
                    className={
                      index === slide
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setSlide(index)
                    }
                  />
                )
              )}
              <button
                onClick={() =>
                  setSlide(
                    (slide + 1) %
                      slides.length
                  )
                }
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* =================================================
          LIVE PLATFORM BAR
      ================================================= */}
      <section className="fg-live-strip">
        <div className="fg-shell fg-live-grid">
          <div className="fg-live-main">
            <i />
            <div>
              <b>
                FoodGo Live
              </b>
              <small>
                Real-time platform
                activity
              </small>
            </div>
          </div>
          <div>
            <b>
              {liveOrders.toLocaleString()}+
            </b>
            <span>
              active orders
            </span>
          </div>
          <div>
            <b>
              {onlinePartners.toLocaleString()}+
            </b>
            <span>
              delivery partners
            </span>
          </div>
          <div>
            <b>
              8,500+
            </b>
            <span>
              restaurant partners
            </span>
          </div>
          <div>
            <b>
              4.7★
            </b>
            <span>
              customer rating
            </span>
          </div>
        </div>
      </section>
      {/* =================================================
          CATEGORIES
      ================================================= */}
      <section className="fg-section">
        <div className="fg-shell">
          <div className="fg-section-heading">
            <div>
              <span className="fg-section-kicker">
                EXPLORE
              </span>
              <h2>
                What are you craving?
              </h2>
              <p>
                Browse by mood, cuisine
                or today's favourite.
              </p>
            </div>
            <Link
              to="/restaurants"
              className="fg-text-link"
            >
              View all
              <FaArrowRight />
            </Link>
          </div>
          <div className="fg-category-scroller">
            <button
              className={`fg-category-card ${
                category === "All"
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                chooseCategory("All")
              }
            >
              <span>✦</span>
              <b>All</b>
              <small>
                Everything
              </small>
            </button>
            {categories.map(
              (item) => (
                <button
                  key={item.id}
                  className={`fg-category-card ${
                    category ===
                    item.name
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    chooseCategory(
                      item.name
                    )
                  }
                  style={{
                    "--cat-bg":
                      item.color,
                  }}
                >
                  <span>
                    {item.emoji}
                  </span>
                  <b>
                    {item.name}
                  </b>
                  <small>
                    {item.description}
                  </small>
                </button>
              )
            )}
          </div>
        </div>
      </section>
      {/* =================================================
          OFFER SECTION
      ================================================= */}
      <section className="fg-section fg-savings">
        <div className="fg-shell">
          <div className="fg-section-heading compact">
            <div>
              <span className="fg-section-kicker">
                SMART SAVINGS
              </span>
              <h2>
                Deals made for you
              </h2>
            </div>
            <span className="fg-heading-note">
              <FaBolt />
              Updated frequently
            </span>
          </div>
          <div className="fg-offer-grid">
            {offers
              .slice(0, 4)
              .map(
                (offer, index) => (
                  <button
                    key={
                      offer.id ||
                      index
                    }
                    className={`fg-offer-card offer-${index}`}
                    onClick={() => {
                      setSelectedOffer(
                        offer
                      );
                      if (
                        offer.code
                      ) {
                        copyOffer(
                          offer.code
                        );
                      }
                    }}
                  >
                    <span>
                      <FaPercent />
                    </span>
                    <div>
                      <small>
                        {offer.title ||
                          "FOODGO OFFER"}
                      </small>
                      <b>
                        {offer.discount ||
                          offer.description ||
                          "Special savings"}
                      </b>
                      <em>
                        {offer.code
                          ? `Use ${offer.code}`
                          : "Limited time only"}
                      </em>
                    </div>
                    <FaArrowRight />
                  </button>
                )
              )}
          </div>
        </div>
      </section>
      {/* =================================================
          RESTAURANTS
      ================================================= */}
      <section
        className="fg-section"
        id="restaurants"
      >
        <div className="fg-shell">
          <div className="fg-section-heading">
            <div>
              <span className="fg-section-kicker">
                NEAR YOU
              </span>
              <h2>
                Top restaurants around{" "}
                {locationLabel}
              </h2>
              <p>
                Highly-rated places with
                reliable delivery.
              </p>
            </div>
            <Link
              to="/restaurants"
              className="fg-text-link"
            >
              See all
              <FaArrowRight />
            </Link>
          </div>
          {/* FILTERS */}
          <div className="fg-filter-bar">
            <div className="fg-filter-scroll">
              {[
                ["all", "All"],
                ["veg", "Pure veg"],
                ["nonveg", "Non-veg"],
                ["fast", "Fast delivery"],
                ["free", "Free delivery"],
              ].map(
                ([value, label]) => (
                  <button
                    key={value}
                    className={
                      (
                        value === "all" &&
                        foodType ===
                          "all" &&
                        deliveryType ===
                          "all"
                      ) ||
                      foodType ===
                        value ||
                      deliveryType ===
                        value
                        ? "active"
                        : ""
                    }
                    onClick={() => {
                      if (
                        value === "all"
                      ) {
                        setFoodType(
                          "all"
                        );
                        setDeliveryType(
                          "all"
                        );
                      } else if (
                        [
                          "veg",
                          "nonveg",
                        ].includes(
                          value
                        )
                      ) {
                        setFoodType(
                          value
                        );
                        setDeliveryType(
                          "all"
                        );
                      } else {
                        setDeliveryType(
                          value
                        );
                        setFoodType(
                          "all"
                        );
                      }
                    }}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
            <select
              value={sort}
              onChange={(e) =>
                setSort(
                  e.target.value
                )
              }
            >
              <option value="relevance">
                Relevance
              </option>
              <option value="rating">
                Top rated
              </option>
              <option value="delivery">
                Fastest
              </option>
              <option value="distance">
                Nearest
              </option>
            </select>
          </div>
          {/* RESTAURANT GRID */}
          {filteredRestaurants.length ? (
            <div className="fg-restaurant-grid">
              {(showAll
                ? filteredRestaurants
                : filteredRestaurants.slice(
                    0,
                    6
                  )
              ).map(
                (restaurant) => (
                  <div
                    className="fg-restaurant-wrapper"
                    key={
                      restaurant.id
                    }
                  >
                    <RestaurantCard
                      restaurant={
                        restaurant
                      }
                    />
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="fg-empty-inline">
              <span>
                🍽️
              </span>
              <h3>
                No restaurants found
              </h3>
              <p>
                Try another search or
                clear your filters.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setCategory(
                    "All"
                  );
                  setFoodType(
                    "all"
                  );
                  setDeliveryType(
                    "all"
                  );
                }}
              >
                Clear filters
              </button>
            </div>
          )}
          {filteredRestaurants.length >
            6 && (
            <div className="fg-center-action">
              <button
                className="fg-outline-btn"
                onClick={() =>
                  setShowAll(
                    (value) =>
                      !value
                  )
                }
              >
                {showAll
                  ? "Show fewer"
                  : `View all ${filteredRestaurants.length} restaurants`}
                <FaArrowRight />
              </button>
            </div>
          )}
        </div>
      </section>
      {/* =================================================
          TRENDING FOOD
      ================================================= */}
      {trending.length > 0 && <section className="fg-section fg-trending">
        <div className="fg-shell">
          <div className="fg-section-heading">
            <div>
              <span className="fg-section-kicker">
                TRENDING NOW
              </span>
              <h2>
                Everyone is ordering these
              </h2>
              <p>
                10 handpicked dishes from
                restaurants you can order from.
              </p>
            </div>
            <span className="fg-fire-heading">
              <FaFire />
              Trending
            </span>
          </div>
          <div className="fg-food-grid">
            {trending.map(
              (food) => (
                <div
                  className="fg-food-wrapper"
                  key={food.id}
                >
                  <FoodCard
                    food={food}
                    addToCart={
                      handleAddFood
                    }
                  />
                </div>
              )
            )}
          </div>
        </div>
      </section>}
      {/* =================================================
          PERSONALIZED
      ================================================= */}
      {recommendations.length > 0 && <section className="fg-section fg-personal">
        <div className="fg-shell fg-personal-grid">
          <div>
            <span className="fg-section-kicker">
              PERSONALISED FOR YOU
            </span>
            <h2>
              Your next favourite dish
              is probably here.
            </h2>
            <p>
              Smart recommendations
              based on what people nearby
              are loving.
            </p>
            <Link
              to="/restaurants"
              className="fg-btn fg-btn-primary"
            >
              Explore recommendations
              <FaArrowRight />
            </Link>
          </div>
          <div className="fg-recommendations">
            {recommendations.map(
              (food) => (
                <button
                  key={food.id}
                  onClick={() =>
                    handleAddFood(
                      food
                    )
                  }
                >
                  <img
                    src={food.image}
                    alt={food.name}
                  />
                  <span>
                    <b>
                      {food.name}
                    </b>
                    <small>
                      {food.category}
                      {" · "}
                      ⭐{" "}
                      {food.rating}
                    </small>
                    <strong>
                      ₹{food.price}
                    </strong>
                  </span>
                  <FaPlus />
                </button>
              )
            )}
          </div>
        </div>
      </section>}
      {/* =================================================
          LIVE TRACKING
      ================================================= */}
      <section className="fg-section">
        <div className="fg-shell">
          <div className="fg-tracking-banner">
            <div className="fg-map-art">
              <span>🍴</span>
              <div className="fg-route-line" />
              <b>🏍️</b>
              <strong>⌂</strong>
              <div className="fg-map-pin pin-one">
                <FaMapMarkerAlt />
              </div>
              <div className="fg-map-pin pin-two">
                <FaMapMarkerAlt />
              </div>
            </div>
            <div>
              <span className="fg-live-chip">
                <i />
                LIVE TRACKING
              </span>
              <span className="fg-section-kicker">
                FROM KITCHEN TO DOOR
              </span>
              <h2>
                Know where your food
                is, every minute.
              </h2>
              <p>
                Follow your delivery
                partner on a live map and
                get accurate arrival
                updates.
              </p>
              <div className="fg-tracking-steps">
                <span>
                  ✓ Order confirmed
                </span>
                <span>
                  ✓ Preparing
                </span>
                <span className="current">
                  🏍 On the way
                </span>
                <span>
                  Doorstep
                </span>
              </div>
              <Link
                to="/orders"
                className="fg-btn fg-btn-dark"
              >
                View my orders
                <FaArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* =================================================
          BENEFITS
      ================================================= */}
      <section className="fg-section fg-benefits">
        <div className="fg-shell">
          <div className="fg-section-heading center">
            <span className="fg-section-kicker">
              WHY FOODGO?
            </span>
            <h2>
              More than just food delivery.
            </h2>
          </div>
          <div className="fg-benefit-grid">
            <article>
              <span>
                <FaRocket />
              </span>
              <h3>
                Lightning fast
              </h3>
              <p>
                Smart routing and nearby
                restaurants help your food
                arrive faster.
              </p>
            </article>
            <article>
              <span>
                <FaShieldAlt />
              </span>
              <h3>
                Safe & secure
              </h3>
              <p>
                Secure checkout and
                verified restaurant partners.
              </p>
            </article>
            <article>
              <span>
                <FaAward />
              </span>
              <h3>
                Quality first
              </h3>
              <p>
                Discover highly-rated dishes
                from trusted restaurants.
              </p>
            </article>
            <article>
              <span>
                <FaGift />
              </span>
              <h3>
                Better rewards
              </h3>
              <p>
                Enjoy exclusive coupons,
                offers and personalised deals.
              </p>
            </article>
          </div>
        </div>
      </section>
      {/* =================================================
          TESTIMONIALS
      ================================================= */}
      <section className="fg-section">
        <div className="fg-shell">
          <div className="fg-section-heading center">
            <span className="fg-section-kicker">
              LOVED BY FOODIES
            </span>
            <h2>
              People order.
              People smile.
            </h2>
          </div>
          <div className="fg-testimonial-grid">
            {testimonials
              .slice(0, 3)
              .map(
                (
                  testimonial,
                  index
                ) => (
                  <article
                    key={
                      testimonial.id ||
                      index
                    }
                  >
                    <div>
                      ★★★★★
                    </div>
                    <p>
                      “
                      {testimonial.message ||
                        testimonial.text ||
                        testimonial.review ||
                        "Great food, fast delivery and a beautiful experience."}
                      ”
                    </p>
                    <span>
                      {(
                        testimonial.name ||
                        "FoodGo User"
                      ).charAt(0)}
                    </span>
                    <b>
                      {testimonial.name ||
                        "FoodGo User"}
                    </b>
                    <small>
                      Verified customer
                    </small>
                  </article>
                )
              )}
          </div>
        </div>
      </section>
      {/* =================================================
          SEARCH MODAL
      ================================================= */}
      {searchOpen && (
        <div
          className="fg-overlay"
          onClick={() =>
            setSearchOpen(false)
          }
        >
          <div
            className="fg-search-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="fg-modal-search">
              <FaSearch />
              <input
                autoFocus
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search restaurants, dishes or cuisines..."
              />
              <button
                onClick={() =>
                  setSearchOpen(false)
                }
              >
                <FaTimes />
              </button>
            </div>
            <span className="fg-modal-label">
              <FaFire />
              Popular searches
            </span>
            {searchSuggestions
              .slice(0, 8)
              .filter(
                (item) =>
                  !search ||
                  item
                    .toLowerCase()
                    .includes(
                      search.toLowerCase()
                    )
              )
              .map(
                (item) => (
                  <button
                    className="fg-search-result"
                    key={item}
                    onClick={() => {
                      setSearch(
                        item
                      );
                      setSearchOpen(
                        false
                      );
                      setTimeout(
                        () => {
                          document
                            .getElementById(
                              "restaurants"
                            )
                            ?.scrollIntoView(
                              {
                                behavior:
                                  "smooth",
                              }
                            );
                        },
                        100
                      );
                    }}
                  >
                    {item}
                    <FaArrowRight />
                  </button>
                )
              )}
          </div>
        </div>
      )}
      {/* =================================================
          LOCATION MODAL
      ================================================= */}
      {locationOpen && (
        <div
          className="fg-overlay"
          onClick={() =>
            setLocationOpen(false)
          }
        >
          <div
            className="fg-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="fg-modal-close"
              onClick={() =>
                setLocationOpen(false)
              }
            >
              <FaTimes />
            </button>
            <span className="fg-modal-icon">
              <FaMapMarkerAlt />
            </span>
            <span className="fg-section-kicker">
              DELIVERY LOCATION
            </span>
            <h2>
              Where should we deliver?
            </h2>
            <p>
              Choose a city or state to personalise
              restaurants and offers.
            </p>
            <button
              className="fg-detect"
              onClick={() =>
                navigator.geolocation?.getCurrentPosition(
                  () =>
                    chooseLocation(
                      "Current Location"
                    ),
                  () =>
                    notify(
                      "Could not detect your location"
                    )
                )
              }
            >
              <FaLocationArrow />
              Detect my location
            </button>
            <div className="fg-city-grid">
              <button className={location === "All India" ? "selected" : ""} onClick={() => chooseLocation("All India")}>
                <FaMapMarkerAlt /> All India {location === "All India" && <FaCheck />}
              </button>
              {liveLocations.map((item) => { const key = `${item.city}|${item.state}`; return <button key={key} className={location === key ? "selected" : ""} onClick={() => chooseLocation(key, `${item.city}, ${item.state}`)}><FaMapMarkerAlt /> {item.city}, {item.state} {location === key && <FaCheck />}</button>; })}
            </div>
          </div>
        </div>
      )}
      {/* =================================================
          OFFER MODAL
      ================================================= */}
      {selectedOffer && (
        <div
          className="fg-overlay"
          onClick={() =>
            setSelectedOffer(null)
          }
        >
          <div
            className="fg-modal fg-offer-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="fg-modal-close"
              onClick={() =>
                setSelectedOffer(null)
              }
            >
              <FaTimes />
            </button>
            <span className="fg-modal-icon">
              <FaPercent />
            </span>
            <span className="fg-section-kicker">
              FOODGO DEAL
            </span>
            <h2>
              {selectedOffer.title ||
                "Exclusive FoodGo offer"}
            </h2>
            <p>
              {selectedOffer.description ||
                selectedOffer.discount ||
                "Save more on your next order."}
            </p>
            {selectedOffer.code && (
              <button
                className="fg-coupon"
                onClick={() =>
                  copyOffer(
                    selectedOffer.code
                  )
                }
              >
                {selectedOffer.code}
                <FaCopy />
              </button>
            )}
          </div>
        </div>
      )}
      {/* =================================================
          LOGIN MODAL
      ================================================= */}
      {loginOpen && (
        <div
          className="fg-overlay"
          onClick={() =>
            setLoginOpen(false)
          }
        >
          <div
            className="fg-modal fg-login-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="fg-modal-close"
              onClick={() =>
                setLoginOpen(false)
              }
            >
              <FaTimes />
            </button>
            <span className="fg-modal-icon">
              <FaUser />
            </span>
            <span className="fg-section-kicker">
              WELCOME TO FOODGO
            </span>
            <h2>
              Login to your account
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                localStorage.setItem(
                  "foodgoUser",
                  JSON.stringify({
                    email:
                      loginData.email,
                    name:
                      loginData.email.split(
                        "@"
                      )[0],
                    loggedIn: true,
                  })
                );
                setLoginOpen(
                  false
                );
                notify(
                  "Welcome back!"
                );
              }}
            >
              <label>
                Email
              </label>
              <div className="fg-input">
                <FaEnvelope />
                <input
                  required
                  type="email"
                  value={
                    loginData.email
                  }
                  onChange={(e) =>
                    setLoginData({
                      ...loginData,
                      email:
                        e.target.value,
                    })
                  }
                />
              </div>
              <label>
                Password
              </label>
              <div className="fg-input">
                <FaLock />
                <input
                  required
                  type="password"
                  value={
                    loginData.password
                  }
                  onChange={(e) =>
                    setLoginData({
                      ...loginData,
                      password:
                        e.target.value,
                    })
                  }
                />
              </div>
              <button
                className="fg-btn fg-btn-primary"
                type="submit"
              >
                Login to FoodGo
              </button>
            </form>
            <Link
              to="/register"
              onClick={() =>
                setLoginOpen(false)
              }
              className="fg-create-account"
            >
              <FaUserPlus />
              Create a new account
            </Link>
          </div>
        </div>
      )}
      {/* =================================================
          TOAST
      ================================================= */}
      {toast && (
        <div className="fg-toast">
          <FaCheck />
          {toast}
        </div>
      )}
    </div>
  );
}
