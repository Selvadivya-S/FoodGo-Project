export const FOODGO_ACCOUNTS = [
  { role: "customer", name: "FoodGo Customer", email: "customer@foodgo.com", password: "Customer@123", avatar: "C" },
  { role: "restaurant_owner", name: "FoodGo Restaurant Partner", email: "restaurant@foodgo.com", password: "Restaurant@123", avatar: "R" },
  { role: "delivery_partner", name: "FoodGo Delivery Partner", email: "delivery@foodgo.com", password: "Delivery@123", avatar: "D" },
  { role: "admin", name: "FoodGo Administrator", email: "admin@foodgo.com", password: "Admin@123", avatar: "A" },
];
export const ROLE_LABELS = {
  customer: "Customer",
  restaurant_owner: "Restaurant Partner",
  delivery_partner: "Delivery Partner",
  admin: "Administrator",
  restaurant: "Restaurant Partner",
  delivery: "Delivery Partner",
};
export const ROLE_DASHBOARD_PATHS = {
  customer: "/customer-dashboard",
  restaurant_owner: "/restaurant-dashboard",
  delivery_partner: "/delivery-dashboard",
  admin: "/admin-dashboard",
};
const normalizeUser = (user) => ({
  ...user,
  id: String(user.id || user._id || ""),
  loggedIn: true,
});
export function getCurrentUser() {
  try {
    const raw =
      localStorage.getItem("foodgo_user") ||
      localStorage.getItem("foodgoUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function saveSession(user, tokens = {}, remember = false) {
  const session = normalizeUser(user);
  localStorage.setItem("foodgo_user", JSON.stringify(session));
  localStorage.setItem("foodgoUser", JSON.stringify(session));
  if (tokens.accessToken) {
    localStorage.setItem("foodgo_access_token", tokens.accessToken);
    localStorage.setItem("accessToken", tokens.accessToken);
  }
  if (tokens.refreshToken) {
    localStorage.setItem("foodgo_refresh_token", tokens.refreshToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
  }
  if (remember) localStorage.setItem("foodgoRememberedEmail", user.email);
  else localStorage.removeItem("foodgoRememberedEmail");
  window.dispatchEvent(new Event("foodgo:user-changed"));
  return session;
}
export function logoutSession() {
  [
    "foodgoUser", "foodgo_user", "accessToken", "refreshToken",
    "foodgo_access_token", "foodgo_refresh_token", "foodgoToken"
  ].forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new Event("foodgo:user-changed"));
}
