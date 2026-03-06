"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TableRow {
  cells: string[];
  highlight?: boolean; // crimson-tinted row (best result)
  dim?: boolean;       // faded row (overfit / null result)
}

interface TableData {
  columns: string[];
  rows: TableRow[];
}

export interface TableItem {
  id: string;
  label: string;
  src?: string;
  tableData?: TableData;
}

interface TableAccordionProps {
  tables: TableItem[];
  title?: string;
}

function TableEntry({ table }: { table: TableItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-stone-200 last:border-b-0">
      <button
        className="flex w-full items-center justify-between gap-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm text-stone-700">{table.label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-stone-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pb-4">
              {table.tableData ? (
                <div className="overflow-x-auto rounded-sm border border-stone-200">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50">
                        {table.tableData.columns.map((col, i) => (
                          <th
                            key={i}
                            className="whitespace-nowrap px-3 py-2 text-left font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.tableData.rows.map((row, i) => (
                        <tr
                          key={i}
                          className={cn(
                            "border-b border-stone-100 last:border-b-0 transition-colors",
                            row.highlight && "bg-[#A51C30]/5",
                            row.dim && "opacity-35",
                            !row.highlight && !row.dim && "hover:bg-stone-50/80"
                          )}
                        >
                          {row.cells.map((cell, j) => (
                            <td
                              key={j}
                              className={cn(
                                "whitespace-nowrap px-3 py-2 font-mono text-[11px]",
                                row.highlight ? "text-stone-900" : "text-stone-600"
                              )}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex min-h-[80px] flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-stone-200 bg-stone-50 p-4">
                  <p className="text-center text-xs text-stone-400">
                    Table data not available
                    {table.src && (
                      <>
                        {" "}— upload screenshot to{" "}
                        <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[10px]">
                          /public/figures/{table.src}
                        </code>
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TableAccordion({ tables, title = "Supporting Tables" }: TableAccordionProps) {
  return (
    <div className="mt-8 rounded-sm border border-stone-200 bg-white/60">
      <div className="border-b border-stone-200 px-5 py-3">
        <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
          {title}
        </h4>
      </div>
      <div className="px-5">
        {tables.map((table) => (
          <TableEntry key={table.id} table={table} />
        ))}
      </div>
    </div>
  );
}
