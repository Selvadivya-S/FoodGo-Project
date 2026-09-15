import api from "./axios";
export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", {
    name: userData.name,
    email: userData.email,
    password: userData.password,
    phone: userData.phone || "",
    role: userData.role || "customer",
  });
  return response.data;
};
export const loginUser = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};
export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};
export const logoutUser = async () => {
  try { await api.post("/auth/logout"); } catch {}
  [
    "foodgo_access_token", "foodgo_refresh_token", "foodgo_user",
    "accessToken", "refreshToken", "foodgoUser"
  ].forEach((key) => localStorage.removeItem(key));
};
