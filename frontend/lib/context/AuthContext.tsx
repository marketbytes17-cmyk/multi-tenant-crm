"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { loginApi, logoutApi } from "@/lib/api/auth";
import { impersonateTenant } from "@/lib/api/superadmin";

export type UserRole = "super_admin" | "client_admin" | "sales_rep";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clientId?: string;
  clientName?: string;
  avatarInitials: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, role?: UserRole, password?: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  impersonate: (tenantId: string, clientName: string, adminEmail: string) => Promise<void>;
}

const MOCK_USERS: Record<UserRole, User> = {
  super_admin: {
    id: "usr_super_1",
    name: "Alex Vance",
    email: "admin@marketbytes.io",
    role: "super_admin",
    avatarInitials: "AV",
  },
  client_admin: {
    id: "usr_client_1",
    name: "Sarah Jenkins",
    email: "sarah@apexdesign.com",
    role: "client_admin",
    clientId: "cli_apex_101",
    clientName: "Apex Design Co.",
    avatarInitials: "SJ",
  },
  sales_rep: {
    id: "usr_rep_1",
    name: "Michael Scott",
    email: "michael@apexdesign.com",
    role: "sales_rep",
    clientId: "cli_apex_101",
    clientName: "Apex Design Co.",
    avatarInitials: "MS",
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check saved session in localStorage
    const savedUser = localStorage.getItem("marketbytes_session");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("marketbytes_session");
      }
    }
    setIsLoading(false);
  }, []);

  const getHomeRoute = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return "/superadmin";
      case "client_admin":
        return "/client";
      case "sales_rep":
        return "/rep";
      default:
        return "/login";
    }
  };

  const login = async (email: string, preferredRole?: UserRole, password?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { user: authUser } = await loginApi({ email, password: password || "MarketBytesAdmin2026!", role: preferredRole });
      setUser(authUser);
      localStorage.setItem("marketbytes_session", JSON.stringify(authUser));
      setIsLoading(false);
      router.push(getHomeRoute(authUser.role));
      return true;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const logout = () => {
    logoutApi();
    setUser(null);
    localStorage.removeItem("marketbytes_session");
    router.push("/login");
  };

  const switchRole = (role: UserRole) => {
    const newUser = MOCK_USERS[role];
    setUser(newUser);
    localStorage.setItem("marketbytes_session", JSON.stringify(newUser));
    router.push(getHomeRoute(role));
  };

  const impersonate = async (tenantId: string, clientName: string, adminEmail: string) => {
    setIsLoading(true);
    try {
      await impersonateTenant(tenantId);
      const impersonatedUser: User = {
        id: `impersonated_${tenantId}`,
        name: `${clientName} (Admin)`,
        email: adminEmail,
        role: "client_admin",
        clientId: tenantId,
        clientName: clientName,
        avatarInitials: clientName.substring(0, 2).toUpperCase(),
      };
      setUser(impersonatedUser);
      localStorage.setItem("marketbytes_session", JSON.stringify(impersonatedUser));
      setIsLoading(false);
      router.push("/client");
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, switchRole, impersonate }}>
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
