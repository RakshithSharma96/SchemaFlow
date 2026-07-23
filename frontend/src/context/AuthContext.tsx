"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getMe, setAccessToken } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Paths that do not require authentication
  const publicPaths = ["/", "/login", "/signup"];

  useEffect(() => {
    const initAuth = async () => {
      try {
        // If we don't have an access token in memory, but we have a HttpOnly cookie,
        // this request will fail with 401, triggering the interceptor to refresh it silently.
        const userData = await getMe();
        setUser(userData);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const handleLogout = () => {
      setUser(null);
      setAccessToken(null);
      router.push("/login");
    };

    if (typeof window !== "undefined") {
      window.addEventListener("auth_logout", handleLogout);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("auth_logout", handleLogout);
      }
    };
  }, [router]);

  useEffect(() => {
    if (!loading && !user && !publicPaths.includes(pathname)) {
      router.push("/login");
    }
  }, [user, loading, pathname, router]);

  const login = (token: string, userData: User) => {
    setAccessToken(token);
    setUser(userData);
    router.push("/dashboard");
  };

  const logout = async () => {
    try {
      const api = await import("@/lib/api");
      await api.logout();
    } catch (e) {
      // Ignore errors on logout
    }
    setUser(null);
    setAccessToken(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
