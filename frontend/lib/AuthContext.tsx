"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  name: string;
  role: "fan" | "host";
  avatarUrl: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  register: (firstName: string, lastName: string, email: string, code: string) => { success: boolean; error?: string };
  loginWithCredentials: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Loaded dynamically from environment variables
const getHostCredentials = () => {
  return {
    id: "host_sagarsahu",
    name: typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_DEMO_HOST_NAME || "Sagar Sahu") : "Sagar Sahu",
    role: "host" as const,
    email: (typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_DEMO_HOST_EMAIL || "sahu.sagar@fanly.com") : "sahu.sagar@fanly.com").toLowerCase(),
    password: typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_DEMO_HOST_PASSWORD || "Devpost2026?") : "Devpost2026?",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80",
  };
};

const getGuestCredentials = () => {
  return {
    id: "fan_ronaldo",
    name: typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_DEMO_GUEST_NAME || "Chris Ronaldo") : "Chris Ronaldo",
    role: "fan" as const,
    email: (typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_DEMO_GUEST_EMAIL || "chrisronaldo@fanly.com") : "chrisronaldo@fanly.com").toLowerCase(),
    password: typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_DEMO_GUEST_PASSWORD || "cr26fanly") : "cr26fanly",
    avatarUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=100&h=100&q=80",
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<Record<string, User & { password?: string }>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load current user
      const stored = localStorage.getItem("fanly-user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse stored user", e);
        }
      }

      // Load registered users list
      const storedUsers = localStorage.getItem("fanly-registered-users");
      if (storedUsers) {
        try {
          setRegisteredUsers(JSON.parse(storedUsers));
        } catch (e) {
          console.error("Failed to parse registered users", e);
        }
      }
      setIsInitialized(true);
    }
  }, []);

  const register = (firstName: string, lastName: string, email: string, code: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();
    const hostCreds = getHostCredentials();
    const guestCreds = getGuestCredentials();

    if (cleanEmail === hostCreds.email || cleanEmail === guestCreds.email) {
      return { success: false, error: "Email already exists in system demo profiles." };
    }

    if (registeredUsers[cleanEmail]) {
      return { success: false, error: "Email already registered." };
    }

    if (cleanCode.length !== 6) {
      return { success: false, error: "Passcode must be exactly 6 characters." };
    }

    const newId = `fan_${Math.random().toString(36).substring(2, 10)}`;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const avatarUrl = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80`;

    const newUser = {
      id: newId,
      name: fullName,
      role: "fan" as const,
      email: cleanEmail,
      password: cleanCode,
      avatarUrl,
    };

    const updatedUsers = {
      ...registeredUsers,
      [cleanEmail]: newUser,
    };

    setRegisteredUsers(updatedUsers);
    localStorage.setItem("fanly-registered-users", JSON.stringify(updatedUsers));

    // Sign in immediately as guest/fan
    setUser({
      id: newUser.id,
      name: newUser.name,
      role: newUser.role,
      avatarUrl: newUser.avatarUrl,
      email: newUser.email,
    });
    localStorage.setItem("fanly-user", JSON.stringify({
      id: newUser.id,
      name: newUser.name,
      role: newUser.role,
      avatarUrl: newUser.avatarUrl,
      email: newUser.email,
    }));

    setIsLoginModalOpen(false);
    return { success: true };
  };

  const loginWithCredentials = (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const hostCreds = getHostCredentials();
    const guestCreds = getGuestCredentials();

    // 1. Check if Host Sagar Sahu is logging in
    if (cleanEmail === hostCreds.email && cleanPassword === hostCreds.password) {
      const hostUser = {
        id: hostCreds.id,
        name: hostCreds.name,
        role: hostCreds.role,
        avatarUrl: hostCreds.avatarUrl,
        email: hostCreds.email,
      };
      setUser(hostUser);
      localStorage.setItem("fanly-user", JSON.stringify(hostUser));
      setIsLoginModalOpen(false);
      return { success: true };
    }

    // 2. Check if Guest Chris Ronaldo is logging in with env credentials
    if (cleanEmail === guestCreds.email && cleanPassword === guestCreds.password) {
      const guestUser = {
        id: guestCreds.id,
        name: guestCreds.name,
        role: guestCreds.role,
        avatarUrl: guestCreds.avatarUrl,
        email: guestCreds.email,
      };
      setUser(guestUser);
      localStorage.setItem("fanly-user", JSON.stringify(guestUser));
      setIsLoginModalOpen(false);
      return { success: true };
    }

    // 3. Check if a registered user is logging in
    const existing = registeredUsers[cleanEmail];
    if (existing && existing.password === cleanPassword) {
      const loggedUser = {
        id: existing.id,
        name: existing.name,
        role: existing.role,
        avatarUrl: existing.avatarUrl,
        email: existing.email,
      };
      setUser(loggedUser);
      localStorage.setItem("fanly-user", JSON.stringify(loggedUser));
      setIsLoginModalOpen(false);
      return { success: true };
    }

    return { success: false, error: "Invalid email or password." };
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
