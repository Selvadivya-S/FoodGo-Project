import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("foodgo_access_token") ||
    localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original?._retry) {
      const refreshToken =
        localStorage.getItem("foodgo_refresh_token") ||
        localStorage.getItem("refreshToken");
      if (refreshToken && original?.url !== "/auth/refresh") {
        original._retry = true;
        try {
          const { data } = await api.post("/auth/refresh", { refreshToken });
          const token = data.accessToken || data.data?.accessToken;
          if (token) {
            localStorage.setItem("foodgo_access_token", token);
            localStorage.setItem("accessToken", token);
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          }
        } catch {}
      }
    }
    return Promise.reject(error);
  }
);
export default api;
