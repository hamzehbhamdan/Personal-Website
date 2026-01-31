"use client";

import { useState, useMemo } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    createColumnHelper,
    SortingState,
} from "@tanstack/react-table";
import { Search, ChevronUp, ChevronDown, Mail, Phone, MoreHorizontal, UserPlus } from "lucide-react";
import { format, subDays, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

import { Contact } from "@/lib/types";

const columnHelper = createColumnHelper<Contact>();

export function ContactTable({ contacts, onContactClick }: { contacts: Contact[], onContactClick?: (contact: Contact) => void }) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");

    const columns = useMemo(() => [
        columnHelper.accessor("name", {
            header: "Name",
            cell: (info) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/70">
                        {info.getValue().charAt(0)}
                    </div>
                    <span className="font-medium text-white">{info.getValue()}</span>
                </div>
            ),
        }),
        columnHelper.accessor("company", {
            header: "Company",
            cell: (info) => <span className="text-white/60">{info.getValue()}</span>,
        }),
        columnHelper.accessor("lastContacted", {
            header: "Last Talked",
            cell: (info) => {
                const val = info.getValue();
                const days = differenceInDays(new Date(), val);
                const row = info.row.original;
                const isOverdue = days > row.frequency;
                return (
                    <div className="flex flex-col">
                        <span className={cn("text-sm", isOverdue ? "text-red-400 font-semibold" : "text-white/80")}>
                            {format(val, "MMM d, yyyy")}
                        </span>
                        <span className="text-[10px] text-white/30 uppercase tracking-tighter">
                            {days} days ago
                        </span>
                    </div>
                );
            },
        }),
        columnHelper.display({
            id: "actions",
            cell: () => (
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                        <Mail size={16} />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                        <MoreHorizontal size={16} />
                    </button>
                </div>
            ),
        }),
    ], []);

    const table = useReactTable({
        data: contacts,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <div className="w-full h-full flex flex-col bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
            {/* Table Header/Toolbar */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input
                        type="text"
                        value={globalFilter ?? ""}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder="Search contacts..."
                        className="w-full bg-white/5 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:bg-white/10 transition-all"
                    />
                </div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="border-b border-white/5">
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="p-4 text-xs font-semibold text-white/40 uppercase tracking-widest cursor-pointer hover:text-white/60 transition-colors"
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        <div className="flex items-center gap-2">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {{
                                                asc: <ChevronUp size={14} />,
                                                desc: <ChevronDown size={14} />,
                                            }[header.column.getIsSorted() as string] ?? null}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                onClick={() => onContactClick?.(row.original)}
                                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className="p-4">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
