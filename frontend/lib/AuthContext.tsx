"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  name: string;
  role: "fan" | "host";
  avatarUrl: string;
}

export const DEMO_PROFILES: Record<string, User> = {
  fan_ronaldo: {
    id: "fan_ronaldo",
    name: "Cristiano Ronaldo",
    role: "fan",
    avatarUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=100&h=100&q=80",
  },
  host_sagar: {
    id: "host_sagarsahu",
    name: "Sagar Sahu",
    role: "host",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80",
  },
};

interface AuthContextType {
  user: User | null;
  login: (name: string, role: "fan" | "host", customId?: string) => void;
  loginAsProfile: (profileId: string) => void;
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

  const login = (name: string, role: "fan" | "host", customId?: string) => {
    const cleanName = name.trim();
    let id = customId;
    if (!id) {
      if (cleanName.toLowerCase() === "sagar sahu") {
        id = "host_sagarsahu";
      } else if (cleanName.toLowerCase() === "cristiano ronaldo" || cleanName.toLowerCase() === "christiano ronaldo") {
        id = "fan_ronaldo";
      } else {
        id = `${role}_${Math.random().toString(36).substring(2, 10)}`;
      }
    }
    
    // Choose standard avatar gender-esque fallback
    const seed = cleanName.replace(/\s+/g, "").toLowerCase();
    const avatarUrl = role === "host"
      ? `https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80`
      : `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80`;

    const newUser: User = { id, name: cleanName, role, avatarUrl };
    setUser(newUser);
    localStorage.setItem("fanly-user", JSON.stringify(newUser));
    setIsLoginModalOpen(false);
  };

  const loginAsProfile = (profileId: string) => {
    const profile = DEMO_PROFILES[profileId];
    if (profile) {
      setUser(profile);
      localStorage.setItem("fanly-user", JSON.stringify(profile));
      setIsLoginModalOpen(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("fanly-user");
  };

  // Prevent hydration flash/mismatch by waiting to render until initialized
  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginAsProfile,
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
