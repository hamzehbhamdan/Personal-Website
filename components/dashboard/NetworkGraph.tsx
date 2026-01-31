"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Contact } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Plus, Minus } from "lucide-react";

interface Node extends Contact {
    x: number;
    y: number;
    vx: number;
    vy: number;
    isDragging?: boolean;
}

interface Link {
    source: string;
    target: string;
}

export function NetworkGraph({ contacts, showNicknames }: { contacts: Contact[], showNicknames?: boolean }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [links, setLinks] = useState<Link[]>([]);
    const requestRef = useRef<number>(null);

    const [pathStart, setPathStart] = useState<string>("");
    const [pathEnd, setPathEnd] = useState<string>("");
    const [startSearch, setStartSearch] = useState("");
    const [endSearch, setEndSearch] = useState("");
    const [isStartOpen, setIsStartOpen] = useState(false);
    const [isEndOpen, setIsEndOpen] = useState(false);
    const [path, setPath] = useState<string[]>([]);

    // Transform State
    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const [dragNode, setDragNode] = useState<string | null>(null);
    const lastPoint = useRef({ x: 0, y: 0 });

    // Helper to select node
    const selectStart = (c: Contact) => {
        setPathStart(c.id);
        setStartSearch(c.name);
        setIsStartOpen(false);
    };

    const selectEnd = (c: Contact) => {
        setPathEnd(c.id);
        setEndSearch(c.name);
        setIsEndOpen(false);
    };

    const filteredStart = contacts.filter(c => c.name.toLowerCase().includes(startSearch.toLowerCase()));
    const filteredEnd = contacts.filter(c => c.name.toLowerCase().includes(endSearch.toLowerCase()));

    if (contacts.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center opacity-20 italic text-xs uppercase tracking-widest">
                No neural nodes detected...
            </div>
        );
    }

    // BFS Pathfinding Algorithm
    const findPath = (start: string, end: string) => {
        if (!start || !end) return;

        const queue: [string, string[]][] = [[start, [start]]];
        const visited = new Set<string>([start]);
        const adjacencyList: { [id: string]: string[] } = {};

        // Build Adjacency List from current links
        links.forEach(l => {
            if (!adjacencyList[l.source]) adjacencyList[l.source] = [];
            if (!adjacencyList[l.target]) adjacencyList[l.target] = [];
            adjacencyList[l.source].push(l.target);
            adjacencyList[l.target].push(l.source);
        });

        while (queue.length > 0) {
            const [currentId, currentPath] = queue.shift()!;

            if (currentId === end) {
                setPath(currentPath);
                return;
            }

            const neighbors = adjacencyList[currentId] || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([neighbor, [...currentPath, neighbor]]);
                }
            }
        }
        setPath([]); // No path found
    };

    useEffect(() => {
        setPath([]);
    }, [pathStart, pathEnd, links]);

    useEffect(() => {
        // Initialize nodes with random positions
        let currentNodes = contacts.map(c => ({
            ...c,
            x: Math.random() * 800,
            y: Math.random() * 600,
            vx: 0,
            vy: 0
        }));

        // Generate links from connections and organization tags (shared company)
        const newLinks: Link[] = [];

        // 1. Direct connections - Deduplicated
        const seen = new Set<string>();
        contacts.forEach(c => {
            c.connections?.forEach(conn => {
                const pair = [c.id, conn.contactId].sort().join("-");
                if (!seen.has(pair)) {
                    newLinks.push({ source: c.id, target: conn.contactId });
                    seen.add(pair);
                }
            });
        });

        // 2. Organization connections (people in the same company)
        const companyGroups: { [key: string]: string[] } = {};
        contacts.forEach(c => {
            if (c.company && c.company !== "TBD") {
                if (!companyGroups[c.company]) companyGroups[c.company] = [];
                companyGroups[c.company].push(c.id);
            }
        });

        Object.values(companyGroups).forEach(ids => {
            for (let i = 0; i < ids.length; i++) {
                for (let j = i + 1; j < ids.length; j++) {
                    newLinks.push({ source: ids[i], target: ids[j] });
                }
            }
        });

        // Pre-warm simulation
        const centerX = containerRef.current?.offsetWidth ? containerRef.current.offsetWidth / 2 : (typeof window !== 'undefined' ? window.innerWidth / 2 : 400);
        const centerY = containerRef.current?.offsetHeight ? containerRef.current.offsetHeight / 2 : (typeof window !== 'undefined' ? window.innerHeight / 2 : 300);

        for (let k = 0; k < 300; k++) {
            // physics step
            const friction = 0.9;

            // 1. Repulsion
            for (let i = 0; i < currentNodes.length; i++) {
                for (let j = i + 1; j < currentNodes.length; j++) {
                    const dx = currentNodes[i].x - currentNodes[j].x;
                    const dy = currentNodes[i].y - currentNodes[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                    if (distance < 300) {
                        const force = (300 - distance) * 0.01;
                        const nx = dx / distance;
                        const ny = dy / distance;
                        currentNodes[i].vx += nx * force;
                        currentNodes[i].vy += ny * force;
                        currentNodes[j].vx -= nx * force;
                        currentNodes[j].vy -= ny * force;
                    }
                }
            }

            // 2. Attraction
            newLinks.forEach(link => {
                const source = currentNodes.find(n => n.id === link.source);
                const target = currentNodes.find(n => n.id === link.target);
                if (source && target) {
                    const dx = source.x - target.x;
                    const dy = source.y - target.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = (distance - 100) * 0.02;
                    const nx = dx / distance;
                    const ny = dy / distance;
                    source.vx -= nx * force;
                    source.vy -= ny * force;
                    target.vx += nx * force;
                    target.vy += ny * force;
                }
            });

            // 3. Center gravity (Aligned with live simulation)
            currentNodes.forEach(n => {
                n.vx += (centerX - n.x) * 0.005;
                n.vy += (centerY - n.y) * 0.005;

                n.x += n.vx;
                n.y += n.vy;
                n.vx *= friction;
                n.vy *= friction;
            });
        }

        setNodes(currentNodes);
        setLinks(newLinks);
    }, [contacts]);

    useEffect(() => {
        const animate = () => {
            setNodes(prevNodes => {
                const newNodes = prevNodes.map(n => ({ ...n }));
                const friction = 0.95;

                // 1. Repulsion between all nodes
                for (let i = 0; i < newNodes.length; i++) {
                    for (let j = i + 1; j < newNodes.length; j++) {
                        const dx = newNodes[i].x - newNodes[j].x;
                        const dy = newNodes[i].y - newNodes[j].y;
                        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                        if (distance < 300) {
                            const force = (300 - distance) * 0.01;
                            const nx = dx / distance;
                            const ny = dy / distance;

                            if (!newNodes[i].isDragging) {
                                newNodes[i].vx += nx * force;
                                newNodes[i].vy += ny * force;
                            }
                            if (!newNodes[j].isDragging) {
                                newNodes[j].vx -= nx * force;
                                newNodes[j].vy -= ny * force;
                            }
                        }
                    }
                }

                // 2. Attraction between linked nodes
                links.forEach(link => {
                    const source = newNodes.find(n => n.id === link.source);
                    const target = newNodes.find(n => n.id === link.target);
                    if (source && target) {
                        const dx = source.x - target.x;
                        const dy = source.y - target.y;
                        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                        const force = (distance - 100) * 0.02;
                        const nx = dx / distance;
                        const ny = dy / distance;

                        if (!source.isDragging) {
                            source.vx -= nx * force;
                            source.vy -= ny * force;
                        }
                        if (!target.isDragging) {
                            target.vx += nx * force;
                            target.vy += ny * force;
                        }
                    }
                });

                // 3. Center gravity
                const centerX = containerRef.current?.offsetWidth ? containerRef.current.offsetWidth / 2 : (typeof window !== 'undefined' ? window.innerWidth / 2 : 400);
                const centerY = containerRef.current?.offsetHeight ? containerRef.current.offsetHeight / 2 : (typeof window !== 'undefined' ? window.innerHeight / 2 : 300);
                newNodes.forEach(n => {
                    if (n.isDragging) {
                        n.vx = 0;
                        n.vy = 0;
                        return;
                    }

                    n.vx += (centerX - n.x) * 0.005;
                    n.vy += (centerY - n.y) * 0.005;

                    n.x += n.vx;
                    n.y += n.vy;
                    n.vx *= friction;
                    n.vy *= friction;
                });

                return newNodes;
            });
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [links]);

    // Graph Interaction Handlers
    const handleWheel = (e: React.WheelEvent) => {
        // Disabled pinch/scroll zoom as requested
        // e.preventDefault();
    };

    const handleZoomManual = (delta: number) => {
        setTransform(prev => ({
            ...prev,
            k: Math.min(Math.max(0.1, prev.k + delta), 4)
        }));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsPanning(true);
        lastPoint.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            const dx = e.clientX - lastPoint.current.x;
            const dy = e.clientY - lastPoint.current.y;
            setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            lastPoint.current = { x: e.clientX, y: e.clientY };
        } else if (dragNode) {
            // Calculate mouse position relative to graph container and transform
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();

            // Mouse pos relative to container
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Adjust for transform to get actual node coordinate space
            const nodeX = (mouseX - transform.x) / transform.k;
            const nodeY = (mouseY - transform.y) / transform.k;

            setNodes(prev => prev.map(n =>
                n.id === dragNode ? { ...n, x: nodeX, y: nodeY, vx: 0, vy: 0 } : n
            ));
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
        if (dragNode) {
            setNodes(prev => prev.map(n =>
                n.id === dragNode ? { ...n, isDragging: false } : n
            ));
            setDragNode(null);
        }
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative overflow-hidden bg-black/20 rounded-[2.5rem] border border-white/5 shadow-2xl cursor-grab active:cursor-grabbing"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <motion.div
                className="w-full h-full transform-gpu origin-top-left"
                style={{
                    x: transform.x,
                    y: transform.y,
                    scale: transform.k,
                }}
            >
                <svg className="w-full h-full absolute inset-0 pointer-events-none overflow-visible">
                    {links.map((link, i) => {
                        const source = nodes.find(n => n.id === link.source);
                        const target = nodes.find(n => n.id === link.target);
                        if (!source || !target) return null;

                        const isPathLink = path.length > 1 && path.includes(link.source) && path.includes(link.target) && Math.abs(path.indexOf(link.source) - path.indexOf(link.target)) === 1;

                        return (
                            <motion.line
                                key={`${link.source}-${link.target}-${i}`}
                                x1={source.x}
                                y1={source.y}
                                x2={target.x}
                                y2={target.y}
                                stroke={isPathLink ? "#10b981" : "white"}
                                strokeWidth={isPathLink ? 3 : 1.5}
                                strokeOpacity={path.length > 0 && !isPathLink ? 0.1 : (isPathLink ? 1 : 0.4)}
                                // No animation for pathLength on every render to performance
                                style={{ filter: isPathLink ? "drop-shadow(0 0 5px #10b981)" : "drop-shadow(0 0 2px rgba(255,255,255,0.3))" }}
                            />
                        );
                    })}
                </svg>

                {nodes.map(node => {
                    const isPathNode = path.includes(node.id);
                    const isInactive = path.length > 0 && !isPathNode;
                    return (
                        <motion.div
                            key={node.id}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                setDragNode(node.id);
                                setNodes(prev => prev.map(n => n.id === node.id ? { ...n, isDragging: true } : n));
                            }}
                            className={cn(
                                "absolute w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold text-white shadow-xl cursor-pointer border border-white/10 backdrop-blur-md transition-colors duration-300",
                                isPathNode ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] z-20" : "",
                                isInactive ? "opacity-20 grayscale" : node.avatarColor,
                                // Scale handled by container, but hover scale local
                                "hover:scale-125 hover:z-50"
                            )}
                            style={{
                                left: node.x - 20,
                                top: node.y - 20,
                                scale: isPathNode ? 1.25 : (isInactive ? 0.9 : 1)
                            }}
                        >
                            {node.name.charAt(0)}
                            <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap overflow-visible pointer-events-none">
                                <div className={cn(
                                    "backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                    isPathNode ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "bg-black/80 text-white",
                                    isInactive && "opacity-0"
                                )}>
                                    {node.nickname && showNicknames ? node.nickname : node.name}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            <div className="absolute top-6 left-6 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Direct Connection</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Org Network</span>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                    <button
                        onClick={() => handleZoomManual(0.2)}
                        className="p-1.5 bg-white/5 hover:bg-white/20 rounded-lg text-white/60 hover:text-white transition-all"
                    >
                        <Plus size={14} />
                    </button>
                    <button
                        onClick={() => handleZoomManual(-0.2)}
                        className="p-1.5 bg-white/5 hover:bg-white/20 rounded-lg text-white/60 hover:text-white transition-all"
                    >
                        <Minus size={14} />
                    </button>
                    <span className="text-[9px] font-black opacity-30 ml-2">{Math.round(transform.k * 100)}%</span>
                </div>
            </div>


            {/* Pathfinding Interface */}
            <div className="absolute top-6 right-6 flex flex-col gap-2 bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-2xl w-64">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Neural Pathfinding</h3>
                <div className="space-y-4 relative z-50">
                    <div className="relative">
                        <input
                            value={startSearch}
                            onFocus={() => setIsStartOpen(true)}
                            onChange={(e) => {
                                setStartSearch(e.target.value);
                                setIsStartOpen(true);
                            }}
                            placeholder="Start Node..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-white/30"
                        />
                        {isStartOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 max-h-40 custom-scrollbar overflow-y-auto bg-black border border-white/10 rounded-lg shadow-xl z-50">
                                {filteredStart.length > 0 ? filteredStart.map(c => (
                                    <div key={c.id} onClick={() => selectStart(c)} className="p-2 text-xs hover:bg-white/10 cursor-pointer text-white/80 hover:text-white border-b border-white/5 last:border-0">
                                        {c.name}
                                    </div>
                                )) : <div className="p-2 text-[10px] opacity-40 italic">No nodes found.</div>}
                            </div>
                        )}
                    </div>



                    <div className="relative">
                        <input
                            value={endSearch}
                            onFocus={() => setIsEndOpen(true)}
                            onChange={(e) => {
                                setEndSearch(e.target.value);
                                setIsEndOpen(true);
                            }}
                            placeholder="Target Node..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-white/30"
                        />
                        {isEndOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 max-h-40 custom-scrollbar overflow-y-auto bg-black border border-white/10 rounded-lg shadow-xl z-50">
                                {filteredEnd.length > 0 ? filteredEnd.map(c => (
                                    <div key={c.id} onClick={() => selectEnd(c)} className="p-2 text-xs hover:bg-white/10 cursor-pointer text-white/80 hover:text-white border-b border-white/5 last:border-0">
                                        {c.name}
                                    </div>
                                )) : <div className="p-2 text-[10px] opacity-40 italic">No nodes found.</div>}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={() => findPath(pathStart, pathEnd)}
                            disabled={!pathStart || !pathEnd || pathStart === pathEnd}
                            className="flex-1 bg-white text-black font-black text-[10px] uppercase tracking-widest py-2 rounded-lg hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Trace Path
                        </button>
                        {(pathStart || pathEnd || path.length > 0) && (
                            <button
                                onClick={() => {
                                    setPathStart("");
                                    setPathEnd("");
                                    setStartSearch("");
                                    setEndSearch("");
                                    setPath([]);
                                }}
                                className="px-3 bg-white/10 text-white font-black text-[10px] uppercase tracking-widest py-2 rounded-lg hover:bg-white/20 transition-all border border-white/10"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    {path.length > 0 ? (
                        <div className="mt-2 text-center">
                            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                {path.length - 1} Degrees of Separation
                            </span>
                        </div>
                    ) : (pathStart && pathEnd && pathStart !== pathEnd && !isStartOpen && !isEndOpen) ? (
                        <div className="mt-2 text-center">
                            <span className="text-red-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                No Neural Connection Detected
                            </span>
                        </div>
                    ) : null}
                </div>
            </div>
        </div >
    );
}
