"use client";

import React from "react";
import { LeadCard, Lead } from "./LeadCard";

interface KanbanColumnProps {
  id: string;
  title: string;
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
  accentColor?: string;
}

export function KanbanColumn({ title, leads, onLeadClick, accentColor = "#155DFC" }: KanbanColumnProps) {
  return (
    <div className="w-[240px] shrink-0 bg-[#FFFFFF] rounded-[14px] p-3 border border-[#E5E7EB] shadow-card flex flex-col max-h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
          <h3 className="font-heading font-bold text-[14px] text-[#030712]">{title}</h3>
        </div>
        <span className="bg-[#E3E7EF] text-[#6B7280] text-[11px] font-semibold px-2 py-0.5 rounded-full min-w-[20px] text-center">
          {leads.length}
        </span>
      </div>

      {/* Cards list */}
      <div className="flex flex-col gap-2 overflow-y-auto pr-0.5 custom-scrollbar min-h-[120px] flex-1">
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-[#6B7280] text-[12px] border border-dashed border-[#E5E7EB] rounded-[11px]">
            No leads in {title}
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
          ))
        )}
      </div>
    </div>
  );
}
