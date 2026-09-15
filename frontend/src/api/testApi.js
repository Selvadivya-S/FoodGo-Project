import api from "./axios";
export const getHealth = async () => {
  const response = await api.get("/health");
  return response.data;
};
