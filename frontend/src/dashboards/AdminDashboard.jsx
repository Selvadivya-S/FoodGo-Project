import React, { useEffect, useMemo, useState } from "react";
import {
  FaUsers,
  FaStore,
  FaShoppingBag,
  FaRupeeSign,
  FaMotorcycle,
  FaMapMarkerAlt,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaArrowRight,
  FaEdit,
  FaTrash,
  FaPlus,
} from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import GoogleMap from "../components/GoogleMap";
import {
  getDashboard,
  adminRestaurants,
  adminCreateRestaurant,
  adminApproveRestaurant,
  adminUsers,
  adminCreateUser,
  adminOrders,
  adminAssignDelivery,
  getAdminAnalytics,
  getAdminSettings,
  updateAdminSettings,
  updateMyProfile,
  updateRestaurant,
  adminRestaurantMenu,
  adminAddDish,
  adminUpdateDish,
  adminDeleteDish,
} from "../api/foodApi";
const EMPTY_USER = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "delivery_partner",
};
const EMPTY_RESTAURANT = {
  name: "",
  brandName: "",
  branchName: "",
  description: "",
  phone: "",
  email: "",
  cuisine: "",
  city: "",
  state: "",
  pincode: "",
  street: "",
  latitude: "",
  longitude: "",
  ownerId: "",
  googleMapsUrl: "",
  images: "",
};
export default function AdminDashboard({ section = "overview" }) {
  const user = JSON.parse(localStorage.getItem("foodgo_user") || "{}");
  const [stats, setStats] = useState({
    users: 0,
    restaurants: 0,
    orders: 0,
    revenue: 0,
    pendingRestaurants: 0,
  });
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [restaurantForm, setRestaurantForm] = useState(EMPTY_RESTAURANT);
  const [userForm, setUserForm] = useState(EMPTY_USER);
  const [analytics, setAnalytics] = useState(null);
  const [settings, setSettings] = useState(null);
  const [profile, setProfile] = useState({ name: user.name || "", phone: user.phone || "", avatar: user.avatar || "" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurantMenuItems, setRestaurantMenuItems] = useState([]);
  const [restaurantImageUrls, setRestaurantImageUrls] = useState("");
  const [adminDish, setAdminDish] = useState({ name: "", price: "", category: "", description: "", image: "", isVeg: null, isAvailable: true });
  const [editingAdminDish, setEditingAdminDish] = useState(null);
  const [savingRestaurantImages, setSavingRestaurantImages] = useState(false);
  const [savingAdminDish, setSavingAdminDish] = useState(false);
  const load = async () => {
    try {
      setLoading(true);
      setMessage("");
      const [dashboard, restaurantList, userList, orderList] =
        await Promise.all([
          getDashboard("admin"),
          adminRestaurants(),
          adminUsers(),
          adminOrders(),
        ]);
      setStats(dashboard || {});
      setRestaurants(Array.isArray(restaurantList) ? restaurantList : []);
      setUsers(Array.isArray(userList) ? userList : []);
      setOrders(Array.isArray(orderList) ? orderList : []);
    } catch (e) {
      setMessage(
        e.response?.data?.message ||
          "Unable to load admin data. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (section === "analytics") getAdminAnalytics().then(setAnalytics).catch((e) => setMessage(e.response?.data?.message || "Unable to load analytics."));
    if (section === "settings") getAdminSettings().then(setSettings).catch((e) => setMessage(e.response?.data?.message || "Unable to load settings."));
  }, [section]);
  const owners = users.filter((item) => item.role === "restaurant_owner");
  const deliveryPartners = users.filter(
    (item) => item.role === "delivery_partner"
  );
  const mapsQuery = useMemo(
    () =>
      [
        restaurantForm.name,
        restaurantForm.street,
        restaurantForm.city,
        restaurantForm.state,
        restaurantForm.pincode,
      ]
        .filter(Boolean)
        .join(", "),
    [restaurantForm]
  );
  const createUser = async (event) => {
    event.preventDefault();
    try {
      await adminCreateUser(userForm);
      setMessage(
        userForm.role === "delivery_partner"
          ? "Delivery partner account created."
          : "Restaurant owner account created."
      );
      setUserForm({ ...EMPTY_USER, role: userForm.role });
      await load();
    } catch (e) {
      setMessage(
        e.response?.data?.message || "Unable to create the account."
      );
    }
  };
  const createRestaurant = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        name: restaurantForm.name.trim(),
        brandName: restaurantForm.brandName.trim(),
        branchName: restaurantForm.branchName.trim(),
        description: restaurantForm.description.trim(),
        phone: restaurantForm.phone.trim(),
        email: restaurantForm.email.trim(),
        cuisine: restaurantForm.cuisine
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        address: {
          street: restaurantForm.street.trim(),
          city: restaurantForm.city.trim(),
          state: restaurantForm.state.trim(),
          pincode: restaurantForm.pincode.trim(),
        },
        latitude: Number(restaurantForm.latitude),
        longitude: Number(restaurantForm.longitude),
        ownerId: restaurantForm.ownerId || undefined,
        googleMapsUrl: restaurantForm.googleMapsUrl.trim(),
        images: restaurantForm.images
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };
      // IMPORTANT: creating a restaurant always creates a NEW MongoDB
      // restaurant document. Never reuse the currently selected restaurant.
      // The returned restaurant is immediately selected so that any dishes
      // added next are attached to THIS newly created restaurant.
      const createdRestaurant = await adminCreateRestaurant(payload);

      setRestaurantForm(EMPTY_RESTAURANT);

      // Make the newly created restaurant the active restaurant in the
      // admin menu manager. This prevents dishes from accidentally being
      // added to the previously selected restaurant.
      setSelectedRestaurant(createdRestaurant);
      setRestaurantImageUrls(
        Array.isArray(createdRestaurant?.images)
          ? createdRestaurant.images.join(", ")
          : ""
      );
      setEditingAdminDish(null);
      setAdminDish({
        name: "",
        price: "",
        category: "",
        description: "",
        image: "",
        isVeg: null,
        isAvailable: true,
      });

      const newMenu = await adminRestaurantMenu(createdRestaurant._id);
      setRestaurantMenuItems(Array.isArray(newMenu) ? newMenu : []);

      setMessage(
        `New restaurant "${createdRestaurant.name}" added. Existing restaurants and their dishes were not changed. You can now add dishes to the new restaurant.`
      );

      await load();
    } catch (e) {
      setMessage(
        e.response?.data?.message || "Unable to add restaurant."
      );
    }
  };
  const approveRestaurant = async (id) => {
    try {
      await adminApproveRestaurant(id);
      setMessage("Restaurant approved and published.");
      await load();
    } catch (e) {
      setMessage(
        e.response?.data?.message || "Unable to approve restaurant."
      );
    }
  };
  const assignDelivery = async (orderId, deliveryPartnerId) => {
    if (!deliveryPartnerId) return;
    try {
      await adminAssignDelivery(orderId, deliveryPartnerId);
      setMessage("Delivery partner assigned.");
      await load();
    } catch (e) {
      setMessage(
        e.response?.data?.message ||
          "Unable to assign delivery partner."
      );
    }
  };
  const openRestaurantManager = async (restaurant) => {
    try {
      setMessage("");
      setSelectedRestaurant(restaurant);
      setRestaurantImageUrls(Array.isArray(restaurant.images) ? restaurant.images.join(", ") : "");
      setEditingAdminDish(null);
      setAdminDish({ name: "", price: "", category: "", description: "", image: "", isVeg: null, isAvailable: true });
      const items = await adminRestaurantMenu(restaurant._id);
      setRestaurantMenuItems(Array.isArray(items) ? items : []);
    } catch (e) {
      setMessage(e.response?.data?.message || "Unable to load restaurant menu.");
    }
  };
  const saveRestaurantImages = async (event) => {
    event.preventDefault();
    if (!selectedRestaurant) return;
    try {
      setSavingRestaurantImages(true);
      const images = restaurantImageUrls.split(",").map((item) => item.trim()).filter(Boolean);
      const updated = await updateRestaurant(selectedRestaurant._id, { images });
      setSelectedRestaurant(updated);
      setRestaurantImageUrls(Array.isArray(updated.images) ? updated.images.join(", ") : "");
      setRestaurants((items) => items.map((item) => item._id === updated._id ? updated : item));
      setMessage("Restaurant images saved.");
    } catch (e) {
      setMessage(e.response?.data?.message || "Unable to save restaurant images.");
    } finally {
      setSavingRestaurantImages(false);
    }
  };
  const saveAdminDish = async (event) => {
    event.preventDefault();
    if (!selectedRestaurant) return;
    if (adminDish.isVeg === null) {
      setMessage("Please select Veg or Non-Veg for this dish.");
      return;
    }
    try {
      setSavingAdminDish(true);
      const payload = { ...adminDish, price: Number(adminDish.price), isVeg: adminDish.isVeg === true, isAvailable: Boolean(adminDish.isAvailable) };
      const saved = editingAdminDish ? await adminUpdateDish(editingAdminDish._id, payload) : await adminAddDish(selectedRestaurant._id, payload);
      setRestaurantMenuItems((items) => editingAdminDish ? items.map((item) => item._id === saved._id ? saved : item) : [...items, saved]);
      setAdminDish({ name: "", price: "", category: "", description: "", image: "", isVeg: null, isAvailable: true });
      setEditingAdminDish(null);
      setMessage(editingAdminDish ? "Dish updated with its image." : "Dish added with its image.");
    } catch (e) {
      setMessage(e.response?.data?.message || "Unable to save dish.");
    } finally {
      setSavingAdminDish(false);
    }
  };
  const removeAdminDish = async (id) => {
    if (!window.confirm("Delete this dish?")) return;
    try {
      await adminDeleteDish(id);
      setRestaurantMenuItems((items) => items.filter((item) => item._id !== id));
      setMessage("Dish deleted.");
    } catch (e) {
      setMessage(e.response?.data?.message || "Unable to delete dish.");
    }
  };
  const restaurantMap =
    Number.isFinite(Number(restaurantForm.latitude)) &&
    Number.isFinite(Number(restaurantForm.longitude))
      ? {
          latitude: restaurantForm.latitude,
          longitude: restaurantForm.longitude,
        }
      : { latitude: "", longitude: "", address: mapsQuery };
  return (
    <DashboardLayout
      role="admin"
      name={user.name || "FoodGo Administrator"}
      section={section}
    >
      <section className="admin-hero">
        <div>
          <span className="dashboard-label">
            FOODGO ADMIN CONTROL CENTER
          </span>
          <h2>
            Platform overview
            <br />
            <span>Everything under control.</span>
          </h2>
          <p>
            Manage restaurant onboarding, restaurant owners, delivery
            partners and customer orders from one workspace.
          </p>
        </div>
        <div className="system-health">
          <span />
          <div>
            <strong>{loading ? "Refreshing…" : "API connected"}</strong>
            <small>MongoDB dashboard data</small>
          </div>
        </div>
      </section>
      <section className="dashboard-stats">
        <Stat icon={<FaUsers />} value={stats.users || 0} label="Total Users" />
        <Stat
          icon={<FaStore />}
          value={stats.restaurants || 0}
          label="Restaurants"
        />
        <Stat
          icon={<FaShoppingBag />}
          value={stats.orders || 0}
          label="Total Orders"
        />
        <Stat
          icon={<FaRupeeSign />}
          value={`₹${Number(stats.revenue || 0).toFixed(0)}`}
          label="Paid Revenue"
        />
      </section>
      {message && (
        <div className="fg-inline-success" style={{ margin: "16px 0" }}>
          {message}
        </div>
      )}
      {section === "users" && (
        <section className="dashboard-grid-2">
          <div className="dashboard-card">
            <span className="dashboard-label">TEAM MANAGEMENT</span>
            <h3>Create a platform account</h3>
            <p>
              Create a restaurant owner first if you want a restaurant to
              manage its own menu.
            </p>
            <form onSubmit={createUser} className="fg-form-grid">
              <input
                required
                placeholder="Full name"
                value={userForm.name}
                onChange={(e) =>
                  setUserForm({ ...userForm, name: e.target.value })
                }
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
              />
              <input
                placeholder="Phone"
                value={userForm.phone}
                onChange={(e) =>
                  setUserForm({ ...userForm, phone: e.target.value })
                }
              />
              <input
                required
                minLength="6"
                type="password"
                placeholder="Temporary password"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
              />
              <select
                value={userForm.role}
                onChange={(e) =>
                  setUserForm({ ...userForm, role: e.target.value })
                }
              >
                <option value="delivery_partner">Delivery partner</option>
                <option value="restaurant_owner">Restaurant owner</option>
              </select>
              <button className="detail-btn" type="submit">
                Create account
              </button>
            </form>
          </div>
          <div className="dashboard-card">
            <span className="dashboard-label">PLATFORM USERS</span>
            <h3>Accounts</h3>
            {!users.length ? (
              <p>No accounts yet.</p>
            ) : (
              users.map((item) => (
                <div className="order-row" key={item._id}>
                  <div>
                    {item.role === "delivery_partner" ? (
                      <FaMotorcycle />
                    ) : item.role === "restaurant_owner" ? (
                      <FaStore />
                    ) : (
                      <FaUsers />
                    )}
                  </div>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {item.email} · {item.role}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
      {section === "restaurants" && (
        <section className="dashboard-grid-2">
          <div className="dashboard-card">
            <span className="dashboard-label">RESTAURANT ONBOARDING</span>
            <h3>Add a real restaurant</h3>
            <p>
              Find the restaurant on Google Maps, use its exact address and
              coordinates, then save the Google Maps link below.
            </p>
            <form onSubmit={createRestaurant} className="fg-form-grid">
              <input
                required
                placeholder="Restaurant name"
                value={restaurantForm.name}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    name: e.target.value,
                  })
                }
              />
              <input
                placeholder="Brand / chain name (e.g. Sangeetha Veg Restaurant)"
                value={restaurantForm.brandName}
                onChange={(e) =>
                  setRestaurantForm({ ...restaurantForm, brandName: e.target.value })
                }
              />
              <input
                placeholder="Branch / outlet name (e.g. T Nagar)"
                value={restaurantForm.branchName}
                onChange={(e) =>
                  setRestaurantForm({ ...restaurantForm, branchName: e.target.value })
                }
              />
              <input
                placeholder="Description"
                value={restaurantForm.description}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    description: e.target.value,
                  })
                }
              />
              <input
                placeholder="Phone"
                value={restaurantForm.phone}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    phone: e.target.value,
                  })
                }
              />
              <input
                type="email"
                placeholder="Restaurant email"
                value={restaurantForm.email}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    email: e.target.value,
                  })
                }
              />
              <input
                placeholder="Cuisine: Indian, Chinese"
                value={restaurantForm.cuisine}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    cuisine: e.target.value,
                  })
                }
              />
              <input
                required
                placeholder="Street / address"
                value={restaurantForm.street}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    street: e.target.value,
                  })
                }
              />
              <input
                required
                placeholder="City (any city)"
                value={restaurantForm.city}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    city: e.target.value,
                  })
                }
              />
              <input
                placeholder="State (any state)"
                value={restaurantForm.state}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    state: e.target.value,
                  })
                }
              />
              <input
                placeholder="Pincode"
                value={restaurantForm.pincode}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    pincode: e.target.value,
                  })
                }
              />
              <input
                required
                type="number"
                step="any"
                placeholder="Latitude"
                value={restaurantForm.latitude}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    latitude: e.target.value,
                  })
                }
              />
              <input
                required
                type="number"
                step="any"
                placeholder="Longitude"
                value={restaurantForm.longitude}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    longitude: e.target.value,
                  })
                }
              />
              <select
                value={restaurantForm.ownerId}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    ownerId: e.target.value,
                  })
                }
              >
                <option value="">
                  Assign restaurant owner later
                </option>
                {owners.map((owner) => (
                  <option key={owner._id} value={owner._id}>
                    {owner.name} · {owner.email}
                  </option>
                ))}
              </select>
              <input
                className="wide"
                placeholder="Restaurant image URL(s), comma separated"
                value={restaurantForm.images}
                onChange={(e) =>
                  setRestaurantForm({ ...restaurantForm, images: e.target.value })
                }
              />
              <small className="wide">Paste direct image URLs. For multiple restaurant photos, separate URLs with commas.</small>
              <input
                className="wide"
                placeholder="Google Maps URL"
                value={restaurantForm.googleMapsUrl}
                onChange={(e) =>
                  setRestaurantForm({
                    ...restaurantForm,
                    googleMapsUrl: e.target.value,
                  })
                }
              />
              <a
                className="detail-btn"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  mapsQuery
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <FaMapMarkerAlt /> Find on Google Maps
              </a>
              <button className="detail-btn" type="submit">
                Add restaurant
              </button>
            </form>
            <div style={{ marginTop: 18 }}>
              <GoogleMap
                latitude={restaurantMap.latitude}
                longitude={restaurantMap.longitude}
                address={mapsQuery}
                height={260}
                title="Restaurant location preview"
              />
            </div>
          </div>
          <div className="dashboard-card">
            <span className="dashboard-label">RESTAURANT NETWORK</span>
            <h3>Restaurants</h3>
            {!restaurants.length ? (
              <p>No restaurants added yet.</p>
            ) : (
              restaurants.map((restaurant) => {
                const address = [
                  restaurant.address?.street,
                  restaurant.address?.city,
                  restaurant.address?.state,
                  restaurant.address?.pincode,
                ]
                  .filter(Boolean)
                  .join(", ");
                const mapLink =
                  restaurant.googleMapsUrl ||
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    address || restaurant.name
                  )}`;
                return (
                  <div className="order-row" key={restaurant._id}>
                    {restaurant.images?.[0] ? (
                      <img src={`${restaurant.images[0]}${restaurant.images[0].includes("?") ? "&" : "?"}fgv=${encodeURIComponent(restaurant.updatedAt || "")}`} alt="" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 10 }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    ) : <div>🍽️</div>}
                    <div>
                      <strong>{restaurant.name}</strong>
                      <span>
                        {restaurant.address?.city || "Location not set"} ·{" "}
                        {restaurant.isApproved ? "Approved" : "Pending"}
                      </span>
                    </div>
                    <a
                      href={mapLink}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${restaurant.name} in Google Maps`}
                    >
                      <FaMapMarkerAlt />
                    </a>
                    <button type="button" onClick={() => openRestaurantManager(restaurant)}>Manage images & menu</button>
                    <button
                      disabled={restaurant.isApproved}
                      onClick={() => approveRestaurant(restaurant._id)}
                    >
                      {restaurant.isApproved ? "Approved" : "Approve"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}
      {selectedRestaurant && section === "restaurants" && (
        <section className="dashboard-grid-2" style={{ marginTop: 20 }}>
          <div className="dashboard-card">
            <div className="card-heading">
              <div>
                <span className="dashboard-label">IMAGE MANAGEMENT</span>
                <h3>{selectedRestaurant.name}</h3>
              </div>
              <button type="button" className="detail-btn" onClick={() => setSelectedRestaurant(null)}>Close</button>
            </div>
            <form className="fg-form-grid" onSubmit={saveRestaurantImages}>
              <input className="wide" placeholder="Restaurant image URL(s), comma separated" value={restaurantImageUrls} onChange={(e) => setRestaurantImageUrls(e.target.value)} />
              <small className="wide">Use direct image links. Example: https://example.com/restaurant.jpg</small>
              <button className="detail-btn" disabled={savingRestaurantImages} type="submit">{savingRestaurantImages ? "Saving…" : "Save restaurant images"}</button>
            </form>
            {selectedRestaurant.images?.length ? <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>{selectedRestaurant.images.map((url, i) => <img key={`${url}-${i}`} src={url} alt={`Restaurant ${i + 1}`} style={{ width: 130, height: 90, objectFit: "cover", borderRadius: 12 }} />)}</div> : <p style={{ marginTop: 14 }}>No restaurant image saved yet.</p>}
          </div>
          <div className="dashboard-card">
            <div className="card-heading"><div><span className="dashboard-label">MENU IMAGE MANAGEMENT</span><h3>{editingAdminDish ? "Edit dish" : "Add dish"}</h3></div>{editingAdminDish && <button type="button" className="detail-btn" onClick={() => { setEditingAdminDish(null); setAdminDish({ name: "", price: "", category: "", description: "", image: "", isVeg: null, isAvailable: true }); }}>Cancel</button>}</div>
            <form className="fg-form-grid" onSubmit={saveAdminDish}>
              <input required placeholder="Dish name" value={adminDish.name} onChange={(e) => setAdminDish({ ...adminDish, name: e.target.value })} />
              <input required type="number" min="0" step="0.01" placeholder="Price" value={adminDish.price} onChange={(e) => setAdminDish({ ...adminDish, price: e.target.value })} />
              <input placeholder="Category" value={adminDish.category} onChange={(e) => setAdminDish({ ...adminDish, category: e.target.value })} />
              <input className="wide" placeholder="Dish image URL" value={adminDish.image} onChange={(e) => setAdminDish({ ...adminDish, image: e.target.value })} />
              <small className="wide">Paste the exact image URL for this dish.</small>
              <textarea className="wide" placeholder="Description" value={adminDish.description} onChange={(e) => setAdminDish({ ...adminDish, description: e.target.value })} />
              <div className="food-type-field wide"><strong>Food type <span>*</span></strong><div className="food-type-options"><label className={`food-type-option veg-option ${adminDish.isVeg === true ? "selected" : ""}`}><input type="radio" name="admin-dish-type" checked={adminDish.isVeg === true} onChange={() => setAdminDish({ ...adminDish, isVeg: true })} /> <span>🌿 Veg</span></label><label className={`food-type-option nonveg-option ${adminDish.isVeg === false ? "selected" : ""}`}><input type="radio" name="admin-dish-type" checked={adminDish.isVeg === false} onChange={() => setAdminDish({ ...adminDish, isVeg: false })} /> <span>🍗 Non-Veg</span></label></div><small>Select exactly one. This controls the Veg / Non-Veg label shown to customers.</small></div>
              <label><input type="checkbox" checked={adminDish.isAvailable} onChange={(e) => setAdminDish({ ...adminDish, isAvailable: e.target.checked })} /> Available</label>
              <button className="detail-btn" disabled={savingAdminDish} type="submit"><FaPlus /> {savingAdminDish ? "Saving…" : editingAdminDish ? "Update dish" : "Add dish"}</button>
            </form>
            <div style={{ marginTop: 18 }}>{!restaurantMenuItems.length ? <p>No menu items yet.</p> : restaurantMenuItems.map((item) => <div className="order-row" key={item._id}>
              {item.image ? <img src={item.image} alt="" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 10 }} onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <div>🍽️</div>}
              <div><strong>{item.name}</strong><span>{item.category || "Uncategorised"} · ₹{Number(item.price).toFixed(0)}</span></div>
              <button type="button" onClick={() => { setEditingAdminDish(item); setAdminDish({ name: item.name || "", price: String(item.price ?? ""), category: item.category || "", description: item.description || "", image: item.image || "", isVeg: Boolean(item.isVeg), isAvailable: item.isAvailable !== false }); }}><FaEdit /></button>
              <button type="button" onClick={() => removeAdminDish(item._id)}><FaTrash /></button>
            </div>)}</div>
          </div>
        </section>
      )}
      {section === "orders" && (
        <section className="dashboard-card">
          <span className="dashboard-label">ORDER OPERATIONS</span>
          <h3>All orders & delivery assignment</h3>
          {!orders.length ? (
            <p>No orders yet.</p>
          ) : (
            orders.map((order) => (
              <div className="restaurant-order" key={order._id}>
                <div>
                  <span>
                    #{String(order._id).slice(-8).toUpperCase()}
                  </span>
                  <strong>
                    {order.restaurantId?.name || "Restaurant"}
                  </strong>
                  <small>
                    {order.customerId?.name || "Customer"} ·{" "}
                    {new Date(order.createdAt).toLocaleString()}
                  </small>
                </div>
                <strong>
                  ₹{Number(order.pricing?.total || 0).toFixed(0)}
                </strong>
                <span>{order.status}</span>
                <select
                  value={
                    order.deliveryPartnerId?._id ||
                    order.deliveryPartnerId ||
                    ""
                  }
                  onChange={(e) =>
                    assignDelivery(order._id, e.target.value)
                  }
                >
                  <option value="">Assign delivery partner</option>
                  {deliveryPartners.map((partner) => (
                    <option key={partner._id} value={partner._id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </section>
      )}
      {section === "overview" && (
        <AdminOverview stats={stats} restaurants={restaurants} orders={orders} />
      )}
      {section === "analytics" && <AdminAnalytics data={analytics} />}
      {section === "settings" && <AdminSettings settings={settings} setSettings={setSettings} saving={savingSettings} setSaving={setSavingSettings} setMessage={setMessage} />}
      {section === "account" && <AdminAccount profile={profile} setProfile={setProfile} setMessage={setMessage} />}
    </DashboardLayout>
  );
}
function AdminOverview({stats,restaurants,orders}){
  const pending=restaurants.filter((r)=>!r.isApproved);
  const roleCounts=stats.roleCounts||{};
  return <><section className="dashboard-grid-2">
    <div className="dashboard-card"><span className="dashboard-label">PLATFORM HEALTH</span><h3>Everything under control</h3><p>These figures are calculated from the same MongoDB collections used by the customer, restaurant and delivery workspaces.</p><div className="detail-info-list"><div><span>Live orders</span><strong>{stats.liveOrders||0}</strong></div><div><span>Pending restaurant approvals</span><strong>{stats.pendingRestaurants||0}</strong></div><div><span>Customer accounts</span><strong>{roleCounts.customers ?? 0}</strong></div><div><span>Restaurant owners</span><strong>{roleCounts.restaurantOwners ?? 0}</strong></div><div><span>Delivery partners</span><strong>{roleCounts.deliveryPartners ?? 0}</strong></div></div></div>
    <div className="dashboard-card"><span className="dashboard-label">ACTION CENTER</span><h3>Items needing attention</h3>{pending.length?<>{pending.slice(0,4).map(r=><div className="order-row" key={r._id}><div>🏪</div><div><strong>{r.name}</strong><span>{r.address?.city||"Location not set"} · Awaiting approval</span></div><a className="detail-btn" href="/admin-dashboard/restaurants">Review <FaArrowRight/></a></div>)}</>:<p>All current restaurants are approved. The platform is ready for operations.</p>}<a className="detail-btn" href="/admin-dashboard/orders">Open order operations <FaArrowRight/></a></div>
  </section>
  <section className="dashboard-card"><div className="card-heading"><div><span className="dashboard-label">RECENT ACTIVITY</span><h3>Latest platform orders</h3></div><a className="detail-btn" href="/admin-dashboard/orders">View all orders</a></div>{!orders.length?<p>No orders have been created yet.</p>:orders.slice(0,6).map(o=><div className="restaurant-order" key={o._id}><div><span>#{String(o._id).slice(-8).toUpperCase()}</span><strong>{o.restaurantId?.name||"Restaurant"}</strong><small>{o.customerId?.name||"Customer"} · {new Date(o.createdAt).toLocaleString()}</small></div><strong>₹{Number(o.pricing?.total||0).toFixed(0)}</strong><span className="order-status">{o.status}</span></div>)}</section>
  <section className="dashboard-card"><span className="dashboard-label">RESTAURANT NETWORK</span><h3>Live restaurant coverage</h3><div className="detail-card-grid">{restaurants.slice(0,6).map(r=><article className="detail-offer-card" key={r._id}><span>{r.isApproved?"APPROVED":"PENDING"}</span><h3>{r.name}</h3><p>{r.address?.city||"City not set"} · ★ {Number(r.rating||0).toFixed(1)}</p><small>{Array.isArray(r.cuisine)?r.cuisine.slice(0,3).join(" · "):"Food"}</small></article>)}</div></section>
  </>; }
function AdminAnalytics({ data }) {
  if (!data) return <section className="dashboard-card"><p>Loading analytics…</p></section>;
  const max = Math.max(1, ...(data.daily || []).map((x) => Number(x.revenue || 0)));
  return <><section className="dashboard-stats"><Stat icon={<FaRupeeSign />} value={`₹${Number(data.revenue || 0).toFixed(0)}`} label="Paid Revenue" /><Stat icon={<FaShoppingBag />} value={data.orders || 0} label="Orders" /><Stat icon={<FaUsers />} value={data.users || 0} label="Users" /><Stat icon={<FaStore />} value={data.restaurants || 0} label="Restaurants" /></section><section className="dashboard-card"><span className="dashboard-label">LAST 7 DAYS</span><h3>Platform revenue & order volume</h3><div className="simple-chart">{(data.daily || []).map((row) => <div className="simple-chart-col" key={row._id}><div style={{ height: `${Math.max(8, (Number(row.revenue || 0) / max) * 100)}%` }} /><span>{row._id.slice(5)}</span><small>{row.orders} orders</small></div>)}</div></section><section className="dashboard-card"><span className="dashboard-label">LIVE OPERATIONS</span><h3>{data.liveOrders || 0} orders currently active</h3><p>Restaurant and delivery dashboards can update order status directly against the same MongoDB order records.</p></section></>;
}
function AdminSettings({ settings, setSettings, saving, setSaving, setMessage }) {
  if (!settings) return <section className="dashboard-card"><p>Loading settings…</p></section>;
  const save = async () => { try { setSaving(true); const next = await updateAdminSettings(settings); setSettings(next); setMessage("Platform settings saved to MongoDB."); } catch (e) { setMessage(e.response?.data?.message || "Unable to save settings."); } finally { setSaving(false); } };
  return <section className="dashboard-card"><span className="dashboard-label">ADMIN SETTINGS</span><h3>Platform configuration</h3><div className="fg-form-grid"><label>Restaurant commission %<input type="number" min="0" max="100" value={settings.restaurantCommission} onChange={e=>setSettings({...settings,restaurantCommission:Number(e.target.value)})}/></label><label>Delivery base fee<input type="number" min="0" value={settings.deliveryBaseFee} onChange={e=>setSettings({...settings,deliveryBaseFee:Number(e.target.value)})}/></label><label>Support SLA (minutes)<input type="number" min="1" value={settings.supportSlaMinutes} onChange={e=>setSettings({...settings,supportSlaMinutes:Number(e.target.value)})}/></label><label>Auto-cancel (minutes)<input type="number" min="1" value={settings.autoCancelMinutes} onChange={e=>setSettings({...settings,autoCancelMinutes:Number(e.target.value)})}/></label><label>Approval mode<select value={settings.approvalMode} onChange={e=>setSettings({...settings,approvalMode:e.target.value})}><option value="MANUAL">Manual</option><option value="AUTO">Automatic</option></select></label><label>Payment gateway<input value={settings.paymentGateway || ""} onChange={e=>setSettings({...settings,paymentGateway:e.target.value})}/></label><label><input type="checkbox" checked={Boolean(settings.liveTracking)} onChange={e=>setSettings({...settings,liveTracking:e.target.checked})}/> Live tracking</label><label><input type="checkbox" checked={Boolean(settings.notifications)} onChange={e=>setSettings({...settings,notifications:e.target.checked})}/> Notifications</label><label><input type="checkbox" checked={Boolean(settings.maintenanceMode)} onChange={e=>setSettings({...settings,maintenanceMode:e.target.checked})}/> Maintenance mode</label><label><input type="checkbox" checked={Boolean(settings.fraudMonitoring)} onChange={e=>setSettings({...settings,fraudMonitoring:e.target.checked})}/> Fraud monitoring</label><button className="detail-btn" type="button" onClick={save} disabled={saving}><FaCheckCircle/> {saving ? "Saving…" : "Save settings"}</button></div></section>;
}
function AdminAccount({ profile, setProfile, setMessage }) {
  const save = async (e) => { e.preventDefault(); try { const updated = await updateMyProfile(profile); const current = JSON.parse(localStorage.getItem("foodgo_user") || "{}"); const next = { ...current, ...updated, loggedIn: true }; localStorage.setItem("foodgo_user", JSON.stringify(next)); localStorage.setItem("foodgoUser", JSON.stringify(next)); setMessage("Administrator profile updated."); } catch (e) { setMessage(e.response?.data?.message || "Unable to update administrator profile."); } };
  return <section className="dashboard-card"><span className="dashboard-label">ACCOUNT SETTINGS</span><h3>Administrator profile</h3><form className="fg-form-grid" onSubmit={save}><input required placeholder="Name" value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})}/><input placeholder="Phone" value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})}/><input className="wide" placeholder="Avatar URL" value={profile.avatar} onChange={e=>setProfile({...profile,avatar:e.target.value})}/><button className="detail-btn" type="submit"><FaCheckCircle/> Save profile</button></form></section>;
}
const Stat = ({ icon, value, label }) => (
  <div className="dashboard-stat-card">
    <div className="stat-icon">{icon}</div>
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  </div>
);
