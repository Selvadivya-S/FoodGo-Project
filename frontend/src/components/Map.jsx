import React from "react";

export default function Map({
  restaurants = [],
  height = 500,
  selected = null,
  latitude,
  longitude,
  address = "",
  title = "FoodGo location",
}) {
  // --------------------------------------------------
  // 1. Select the restaurant
  // --------------------------------------------------
  const target = selected || restaurants[0] || null;

  // --------------------------------------------------
  // 2. Get coordinates
  // Priority:
  // selected restaurant coordinates
  // ↓
  // component coordinates
  // --------------------------------------------------
  const lat = Number(
    target?.latitude ??
    target?.lat ??
    latitude
  );

  const lng = Number(
    target?.longitude ??
    target?.lng ??
    longitude
  );

  const hasCoords =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0);

  // --------------------------------------------------
  // 3. Get restaurant address
  // --------------------------------------------------
  const restaurantAddress = target
    ? [
        target.address?.street,
        target.address?.city,
        target.address?.state,
        target.address?.pincode,
      ]
        .filter(Boolean)
        .join(", ")
    : address;

  // --------------------------------------------------
  // 4. Choose Google Maps query
  // Coordinates first, address second
  // --------------------------------------------------
  const query = hasCoords
    ? `${lat},${lng}`
    : [
        target?.name,
        restaurantAddress,
      ]
        .filter(Boolean)
        .join(", ") || "Chennai, India";

  // --------------------------------------------------
  // 5. Google Maps URLs
  // --------------------------------------------------
  const src =
    `https://www.google.com/maps?q=${encodeURIComponent(query)}` +
    "&z=15&output=embed";

  const link =
    `https://www.google.com/maps/search/?api=1&query=` +
    encodeURIComponent(query);

  // --------------------------------------------------
  // 6. Render map
  // --------------------------------------------------
  return (
    <div className="fg-google-map">

      <iframe
        title={title}
        src={src}
        width="100%"
        height={height}
        style={{
          border: 0,
          borderRadius: 20,
        }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />

      <div
        style={{
          marginTop: 10,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
        }}
      >
        <span
          className="fg-empty-inline"
          style={{ margin: 0 }}
        >
          {restaurants.length > 0
            ? `${restaurants.length} restaurant${
                restaurants.length === 1 ? "" : "s"
              } loaded from FoodGo.`
            : hasCoords
            ? "Showing exact restaurant location."
            : "Showing restaurant location from address."}
        </span>

        <a
          className="fg-btn fg-btn-secondary"
          href={link}
          target="_blank"
          rel="noreferrer"
        >
          Open in Google Maps
        </a>
      </div>
    </div>
  );
}