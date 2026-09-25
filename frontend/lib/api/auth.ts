import { LoginInput, ForgotPasswordInput } from "../validators/auth";
import { User, UserRole } from "../context/AuthContext";

export async function loginApi(input: LoginInput): Promise<{ user: User; token: string }> {
  // Normalized API response shape per FRONTEND_ARCHITECTURE.md §5
  return new Promise((resolve) => {
    setTimeout(() => {
      let role: UserRole = input.role || "client_admin";
      if (input.email.includes("super")) role = "super_admin";
      if (input.email.includes("rep")) role = "sales_rep";

      resolve({
        user: {
          id: `usr_${role}_1`,
          name: role === "super_admin" ? "Alex Vance" : role === "client_admin" ? "Sarah Jenkins" : "Michael Scott",
          email: input.email,
          role,
          clientId: role !== "super_admin" ? "cli_apex_101" : undefined,
          clientName: role !== "super_admin" ? "Apex Design Co." : undefined,
          avatarInitials: role === "super_admin" ? "AV" : role === "client_admin" ? "SJ" : "MS",
        },
        token: "mock_jwt_token_marketbytes_xyz",
      });
    }, 400);
  });
}

export async function forgotPasswordApi(input: ForgotPasswordInput): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: `Reset link successfully sent to ${input.email}`,
      });
    }, 400);
  });
}

export async function logoutApi(): Promise<{ success: boolean }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 200);
  });
}
