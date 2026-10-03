import { createContext, useContext, useState, useCallback } from "react";
import * as api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children, initialUser = null }) {
  const [user, setUser] = useState(initialUser);
  const [initializing, setInitializing] = useState(true);

  const loginUser = useCallback(async (email, password) => {
    const result = await api.login(email, password);
    setUser(result);
    return result;
  }, []);

  const signupUser = useCallback(async (name, email, password) => {
    await api.signup(name, email, password);
    return loginUser(email, password);
  }, [loginUser]);

  const logoutUser = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const result = await api.getMe();
      setUser(result);
      return result;
    } catch {
      setUser(null);
      return null;
    } finally {
      setInitializing(false);
    }
  }, []);

  const updateProfile = useCallback(async (name, currentPassword, newPassword) => {
    const result = await api.updateProfile(name, currentPassword, newPassword);
    setUser(result);
    return result;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, initializing, loginUser, signupUser, logoutUser, refreshUser, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
