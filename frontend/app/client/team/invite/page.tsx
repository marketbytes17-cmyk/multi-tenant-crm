"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInviteRepMutation } from "@/lib/hooks/useClient";
import { InviteRepSchema } from "@/lib/validators/client";
import { ArrowLeft, UserPlus, Mail, User } from "lucide-react";

export default function InviteRepPage() {
  const router = useRouter();
  const inviteMutation = useInviteRepMutation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    sendInviteEmail: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = InviteRepSchema.safeParse(formData);
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errMap[err.path[0].toString()] = err.message;
      });
      setErrors(errMap);
      return;
    }

    await inviteMutation.mutateAsync(validation.data);
    router.push("/client/team");
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <Link
          href="/client/team"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#6B7280] hover:text-[#030712] mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Team List
        </Link>
        <h1 className="font-heading font-extrabold text-[26px] text-[#030712] tracking-tight">
          Invite Sales Representative
        </h1>
        <p className="text-[13px] text-[#6B7280]">
          Add a new sales team member to handle lead assignments in your organization
        </p>
      </div>

      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-6 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Pam Beesly"
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] pl-9 pr-3 py-2.5 text-[13.5px] text-[#030712] focus:border-[#155DFC]"
              />
            </div>
            {errors.name && <p className="text-[11.5px] text-[#FB3038] mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
              Work Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="rep@apexdesign.com"
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] pl-9 pr-3 py-2.5 text-[13.5px] text-[#030712] focus:border-[#155DFC]"
              />
            </div>
            {errors.email && <p className="text-[11.5px] text-[#FB3038] mt-1">{errors.email}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
            <Link
              href="/client/team"
              className="px-4 py-2 text-[13px] font-semibold text-[#6B7280] hover:text-[#030712]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="bg-[#030712] text-[#FFFFFF] font-semibold text-[13px] px-6 py-2.5 rounded-full hover:bg-[#155DFC] transition-colors disabled:opacity-50"
            >
              {inviteMutation.isPending ? "Sending Invite..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
