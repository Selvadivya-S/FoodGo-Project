import api from "./axios";
const unwrap = (response) => response.data?.data ?? response.data;
export async function getRestaurantLocations() {
  return unwrap(await api.get("/restaurants/locations"));
}
export async function getRestaurants(params = {}) {
  return unwrap(await api.get("/restaurants", { params }));
}
export async function getRestaurant(id) {
  return unwrap(await api.get(`/restaurants/${id}`));
}
export async function getCityMenu(city, limit = 20) {
  return unwrap(await api.get("/restaurants/menus", { params: { city, limit } }));
}
export async function getMenu(restaurantId) {
  return unwrap(await api.get(`/restaurants/${restaurantId}/menu`));
}
export async function getBranches(restaurantId) {
  return unwrap(await api.get(`/restaurants/${restaurantId}/branches`));
}
export async function createOrder(payload) {
  return unwrap(await api.post("/customer/orders", payload));
}
export async function createPaymentOrder(orderId) {
  return unwrap(await api.post("/payment/create-order", { orderId }));
}
export async function verifyPayment(payload) {
  return unwrap(await api.post("/payment/verify", payload));
}
export async function failPayment(orderId) {
  return unwrap(await api.post("/payment/fail", { orderId }));
}
export async function getMyOrders() {
  return unwrap(await api.get("/customer/orders"));
}
export async function getOrder(id) {
  return unwrap(await api.get(`/customer/orders/${id}`));
}
export async function getDashboard(role, restaurantId) {
  let endpoint = role === "admin"
    ? "/admin/dashboard"
    : role === "restaurant_owner"
      ? "/restaurant/dashboard"
      : role === "delivery_partner"
        ? "/delivery/dashboard"
        : "/customer/dashboard";
  if (role === "restaurant_owner" && restaurantId) endpoint += `?restaurantId=${encodeURIComponent(restaurantId)}`;
  return unwrap(await api.get(endpoint));
}
export async function adminRestaurants() {
  return unwrap(await api.get("/admin/restaurants"));
}
export async function adminCreateRestaurant(payload) {
  return unwrap(await api.post("/admin/restaurants", payload));
}
export async function adminApproveRestaurant(id) {
  return unwrap(await api.patch(`/admin/restaurants/${id}/approve`));
}
export async function restaurantMenu(restaurantId) {
  return unwrap(await api.get(`/restaurant/${restaurantId}/menu`));
}
export async function addDish(restaurantId, payload) {
  return unwrap(await api.post(`/restaurant/${restaurantId}/menu`, payload));
}
export async function updateDish(id, payload) {
  return unwrap(await api.patch(`/restaurant/menu/${id}`, payload));
}
export async function deleteDish(id) {
  return unwrap(await api.delete(`/restaurant/menu/${id}`));
}
export async function restaurantOrders(restaurantId) {
  return unwrap(await api.get(`/restaurant/${restaurantId}/orders`));
}
export async function updateRestaurantOrder(restaurantId, orderId, status) {
  return unwrap(await api.patch(`/restaurant/${restaurantId}/orders/${orderId}/status`, { status }));
}
export async function adminUsers() {
  return unwrap(await api.get("/admin/users"));
}
export async function adminCreateUser(payload) {
  return unwrap(await api.post("/admin/users", payload));
}
export async function adminOrders() {
  return unwrap(await api.get("/admin/orders"));
}
export async function adminAssignDelivery(orderId, deliveryPartnerId) {
  return unwrap(await api.patch(`/admin/orders/${orderId}/assign-delivery`, { deliveryPartnerId }));
}
export async function adminRestaurantMenu(restaurantId) {
  return unwrap(await api.get(`/admin/restaurants/${restaurantId}/menu`));
}
export async function adminAddDish(restaurantId, payload) {
  return unwrap(await api.post(`/admin/restaurants/${restaurantId}/menu`, payload));
}
export async function adminUpdateDish(id, payload) {
  return unwrap(await api.patch(`/admin/menu/${id}`, payload));
}
export async function adminDeleteDish(id) {
  return unwrap(await api.delete(`/admin/menu/${id}`));
}
export async function deliveryList() {
  return unwrap(await api.get("/delivery/deliveries"));
}
export async function updateDeliveryStatus(orderId, status) {
  return unwrap(await api.patch("/delivery/deliveries/status", { orderId, status }));
}
export async function getCustomerFavourites() {
  return unwrap(await api.get("/customer/favourites"));
}
export async function addCustomerFavourite(payload) {
  return unwrap(await api.post("/customer/favourites", payload));
}
export async function removeCustomerFavourite(id) {
  return unwrap(await api.delete(`/customer/favourites/${id}`));
}
export async function getCustomerWallet() {
  return unwrap(await api.get("/customer/wallet"));
}
export async function topUpCustomerWallet(amount) {
  return unwrap(await api.post("/customer/wallet/top-up", { amount }));
}
export async function syncCustomerWalletOrders() {
  return unwrap(await api.post("/customer/wallet/sync-orders"));
}
export async function getCustomerOffers() {
  return unwrap(await api.get("/customer/offers"));
}
export async function validateCustomerOffer(code, subtotal = 0) {
  return unwrap(await api.post("/customer/offers/validate", { code, subtotal }));
}
export async function updateCustomerProfile(payload) {
  return unwrap(await api.patch("/customer/profile", payload));
}
export async function updateMyProfile(payload) {
  return unwrap(await api.patch("/auth/me", payload));
}
export async function getRestaurantAnalytics(restaurantId) {
  const query = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : "";
  return unwrap(await api.get(`/restaurant/analytics${query}`));
}
export async function updateRestaurant(id, payload) {
  return unwrap(await api.patch(`/restaurant/${id}`, payload));
}
export async function getDeliveryAnalytics() {
  return unwrap(await api.get("/delivery/analytics"));
}
export async function getAdminAnalytics() {
  return unwrap(await api.get("/admin/analytics"));
}
export async function getAdminSettings() {
  return unwrap(await api.get("/admin/settings"));
}
export async function updateAdminSettings(payload) {
  return unwrap(await api.patch("/admin/settings", payload));
}
export async function getNotifications(role) {
  const prefix = role === "admin" ? "/admin" : role === "restaurant" || role === "restaurant_owner" ? "/restaurant" : role === "delivery" || role === "delivery_partner" ? "/delivery" : "/customer";
  return unwrap(await api.get(`${prefix}/notifications`));
}
export async function markNotificationRead(role, id) {
  const prefix = role === "admin" ? "/admin" : role === "restaurant" || role === "restaurant_owner" ? "/restaurant" : role === "delivery" || role === "delivery_partner" ? "/delivery" : "/customer";
  return unwrap(await api.patch(`${prefix}/notifications/${id}/read`));
}

