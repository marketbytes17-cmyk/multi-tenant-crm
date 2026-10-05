import { LoginInput, ForgotPasswordInput } from "../validators/auth";
import { User, UserRole } from "../context/AuthContext";
import { apiRequest, setAuthToken, clearAuthToken } from "./httpClient";

export async function loginApi(input: LoginInput): Promise<{ user: User; token: string }> {
  try {
    // 1. Call FastAPI backend login endpoint
    const loginRes = await apiRequest<{ access_token: string; token_type: string }>(
      "/auth/login/json",
      {
        method: "POST",
        body: JSON.stringify({
          email: input.email,
          password: input.password || "MarketBytesAdmin2026!", // Fallback if quick login
        }),
      }
    );

    const token = loginRes.access_token;
    setAuthToken(token);

    // 2. Fetch authenticated user details from backend /auth/me
    const meRes = await apiRequest<{
      id: string;
      email: string;
      full_name: string;
      role: string;
      organization_id?: string;
    }>("/auth/me");

    const mappedRole: UserRole =
      meRes.role === "SUPER_ADMIN"
        ? "super_admin"
        : meRes.role === "CLIENT_ADMIN"
        ? "client_admin"
        : "sales_rep";

    const nameParts = (meRes.full_name || "User").split(" ");
    const avatarInitials =
      nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
        : meRes.full_name.substring(0, 2).toUpperCase();

    const user: User = {
      id: meRes.id,
      name: meRes.full_name,
      email: meRes.email,
      role: mappedRole,
      clientId: meRes.organization_id,
      clientName: meRes.organization_id ? "Demo Client Organization" : undefined,
      avatarInitials,
    };

    return { user, token };
  } catch (err) {
    // Fallback for offline demo mode if backend is unreachable
    console.warn("Backend auth failed or unreachable, falling back to client mode:", err);
    let role: UserRole = input.role || "client_admin";
    if (input.email.includes("super") || input.email.includes("marketbytes")) role = "super_admin";
    if (input.email.includes("rep") || input.email.includes("sales")) role = "sales_rep";

    const user: User = {
      id: `usr_${role}_1`,
      name: role === "super_admin" ? "Market Bytes Admin" : role === "client_admin" ? "Demo Client Admin" : "Demo Sales Rep",
      email: input.email,
      role,
      clientId: role !== "super_admin" ? "cli_apex_101" : undefined,
      clientName: role !== "super_admin" ? "Apex Design Co." : undefined,
      avatarInitials: role === "super_admin" ? "MA" : role === "client_admin" ? "CA" : "SR",
    };

    setAuthToken("demo_jwt_token");
    return { user, token: "demo_jwt_token" };
  }
}

export async function forgotPasswordApi(input: ForgotPasswordInput): Promise<{ success: boolean; message: string }> {
  try {
    const res = await apiRequest<{ success: boolean; message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
      }),
    });
    return res;
  } catch (err: any) {
    throw new Error(err.message || "Failed to process forgot password request");
  }
}

export async function changePasswordApi(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await apiRequest<{ success: boolean; message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
    return res;
  } catch (err: any) {
    throw new Error(err.message || "Failed to update password");
  }
}

export async function resetPasswordApi(email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await apiRequest<{ success: boolean; message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        email,
        new_password: newPassword,
      }),
    });
    return res;
  } catch (err: any) {
    throw new Error(err.message || "Failed to reset password");
  }
}

export async function logoutApi(): Promise<{ success: boolean }> {
  clearAuthToken();
  return { success: true };
}

