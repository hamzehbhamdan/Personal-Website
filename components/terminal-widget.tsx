"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { HOME, promptPath } from "@/lib/terminal/fs"
import { CHIPS, MAX_INPUT, runCommand, suggestions, type Line, type Seg, type Suggestion } from "@/lib/terminal/commands"

type Theme = "light" | "dark"
type Entry = { id: number; prompt?: string; cmd?: string; lines: Line[] }

const THEME_KEY = "hh-terminal-theme"
const MAX_ENTRIES = 150

const WELCOME: Line[] = [
    [{ t: "Hi! Tap a shortcut below or type a command." }],
    [
        { t: "New here? Try ", k: "dim" },
        { t: "ls", run: "ls" },
        { t: ", then ", k: "dim" },
        { t: "cd projects", run: "cd projects" },
        { t: ".", k: "dim" },
    ],
]

const STYLES: Record<
    Theme,
    {
        panel: string
        bar: string
        barBtn: string
        rowBorder: string
        input: string
        chip: string
        text: string
        dim: string
        acc: string
        ok: string
        err: string
        prompt: string
        link: string
        ghost: string
    }
> = {
    light: {
        panel: "border-stone-300 bg-white text-stone-800 shadow-2xl",
        bar: "border-stone-200 bg-[#f9f8f6] text-stone-500",
        barBtn: "text-stone-400 hover:text-stone-900",
        rowBorder: "border-stone-200",
        input: "text-stone-900 placeholder:text-stone-400",
        chip: "border-stone-300 text-stone-700 hover:border-[#A51C30] hover:text-[#A51C30]",
        text: "text-stone-800",
        dim: "text-stone-500",
        acc: "text-[#A51C30]",
        ok: "text-emerald-700",
        err: "text-red-700",
        prompt: "text-[#A51C30]",
        link: "decoration-stone-300 hover:decoration-current",
        ghost: "text-stone-400",
    },
    dark: {
        panel: "border-stone-800 bg-stone-950 text-stone-200 shadow-2xl",
        bar: "border-stone-800 bg-stone-950 text-stone-500",
        barBtn: "text-stone-500 hover:text-stone-200",
        rowBorder: "border-stone-800",
        input: "text-stone-100 placeholder:text-stone-600",
        chip: "border-stone-700 text-stone-300 hover:border-[#e0788a] hover:text-[#e0788a]",
        text: "text-stone-200",
        dim: "text-stone-500",
        acc: "text-[#e0788a]",
        ok: "text-emerald-400",
        err: "text-red-400",
        prompt: "text-[#e0788a]",
        link: "decoration-stone-600 hover:decoration-current",
        ghost: "text-stone-600",
    },
}

function SegView({
    seg,
    theme,
    onRun,
    onNavigate,
}: {
    seg: Seg
    theme: Theme
    onRun: (cmd: string) => void
    onNavigate: () => void
}) {
    const st = STYLES[theme]
    const color = seg.k === "dim" ? st.dim : seg.k === "acc" ? st.acc : seg.k === "ok" ? st.ok : seg.k === "err" ? st.err : st.text
    const linkCls = cn(color, "underline underline-offset-2", st.link)

    if (seg.run)
        return (
            <button type="button" onClick={() => onRun(seg.run!)} className={cn(linkCls, "cursor-pointer text-left")}>
                {seg.t}
            </button>
        )
    if (!seg.href) return <span className={color}>{seg.t}</span>

    const internal = seg.href.startsWith("/") && !/\.(pdf|html)$/.test(seg.href)
    if (internal)
        return (
            <Link href={seg.href} className={linkCls} onClick={onNavigate}>
                {seg.t}
            </Link>
        )
    const newTab = /^https?:/.test(seg.href) || /\.(pdf|html)$/.test(seg.href)
    return (
        <a href={seg.href} className={linkCls} {...(newTab ? { target: "_blank", rel: "noreferrer" } : {})}>
            {seg.t}
        </a>
    )
}

export function TerminalWidget() {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)
    const [theme, setTheme] = React.useState<Theme>("light")
    const [cwd, setCwd] = React.useState(HOME)
    const [entries, setEntries] = React.useState<Entry[]>([])
    const [value, setValue] = React.useState("")
    const [sel, setSel] = React.useState(0)
    const idRef = React.useRef(0)
    const historyRef = React.useRef<string[]>([])
    const histIdx = React.useRef(-1)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const logRef = React.useRef<HTMLDivElement>(null)
    const launcherRef = React.useRef<HTMLButtonElement>(null)
    const st = STYLES[theme]

    const cands = React.useMemo(() => suggestions(value, cwd), [value, cwd])
    const selIdx = cands.length ? Math.min(sel, cands.length - 1) : 0
    const active: Suggestion | undefined = cands[selIdx]
    // ghost text: the part of the active suggestion not typed yet (hidden if the text could scroll)
    const ghost =
        active && value.length <= 44 && active.value.toLowerCase().startsWith(value.toLowerCase())
            ? active.value.slice(value.length)
            : ""

    const accept = (c: Suggestion) => {
        setValue(c.value)
        setSel(0)
        histIdx.current = -1
        inputRef.current?.focus()
    }

    // restore saved theme after mount (avoids a server/client mismatch)
    React.useEffect(() => {
        try {
            const saved = localStorage.getItem(THEME_KEY)
            if (saved === "dark" || saved === "light") setTheme(saved)
        } catch {
            /* storage unavailable: stay light */
        }
    }, [])

    const applyTheme = (mode: Theme) => {
        setTheme(mode)
        try {
            localStorage.setItem(THEME_KEY, mode)
        } catch {
            /* ignore */
        }
    }

    const close = React.useCallback(() => {
        setOpen(false)
        setTimeout(() => launcherRef.current?.focus(), 0)
    }, [])

    React.useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 30)
    }, [open])

    React.useEffect(() => {
        logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
    }, [entries, open])

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false)
            const target = e.target as HTMLElement | null
            const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
            if (e.key === "`" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault()
                setOpen((o) => !o)
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [])

    const push = (e: Omit<Entry, "id">) =>
        setEntries((prev) => [...prev, { id: idRef.current++, ...e }].slice(-MAX_ENTRIES))

    const exec = (raw: string) => {
        const cmd = raw.trim().slice(0, MAX_INPUT)
        if (!cmd) {
            push({ prompt: promptPath(cwd), cmd: "", lines: [] })
            return
        }
        historyRef.current.push(cmd)
        histIdx.current = -1
        setSel(0)
        const res = runCommand(cmd, { cwd, history: historyRef.current, theme })
        const action = res.action
        if (action?.type === "clear") {
            setEntries([])
            return
        }
        push({ prompt: promptPath(cwd), cmd, lines: res.lines })
        if (res.cwd) setCwd(res.cwd)
        if (action?.type === "theme") applyTheme(action.mode)
        if (action?.type === "close") close()
        if (action?.type === "navigate") {
            const href = action.href
            setTimeout(() => {
                if (/^https?:|^mailto:|\.(pdf|html)$/.test(href)) {
                    if (href.startsWith("mailto:")) window.location.href = href
                    else window.open(href, "_blank", "noopener")
                } else {
                    router.push(href)
                    if (window.matchMedia("(max-width: 640px)").matches) setOpen(false)
                }
            }, 350)
        }
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const h = historyRef.current
        if (e.key === "Enter") {
            exec(value)
            setValue("")
        } else if (e.key === "Tab") {
            // only intercept Tab when there is something to accept, so keyboard users can still tab out
            if (!active) return
            e.preventDefault()
            accept(active)
        } else if (e.key === "ArrowRight") {
            const el = e.currentTarget
            if (active && ghost && el.selectionStart === value.length && el.selectionEnd === value.length) {
                e.preventDefault()
                accept(active)
            }
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            const up = e.key === "ArrowUp"
            const browsing = histIdx.current !== -1 || value === ""
            if (!browsing && cands.length > 1) {
                // cycle through suggestions
                e.preventDefault()
                setSel((i) => (up ? (i - 1 + cands.length) % cands.length : (i + 1) % cands.length))
            } else if (up) {
                if (!h.length) return
                e.preventDefault()
                histIdx.current = histIdx.current === -1 ? h.length - 1 : Math.max(0, histIdx.current - 1)
                setValue(h[histIdx.current])
                setSel(0)
            } else {
                if (histIdx.current === -1) return
                e.preventDefault()
                histIdx.current += 1
                if (histIdx.current >= h.length) {
                    histIdx.current = -1
                    setValue("")
                } else setValue(h[histIdx.current])
                setSel(0)
            }
        } else if (e.ctrlKey && e.key.toLowerCase() === "l") {
            e.preventDefault()
            setEntries([])
        }
    }

    const mobileClose = () => {
        if (window.matchMedia("(max-width: 640px)").matches) setOpen(false)
    }

    const renderLine = (l: Line, key: React.Key) => (
        <div key={key} className="min-h-[1.5em]">
            {l.map((s, j) => (
                <SegView key={j} seg={s} theme={theme} onRun={exec} onNavigate={mobileClose} />
            ))}
            {l.every((s) => !s.t) && " "}
        </div>
    )

    return (
        <>
            <button
                ref={launcherRef}
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open terminal"
                aria-expanded={open}
                className={cn(
                    "fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8 flex items-center gap-2 px-3.5 py-2",
                    "border border-[#A51C30]/40 bg-[#f9f8f6] text-[#A51C30] shadow-sm",
                    "font-mono text-[11px] uppercase tracking-[0.2em]",
                    "hover:border-[#A51C30] hover:bg-[#A51C30]/5 transition-all duration-200",
                    open && "pointer-events-none opacity-0"
                )}
            >
                <span aria-hidden className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#A51C30]/60 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#A51C30]" />
                </span>
                <span aria-hidden className="font-semibold normal-case tracking-normal">
                    &gt;_
                </span>
                Terminal
            </button>

            <div
                role="dialog"
                aria-label="Terminal"
                aria-hidden={!open}
                className={cn(
                    "fixed z-[60] flex flex-col overflow-hidden border",
                    "bottom-3 right-3 left-3 sm:left-auto sm:bottom-8 sm:right-8 sm:w-[540px]",
                    "font-mono text-[13px] leading-relaxed",
                    "origin-bottom-right transition-all duration-200 motion-reduce:transition-none",
                    st.panel,
                    open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
                )}
            >
                <div className={cn("flex items-center justify-between border-b px-4 py-2.5", st.bar)}>
                    <span className="text-[11px] uppercase tracking-[0.2em]">
                        hh<span className={st.acc}>.</span> terminal
                    </span>
                    <button
                        type="button"
                        onClick={close}
                        aria-label="Minimize terminal"
                        tabIndex={open ? 0 : -1}
                        className={cn("transition-colors", st.barBtn)}
                    >
                        <Minus className="h-4 w-4" />
                    </button>
                </div>

                <div
                    ref={logRef}
                    role="log"
                    aria-live="polite"
                    className="h-72 space-y-0.5 overflow-y-auto whitespace-pre-wrap break-words px-4 py-3 sm:h-96"
                    onClick={(e) => {
                        if ((e.target as HTMLElement).closest("button,a")) return
                        inputRef.current?.focus()
                    }}
                >
                    {WELCOME.map((l, i) => renderLine(l, `w${i}`))}
                    {entries.map((e) => (
                        <div key={e.id} className="space-y-0.5 pt-1">
                            <div>
                                <span className={st.prompt}>{e.prompt} $</span> <span className={st.text}>{e.cmd}</span>
                            </div>
                            {e.lines.map((l, i) => renderLine(l, i))}
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap gap-1.5 px-4 pb-2.5">
                    {CHIPS.map((c) => (
                        <button
                            key={c}
                            type="button"
                            tabIndex={open ? 0 : -1}
                            onClick={() => exec(c)}
                            className={cn("border px-2 py-0.5 text-[12px] transition-colors", st.chip)}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                {cands.length > 1 && (
                    <div
                        id="terminal-suggestions"
                        role="listbox"
                        aria-label="Suggestions"
                        className={cn("flex flex-wrap items-center gap-x-3 gap-y-0.5 border-t px-4 py-1.5 text-[12px]", st.rowBorder)}
                    >
                        {(() => {
                            const size = 8
                            const start = Math.min(Math.max(0, selIdx - 3), Math.max(0, cands.length - size))
                            const shown = cands.slice(start, start + size)
                            return (
                                <>
                                    {start > 0 && <span className={st.dim}>…</span>}
                                    {shown.map((c, i) => {
                                        const idx = start + i
                                        const on = idx === selIdx
                                        return (
                                            <button
                                                key={c.value}
                                                type="button"
                                                role="option"
                                                aria-selected={on}
                                                tabIndex={-1}
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => accept(c)}
                                                className={cn(
                                                    "transition-colors",
                                                    on ? cn(st.acc, "underline underline-offset-2") : st.dim,
                                                    !on && "hover:text-current"
                                                )}
                                            >
                                                {c.label}
                                            </button>
                                        )
                                    })}
                                    {start + size < cands.length && <span className={st.dim}>+{cands.length - start - size} more</span>}
                                    <span className={cn("ml-auto hidden sm:inline", st.dim)}>↑↓ choose · tab accept</span>
                                </>
                            )
                        })()}
                    </div>
                )}

                <div className={cn("flex items-center gap-2 border-t px-4 py-3", st.rowBorder)}>
                    <span className={cn("shrink-0", st.prompt)} aria-hidden>
                        {promptPath(cwd)} $
                    </span>
                    <div className="relative min-w-0 flex-1">
                        {ghost && (
                            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre">
                                <span className="invisible">{value}</span>
                                <span className={st.ghost}>{ghost}</span>
                            </div>
                        )}
                        <input
                            ref={inputRef}
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value.slice(0, MAX_INPUT))
                                setSel(0)
                                histIdx.current = -1
                            }}
                            onKeyDown={onKeyDown}
                            tabIndex={open ? 0 : -1}
                            placeholder="try: help"
                            aria-label="Terminal command"
                            aria-autocomplete="inline"
                            aria-controls={cands.length > 1 ? "terminal-suggestions" : undefined}
                            autoComplete="off"
                            autoCapitalize="off"
                            autoCorrect="off"
                            spellCheck={false}
                            className={cn("relative w-full bg-transparent outline-none", st.input)}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}
