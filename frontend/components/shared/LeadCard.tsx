"use client";

import React from "react";
import { StatusTag, LeadStage } from "./StatusTag";
import { Phone, Calendar, User } from "lucide-react";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: LeadStage;
  source: string;
  assignedRepName?: string;
  assignedRepInitials?: string;
  createdAt: string;
  notesCount?: number;
}

interface LeadCardProps {
  lead: Lead;
  onClick?: (lead: Lead) => void;
  isDragging?: boolean;
}

export function LeadCard({ lead, onClick, isDragging = false }: LeadCardProps) {
  return (
    <div
      onClick={() => onClick?.(lead)}
      className={`group bg-[#FFFFFF] border border-[#E5E7EB] rounded-[11px] p-[10px] shadow-sm hover:border-[#155DFC] transition-all cursor-pointer select-none ${
        isDragging ? "opacity-40 border-[#155DFC] shadow-md" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="font-heading font-bold text-[13.5px] text-[#030712] group-hover:text-[#155DFC] transition-colors truncate">
          {lead.name}
        </h4>
        <StatusTag status={lead.status} className="shrink-0" />
      </div>

      <div className="flex items-center gap-1.5 text-[11.5px] text-[#6B7280] mb-2">
        <Phone className="w-3 h-3 shrink-0" />
        <span className="truncate">{lead.phone}</span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] text-[11px] text-[#6B7280]">
        <span className="bg-[#F1F2F4] text-[#6B7280] px-2 py-0.5 rounded-full font-medium truncate max-w-[110px]">
          {lead.source}
        </span>

        {lead.assignedRepName ? (
          <div className="flex items-center gap-1 text-[#030712] font-medium">
            <span className="w-4 h-4 rounded-full bg-[#D5E3FC] text-[#155DFC] text-[9px] font-bold flex items-center justify-center">
              {lead.assignedRepInitials || lead.assignedRepName.substring(0, 2).toUpperCase()}
            </span>
            <span className="truncate max-w-[70px]">{lead.assignedRepName.split(" ")[0]}</span>
          </div>
        ) : (
          <span className="text-[#FB3038] font-medium flex items-center gap-1">
            <User className="w-3 h-3" />
            Unassigned
          </span>
        )}
      </div>
    </div>
  );
}
