import React, { useState, useEffect } from "react";
import AuthContext from "../contexts/authContext";
import { jwtDecode } from "jwt-decode";
import AuthServices from "../services/auth.services";
const { processrRefreshToken } = AuthServices;

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    (async () => {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        try {
          const decoded = jwtDecode(accessToken);
          if (decoded.exp * 1000 > Date.now()) {
            setUser(decoded);
            setIsAuthenticated(true);
          } else {
            await refreshToken();
          }
        } catch {
          await refreshToken();
        }
      } else {
        await refreshToken();
      }
    })();
  }, []);

  const login = ({ accessToken }) => {
    localStorage.setItem("accessToken", accessToken);
    const data = jwtDecode(accessToken);
    setUser(data);
    setIsAuthenticated(true);
  };
  const refreshToken = async () => {
    try {
      const res = await processrRefreshToken();
      const { accessToken } = res;
      localStorage.setItem("accessToken", accessToken);
      const decoded = jwtDecode(accessToken);
      setUser(decoded);
      setIsAuthenticated(true);
    } catch (err) {
      logout();
    }
  };
  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
    setIsAuthenticated(false);
  };
  return (
    <AuthContext.Provider value={{ user, setUser, login, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
