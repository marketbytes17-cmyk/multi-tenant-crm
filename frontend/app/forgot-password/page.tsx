"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E3E7EF] p-4 font-sans">
      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] p-8 shadow-[0_1px_2px_rgba(3,7,18,0.04),0_8px_20px_rgba(3,7,18,0.06)]">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#6B7280] hover:text-[#030712] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        {isSubmitted ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-[#00BC7D]/10 text-[#00BC7D] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="font-heading font-bold text-[20px] text-[#030712] mb-2">Check your email</h2>
            <p className="text-[13px] text-[#6B7280] leading-relaxed mb-6">
              We have sent a password reset link to <strong className="text-[#030712]">{email}</strong>.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-[13px] font-semibold text-[#155DFC] hover:underline"
            >
              Didn't receive the email? Try again
            </button>
          </div>
        ) : (
          <div>
            <h2 className="font-heading font-bold text-[22px] text-[#030712] mb-1">Reset Password</h2>
            <p className="text-[13px] text-[#6B7280] mb-6">
              Enter your registered work email and we will send you instructions to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@agency.com"
                    className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] pl-9 pr-3 py-2.5 text-[13.5px] text-[#030712] placeholder-[#6B7280] focus:border-[#155DFC] transition-colors"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#155DFC] text-[#FFFFFF] font-semibold text-[13.5px] py-2.5 rounded-full hover:bg-[#030712] transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "Sending reset link..." : "Send Reset Link"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
