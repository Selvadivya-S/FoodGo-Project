import React, { useEffect, useMemo, useState } from "react";

import {
  FaShoppingBag,
  FaRupeeSign,
  FaUtensils,
  FaStore,
  FaMapMarkerAlt,
  FaExternalLinkAlt,
  FaEdit,
  FaTrash,
  FaPlus,
  FaCheckCircle,
  FaChartLine,
} from "react-icons/fa";

import DashboardLayout from "../components/DashboardLayout";

import {
  getDashboard,
  restaurantMenu,
  addDish,
  updateDish,
  deleteDish,
  restaurantOrders,
  updateRestaurantOrder,
  getRestaurantAnalytics,
  updateRestaurant,
} from "../api/foodApi";


// --------------------------------------------------
// Empty dish form
// --------------------------------------------------

const EMPTY_DISH = {
  name: "",
  price: "",
  category: "",
  description: "",
  image: "",
  isVeg: null,
  isAvailable: true,
};


// ==================================================
// RESTAURANT DASHBOARD
// ==================================================

export default function RestaurantDashboard({
  section = "overview",
}) {
  // ------------------------------------------------
  // Get logged-in restaurant owner
  // ------------------------------------------------

  const user = JSON.parse(
    localStorage.getItem("foodgo_user") || "{}"
  );


  // ------------------------------------------------
  // Dashboard state
  // ------------------------------------------------

  const [data, setData] = useState({
    restaurant: null,
    restaurants: [],
    totalOrders: 0,
    todayOrders: 0,
    todayRevenue: 0,
    menuItems: 0,
    recentOrders: [],
  });

  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [dish, setDish] = useState(EMPTY_DISH);
  const [editing, setEditing] = useState(null);

  const [profile, setProfile] = useState({});

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(localStorage.getItem("foodgo_selected_restaurant") || "");


  // ------------------------------------------------
  // Get restaurant ID
  // ------------------------------------------------

  const restaurantId = useMemo(
    () => data.restaurant?._id || null,
    [data.restaurant]
  );


  // ==================================================
  // LOAD DASHBOARD
  // ==================================================

  const load = async () => {
    try {
      setError("");

      const result = await getDashboard("restaurant_owner", selectedRestaurantId || undefined);
      setData(result || {});
      if (Array.isArray(result?.restaurants) && result.restaurants.length) {
        const valid = result.restaurants.some((r) => String(r._id) === String(selectedRestaurantId));
        const id = valid ? selectedRestaurantId : String(result.restaurants[0]._id);
        if (id !== selectedRestaurantId) {
          setSelectedRestaurantId(id);
          localStorage.setItem("foodgo_selected_restaurant", id);
        }
      }
      if (result?.restaurant) setProfile(result.restaurant);
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Unable to load restaurant dashboard."
      );
    }
  };


  // ==================================================
  // LOAD MENU + ORDERS
  // ==================================================

  const loadData = async (id) => {
    if (!id) return;

    try {
      const [m, o] = await Promise.all([
        restaurantMenu(id),
        restaurantOrders(id),
      ]);

      setMenu(Array.isArray(m) ? m : []);
      setOrders(Array.isArray(o) ? o : []);
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Unable to load menu and orders."
      );
    }
  };


  // ------------------------------------------------
  // Load dashboard whenever section changes
  // ------------------------------------------------

  useEffect(() => {
    load();

    // Keep the dashboard in sync with admin approvals.
    // A pending restaurant becomes available automatically after the admin approves it.
    const approvalRefresh = window.setInterval(() => {
      load();
    }, 10000);

    return () => window.clearInterval(approvalRefresh);
  }, [section, selectedRestaurantId]);


  // ------------------------------------------------
  // Load menu and orders when restaurant ID changes
  // ------------------------------------------------

  useEffect(() => {
    loadData(restaurantId);
  }, [restaurantId]);


  // ------------------------------------------------
  // Load analytics only when analytics section opens
  // ------------------------------------------------

  useEffect(() => {
    if (section === "analytics") {
      getRestaurantAnalytics(selectedRestaurantId || undefined)
        .then(setAnalytics)
        .catch((e) =>
          setError(
            e.response?.data?.message ||
              "Unable to load analytics."
          )
        );
    }
  }, [section, selectedRestaurantId]);


  // ==================================================
  // ADD / UPDATE DISH
  // ==================================================

  const saveDish = async (e) => {
    e.preventDefault();

    if (!restaurantId) return;

    if (dish.isVeg === null) {
      setError(
        "Please select Veg or Non-Veg for this dish."
      );
      return;
    }

    try {
      setError("");
      setSaving(true);

      const payload = {
        ...dish,
        price: Number(dish.price),
        isVeg: dish.isVeg === true,
        isAvailable: Boolean(dish.isAvailable),
      };

      if (editing) {
        await updateDish(editing._id, payload);
      } else {
        await addDish(restaurantId, payload);
      }

      setDish(EMPTY_DISH);
      setEditing(null);

      setMessage(
        editing
          ? "Dish updated."
          : "Dish added."
      );

      await Promise.all([
        load(),
        loadData(restaurantId),
      ]);
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Unable to save dish."
      );
    } finally {
      setSaving(false);
    }
  };


  // ==================================================
  // DELETE DISH
  // ==================================================

  const removeDish = async (id) => {
    if (
      !window.confirm(
        "Remove this dish from the menu?"
      )
    ) {
      return;
    }

    try {
      await deleteDish(id);

      setMessage("Dish removed.");

      await Promise.all([
        load(),
        loadData(restaurantId),
      ]);
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Unable to remove dish."
      );
    }
  };


  // ==================================================
  // CHANGE ORDER STATUS
  // ==================================================

  const changeStatus = async (
    order,
    status
  ) => {
    try {
      await updateRestaurantOrder(
        restaurantId,
        order._id,
        status
      );

      setMessage(
        `Order updated to ${status}.`
      );

      await Promise.all([
        load(),
        loadData(restaurantId),
      ]);
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Unable to update order."
      );
    }
  };


  // ==================================================
  // SAVE RESTAURANT PROFILE
  // ==================================================

  const saveProfile = async (e) => {
    e.preventDefault();

    try {
      const updated = await updateRestaurant(
        restaurantId,
        {
          name: profile.name,
          brandName: profile.brandName,
          branchName: profile.branchName,
          description: profile.description,
          phone: profile.phone,
          email: profile.email,
          cuisine: profile.cuisine,

          address: profile.address,

          googleMapsUrl:
            profile.googleMapsUrl,

          deliveryFee: Number(
            profile.deliveryFee ?? 40
          ),

          freeDelivery:
            Boolean(profile.freeDelivery),

          images: Array.isArray(
            profile.images
          )
            ? profile.images
            : typeof profile.images ===
              "string"
            ? profile.images
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)
            : [],
        }
      );

      setData((d) => ({
        ...d,
        restaurant: updated,
      }));

      setProfile(updated);

      setMessage(
        "Restaurant profile updated."
      );
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Unable to update restaurant."
      );
    }
  };


  // ==================================================
  // GOOGLE MAPS URL
  // ==================================================

  const mapQuery = [
    profile.address?.street,
    profile.address?.city,
    profile.address?.state,
    profile.address?.pincode,
  ]
    .filter(Boolean)
    .join(", ");


  const mapUrl =
    profile.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      mapQuery || profile.name || ""
    )}`;


  // ==================================================
  // DASHBOARD UI
  // ==================================================

  return (
    <DashboardLayout
      role="restaurant"
      name={user.name || "Restaurant Partner"}
      section={section}
    >

      {/* -------------------------------------------- */}
      {/* Restaurant Hero */}
      {/* -------------------------------------------- */}

      <section className="restaurant-hero">

        <div>
          <span className="dashboard-label">
            RESTAURANT CONTROL CENTER
          </span>

          <h2>
            {data.restaurant?.name ||
              "Restaurant"}
          </h2>

          <p>
            {data.restaurant
              ? `${
                  [
                    data.restaurant.address?.city,
                    data.restaurant.address?.state,
                  ]
                    .filter(Boolean)
                    .join(", ") ||
                  "Location not set"
                } · ${
                  data.restaurant.isApproved
                    ? "Approved"
                    : "Pending approval"
                }`
              : "No restaurant assigned to this account."}
          </p>
        </div>


        {data.restaurants?.length > 0 && (
          <div className="restaurant-selector">
            <label htmlFor="dashboard-restaurant">Manage restaurant</label>
            <select
              id="dashboard-restaurant"
              value={selectedRestaurantId || data.restaurant?._id || ""}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedRestaurantId(id);
                localStorage.setItem("foodgo_selected_restaurant", id);
              }}
            >
              {data.restaurants.map((restaurant) => (
                <option key={restaurant._id} value={restaurant._id}>
                  {restaurant.name}{restaurant.branchName ? ` — ${restaurant.branchName}` : ""}{restaurant.address?.city ? ` (${restaurant.address.city})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="system-health">
          <span />

          <div>
            <strong>
              {data.restaurant?.isOpen
                ? "Restaurant is Online"
                : "Restaurant is Offline"}
            </strong>

            <small>
              {data.restaurant?.isApproved
                ? "Published on FoodGo"
                : "Waiting for approval"}
            </small>
          </div>
        </div>

      </section>


      {/* -------------------------------------------- */}
      {/* Dashboard Statistics */}
      {/* -------------------------------------------- */}

      <section className="dashboard-stats">

        <Stat
          icon={<FaShoppingBag />}
          value={data.todayOrders || 0}
          label="Today's Orders"
        />

        <Stat
          icon={<FaRupeeSign />}
          value={`₹${Number(
            data.todayRevenue || 0
          ).toFixed(0)}`}
          label="Today's Revenue"
        />

        <Stat
          icon={<FaUtensils />}
          value={data.menuItems || 0}
          label="Menu Items"
        />

        <Stat
          icon={<FaStore />}
          value={data.totalOrders || 0}
          label="Total Orders"
        />

      </section>


      {/* -------------------------------------------- */}
      {/* Messages */}
      {/* -------------------------------------------- */}

      {error && (
        <div className="fg-inline-error">
          {error}
        </div>
      )}

      {message && (
        <div className="fg-inline-success">
          {message}
        </div>
      )}


      {/* -------------------------------------------- */}
      {/* Main Dashboard Content */}
      {/* -------------------------------------------- */}

      {!restaurantId ? (

        <section className="dashboard-card">
          <h3>
            Waiting for restaurant approval
          </h3>

          <p>
            Your restaurant will appear here automatically after an administrator approves it.
            Once it is approved, you can add and manage its dishes.
          </p>
        </section>

      ) : section === "orders" ? (

        <Orders
          orders={orders}
          onStatus={changeStatus}
        />

      ) : section === "menu" ? (

        <Menu
          menu={menu}
          dish={dish}
          setDish={setDish}
          editing={editing}
          setEditing={setEditing}
          saveDish={saveDish}
          removeDish={removeDish}
          saving={saving}
        />

      ) : section === "analytics" ? (

        <Analytics data={analytics} />

      ) : section === "profile" ? (

        <Profile
          profile={profile}
          setProfile={setProfile}
          saveProfile={saveProfile}
          mapUrl={mapUrl}
        />

      ) : section === "account" ? (

        <Account profile={user} />

      ) : (

        <Overview
          data={data}
          orders={orders}
          menu={menu}
        />

      )}

    </DashboardLayout>
  );
}


// ==================================================
// OVERVIEW
// ==================================================

function Overview({
  data,
  orders,
}) {
  return (
    <>
      <section className="dashboard-card">

        <span className="dashboard-label">
          OVERVIEW
        </span>

        <h3>
          {data.restaurant?.name}
        </h3>

        <p>
          {data.restaurant?.description ||
            "Manage your restaurant, menu and orders from the sidebar."}
        </p>

        <p>
          <b>Menu:</b>{" "}
          {data.menuItems || 0} dishes

          {" · "}

          <b>Orders:</b>{" "}
          {data.totalOrders || 0}
        </p>

      </section>

      <Orders
        orders={orders.slice(0, 5)}
        compact
      />
    </>
  );
}


// ==================================================
// ORDERS
// ==================================================

function Orders({
  orders,
  onStatus,
  compact = false,
}) {
  return (
    <section className="dashboard-card">

      <div className="card-heading">

        <div>
          <span className="dashboard-label">
            {compact
              ? "RECENT ORDERS"
              : "LIVE OPERATIONS"}
          </span>

          <h3>
            {compact
              ? "Recent orders"
              : "Restaurant orders"}
          </h3>
        </div>

      </div>


      {!orders.length ? (

        <p>
          No customer orders yet.
        </p>

      ) : (

        orders.map((order) => (

          <div
            className="restaurant-order"
            key={order._id}
          >

            <div>
              <span>
                #
                {String(order._id)
                  .slice(-8)
                  .toUpperCase()}
              </span>

              <strong>
                {order.items
                  ?.map(
                    (i) =>
                      `${i.name} × ${i.quantity}`
                  )
                  .join(", ") ||
                  "Order items"}
              </strong>

              <small>
                {new Date(
                  order.createdAt
                ).toLocaleString()}
              </small>
            </div>


            <strong>
              ₹
              {Number(
                order.pricing?.total || 0
              ).toFixed(0)}
            </strong>


            <span>
              {order.status}
            </span>


            {!compact && (
              <select
                value={order.status}
                onChange={(e) =>
                  onStatus(
                    order,
                    e.target.value
                  )
                }
              >
                <option value="PLACED">
                  Placed
                </option>

                <option value="CONFIRMED">
                  Confirmed
                </option>

                <option value="PREPARING">
                  Preparing
                </option>

                <option value="READY_FOR_PICKUP">
                  Ready for pickup
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>

                <option value="REJECTED">
                  Rejected
                </option>
              </select>
            )}

          </div>
        ))
      )}

    </section>
  );
}


// ==================================================
// MENU MANAGEMENT
// ==================================================

function Menu({
  menu,
  dish,
  setDish,
  editing,
  setEditing,
  saveDish,
  removeDish,
  saving,
}) {
  return (
    <>
      {/* ------------------------------------------ */}
      {/* Add / Edit Dish */}
      {/* ------------------------------------------ */}

      <section className="dashboard-card">

        <div className="card-heading">

          <div>
            <span className="dashboard-label">
              MENU MANAGEMENT
            </span>

            <h3>
              {editing
                ? "Edit dish"
                : "Add a dish"}
            </h3>
          </div>


          {editing && (
            <button
              className="detail-btn"
              type="button"
              onClick={() => {
                setEditing(null);
                setDish(EMPTY_DISH);
              }}
            >
              Cancel
            </button>
          )}

        </div>


        <form
          className="fg-form-grid"
          onSubmit={saveDish}
        >

          <input
            required
            placeholder="Dish name"
            value={dish.name}
            onChange={(e) =>
              setDish({
                ...dish,
                name: e.target.value,
              })
            }
          />


          <input
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="Price"
            value={dish.price}
            onChange={(e) =>
              setDish({
                ...dish,
                price: e.target.value,
              })
            }
          />


          <input
            placeholder="Category"
            value={dish.category}
            onChange={(e) =>
              setDish({
                ...dish,
                category: e.target.value,
              })
            }
          />


          <input
            placeholder="Image URL"
            value={dish.image}
            onChange={(e) =>
              setDish({
                ...dish,
                image: e.target.value,
              })
            }
          />


          <textarea
            className="wide"
            placeholder="Description"
            value={dish.description}
            onChange={(e) =>
              setDish({
                ...dish,
                description: e.target.value,
              })
            }
          />


          {/* Food Type */}

          <div className="food-type-field wide">

            <strong>
              Food type <span>*</span>
            </strong>


            <div className="food-type-options">

              <label
                className={`food-type-option veg-option ${
                  dish.isVeg === true
                    ? "selected"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="restaurant-dish-type"
                  checked={dish.isVeg === true}
                  onChange={() =>
                    setDish({
                      ...dish,
                      isVeg: true,
                    })
                  }
                />

                <span>
                  🌿 Veg
                </span>
              </label>


              <label
                className={`food-type-option nonveg-option ${
                  dish.isVeg === false
                    ? "selected"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="restaurant-dish-type"
                  checked={dish.isVeg === false}
                  onChange={() =>
                    setDish({
                      ...dish,
                      isVeg: false,
                    })
                  }
                />

                <span>
                  🍗 Non-Veg
                </span>
              </label>

            </div>


            <small>
              Select exactly one. This controls
              the Veg / Non-Veg label shown to
              customers.
            </small>

          </div>


          {/* Availability */}

          <label>
            <input
              type="checkbox"
              checked={dish.isAvailable}
              onChange={(e) =>
                setDish({
                  ...dish,
                  isAvailable:
                    e.target.checked,
                })
              }
            />

            {" "}
            Available
          </label>


          {/* Save Button */}

          <button
            className="detail-btn"
            disabled={saving}
            type="submit"
          >
            <FaPlus />

            {" "}

            {saving
              ? "Saving…"
              : editing
              ? "Update dish"
              : "Add dish"}
          </button>

        </form>

      </section>


      {/* ------------------------------------------ */}
      {/* Live Menu */}
      {/* ------------------------------------------ */}

      <section className="dashboard-card">

        <span className="dashboard-label">
          {menu.length} ITEMS
        </span>

        <h3>
          Live menu
        </h3>


        {!menu.length ? (

          <p>
            No dishes yet.
          </p>

        ) : (

          <div className="orders-table">

            {menu.map((item) => (

              <div
                className="order-row"
                key={item._id}
              >

                <div className="order-food-icon">
                  🍽️
                </div>


                <div>
                  <strong>
                    {item.name}
                  </strong>

                  <span>
                    {item.category ||
                      "Uncategorised"}

                    {" · "}

                    {item.isVeg === true
                      ? "Veg"
                      : "Non-Veg"}

                    {" · "}

                    {item.isAvailable
                      ? "Available"
                      : "Paused"}
                  </span>
                </div>


                <strong>
                  ₹
                  {Number(
                    item.price
                  ).toFixed(0)}
                </strong>


                {/* Edit */}

                <button
                  type="button"
                  onClick={() => {
                    setEditing(item);

                    setDish({
                      ...EMPTY_DISH,
                      ...item,
                      price: String(
                        item.price
                      ),
                      isVeg:
                        Boolean(
                          item.isVeg
                        ),
                    });
                  }}
                >
                  <FaEdit />
                </button>


                {/* Delete */}

                <button
                  type="button"
                  onClick={() =>
                    removeDish(item._id)
                  }
                >
                  <FaTrash />
                </button>

              </div>
            ))}

          </div>
        )}

      </section>
    </>
  );
}


// ==================================================
// ANALYTICS
// ==================================================

function Analytics({ data }) {
  if (!data) {
    return (
      <section className="dashboard-card">
        <p>
          Loading analytics…
        </p>
      </section>
    );
  }


  const max = Math.max(
    1,
    ...(data.daily || []).map(
      (x) => Number(x.revenue || 0)
    )
  );


  return (
    <>
      {/* Analytics statistics */}

      <section className="dashboard-stats">

        <Stat
          icon={<FaRupeeSign />}
          value={`₹${Number(
            data.totalRevenue || 0
          ).toFixed(0)}`}
          label="Paid Revenue"
        />

        <Stat
          icon={<FaShoppingBag />}
          value={data.totalOrders || 0}
          label="Total Orders"
        />

        <Stat
          icon={<FaStore />}
          value={data.rating || 0}
          label="Restaurant Rating"
        />

        <Stat
          icon={<FaChartLine />}
          value={`${data.repeatCustomers || 0}%`}
          label="Repeat Customers"
        />

      </section>


      {/* Revenue chart */}

      <section className="dashboard-card">

        <span className="dashboard-label">
          LAST 7 DAYS
        </span>

        <h3>
          Revenue & orders
        </h3>


        <div className="simple-chart">

          {(data.daily || []).map(
            (row) => (

              <div
                key={row._id}
                className="simple-chart-col"
              >

                <div
                  title={`₹${
                    row.revenue || 0
                  }`}
                  style={{
                    height: `${Math.max(
                      8,
                      (Number(
                        row.revenue || 0
                      ) /
                        max) *
                        100
                    )}%`,
                  }}
                />


                <span>
                  {row._id.slice(5)}
                </span>

                <small>
                  {row.orders} orders
                </small>

              </div>
            )
          )}

        </div>

      </section>


      {/* Top dishes */}

      <section className="dashboard-card">

        <span className="dashboard-label">
          TOP DISHES
        </span>

        <h3>
          Best-selling dishes from actual
          orders
        </h3>


        {!data.topDishes?.length ? (

          <p>
            No order history is available yet.
          </p>

        ) : (

          data.topDishes.map((d) => (

            <div
              className="order-row"
              key={String(d._id)}
            >

              <div>
                🍽️
              </div>

              <div>
                <strong>
                  {d.name}
                </strong>

                <span>
                  {d.quantity} units sold
                </span>
              </div>

              <strong>
                ₹
                {Number(
                  d.revenue || 0
                ).toFixed(0)}
              </strong>

            </div>

          ))
        )}

      </section>
    </>
  );
}


// ==================================================
// RESTAURANT PROFILE
// ==================================================

function Profile({
  profile,
  setProfile,
  saveProfile,
  mapUrl,
}) {
  const imageUrls = Array.isArray(
    profile.images
  )
    ? profile.images.join(", ")
    : profile.images || "";


  return (
    <section className="dashboard-card">

      <span className="dashboard-label">
        RESTAURANT PROFILE
      </span>

      <h3>
        Edit restaurant information
      </h3>


      <form
        className="fg-form-grid"
        onSubmit={saveProfile}
      >

        {/* Restaurant information */}

        <input
          required
          placeholder="Restaurant name"
          value={profile.name || ""}
          onChange={(e) =>
            setProfile({
              ...profile,
              name: e.target.value,
            })
          }
        />


        <input
          placeholder="Brand name"
          value={profile.brandName || ""}
          onChange={(e) =>
            setProfile({
              ...profile,
              brandName: e.target.value,
            })
          }
        />


        <input
          placeholder="Branch name"
          value={profile.branchName || ""}
          onChange={(e) =>
            setProfile({
              ...profile,
              branchName: e.target.value,
            })
          }
        />


        <input
          placeholder="Phone"
          value={profile.phone || ""}
          onChange={(e) =>
            setProfile({
              ...profile,
              phone: e.target.value,
            })
          }
        />


        <input
          placeholder="Email"
          value={profile.email || ""}
          onChange={(e) =>
            setProfile({
              ...profile,
              email: e.target.value,
            })
          }
        />


        <input
          placeholder="Cuisine (comma separated)"
          value={
            Array.isArray(profile.cuisine)
              ? profile.cuisine.join(", ")
              : profile.cuisine || ""
          }
          onChange={(e) =>
            setProfile({
              ...profile,
              cuisine: e.target.value
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
            })
          }
        />


        <textarea
          className="wide"
          placeholder="Description"
          value={profile.description || ""}
          onChange={(e) =>
            setProfile({
              ...profile,
              description:
                e.target.value,
            })
          }
        />


        {/* Restaurant images */}

        <input
          className="wide"
          placeholder="Restaurant image URL(s), comma separated"
          value={imageUrls}
          onChange={(e) =>
            setProfile({
              ...profile,
              images: e.target.value,
            })
          }
        />


        <small className="wide">
          Paste one or more direct image URLs.
          Separate multiple URLs with commas.
        </small>


        {/* Image preview */}

        {Array.isArray(profile.images) &&
          profile.images.length > 0 && (

            <div
              className="wide"
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >

              {profile.images.map(
                (url, i) => (

                  <img
                    key={`${url}-${i}`}
                    src={url}
                    alt={`Restaurant ${
                      i + 1
                    }`}
                    style={{
                      width: 140,
                      height: 95,
                      objectFit: "cover",
                      borderRadius: 12,
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display =
                        "none";
                    }}
                  />

                )
              )}

            </div>
          )}


        {/* Address */}

        <input
          className="wide"
          placeholder="Street"
          value={
            profile.address?.street || ""
          }
          onChange={(e) =>
            setProfile({
              ...profile,
              address: {
                ...profile.address,
                street: e.target.value,
              },
            })
          }
        />


        <input
          placeholder="City"
          value={
            profile.address?.city || ""
          }
          onChange={(e) =>
            setProfile({
              ...profile,
              address: {
                ...profile.address,
                city: e.target.value,
              },
            })
          }
        />


        <input
          placeholder="State"
          value={
            profile.address?.state || ""
          }
          onChange={(e) =>
            setProfile({
              ...profile,
              address: {
                ...profile.address,
                state: e.target.value,
              },
            })
          }
        />


        <input
          placeholder="Pincode"
          value={
            profile.address?.pincode || ""
          }
          onChange={(e) =>
            setProfile({
              ...profile,
              address: {
                ...profile.address,
                pincode: e.target.value,
              },
            })
          }
        />


        {/* Google Maps */}

        <input
          className="wide"
          placeholder="Google Maps URL"
          value={
            profile.googleMapsUrl || ""
          }
          onChange={(e) =>
            setProfile({
              ...profile,
              googleMapsUrl:
                e.target.value,
            })
          }
        />


        {/* Delivery fee */}

        <input
          type="number"
          min="0"
          step="1"
          placeholder="Delivery fee (₹)"
          value={
            profile.deliveryFee ?? 40
          }
          onChange={(e) =>
            setProfile({
              ...profile,
              deliveryFee:
                e.target.value,
            })
          }
        />


        {/* Free delivery */}

        <label>
          <input
            type="checkbox"
            checked={
              profile.freeDelivery === true
            }
            onChange={(e) =>
              setProfile({
                ...profile,
                freeDelivery:
                  e.target.checked,
              })
            }
          />

          {" "}
          Offer free delivery
        </label>


        {/* Save */}

        <button
          className="detail-btn"
          type="submit"
        >
          <FaCheckCircle />
          {" "}
          Save restaurant
        </button>


        {/* Google Maps button */}

        <a
          className="detail-btn"
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
        >
          <FaMapMarkerAlt />
          {" "}
          Open Google Maps
          {" "}
          <FaExternalLinkAlt />
        </a>

      </form>

    </section>
  );
}


// ==================================================
// ACCOUNT
// ==================================================

function Account({
  profile,
}) {
  return (
    <section className="dashboard-card">

      <span className="dashboard-label">
        ACCOUNT
      </span>

      <h3>
        {profile.name ||
          "Restaurant partner"}
      </h3>

      <p>
        {profile.email}
      </p>

      <p>
        Use the profile tab to edit
        restaurant details. Use the account
        settings link for personal profile
        changes.
      </p>

    </section>
  );
}


// ==================================================
// STAT CARD
// ==================================================

const Stat = ({
  icon,
  value,
  label,
}) => (
  <div className="dashboard-stat-card">

    <div className="stat-icon">
      {icon}
    </div>

    <div>
      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>
    </div>

  </div>
);