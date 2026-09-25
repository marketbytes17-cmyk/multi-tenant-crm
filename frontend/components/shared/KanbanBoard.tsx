"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { LeadCard, Lead } from "./LeadCard";
import { LeadStage } from "./StatusTag";

export interface ColumnData {
  id: LeadStage;
  title: string;
  accentColor: string;
}

export const KANBAN_STAGES: ColumnData[] = [
  { id: "New", title: "New", accentColor: "#155DFC" },
  { id: "Contacted", title: "Contacted", accentColor: "#F54900" },
  { id: "In Negotiation", title: "In Negotiation", accentColor: "#7F71F8" },
  { id: "Closed Won", title: "Closed Won", accentColor: "#00BC7D" },
  { id: "Closed Lost", title: "Closed Lost", accentColor: "#FB3038" },
];

interface KanbanBoardProps {
  initialLeads: Lead[];
  onStageChange?: (leadId: string, newStage: LeadStage) => void;
  onLeadClick?: (lead: Lead) => void;
}

export function KanbanBoard({
  initialLeads,
  onStageChange,
  onLeadClick,
}: KanbanBoardProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const found = leads.find((l) => l.id === active.id);
    if (found) {
      setActiveLead(found);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeLeadItem = leads.find((l) => l.id === activeId);
    if (!activeLeadItem) return;

    // Check if dragging over a column container (which has ID = stage name)
    const isOverColumn = KANBAN_STAGES.some((s) => s.id === overId);
    let targetStage: LeadStage | null = null;

    if (isOverColumn) {
      targetStage = overId as LeadStage;
    } else {
      const overLeadItem = leads.find((l) => l.id === overId);
      if (overLeadItem) {
        targetStage = overLeadItem.status;
      }
    }

    if (targetStage && activeLeadItem.status !== targetStage) {
      setLeads((prevLeads) =>
        prevLeads.map((l) =>
          l.id === activeId ? { ...l, status: targetStage! } : l
        )
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event;
    const activeLeadItem = leads.find((l) => l.id === active.id);
    if (activeLeadItem && onStageChange) {
      onStageChange(activeLeadItem.id, activeLeadItem.status);
    }
    setActiveLead(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 pt-1 max-w-full custom-scrollbar">
        {KANBAN_STAGES.map((col) => {
          const columnLeads = leads.filter((l) => l.status === col.id);

          return (
            <div
              key={col.id}
              id={col.id}
              className="w-[240px] shrink-0 bg-[#FFFFFF] rounded-[14px] p-3 border border-[#E5E7EB] shadow-card flex flex-col min-h-[450px]"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: col.accentColor }}
                  />
                  <h3 className="font-heading font-bold text-[14px] text-[#030712]">
                    {col.title}
                  </h3>
                </div>
                <span className="bg-[#E3E7EF] text-[#6B7280] text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  {columnLeads.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 overflow-y-auto flex-1 custom-scrollbar min-h-[150px]">
                {columnLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-[#6B7280] text-[12px] border border-dashed border-[#E5E7EB] rounded-[11px]">
                    No leads in {col.title}
                  </div>
                ) : (
                  columnLeads.map((lead) => (
                    <div key={lead.id} id={lead.id}>
                      <LeadCard lead={lead} onClick={onLeadClick} />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} isDragging={true} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
