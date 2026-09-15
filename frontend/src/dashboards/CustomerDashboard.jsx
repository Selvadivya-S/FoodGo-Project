import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaShoppingBag,
  FaClock,
  FaRupeeSign,
  FaHeart,
  FaArrowRight,
  FaTrash,
  FaPlus,
  FaCopy,
  FaCheckCircle,
  FaMapMarkerAlt,
} from "react-icons/fa";

import DashboardLayout from "../components/DashboardLayout";

import {
  getDashboard,
  getMyOrders,
  getCustomerFavourites,
  removeCustomerFavourite,
  getCustomerWallet,
  topUpCustomerWallet,
  syncCustomerWalletOrders,
  getCustomerOffers,
  validateCustomerOffer,
  updateMyProfile,
} from "../api/foodApi";


export default function CustomerDashboard({ section = "overview" }) {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("foodgo_user") || "{}"
  );

  const [data, setData] = useState({
    orders: 0,
    activeOrders: 0,
    totalSpent: 0,
    recentOrders: [],
  });

  const [orders, setOrders] = useState([]);
  const [favourites, setFavourites] = useState([]);

  const [wallet, setWallet] = useState({
    balance: 0,
    transactions: [],
  });

  const [offers, setOffers] = useState([]);

  const [profile, setProfile] = useState({
    name: user.name || "",
    phone: user.phone || "",
    avatar: user.avatar || "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [topUp, setTopUp] = useState(500);

  const [offerCode, setOfferCode] = useState("");
  const [offerResult, setOfferResult] = useState(null);


  // --------------------------------------------------
  // LOAD CUSTOMER DASHBOARD DATA
  // --------------------------------------------------

  const load = async () => {
    try {
      setError("");

      const [
        dashboard,
        orderRows,
        favouriteRows,
        offerRows,
      ] = await Promise.all([
        getDashboard("customer"),
        getMyOrders(),
        getCustomerFavourites(),
        getCustomerOffers(),
      ]);

      await syncCustomerWalletOrders().catch(() => {});

      const walletRows = await getCustomerWallet();

      setData(dashboard || {});

      setOrders(
        Array.isArray(orderRows) ? orderRows : []
      );

      setFavourites(
        Array.isArray(favouriteRows) ? favouriteRows : []
      );

      setWallet(
        walletRows || {
          balance: 0,
          transactions: [],
        }
      );

      setOffers(
        Array.isArray(offerRows) ? offerRows : []
      );
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Unable to load customer dashboard."
      );
    }
  };


  // Reload when dashboard section changes or a favourite is added/removed.
  useEffect(() => {
    load();

    const onFavouritesChanged = () => load();
    window.addEventListener(
      "foodgo:favourites-changed",
      onFavouritesChanged
    );

    return () => {
      window.removeEventListener(
        "foodgo:favourites-changed",
        onFavouritesChanged
      );
    };
  }, [section]);


  // --------------------------------------------------
  // ACTIVE ORDERS
  // --------------------------------------------------

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          ![
            "DELIVERED",
            "CANCELLED",
            "REJECTED",
            "REFUNDED",
          ].includes(o.status)
      ),
    [orders]
  );


  const restaurantFavourites = useMemo(
    () =>
      favourites.filter(
        (row) => row?.restaurantId && !row?.menuItemId
      ),
    [favourites]
  );

  const dishFavourites = useMemo(
    () =>
      favourites.filter(
        (row) => row?.menuItemId
      ),
    [favourites]
  );

  // --------------------------------------------------
  // REMOVE FAVOURITE
  // --------------------------------------------------

  const removeFavourite = async (id) => {
    try {
      await removeCustomerFavourite(id);

      setFavourites((rows) =>
        rows.filter((row) => row._id !== id)
      );

      setMessage("Removed from favourites.");
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Unable to remove favourite."
      );
    }
  };


  // --------------------------------------------------
  // ADD MONEY TO WALLET
  // --------------------------------------------------

  const addMoney = async (e) => {
    e.preventDefault();

    try {
      await topUpCustomerWallet(Number(topUp));

      setMessage(
        `₹${Number(topUp).toFixed(0)} wallet credit added.`
      );

      const next = await getCustomerWallet();

      setWallet(next);
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Unable to update wallet."
      );
    }
  };


  // --------------------------------------------------
  // APPLY / VALIDATE OFFER
  // --------------------------------------------------

  const applyOffer = async (code) => {
    try {
      setOfferResult(null);

      const result = await validateCustomerOffer(
        code,
        Number(data.totalSpent || 0)
      );

      setOfferResult(result);

      setMessage(`${code} is valid.`);
    } catch (e) {
      setOfferResult(null);

      setError(
        e.response?.data?.message ||
          "Offer could not be validated."
      );
    }
  };


  // --------------------------------------------------
  // SAVE CUSTOMER PROFILE
  // --------------------------------------------------

  const saveProfile = async (e) => {
    e.preventDefault();

    try {
      const updated = await updateMyProfile(profile);

      const next = {
        ...user,
        ...updated,
        id: String(
          updated?._id ||
            updated?.id ||
            user.id
        ),
        loggedIn: true,
      };

      localStorage.setItem(
        "foodgo_user",
        JSON.stringify(next)
      );

      localStorage.setItem(
        "foodgoUser",
        JSON.stringify(next)
      );

      window.dispatchEvent(
        new Event("foodgo:user-changed")
      );

      setMessage("Profile updated successfully.");
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Unable to update profile."
      );
    }
  };


  // --------------------------------------------------
  // MAIN DASHBOARD
  // --------------------------------------------------

  return (
    <DashboardLayout
      role="customer"
      name={profile.name || "FoodGo User"}
      section={section}
    >

      {/* Welcome */}
      <section className="dashboard-welcome">
        <div>
          <span className="dashboard-label">
            YOUR FOOD JOURNEY
          </span>

          <h2>
            Everything delicious,
            <br />
            <span>in one place.</span>
          </h2>

          <p>
            Your dashboard is connected to your
            MongoDB account and orders.
          </p>
        </div>

        <div className="dashboard-welcome-food">
          🍕
        </div>
      </section>


      {/* Statistics */}
      <section className="dashboard-stats">

        <Stat
          icon={<FaShoppingBag />}
          value={data.orders || 0}
          label="Total Orders"
        />

        <Stat
          icon={<FaClock />}
          value={data.activeOrders || 0}
          label="Active Orders"
        />

        <Stat
          icon={<FaRupeeSign />}
          value={`₹${Number(
            data.totalSpent || 0
          ).toFixed(0)}`}
          label="Total Spent"
        />

        <Stat
          icon={<FaHeart />}
          value={favourites.length}
          label="Favourites"
        />

      </section>


      {/* Messages */}
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


      {/* Dashboard Sections */}

      {section === "orders" && (
        <OrdersSection
          orders={orders}
          navigate={navigate}
        />
      )}

      {section === "tracking" && (
        <TrackingSection
          orders={activeOrders}
        />
      )}

      {section === "favourites" && (
        <FavouritesSection
          restaurantFavourites={restaurantFavourites}
          dishFavourites={dishFavourites}
          removeFavourite={removeFavourite}
        />
      )}

      {section === "wallet" && (
        <WalletSection
          wallet={wallet}
          topUp={topUp}
          setTopUp={setTopUp}
          addMoney={addMoney}
        />
      )}

      {section === "offers" && (
        <OffersSection
          offers={offers}
          offerCode={offerCode}
          setOfferCode={setOfferCode}
          applyOffer={applyOffer}
          offerResult={offerResult}
        />
      )}

      {section === "account" && (
        <AccountSection
          profile={profile}
          setProfile={setProfile}
          saveProfile={saveProfile}
        />
      )}

      {section === "overview" && (
        <CustomerOverview
          data={data}
          orders={orders}
          favourites={favourites}
          wallet={wallet}
          offers={offers}
          navigate={navigate}
        />
      )}

    </DashboardLayout>
  );
}


// ==================================================
// CUSTOMER OVERVIEW
// ==================================================

function CustomerOverview({
  data,
  orders,
  favourites,
  wallet,
  offers,
  navigate,
}) {
  const active = orders.find(
    (o) =>
      ![
        "DELIVERED",
        "CANCELLED",
        "REJECTED",
        "REFUNDED",
      ].includes(o.status)
  );

  return (
    <>
      <section className="dashboard-grid-2">

        {/* Account Snapshot */}
        <div className="dashboard-card">

          <span className="dashboard-label">
            ACCOUNT SNAPSHOT
          </span>

          <h3>
            Welcome back to FoodGo
          </h3>

          <div className="detail-info-list">

            <div>
              <span>Completed orders</span>
              <strong>
                {data.completedOrders || 0}
              </strong>
            </div>

            <div>
              <span>Average order value</span>
              <strong>
                ₹
                {Number(
                  data.averageOrderValue || 0
                ).toFixed(0)}
              </strong>
            </div>

            <div>
              <span>Saved favourites</span>
              <strong>
                {favourites.length}
              </strong>
            </div>

            <div>
              <span>Available offers</span>
              <strong>
                {offers.length}
              </strong>
            </div>

          </div>
        </div>


        {/* Wallet */}
        <div className="dashboard-card">

          <span className="dashboard-label">
            FOOD WALLET
          </span>

          <h3>
            ₹
            {Number(
              wallet.balance || 0
            ).toFixed(0)}
          </h3>

          <p>
            Your current FoodGo wallet balance
            is calculated from the live
            transaction ledger.
          </p>

          <Link
            className="detail-btn"
            to="/customer-dashboard/wallet"
          >
            Open wallet
            <FaArrowRight />
          </Link>

        </div>

      </section>


      {/* Active Order */}
      {active && (
        <section className="dashboard-card">

          <div className="card-heading">

            <div>
              <span className="dashboard-label">
                LIVE ORDER
              </span>

              <h3>
                Your current delivery
              </h3>
            </div>

            <Link
              className="detail-btn"
              to={`/track-order/${active._id}`}
            >
              <FaMapMarkerAlt />
              Track order
            </Link>

          </div>


          <div className="restaurant-order">

            <div>

              <span>
                #
                {String(active._id)
                  .slice(-8)
                  .toUpperCase()}
              </span>

              <strong>
                {active.restaurantId?.name ||
                  "FoodGo Restaurant"}
              </strong>

              <small>
                {active.items
                  ?.map(
                    (x) =>
                      `${x.name} × ${x.quantity}`
                  )
                  .join(", ")}
              </small>

            </div>

            <strong>
              ₹
              {Number(
                active.pricing?.total || 0
              ).toFixed(0)}
            </strong>

            <span className="order-status">
              {active.status}
            </span>

          </div>

        </section>
      )}


      {/* Recent Orders */}
      <OrdersSection
        orders={(data.recentOrders || []).slice(0, 5)}
        navigate={navigate}
        compact
      />
    </>
  );
}


// ==================================================
// ORDERS SECTION
// ==================================================

function OrdersSection({
  orders,
  navigate,
  compact = false,
}) {
  return (
    <section className="dashboard-card">

      <div className="card-heading">

        <div>
          <span className="dashboard-label">
            {compact
              ? "ACTIVITY"
              : "ORDER HISTORY"}
          </span>

          <h3>
            {compact
              ? "Recent orders"
              : "Your orders"}
          </h3>
        </div>

        <Link
          className="detail-btn"
          to="/restaurants"
        >
          Order food
          <FaArrowRight />
        </Link>

      </div>


      {!orders.length ? (
        <p>
          No orders yet. Browse restaurants
          to place your first order.
        </p>
      ) : (
        <div className="orders-table">

          {orders.map((o) => (
            <div
              className="order-row"
              key={o._id}
            >

              <div className="order-food-icon">
                🍽️
              </div>

              <div>

                <strong>
                  {o.restaurantId?.name ||
                    "Restaurant"}
                </strong>

                <span>
                  {o.items
                    ?.map(
                      (x) =>
                        `${x.name} × ${x.quantity}`
                    )
                    .join(", ")}
                </span>

                <small>
                  {new Date(
                    o.createdAt
                  ).toLocaleString()}
                </small>

              </div>

              <strong>
                ₹
                {Number(
                  o.pricing?.total || 0
                ).toFixed(0)}
              </strong>

              <span className="order-status">
                {o.status}
              </span>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/track-order/${o._id}`
                  )
                }
              >
                <FaArrowRight />
              </button>

            </div>
          ))}

        </div>
      )}

    </section>
  );
}


// ==================================================
// TRACKING SECTION
// ==================================================

function TrackingSection({ orders }) {
  return (
    <section className="dashboard-card">

      <div className="card-heading">

        <div>
          <span className="dashboard-label">
            LIVE TRACKING
          </span>

          <h3>
            Active orders
          </h3>
        </div>

      </div>


      {!orders.length ? (
        <p>
          No active orders to track.
        </p>
      ) : (
        orders.map((o) => (
          <div
            className="restaurant-order"
            key={o._id}
          >

            <div>

              <span>
                #
                {String(o._id)
                  .slice(-8)
                  .toUpperCase()}
              </span>

              <strong>
                {o.restaurantId?.name ||
                  "Restaurant"}
              </strong>

              <small>
                {o.status} · ETA{" "}
                {o.estimatedDeliveryTime
                  ? new Date(
                      o.estimatedDeliveryTime
                    ).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )
                  : "updating"}
              </small>

            </div>

            <strong>
              ₹
              {Number(
                o.pricing?.total || 0
              ).toFixed(0)}
            </strong>

            <Link
              className="detail-btn"
              to={`/track-order/${o._id}`}
            >
              <FaMapMarkerAlt />
              Track
            </Link>

          </div>
        ))
      )}

    </section>
  );
}


// ==================================================
// FAVOURITES SECTION
// ==================================================

function FavouriteRow({ row, removeFavourite, type }) {
  const restaurant = row?.restaurantId;
  const dish = row?.menuItemId;
  const restaurantName =
    restaurant?.name ||
    dish?.restaurantId?.name ||
    "Restaurant";

  const title = type === "dish"
    ? dish?.name || "Dish"
    : restaurant?.name || "Restaurant";

  const subtitle = type === "dish"
    ? `Dish · ${restaurantName}`
    : `${restaurant?.branchName || restaurant?.address?.city || "Restaurant"}`;

  const image =
    type === "dish"
      ? dish?.image
      : restaurant?.images?.[0];

  return (
    <div className="order-row">
      <div className="order-food-icon">
        {image ? (
          <img
            src={image}
            alt={title}
            style={{
              width: 46,
              height: 46,
              borderRadius: 10,
              objectFit: "cover",
            }}
          />
        ) : (
          type === "dish" ? "🍽️" : "🏪"
        )}
      </div>

      <div>
        <strong>{title}</strong>
        <span>{subtitle}</span>
        {type === "dish" && dish?.category && (
          <small>{dish.category}</small>
        )}
      </div>

      {type === "dish" && dish?.price != null && (
        <strong>₹{Number(dish.price).toFixed(0)}</strong>
      )}

      <button
        type="button"
        onClick={() => removeFavourite(row._id)}
        aria-label={`Remove ${type} favourite`}
        title="Remove from favourites"
      >
        <FaTrash />
      </button>
    </div>
  );
}

function FavouritesSection({
  restaurantFavourites,
  dishFavourites,
  removeFavourite,
}) {
  return (
    <section className="dashboard-card">
      <div className="card-heading">
        <div>
          <span className="dashboard-label">
            YOUR FAVOURITES
          </span>
          <h3>Favourite restaurants & dishes</h3>
        </div>

        <Link
          className="detail-btn"
          to="/restaurants"
        >
          Browse restaurants
        </Link>
      </div>

      <div style={{ display: "grid", gap: 24 }}>
        <div>
          <div className="card-heading" style={{ marginBottom: 10 }}>
            <div>
              <strong>Favourite Restaurants</strong>
              <span style={{ marginLeft: 8 }}>
                {restaurantFavourites.length}
              </span>
            </div>
          </div>

          {!restaurantFavourites.length ? (
            <p>No favourite restaurants yet.</p>
          ) : (
            <div className="orders-table">
              {restaurantFavourites.map((row) => (
                <FavouriteRow
                  key={row._id}
                  row={row}
                  type="restaurant"
                  removeFavourite={removeFavourite}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="card-heading" style={{ marginBottom: 10 }}>
            <div>
              <strong>Favourite Dishes</strong>
              <span style={{ marginLeft: 8 }}>
                {dishFavourites.length}
              </span>
            </div>
          </div>

          {!dishFavourites.length ? (
            <p>No favourite dishes yet.</p>
          ) : (
            <div className="orders-table">
              {dishFavourites.map((row) => (
                <FavouriteRow
                  key={row._id}
                  row={row}
                  type="dish"
                  removeFavourite={removeFavourite}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


// ==================================================
// WALLET SECTION
// ==================================================

function WalletSection({
  wallet,
  topUp,
  setTopUp,
  addMoney,
}) {
  return (
    <>
      <section className="wallet-banner">

        <div>

          <span>
            AVAILABLE BALANCE
          </span>

          <strong>
            ₹
            {Number(
              wallet.balance || 0
            ).toFixed(0)}
          </strong>

          <small>
            Balance is calculated from your
            FoodGo wallet ledger.
          </small>

        </div>


        <form
          onSubmit={addMoney}
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >

          <input
            type="number"
            min="1"
            max="50000"
            value={topUp}
            onChange={(e) =>
              setTopUp(e.target.value)
            }
            style={{ width: 110 }}
          />

          <button
            className="detail-btn light"
            type="submit"
          >
            <FaPlus />
            Add credit
          </button>

        </form>

      </section>


      <div className="dashboard-card">

        <span className="dashboard-label">
          RECENT ACTIVITY
        </span>

        <h3>
          Wallet transactions
        </h3>


        {!wallet.transactions?.length ? (
          <p>
            No wallet transactions yet.
          </p>
        ) : (
          <div className="orders-table">

            {wallet.transactions.map((t) => (
              <div
                className="order-row"
                key={t._id}
              >

                <div className="order-food-icon">
                  {["ORDER"].includes(t.type)
                    ? "🧾"
                    : "💳"}
                </div>

                <div>

                  <strong>
                    {t.description || t.type}
                  </strong>

                  <span>
                    {new Date(
                      t.createdAt
                    ).toLocaleString()}
                  </span>

                </div>

                <strong>
                  {[
                    "TOP_UP",
                    "REFUND",
                    "CASHBACK",
                    "ADJUSTMENT",
                  ].includes(t.type)
                    ? "+"
                    : "-"}
                  ₹
                  {Number(
                    t.amount || 0
                  ).toFixed(0)}
                </strong>

                <span>
                  {t.status}
                </span>

              </div>
            ))}

          </div>
        )}

      </div>
    </>
  );
}


// ==================================================
// OFFERS SECTION
// ==================================================

function OffersSection({
  offers,
  offerCode,
  setOfferCode,
  applyOffer,
  offerResult,
}) {
  return (
    <section className="dashboard-card">

      <div className="card-heading">

        <div>
          <span className="dashboard-label">
            ACTIVE OFFERS
          </span>

          <h3>
            Available coupons
          </h3>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
          }}
        >

          <input
            placeholder="Enter code"
            value={offerCode}
            onChange={(e) =>
              setOfferCode(
                e.target.value.toUpperCase()
              )
            }
          />

          <button
            className="detail-btn"
            type="button"
            onClick={() =>
              applyOffer(offerCode)
            }
            disabled={!offerCode}
          >
            <FaCheckCircle />
            Validate
          </button>

        </div>

      </div>


      {offerResult && (
        <div className="fg-inline-success">
          Valid · discount up to ₹
          {Number(
            offerResult.discount || 0
          ).toFixed(0)}
          {" "}
          for the current amount.
        </div>
      )}


      {!offers.length ? (
        <p>
          No active coupons are currently
          stored in the FoodGo database.
        </p>
      ) : (
        <div className="detail-card-grid">

          {offers.map((o) => (
            <article
              className="detail-offer-card"
              key={o._id}
            >

              <span>
                {o.code}
              </span>

              <h3>
                {o.discountType === "PERCENTAGE"
                  ? `${o.discountValue}% OFF`
                  : `₹${o.discountValue} OFF`}
              </h3>

              <p>
                Minimum order ₹
                {o.minimumOrder || 0}

                {o.maxDiscount
                  ? ` · Max ₹${o.maxDiscount}`
                  : ""}
              </p>

              <small>
                Expires{" "}
                {new Date(
                  o.expiresAt
                ).toLocaleDateString()}
              </small>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    o.code
                  );

                  setOfferCode(o.code);
                }}
              >
                <FaCopy />
                Copy code
              </button>

            </article>
          ))}

        </div>
      )}

    </section>
  );
}


// ==================================================
// ACCOUNT SECTION
// ==================================================

function AccountSection({
  profile,
  setProfile,
  saveProfile,
}) {
  return (
    <section className="dashboard-card">

      <span className="dashboard-label">
        ACCOUNT SETTINGS
      </span>

      <h3>
        Personal information
      </h3>

      <form
        className="fg-form-grid"
        onSubmit={saveProfile}
      >

        <input
          required
          placeholder="Name"
          value={profile.name}
          onChange={(e) =>
            setProfile({
              ...profile,
              name: e.target.value,
            })
          }
        />

        <input
          placeholder="Phone"
          value={profile.phone}
          onChange={(e) =>
            setProfile({
              ...profile,
              phone: e.target.value,
            })
          }
        />

        <input
          className="wide"
          placeholder="Avatar URL (optional)"
          value={profile.avatar}
          onChange={(e) =>
            setProfile({
              ...profile,
              avatar: e.target.value,
            })
          }
        />

        <button
          className="detail-btn"
          type="submit"
        >
          <FaCheckCircle />
          Save profile
        </button>

      </form>

    </section>
  );
}


// ==================================================
// STAT COMPONENT
// ==================================================

const Stat = ({ icon, value, label }) => (
  <div className="dashboard-stat-card">

    <div className="stat-icon">
      {icon}
    </div>

    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>

  </div>
);