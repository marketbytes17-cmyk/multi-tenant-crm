"use client";

import { useMutation } from "@tanstack/react-query";
import { loginApi, forgotPasswordApi, logoutApi } from "@/lib/api/auth";
import { LoginInput, ForgotPasswordInput } from "@/lib/validators/auth";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/lib/context/ToastContext";

export function useLoginMutation() {
  const { login } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const res = await loginApi(input);
      await login(res.user.email, res.user.role);
      return res;
    },
    onSuccess: (data) => {
      toast(`Welcome back, ${data.user.name}!`, "success");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to sign in", "error");
    },
  });
}

export function useForgotPasswordMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => forgotPasswordApi(input),
    onSuccess: (data) => {
      toast(data.message, "success");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to send reset link", "error");
    },
  });
}
