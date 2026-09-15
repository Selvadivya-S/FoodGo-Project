import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  loginUser as loginApi,
  registerUser as registerApi,
  getCurrentUser,
  logoutUser as logoutApi,
} from "../api/authApi";
const AuthContext =
  createContext(null);
export const AuthProvider = ({
  children,
}) => {
  const [user, setUser] =
    useState(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  useEffect(() => {
    const loadUser = async () => {
      const token =
        localStorage.getItem(
          "foodgo_access_token"
        );
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data =
          await getCurrentUser();
        if (data.success) {
          setUser(data.user);
        }
      } catch (error) {
        console.error(
          "Unable to restore login:",
          error
        );
        localStorage.removeItem(
          "foodgo_access_token"
        );
        localStorage.removeItem(
          "foodgo_refresh_token"
        );
        localStorage.removeItem(
          "foodgo_user"
        );
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);
  const login = async (
    email,
    password
  ) => {
    try {
      setError("");
      const data =
        await loginApi(
          email,
          password
        );
      if (!data.success) {
        throw new Error(
          data.message ||
            "Login failed"
        );
      }
      localStorage.setItem(
        "foodgo_access_token",
        data.accessToken
      );
      if (data.refreshToken) {
        localStorage.setItem(
          "foodgo_refresh_token",
          data.refreshToken
        );
      }
      localStorage.setItem(
        "foodgo_user",
        JSON.stringify(
          data.user
        )
      );
      setUser(data.user);
      return data;
    } catch (error) {
      const message =
        error.response?.data
          ?.message ||
        error.message ||
        "Login failed";
      setError(message);
      throw new Error(message);
    }
  };
  const register = async (
    userData
  ) => {
    try {
      setError("");
      const data =
        await registerApi(
          userData
        );
      if (!data.success) {
        throw new Error(
          data.message ||
            "Registration failed"
        );
      }
      localStorage.setItem(
        "foodgo_access_token",
        data.accessToken
      );
      if (data.refreshToken) {
        localStorage.setItem(
          "foodgo_refresh_token",
          data.refreshToken
        );
      }
      localStorage.setItem(
        "foodgo_user",
        JSON.stringify(
          data.user
        )
      );
      setUser(data.user);
      return data;
    } catch (error) {
      const message =
        error.response?.data
          ?.message ||
        error.message ||
        "Registration failed";
      setError(message);
      throw new Error(message);
    }
  };
  const logout = () => {
    logoutApi();
    setUser(null);
    setError("");
  };
  const value = {
    user,
    loading,
    error,
    isAuthenticated:
      Boolean(user),
    login,
    register,
    logout,
  };
  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const context =
    useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }
  return context;
};
