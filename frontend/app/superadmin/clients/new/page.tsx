"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreateClientMutation } from "@/lib/hooks/useSuperAdmin";
import { AddClientSchema } from "@/lib/validators/superadmin";
import { Modal } from "@/components/shared/Modal";
import { ArrowLeft, Building2, Mail, Phone, Lock, Copy, Check, ShieldCheck } from "lucide-react";
import { useToast } from "@/lib/context/ToastContext";

export default function AddNewClientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateClientMutation();

  const [formData, setFormData] = useState({
    name: "",
    contactEmail: "",
    contactPhone: "",
    adminEmail: "",
    password: "",
    autoGeneratePassword: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdCredentials, setCreatedCredentials] = useState<{
    clientName: string;
    adminEmail: string;
    password?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = AddClientSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      const res = await createMutation.mutateAsync(validation.data);
      setCreatedCredentials({
        clientName: res.client.name,
        adminEmail: res.client.adminEmail,
        password: res.generatedPassword,
      });
    } catch (err) {
      // Handled in mutation onError
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `MarketBytes CRM Client Credentials:\nOrganization: ${createdCredentials.clientName}\nLogin Email: ${createdCredentials.adminEmail}\nPassword: ${createdCredentials.password}\nPortal: http://localhost:3000/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast("Credentials copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/superadmin/clients"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#6B7280] hover:text-[#030712] mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients List
        </Link>
        <h1 className="font-heading font-extrabold text-[26px] text-[#030712] tracking-tight">
          Add New Client Organization
        </h1>
        <p className="text-[13px] text-[#6B7280]">
          Provision a new tenant account, assign initial admin credentials, and prepare Meta page routing
        </p>
      </div>

      {/* Form Panel */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] p-6 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
              Client / Business Name *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Apex Design Co."
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] pl-9 pr-3 py-2.5 text-[13.5px] text-[#030712] placeholder-[#6B7280] focus:border-[#155DFC]"
              />
            </div>
            {errors.name && <p className="text-[11.5px] text-[#FB3038] mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
                Contact Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="contact@company.com"
                  className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] pl-9 pr-3 py-2.5 text-[13.5px] text-[#030712] placeholder-[#6B7280] focus:border-[#155DFC]"
                />
              </div>
              {errors.contactEmail && <p className="text-[11.5px] text-[#FB3038] mt-1">{errors.contactEmail}</p>}
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
                Contact Phone *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] pl-9 pr-3 py-2.5 text-[13.5px] text-[#030712] placeholder-[#6B7280] focus:border-[#155DFC]"
                />
              </div>
              {errors.contactPhone && <p className="text-[11.5px] text-[#FB3038] mt-1">{errors.contactPhone}</p>}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E7EB]">
            <h3 className="font-heading font-bold text-[14px] text-[#030712] mb-3">Initial Admin Credentials</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
                  Initial Admin Login Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder="admin@company.com"
                    className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] pl-9 pr-3 py-2.5 text-[13.5px] text-[#030712] placeholder-[#6B7280] focus:border-[#155DFC]"
                  />
                </div>
                {errors.adminEmail && <p className="text-[11.5px] text-[#FB3038] mt-1">{errors.adminEmail}</p>}
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#FAFAFB] rounded-[9px] border border-[#E5E7EB]">
                <input
                  type="checkbox"
                  id="autoPassword"
                  checked={formData.autoGeneratePassword}
                  onChange={(e) => setFormData({ ...formData, autoGeneratePassword: e.target.checked })}
                  className="w-4 h-4 text-[#155DFC] rounded border-[#E5E7EB]"
                />
                <label htmlFor="autoPassword" className="text-[12.5px] text-[#030712] font-medium cursor-pointer">
                  Auto-generate secure initial password
                </label>
              </div>

              {!formData.autoGeneratePassword && (
                <div>
                  <label className="block text-[12px] font-semibold text-[#030712] mb-1.5 font-heading">
                    Manual Initial Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 8 characters"
                      className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] pl-9 pr-3 py-2.5 text-[13.5px] text-[#030712] placeholder-[#6B7280] focus:border-[#155DFC]"
                    />
                  </div>
                  {errors.password && <p className="text-[11.5px] text-[#FB3038] mt-1">{errors.password}</p>}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
            <Link
              href="/superadmin/clients"
              className="px-4 py-2 text-[13px] font-semibold text-[#6B7280] hover:text-[#030712]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-[#030712] text-[#FFFFFF] hover:bg-[#155DFC] font-semibold text-[13px] px-6 py-2.5 rounded-full transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating Client..." : "Create Client Account"}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal with Generated Credentials */}
      <Modal
        isOpen={!!createdCredentials}
        onClose={() => {
          setCreatedCredentials(null);
          router.push("/superadmin/clients");
        }}
        title="Client Created Successfully!"
        description="Share these login credentials with the client admin."
      >
        {createdCredentials && (
          <div className="space-y-4 pt-1">
            <div className="p-4 bg-[#FAFAFB] border border-[#E5E7EB] rounded-[11px] space-y-2 text-[13px]">
              <div>
                <span className="text-[#6B7280] block text-[11px] font-medium">Organization:</span>
                <span className="font-bold text-[#030712] font-heading">{createdCredentials.clientName}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px] font-medium">Login Email:</span>
                <span className="font-semibold text-[#030712] font-mono">{createdCredentials.adminEmail}</span>
              </div>
              <div>
                <span className="text-[#6B7280] block text-[11px] font-medium">Initial Password:</span>
                <span className="font-bold text-[#155DFC] font-mono bg-[#D5E3FC]/50 px-2 py-0.5 rounded">
                  {createdCredentials.password}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopyCredentials}
              className="w-full flex items-center justify-center gap-2 bg-[#030712] text-[#FFFFFF] font-semibold text-[13px] py-2.5 rounded-full hover:bg-[#155DFC] transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-[#00BC7D]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied Credentials!" : "Copy Credentials Summary"}</span>
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
