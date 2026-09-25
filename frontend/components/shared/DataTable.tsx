"use client";

import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search records...",
  onRowClick,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] shadow-card overflow-hidden flex flex-col">
      {/* Search & Filter Top Bar */}
      {searchPlaceholder && (
        <div className="p-3.5 border-b border-[#E5E7EB] flex items-center justify-between gap-3 bg-[#FFFFFF]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[9px] pl-9 pr-3 py-2 text-[13px] text-[#030712] placeholder-[#6B7280] focus:border-[#155DFC] focus:ring-0 transition-colors"
            />
          </div>
          <div className="text-[12px] text-[#6B7280]">
            Showing {table.getRowModel().rows.length} entries
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-[#E5E7EB] bg-[#FAFAFB]">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-4 py-2.5 text-[11px] font-semibold text-[#6B7280] tracking-normal select-none"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-1 ${
                          header.column.getCanSort() ? "cursor-pointer hover:text-[#030712]" : ""
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="shrink-0">
                            {header.column.getIsSorted() === "asc" ? (
                              <ArrowUp className="w-3 h-3 text-[#155DFC]" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ArrowDown className="w-3 h-3 text-[#155DFC]" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              // Skeleton rows
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="border-b border-[#E5E7EB] last:border-b-0 animate-pulse">
                  {columns.map((_, colIdx) => (
                    <td key={colIdx} className="px-4 py-3.5">
                      <div className="h-4 bg-[#E3E7EF] rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-[#6B7280] text-[13px]">
                  No matching records found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={`border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#FAFAFB] transition-colors text-[13.5px] text-[#030712] ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {table.getPageCount() > 1 && (
        <div className="p-3 border-t border-[#E5E7EB] flex items-center justify-between text-[12px] text-[#6B7280]">
          <div>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 rounded-[9px] border border-[#E5E7EB] text-[#030712] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#030712] transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 rounded-[9px] border border-[#E5E7EB] text-[#030712] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#030712] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
