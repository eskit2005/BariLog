import React, { createContext, useState, useEffect } from 'react';
import { fetchMe, login as apiLogin, logout as apiLogout, getAuthToken } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      if (getAuthToken()) {
        const profile = await fetchMe();
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const loginUser = async (email, password) => {
    await apiLogin(email, password);
    const profile = await fetchMe();
    setUser(profile);
    return profile;
  };

  const logoutUser = async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
