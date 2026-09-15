import React from "react";
export default function GoogleMap({
  latitude,
  longitude,
  address = "",
  height = 380,
  title = "FoodGo location",
}) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasCoords =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0);
  const query = hasCoords
    ? `${lat},${lng}`
    : String(address || "").trim();
  if (!query) {
    return (
      <div className="fg-empty-inline">
        Add the restaurant address or exact latitude/longitude to show its
        Google Maps location.
      </div>
    );
  }
  const src =
    `https://www.google.com/maps?q=${encodeURIComponent(query)}` +
    "&z=15&output=embed";
  const link =
    `https://www.google.com/maps/search/?api=1&query=` + 
    encodeURIComponent(query); 
  return ( 
    <div className="fg-google-map"> 
      <iframe 
        title={title} 
        src={src} 
        width="100%" 
        height={height} 
        style={{ border: 0, borderRadius: 20 }} 
        loading="lazy" 
        allowFullScreen 
        referrerPolicy="no-referrer-when-downgrade" 
      /> 
      <a 
        className="fg-btn fg-btn-secondary" 
        href={link} 
        target="_blank" 
        rel="noreferrer" 
      > 
        Open in Google Maps 
      </a> 
    </div> 
  ); 
} 