"use client";

import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  iconTint?: "blue" | "violet" | "orange" | "gray";
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  iconTint = "gray",
}: EmptyStateProps) {
  const tintStyles = {
    blue: "bg-[#D5E3FC] text-[#155DFC]",
    violet: "bg-[#EEECFE] text-[#7F71F8]",
    orange: "bg-[#FFF1E6] text-[#F54900]",
    gray: "bg-[#F1F2F4] text-[#6B7280]",
  }[iconTint];

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] shadow-card">
      <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center mb-3 ${tintStyles}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-heading font-bold text-[15px] text-[#030712]">{title}</h3>
      {description && <p className="text-[13px] text-[#6B7280] max-w-sm mt-1 mb-4">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-[#030712] text-[#FFFFFF] text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-[#155DFC] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
