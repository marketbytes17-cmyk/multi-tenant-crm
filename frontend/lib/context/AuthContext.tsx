"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

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
  login: (email: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
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

  const login = async (email: string, preferredRole?: UserRole): Promise<boolean> => {
    setIsLoading(true);
    // Determine role based on email or preferredRole
    let selectedRole: UserRole = preferredRole || "client_admin";
    if (email.includes("super") || email.includes("marketbytes")) {
      selectedRole = "super_admin";
    } else if (email.includes("rep") || email.includes("sales")) {
      selectedRole = "sales_rep";
    }

    const newUser = MOCK_USERS[selectedRole];
    setUser(newUser);
    localStorage.setItem("marketbytes_session", JSON.stringify(newUser));
    setIsLoading(false);
    
    router.push(getHomeRoute(selectedRole));
    return true;
  };

  const logout = () => {
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

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, switchRole }}>
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
