"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { registerUser, loginUser, User } from "./agentClient";

interface AuthContextType {
  user: User | null;
  register: (firstName: string, lastName: string, email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load current user from session store
      const stored = localStorage.getItem("fanly-user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse stored user", e);
        }
      }
      setIsInitialized(true);
    }
  }, []);

  const register = async (firstName: string, lastName: string, email: string, code: string) => {
    try {
      const newUser = await registerUser(firstName, lastName, email, code);
      setUser(newUser);
      localStorage.setItem("fanly-user", JSON.stringify(newUser));
      setIsLoginModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to register." };
    }
  };

  const loginWithCredentials = async (email: string, password: string) => {
    try {
      const loggedUser = await loginUser(email, password);
      setUser(loggedUser);
      localStorage.setItem("fanly-user", JSON.stringify(loggedUser));
      setIsLoginModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Invalid email or password." };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("fanly-user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        register,
        loginWithCredentials,
        logout,
        isLoginModalOpen,
        setIsLoginModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
