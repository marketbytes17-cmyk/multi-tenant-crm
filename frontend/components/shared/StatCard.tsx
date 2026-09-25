"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

export type StatTint = "blue" | "violet" | "orange" | "gray";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tint?: StatTint;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  actionLabel?: string;
  onAction?: () => void;
  highlightAlert?: boolean;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  tint = "blue",
  trend,
  actionLabel,
  onAction,
  highlightAlert = false,
}: StatCardProps) {
  const tintStyles = {
    blue: "bg-[#D5E3FC] text-[#155DFC]",
    violet: "bg-[#EEECFE] text-[#7F71F8]",
    orange: "bg-[#FFF1E6] text-[#F54900]",
    gray: "bg-[#F1F2F4] text-[#6B7280]",
  }[tint];

  return (
    <div
      className={`bg-[#FFFFFF] border rounded-[14px] p-4 shadow-card flex flex-col justify-between transition-all ${
        highlightAlert ? "border-[#FB3038]/50 ring-2 ring-[#FB3038]/20" : "border-[#E5E7EB]"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${tintStyles}`}>
          <Icon className="w-5 h-5" />
        </div>

        {actionLabel && onAction ? (
          <button
            onClick={onAction}
            className="text-[11.5px] font-semibold text-[#030712] hover:text-[#155DFC] bg-[#F1F2F4] hover:bg-[#D5E3FC] px-2.5 py-1 rounded-full transition-colors"
          >
            {actionLabel}
          </button>
        ) : trend ? (
          <span
            className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full ${
              trend.isPositive ? "bg-[#00BC7D]/10 text-[#00BC7D]" : "bg-[#FB3038]/10 text-[#FB3038]"
            }`}
          >
            {trend.isPositive ? "+" : ""}{trend.value}
          </span>
        ) : null}
      </div>

      <div>
        <div className="font-heading font-extrabold text-[24px] text-[#030712] tracking-tight leading-none mb-1">
          {value}
        </div>
        <p className="text-[12px] font-normal text-[#6B7280] leading-snug">{title}</p>
      </div>
    </div>
  );
}
