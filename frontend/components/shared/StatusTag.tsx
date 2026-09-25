"use client";

import React from "react";

export type LeadStage = "New" | "Contacted" | "In Negotiation" | "Closed Won" | "Closed Lost";

interface StatusTagProps {
  status: LeadStage | string;
  className?: string;
}

export function StatusTag({ status, className = "" }: StatusTagProps) {
  let dotColor = "bg-[#155DFC]";
  let textColor = "text-[#155DFC]";

  switch (status) {
    case "New":
      dotColor = "bg-[#155DFC]";
      textColor = "text-[#155DFC]";
      break;
    case "Contacted":
      dotColor = "bg-[#F54900]";
      textColor = "text-[#F54900]";
      break;
    case "In Negotiation":
      dotColor = "bg-[#7F71F8]";
      textColor = "text-[#7F71F8]";
      break;
    case "Closed Won":
      dotColor = "bg-[#00BC7D]";
      textColor = "text-[#00BC7D]";
      break;
    case "Closed Lost":
      dotColor = "bg-[#FB3038]";
      textColor = "text-[#FB3038]";
      break;
    default:
      dotColor = "bg-[#6B7280]";
      textColor = "text-[#6B7280]";
      break;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 font-medium text-[12px] ${textColor} ${className}`}>
      <span className={`w-[7px] h-[7px] rounded-full ${dotColor}`} />
      <span>{status}</span>
    </div>
  );
}
