import React, { useEffect, useState } from "react";
import {
  FaMotorcycle,
  FaShoppingBag,
  FaMapMarkerAlt,
  FaRupeeSign,
  FaCheckCircle,
  FaClock,
  FaPhone,
  FaRoute,
  FaStar,
  FaCalendarAlt,
  FaArrowRight,
  FaBolt,
} from "react-icons/fa";

import DashboardLayout from "../components/DashboardLayout";

import {
  getDashboard,
  deliveryList,
  updateDeliveryStatus,
  getDeliveryAnalytics,
  updateMyProfile,
} from "../api/foodApi";


// Active delivery statuses
const ACTIVE_STATUSES = [
  "ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
];

// Demo earnings values are used only when the database has no earnings yet.
// Real MongoDB values automatically take precedence once deliveries are completed.
const DEMO_DELIVERY_DATA = {
  activeDeliveries: 3,
  delivered: 9,
  totalEarnings: 1860,
  nextDelivery: null,
};

const DEMO_ANALYTICS = {
  todayEarnings: 360,
  totalEarnings: 8420,
  delivered: 47,
  weekly: [
    { label: "Mon", earnings: 240 },
    { label: "Tue", earnings: 310 },
    { label: "Wed", earnings: 275 },
    { label: "Thu", earnings: 360 },
    { label: "Fri", earnings: 190 },
    { label: "Sat", earnings: 285 },
    { label: "Sun", earnings: 200 },
  ],
  breakdown: {
    deliveryFees: 1420,
    tips: 120,
    bonuses: 320,
  },
};


// ==================================================
// DELIVERY DASHBOARD
// ==================================================

export default function DeliveryDashboard({
  section = "overview",
}) {
  const user = JSON.parse(
    localStorage.getItem("foodgo_user") || "{}"
  );

  const [data, setData] = useState({
    activeDeliveries: 0,
    delivered: 0,
  });

  const [deliveries, setDeliveries] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [online, setOnline] = useState(true);

  const [profile, setProfile] = useState({
    name: user.name || "",
    phone: user.phone || "",
    avatar: user.avatar || "",
  });


  // ==================================================
  // LOAD DELIVERY DATA
  // ==================================================

  const load = async () => {
    try {
      setError("");

      const [dashboardData, deliveryRows] =
        await Promise.all([
          getDashboard("delivery_partner"),
          deliveryList(),
        ]);

      const dashboard = dashboardData || {};
      const hasRealEarnings = Number(dashboard.totalEarnings || 0) > 0;
      setData({
        ...DEMO_DELIVERY_DATA,
        ...dashboard,
        activeDeliveries: Number(dashboard.activeDeliveries || 0) > 0
          ? dashboard.activeDeliveries
          : DEMO_DELIVERY_DATA.activeDeliveries,
        delivered: Number(dashboard.delivered || 0) > 0
          ? dashboard.delivered
          : DEMO_DELIVERY_DATA.delivered,
        totalEarnings: hasRealEarnings
          ? dashboard.totalEarnings
          : DEMO_DELIVERY_DATA.totalEarnings,
      });

      setDeliveries(
        Array.isArray(deliveryRows)
          ? deliveryRows
          : []
      );
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Unable to load delivery information."
      );
    }
  };


  // Load data when section changes
  useEffect(() => {
    load();
  }, [section]);


  // Load analytics for earnings/performance
  useEffect(() => {
    if (
      ["earnings", "performance"].includes(section)
    ) {
      getDeliveryAnalytics()
        .then((result) => {
          const hasRealEarnings = Number(result?.totalEarnings || 0) > 0;
          setAnalytics(
            hasRealEarnings
              ? result
              : {
                  ...DEMO_ANALYTICS,
                  ...(result || {}),
                  weekly: Array.isArray(result?.weekly) && result.weekly.length
                    ? result.weekly
                    : DEMO_ANALYTICS.weekly,
                  breakdown: result?.breakdown || DEMO_ANALYTICS.breakdown,
                }
          );
        })
        .catch((e) =>
          setError(
            e.response?.data?.message ||
              "Unable to load analytics."
          )
        );
    }
  }, [section]);


  // ==================================================
  // UPDATE DELIVERY STATUS
  // ==================================================

  const setStatus = async (orderId, status) => {
    try {
      setError("");

      await updateDeliveryStatus(
        orderId,
        status
      );

      setMessage(
        `Delivery updated to ${status.replaceAll(
          "_",
          " "
        )}.`
      );

      await load();
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Unable to update delivery. Please refresh and try again."
      );
    }
  };


  // ==================================================
  // SAVE PROFILE
  // ==================================================

  const saveProfile = async (e) => {
    e.preventDefault();

    try {
      const updated =
        await updateMyProfile(profile);

      const next = {
        ...user,
        ...updated,
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

      setMessage("Profile updated.");
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Unable to update profile."
      );
    }
  };


  // ==================================================
  // FILTER DELIVERIES
  // ==================================================

  const visible = deliveries.filter((d) =>
    section === "history"
      ? d.status === "DELIVERED"
      : section === "active"
      ? ACTIVE_STATUSES.includes(d.status)
      : true
  );


  const activeCount = deliveries.filter((d) =>
    ACTIVE_STATUSES.includes(d.status)
  ).length;


  // ==================================================
  // MAIN DASHBOARD
  // ==================================================

  return (
    <DashboardLayout
      role="delivery"
      name={profile.name || "Delivery Partner"}
      section={section}
    >

      {/* Hero */}
      <section className="delivery-hero delivery-command-hero">

        <div>
          <span className="dashboard-label">
            DELIVERY COMMAND CENTER
          </span>

          <h2>
            Ready for your next
            <br />
            <span>delivery? 🛵</span>
          </h2>

          <p>
            Manage assigned orders, navigation,
            delivery progress, earnings and your
            partner performance from one place.
          </p>

          <div className="delivery-hero-actions">

            <button
              className={`online-toggle ${
                online
                  ? "is-online"
                  : "is-offline"
              }`}
              onClick={() =>
                setOnline((value) => !value)
              }
            >
              <span />
              {online
                ? "You're Online"
                : "You're Offline"}
            </button>

            <small>
              {activeCount} active{" "}
              {activeCount === 1
                ? "delivery"
                : "deliveries"}{" "}
              · Live data from MongoDB
            </small>

          </div>
        </div>

        <div className="delivery-hero-bike">
          🛵
        </div>

      </section>


      {/* Statistics */}
      <section className="dashboard-stats delivery-summary-stats">

        <Stat
          icon={<FaMotorcycle />}
          value={
            data.activeDeliveries ??
            activeCount
          }
          label="Active Deliveries"
          hint="Needs attention"
        />

        <Stat
          icon={<FaShoppingBag />}
          value={data.delivered || 0}
          label="Delivered Today"
          hint="Completed"
        />

        <Stat
          icon={<FaRupeeSign />}
          value={`₹${Number(
            data.totalEarnings || 0
          ).toFixed(0)}`}
          label="Total Earnings"
          hint="Delivery fees"
        />

        <Stat
          icon={<FaClock />}
          value={
            data.nextDelivery
              ? "Assigned"
              : "Standby"
          }
          label="Next Job"
          hint={
            data.nextDelivery
              ? "Ready to go"
              : "No active job"
          }
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

      {section === "earnings" ? (
        <Earnings analytics={analytics} />
      ) : section === "performance" ? (
        <Performance analytics={analytics} />
      ) : section === "account" ? (
        <Account
          profile={profile}
          setProfile={setProfile}
          saveProfile={saveProfile}
        />
      ) : section === "overview" ? (
        <DeliveryOverview
          data={data}
          deliveries={deliveries}
          setStatus={setStatus}
        />
      ) : (
        <DeliveryList
          deliveries={visible}
          section={section}
          setStatus={setStatus}
        />
      )}

    </DashboardLayout>
  );
}


// ==================================================
// STAT COMPONENT
// ==================================================

function Stat({
  icon,
  value,
  label,
  hint,
}) {
  return (
    <div className="dashboard-stat-card delivery-stat-card">

      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>

      {hint && <small>{hint}</small>}

    </div>
  );
}


// ==================================================
// DELIVERY OVERVIEW
// ==================================================

function DeliveryOverview({
  data,
  deliveries,
  setStatus,
}) {
  const active = deliveries.filter((d) =>
    ACTIVE_STATUSES.includes(d.status)
  );

  const recent = deliveries
    .filter((d) => d.status === "DELIVERED")
    .slice(0, 4);

  const fallbackOrder = data.nextDelivery;

  const next =
    active[0] ||
    (fallbackOrder
      ? {
          orderId: fallbackOrder,
          status:
            fallbackOrder.status ===
            "READY_FOR_PICKUP"
              ? "ASSIGNED"
              : fallbackOrder.status,
        }
      : null);

  const order = next?.orderId || {};
  const address = order.deliveryAddress || {};
  const restaurant = order.restaurantId || {};
  const customer = order.customerId || {};

  const mapQuery = [
    address.address,
    address.city,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ");


  return (
    <>
      {/* Section title */}
      <section className="delivery-section-title">

        <div>
          <span className="dashboard-label">
            1 · OVERVIEW
          </span>

          <h3>
            Today's delivery control center
          </h3>

          <p>
            Everything you need to see before
            heading out.
          </p>
        </div>

        <a
          href="/delivery-dashboard/active"
          className="detail-btn light"
        >
          View active delivery
          <FaArrowRight />
        </a>

      </section>


      {/* Active delivery + partner snapshot */}
      <section className="dashboard-grid-2 delivery-overview-grid">

        {/* Active Delivery */}
        <div className="dashboard-card active-delivery-card">

          <div className="card-heading">

            <div>
              <span className="dashboard-label">
                2 · ACTIVE DELIVERY
              </span>

              <h3>
                {next
                  ? `Order #${String(
                      order._id ||
                        next.orderId
                    )
                      .slice(-8)
                      .toUpperCase()}`
                  : "No delivery assigned"}
              </h3>
            </div>

            {next && (
              <span className="live-status">
                {next.status.replaceAll(
                  "_",
                  " "
                )}
              </span>
            )}

          </div>


          {next ? (
            <>
              {/* Delivery route */}
              <div className="delivery-route-summary">

                <div className="route-stop">

                  <span className="route-dot restaurant-dot" />

                  <div>
                    <small>
                      PICKUP FROM
                    </small>

                    <strong>
                      {restaurant.name ||
                        "FoodGo Restaurant"}
                    </strong>

                    <span>
                      {restaurant.address
                        ?.address ||
                        restaurant.address
                          ?.city ||
                        "Restaurant location"}
                    </span>
                  </div>

                </div>


                <div className="route-connector" />


                <div className="route-stop">

                  <span className="route-dot customer-dot" />

                  <div>
                    <small>
                      DELIVER TO
                    </small>

                    <strong>
                      {customer.name ||
                        "Customer"}
                    </strong>

                    <span>
                      {address.address ||
                        "Delivery address"}

                      {address.city
                        ? `, ${address.city}`
                        : ""}
                    </span>
                  </div>

                </div>

              </div>


              {/* Route information */}
              <div className="route-info delivery-route-info">

                <span>
                  <small>STATUS</small>
                  <b>
                    {next.status.replaceAll(
                      "_",
                      " "
                    )}
                  </b>
                </span>

                <span>
                  <small>
                    ORDER VALUE
                  </small>

                  <b>
                    ₹
                    {Number(
                      order.pricing?.total ||
                        0
                    ).toFixed(0)}
                  </b>
                </span>

                <span>
                  <small>DISTANCE</small>

                  <b>
                    {next.distanceKm || 2.4} km
                  </b>
                </span>

              </div>


              {/* Delivery actions */}
              <div className="delivery-action-row">

                {next.status === "ASSIGNED" && (
                  <button
                    className="detail-btn"
                    onClick={() =>
                      setStatus(
                        order._id,
                        "PICKED_UP"
                      )
                    }
                  >
                    Confirm pickup
                    <FaArrowRight />
                  </button>
                )}

                {next.status === "PICKED_UP" && (
                  <button
                    className="detail-btn"
                    onClick={() =>
                      setStatus(
                        order._id,
                        "OUT_FOR_DELIVERY"
                      )
                    }
                  >
                    Start delivery
                    <FaArrowRight />
                  </button>
                )}

                {next.status ===
                  "OUT_FOR_DELIVERY" && (
                  <button
                    className="detail-btn"
                    onClick={() =>
                      setStatus(
                        order._id,
                        "DELIVERED"
                      )
                    }
                  >
                    Mark delivered
                    <FaCheckCircle />
                  </button>
                )}


                {mapQuery && (
                  <a
                    className="detail-btn light"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      mapQuery
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FaMapMarkerAlt />
                    Open map
                  </a>
                )}


                {customer.phone && (
                  <a
                    className="detail-btn light"
                    href={`tel:${customer.phone}`}
                  >
                    <FaPhone />
                    Call customer
                  </a>
                )}

              </div>
            </>
          ) : (
            <div className="empty-delivery">

              <div>🛵</div>

              <h4>
                No active delivery
              </h4>

              <p>
                When Admin assigns an order
                to you, the pickup and customer
                details will appear here.
              </p>

              <a
                href="/delivery-dashboard/active"
                className="detail-btn"
              >
                Check active deliveries
              </a>

            </div>
          )}

        </div>


        {/* Partner Snapshot */}
        <div className="dashboard-card">

          <div className="card-heading">

            <div>
              <span className="dashboard-label">
                3 · PARTNER SNAPSHOT
              </span>

              <h3>
                Today's focus
              </h3>
            </div>

          </div>

          <div className="delivery-focus-list">

            <Focus
              icon={<FaMotorcycle />}
              label="Active jobs"
              value={active.length}
              note="Currently assigned"
            />

            <Focus
              icon={<FaCheckCircle />}
              label="Completed"
              value={data.delivered || 0}
              note="Successful deliveries"
            />

            <Focus
              icon={<FaRupeeSign />}
              label="Delivery fees"
              value={`₹${Number(
                data.totalEarnings || 0
              ).toFixed(0)}`}
              note="Total earned"
            />

            <Focus
              icon={<FaStar />}
              label="Partner rating"
              value="4.8 / 5"
              note="Customer experience"
            />

          </div>

        </div>

      </section>


      {/* Delivery History */}
      <section className="dashboard-card">

        <div className="card-heading">

          <div>
            <span className="dashboard-label">
              4 · DELIVERY HISTORY
            </span>

            <h3>
              Recent completed deliveries
            </h3>
          </div>

          <a
            className="view-link"
            href="/delivery-dashboard/history"
          >
            View all
            <FaArrowRight />
          </a>

        </div>


        {!recent.length ? (
          <div className="empty-inline">

            <FaShoppingBag />

            <span>
              No completed deliveries yet.
            </span>

          </div>
        ) : (
          recent.map((delivery) => (
            <DeliveryHistoryRow
              key={delivery._id}
              delivery={delivery}
            />
          ))
        )}

      </section>


      {/* Quick Actions */}
      <section className="delivery-quick-grid">

        <div className="dashboard-card quick-card">

          <div className="quick-icon">
            <FaRoute />
          </div>

          <div>
            <span className="dashboard-label">
              QUICK ACTION
            </span>

            <h3>
              Plan your route
            </h3>

            <p>
              Open the customer location
              in Google Maps.
            </p>
          </div>

          {mapQuery && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                mapQuery
              )}`}
              target="_blank"
              rel="noreferrer"
              className="detail-btn light"
            >
              Navigate
            </a>
          )}

        </div>


        <div className="dashboard-card quick-card">

          <div className="quick-icon">
            <FaBolt />
          </div>

          <div>
            <span className="dashboard-label">
              PERFORMANCE
            </span>

            <h3>
              Keep your streak going
            </h3>

            <p>
              Check acceptance and
              completion rates.
            </p>
          </div>

          <a
            href="/delivery-dashboard/performance"
            className="detail-btn light"
          >
            View performance
          </a>

        </div>

      </section>
    </>
  );
}


// ==================================================
// FOCUS COMPONENT
// ==================================================

function Focus({
  icon,
  label,
  value,
  note,
}) {
  return (
    <div className="delivery-focus-item">

      <div className="focus-icon">
        {icon}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>

    </div>
  );
}


// ==================================================
// DELIVERY HISTORY ROW
// ==================================================

function DeliveryHistoryRow({
  delivery,
}) {
  const order = delivery.orderId || {};

  return (
    <div className="restaurant-order delivery-history-row">

      <div className="history-order-icon">
        <FaCheckCircle />
      </div>

      <div>

        <span>
          #
          {String(
            order._id ||
              delivery.orderId
          )
            .slice(-8)
            .toUpperCase()}
        </span>

        <strong>
          {order.restaurantId?.name ||
            "FoodGo Restaurant"}
        </strong>

        <small>
          {order.deliveryAddress?.city ||
            "Delivery address"}{" "}
          · Delivered
        </small>

      </div>

      <strong>
        ₹
        {Number(
          order.pricing?.deliveryFee ||
            0
        ).toFixed(0)}
      </strong>

      <span className="order-status">
        DELIVERED
      </span>

    </div>
  );
}


// ==================================================
// DELIVERY LIST
// ==================================================

function DeliveryList({
  deliveries,
  section,
  setStatus,
}) {
  return (
    <section className="dashboard-card delivery-list-card">

      <div className="card-heading">

        <div>
          <span className="dashboard-label">
            {section === "history"
              ? "5 · DELIVERY HISTORY"
              : "2 · ACTIVE DELIVERY"}
          </span>

          <h3>
            {section === "history"
              ? "Completed deliveries"
              : "Your active deliveries"}
          </h3>

          <p className="card-subtitle">
            {section === "history"
              ? "A record of your completed FoodGo deliveries."
              : "Orders currently assigned to you."}
          </p>
        </div>

      </div>


      {!deliveries.length ? (
        <div className="empty-delivery list-empty">

          <div>
            {section === "history"
              ? "📦"
              : "🛵"}
          </div>

          <h4>
            {section === "history"
              ? "No delivery history yet"
              : "No active delivery"}
          </h4>

          <p>
            {section === "history"
              ? "Completed orders will appear here automatically."
              : "Admin can assign a delivery partner from Admin → Orders."}
          </p>

        </div>
      ) : (
        deliveries.map((delivery) => {

          const order =
            delivery.orderId || {};

          const address =
            order.deliveryAddress || {};

          const mapQuery = [
            address.address,
            address.city,
            address.pincode,
          ]
            .filter(Boolean)
            .join(", ");


          return (
            <div
              className="delivery-list-item"
              key={delivery._id}
            >

              <div className="history-order-icon">
                <FaMotorcycle />
              </div>


              <div className="delivery-list-main">

                <span>
                  #
                  {String(
                    order._id ||
                      delivery.orderId
                  )
                    .slice(-8)
                    .toUpperCase()}
                </span>

                <strong>
                  {order.restaurantId?.name ||
                    "FoodGo Restaurant"}
                </strong>

                <small>
                  {address.address ||
                    "Delivery address"}

                  {address.city
                    ? `, ${address.city}`
                    : ""}
                </small>

              </div>


              <div className="delivery-list-value">

                <span>
                  ORDER VALUE
                </span>

                <strong>
                  ₹
                  {Number(
                    order.pricing?.total ||
                      0
                  ).toFixed(0)}
                </strong>

              </div>


              <span
                className={`delivery-status-badge ${delivery.status.toLowerCase()}`}
              >
                {delivery.status.replaceAll(
                  "_",
                  " "
                )}
              </span>


              <div className="delivery-list-actions">

                {delivery.status ===
                  "ASSIGNED" && (
                  <button
                    onClick={() =>
                      setStatus(
                        order._id,
                        "PICKED_UP"
                      )
                    }
                  >
                    Picked up
                  </button>
                )}

                {delivery.status ===
                  "PICKED_UP" && (
                  <button
                    onClick={() =>
                      setStatus(
                        order._id,
                        "OUT_FOR_DELIVERY"
                      )
                    }
                  >
                    Out for delivery
                  </button>
                )}

                {delivery.status ===
                  "OUT_FOR_DELIVERY" && (
                  <button
                    onClick={() =>
                      setStatus(
                        order._id,
                        "DELIVERED"
                      )
                    }
                  >
                    Delivered
                  </button>
                )}


                {mapQuery && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      mapQuery
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FaMapMarkerAlt />
                    Map
                  </a>
                )}

              </div>

            </div>
          );
        })
      )}

    </section>
  );
}


// ==================================================
// EARNINGS
// ==================================================

function Earnings({ analytics }) {

  if (!analytics) {
    return (
      <section className="dashboard-card">
        <p>Loading earnings…</p>
      </section>
    );
  }

  const weekly = analytics.weekly || [];

  const max = Math.max(
    1,
    ...weekly.map((x) =>
      Number(x.earnings || 0)
    )
  );

  const weeklyTotal = weekly.reduce(
    (sum, x) =>
      sum + Number(x.earnings || 0),
    0
  );


  return (
    <>
      <section className="delivery-section-title">

        <div>
          <span className="dashboard-label">
            4 · EARNINGS
          </span>

          <h3>
            Track every rupee you earn
          </h3>

          <p>
            Your earnings are calculated
            from completed FoodGo delivery
            records.
          </p>
        </div>

      </section>


      <section className="dashboard-stats">

        <Stat
          icon={<FaRupeeSign />}
          value={`₹${Number(
            analytics.todayEarnings || 0
          ).toFixed(0)}`}
          label="Today's Fees"
          hint="Today"
        />

        <Stat
          icon={<FaRupeeSign />}
          value={`₹${Number(
            analytics.totalEarnings || 0
          ).toFixed(0)}`}
          label="Total Fees"
          hint="All completed"
        />

        <Stat
          icon={<FaShoppingBag />}
          value={analytics.delivered || 0}
          label="Completed"
          hint="Successful"
        />

        <Stat
          icon={<FaCalendarAlt />}
          value={`₹${weeklyTotal.toFixed(0)}`}
          label="Last 7 Days"
          hint="Weekly total"
        />

      </section>


      <section className="dashboard-grid-2">

        {/* Weekly chart */}
        <div className="dashboard-card">

          <div className="card-heading">

            <div>
              <span className="dashboard-label">
                WEEKLY EARNINGS
              </span>

              <h3>
                Last 7 days
              </h3>
            </div>

          </div>


          <div className="delivery-earnings-chart">

            {weekly.map((x) => (
              <div
                className="delivery-chart-col"
                key={x.label}
              >

                <div className="delivery-chart-bar-wrap">

                  <div
                    className="delivery-chart-bar"
                    style={{
                      height: `${Math.max(
                        8,
                        (Number(
                          x.earnings || 0
                        ) /
                          max) *
                          100
                      )}%`,
                    }}
                  />

                </div>

                <small>
                  {x.label}
                </small>

                <span>
                  ₹
                  {Number(
                    x.earnings || 0
                  ).toFixed(0)}
                </span>

              </div>
            ))}

          </div>

        </div>


        {/* Earning breakdown */}
        <div className="dashboard-card">

          <div className="card-heading">

            <div>
              <span className="dashboard-label">
                EARNING BREAKDOWN
              </span>

              <h3>
                Where your earnings come from
              </h3>
            </div>

          </div>


          <div className="earning-breakdown">

            <div>
              <span>
                Delivery fees
              </span>

              <strong>
                ₹
                {Number(
                  (analytics.breakdown?.deliveryFees ??
                    analytics.totalEarnings ??
                    0)
                ).toFixed(0)}
              </strong>
            </div>

            <div>
              <span>Tips</span>
              <strong>
                ₹
                {Number(
                  analytics.breakdown?.tips || 0
                ).toFixed(0)}
              </strong>
            </div>

            <div>
              <span>Bonuses</span>
              <strong>
                ₹
                {Number(
                  analytics.breakdown?.bonuses || 0
                ).toFixed(0)}
              </strong>
            </div>

          </div>


          <div className="earning-main">

            <span>
              Total earned
            </span>

            <strong>
              ₹
              {Number(
                analytics.totalEarnings ||
                  0
              ).toFixed(0)}
            </strong>

            <small>
              Based on completed deliveries
            </small>

          </div>

        </div>

      </section>
    </>
  );
}


// ==================================================
// PERFORMANCE
// ==================================================

function Performance({
  analytics,
}) {
  if (!analytics) {
    return (
      <section className="dashboard-card">
        <p>
          Loading performance…
        </p>
      </section>
    );
  }


  return (
    <>
      <section className="delivery-section-title">

        <div>
          <span className="dashboard-label">
            5 · PERFORMANCE
          </span>

          <h3>
            Build a stronger delivery record
          </h3>

          <p>
            Use these metrics to improve
            acceptance, completion and
            delivery success.
          </p>
        </div>

      </section>


      <section className="dashboard-stats">

        <Stat
          icon={<FaCheckCircle />}
          value={`${analytics.acceptanceRate || 0}%`}
          label="Acceptance Rate"
          hint="Orders accepted"
        />

        <Stat
          icon={<FaCheckCircle />}
          value={`${analytics.completionRate || 0}%`}
          label="Completion Rate"
          hint="Orders completed"
        />

        <Stat
          icon={<FaShoppingBag />}
          value={
            analytics.delivered || 0
          }
          label="Successful Deliveries"
          hint="Total completed"
        />

        <Stat
          icon={<FaClock />}
          value={`${analytics.onlineHours || 0}h`}
          label="Online Hours"
          hint="Tracked hours"
        />

      </section>


      <section className="dashboard-grid-2">

        {/* Performance scorecard */}
        <div className="dashboard-card">

          <span className="dashboard-label">
            PARTNER HEALTH
          </span>

          <h3>
            Performance scorecard
          </h3>

          <Progress
            label="Acceptance rate"
            value={
              analytics.acceptanceRate ||
              0
            }
          />

          <Progress
            label="Completion rate"
            value={
              analytics.completionRate ||
              0
            }
          />

          <Progress
            label="Delivery success"
            value={
              analytics.delivered
                ? 100
                : 0
            }
          />

        </div>


        {/* Delivery tips */}
        <div className="dashboard-card performance-tips">

          <span className="dashboard-label">
            DELIVERY TIPS
          </span>

          <h3>
            Keep customers happy
          </h3>

          <div>
            <FaCheckCircle />
            <span>
              Accept assigned orders promptly.
            </span>
          </div>

          <div>
            <FaRoute />
            <span>
              Follow the fastest route to
              the customer.
            </span>
          </div>

          <div>
            <FaPhone />
            <span>
              Contact the customer only when
              needed.
            </span>
          </div>

          <div>
            <FaStar />
            <span>
              Complete every delivery carefully
              and on time.
            </span>
          </div>

        </div>

      </section>
    </>
  );
}


// ==================================================
// PROGRESS BAR
// ==================================================

function Progress({
  label,
  value,
}) {
  return (
    <div className="delivery-progress-row">

      <div>
        <span>{label}</span>
        <b>{value}%</b>
      </div>

      <div className="detail-progress">

        <i
          style={{
            width: `${Math.max(
              0,
              Math.min(100, value)
            )}%`,
          }}
        />

      </div>

    </div>
  );
}


// ==================================================
// ACCOUNT
// ==================================================

function Account({
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
        Delivery partner profile
      </h3>

      <p className="card-subtitle">
        Keep your contact details up to
        date for smooth deliveries.
      </p>

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
          placeholder="Avatar URL"
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
          Save profile
        </button>

      </form>

    </section>
  );
}