import { experience, personalInfo } from "@/lib/data"
import { HOME, listDir, lookup, resolvePath, type DirNode } from "@/lib/terminal/fs"

export type Seg = {
    t: string
    k?: "dim" | "acc" | "ok" | "err"
    /** real link (internal route, external URL, mailto, or file) */
    href?: string
    /** clicking runs this command in the terminal */
    run?: string
}
export type Line = Seg[]
export type TerminalAction =
    | { type: "navigate"; href: string }
    | { type: "clear" }
    | { type: "close" }
    | { type: "theme"; mode: "light" | "dark" }
export type TerminalContext = { cwd: string; history: string[]; theme: "light" | "dark" }
export type TerminalResult = { lines: Line[]; action?: TerminalAction; cwd?: string }

export const CHIPS = ["help", "ls", "cat about.txt", "git log", "open projects"]
export const MAX_INPUT = 200
const DEFAULT_CTX: TerminalContext = { cwd: HOME, history: [], theme: "light" }

const t = (s: string): Seg => ({ t: s })
const dim = (s: string): Seg => ({ t: s, k: "dim" })
const err = (s: string): Seg => ({ t: s, k: "err" })
const acc = (s: string): Seg => ({ t: s, k: "acc" })
const text = (s: string): Line[] => s.split("\n").map((l) => [t(l)])
const errLine = (s: string): TerminalResult => ({ lines: [[err(s)]] })

export function shortHash(input: string): string {
    let h = 5381
    for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0
    return h.toString(16).padStart(7, "0").slice(-7)
}

// ── command tables ─────────────────────────────────────────────────────────
const READONLY = new Set([
    "mv", "cp", "rm", "rmdir", "mkdir", "touch", "chmod", "chown", "chgrp", "ln", "dd", "tee",
    "kill", "pkill", "killall", "shutdown", "reboot", "halt", "mount", "umount", "truncate", "unlink",
])
const NETWORK = new Set(["curl", "wget", "ssh", "scp", "telnet", "ftp", "nc"])
const INSTALLERS = new Set(["apt", "apt-get", "brew", "pip", "pip3", "npm", "npx", "yarn", "pnpm", "cargo"])
const EDITORS = new Set(["vim", "vi", "nvim", "nano", "emacs", "code", "pico"])
const SHELLS = new Set(["sh", "bash", "zsh", "fish", "su"])

const USAGE: Record<string, string> = {
    ls: "ls [-a] [-l] [path]   list a directory (-a shows hidden files)",
    cd: "cd [path]   change directory. try: cd projects, cd .., cd ~, cd /",
    pwd: "pwd   print the current directory",
    find: "find [path] [-name glob] [-type f|d]   search by name. try: find baseball, find -name \"*.md\"",
    cat: "cat <file>   print a file. try: cat about.txt",
    tree: "tree [path]   show the directory tree",
    open: "open [path]   visit the page for a file or directory. try: open thesis",
    git: "git log | git status   a very small git",
    theme: "theme [light|dark]   switch the terminal theme",
    echo: "echo <text>   print text",
    history: "history   list commands you have run",
    clear: "clear   clear the screen (or press ctrl+l)",
    exit: "exit   close the terminal",
}

const COMMAND_NAMES = [
    "about", "cat", "cd", "clear", "coffee", "contact", "cowsay", "dark", "date", "echo", "exit",
    "find", "git", "hello", "help", "history", "hostname", "light", "ls", "man", "neofetch",
    "open", "pwd", "theme", "tree", "uname", "which", "whoami",
]

// ── helpers ────────────────────────────────────────────────────────────────
function tokenize(s: string): string[] {
    const out: string[] = []
    const re = /"([^"]*)"|'([^']*)'|(\S+)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(s))) out.push(m[1] ?? m[2] ?? m[3])
    return out
}

function relFor(cwd: string, abs: string, name: string): string {
    return abs === cwd ? name : `${abs === "/" ? "" : abs}/${name}`
}

function lsCmd(paths: string[], cwd: string, long: boolean, all: boolean): TerminalResult {
    const lines: Line[] = []
    paths.forEach((p) => {
        const abs = resolvePath(cwd, p)
        const node = lookup(abs)
        if (!node) {
            lines.push([err(`ls: cannot access '${p}': No such file or directory`)])
            return
        }
        if (node.kind === "file") {
            lines.push([{ t: p, run: `cat ${p}` }])
            return
        }
        if (paths.length > 1) lines.push([dim(`${p}:`)])
        const entries = listDir(node, all)
        const segs: Seg[] = entries.map(([name, child]) => {
            const rel = relFor(cwd, abs, name)
            return child.kind === "dir"
                ? { t: `${name}/`, k: "acc", run: `cd ${rel}` }
                : { t: name, run: `cat ${rel}` }
        })
        if (long) {
            entries.forEach(([, child], i) =>
                lines.push([dim(`${child.kind === "dir" ? "drwxr-xr-x" : "-rw-r--r--"}  hamzeh  `), segs[i]])
            )
        } else if (segs.length && segs.reduce((n, s) => n + s.t.length + 2, 0) > 64) {
            // too wide for one row: one entry per line
            segs.forEach((s) => lines.push([s]))
        } else if (segs.length) {
            const row: Seg[] = []
            segs.forEach((s, i) => {
                if (i) row.push(t("  "))
                row.push(s)
            })
            lines.push(row)
        }
    })
    return { lines }
}

function globToRegExp(glob: string, ci: boolean): RegExp {
    const esc = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".")
    return new RegExp(`^${esc}$`, ci ? "i" : "")
}

const FIND_LIMIT = 50

function findCmd(args: string[], cwd: string): TerminalResult {
    let startArg: string | undefined
    let name: RegExp | undefined
    let type: "f" | "d" | undefined
    for (let i = 0; i < args.length; i++) {
        const a = args[i]
        if (a === "-name" || a === "-iname") {
            const g = args[++i]
            if (!g) return errLine(`find: missing argument to '${a}'`)
            name = globToRegExp(g, a === "-iname")
        } else if (a === "-type") {
            const v = args[++i]
            if (v !== "f" && v !== "d") return errLine("find: -type takes f or d")
            type = v
        } else if (a === "-delete" || a === "-exec" || a === "-execdir" || a === "-ok") {
            return errLine(`find: ${a} is disabled. this filesystem is read-only.`)
        } else if (a.startsWith("-")) {
            return errLine(`find: unknown option '${a}'`)
        } else if (startArg === undefined) {
            startArg = a
        } else {
            return errLine("find: only one starting path is supported")
        }
    }
    // friendly mode: "find baseball" searches names containing the word
    if (startArg !== undefined && !name && !lookup(resolvePath(cwd, startArg))) {
        name = globToRegExp(`*${startArg}*`, true)
        startArg = "."
    }
    const start = startArg ?? "."
    const startNode = lookup(resolvePath(cwd, start))
    if (!startNode) return errLine(`find: '${start}': No such file or directory`)
    if (startNode.kind === "file") return { lines: [[t(start)]] }

    const shown = start.replace(/\/+$/, "") || "/"
    const hits: { path: string; dir: boolean }[] = []
    const walk = (node: DirNode, rel: string) => {
        for (const [n, child] of listDir(node, true)) {
            if (hits.length > FIND_LIMIT) return
            const path = `${rel}/${n}`
            const isDir = child.kind === "dir"
            if ((!name || name.test(n)) && (!type || (type === "d") === isDir)) hits.push({ path, dir: isDir })
            if (isDir) walk(child, path)
        }
    }
    walk(startNode, shown === "/" ? "" : shown)

    if (!hits.length) return { lines: [[dim("no matches")]] }
    const lines: Line[] = hits.slice(0, FIND_LIMIT).map((h): Line => [
        h.dir ? { t: h.path, k: "acc", run: `cd ${h.path}` } : { t: h.path, run: `cat ${h.path}` },
    ])
    if (hits.length > FIND_LIMIT) lines.push([dim(`... showing the first ${FIND_LIMIT}`)])
    return { lines }
}

function treeLines(node: DirNode, prefix: string, out: Line[], budget: { n: number }) {
    const entries = listDir(node, false)
    entries.forEach(([name, child], i) => {
        if (budget.n <= 0) return
        budget.n--
        const last = i === entries.length - 1
        out.push([
            dim(prefix + (last ? "└── " : "├── ")),
            child.kind === "dir" ? acc(`${name}/`) : t(name),
        ])
        if (child.kind === "dir") treeLines(child, prefix + (last ? "    " : "│   "), out, budget)
    })
}

function cowsay(msg: string): Line[] {
    const words = msg.split(/\s+/)
    const rows: string[] = []
    let cur = ""
    for (const w of words) {
        if ((cur + " " + w).trim().length > 30) {
            if (cur) rows.push(cur)
            cur = w
        } else cur = (cur + " " + w).trim()
    }
    if (cur) rows.push(cur)
    const width = Math.max(...rows.map((r) => r.length))
    const bubble = [
        " " + "_".repeat(width + 2),
        ...rows.map((r, i) => {
            const [l, rt] = rows.length === 1 ? ["<", ">"] : i === 0 ? ["/", "\\"] : i === rows.length - 1 ? ["\\", "/"] : ["|", "|"]
            return `${l} ${r.padEnd(width)} ${rt}`
        }),
        " " + "-".repeat(width + 2),
    ]
    const cow = ["        \\   ^__^", "         \\  (oo)\\_______", "            (__)\\       )\\/\\", "                ||----w |", "                ||     ||"]
    return [...bubble, ...cow].map((l) => [t(l)])
}

function neofetch(): Line[] {
    const logo = ["  _   _ _   _ ", " | | | | | | |", " | |_| | |_| |", " |  _  |  _  |", " |_| |_|_| |_|"]
    const info: Seg[][] = [
        [acc("visitor"), dim("@"), acc("hamzehhamdan.com")],
        [dim("-----------------------")],
        [dim("role     "), t(personalInfo.title)],
        [dim("location "), t(personalInfo.location)],
        [dim("school   "), t("Harvard '25, CS + Statistics")],
        [dim("stack    "), t("Python, TypeScript")],
    ]
    return info.map((row, i) => [acc((logo[i] ?? "               ").padEnd(16)), ...row])
}

function gitLog(): Line[] {
    return [
        ...experience.map((e): Line => [
            dim(shortHash(e.company + e.date) + " "),
            t(`${e.date.split("–")[0].trim().toLowerCase()}: ${e.role.toLowerCase()}, ${e.company.toLowerCase()}`),
        ]),
        [dim("0000001 "), t("2025: harvard, cs + statistics")],
    ]
}

// ── main entry ─────────────────────────────────────────────────────────────
export function runCommand(raw: string, ctx: TerminalContext = DEFAULT_CTX): TerminalResult {
    const input = raw.trim().slice(0, MAX_INPUT)
    if (!input) return { lines: [] }

    // redirect-looking input ("echo hi > file"); a bare ">" inside text like "<b>" is just text
    if (/\s>{1,2}(\s|$|\S)/.test(input))
        return errLine("read-only filesystem: redirects are disabled. look around as much as you like.")
    if (/[|;&`]/.test(input)) return errLine("one command at a time, please.")

    const [rawCmd, ...args] = tokenize(input)
    const cmd = (rawCmd ?? "").toLowerCase()
    const flags = args.filter((a) => a.startsWith("-")).join("")
    const operands = args.filter((a) => !a.startsWith("-"))

    // easter eggs and jokes first
    if (cmd === "sudo") {
        const rest = args.join(" ").toLowerCase()
        if (rest === "hire hamzeh")
            return {
                lines: [
                    [t("hamzeh is not in the sudoers file. This incident will be reported.")],
                    [dim("(email works too: "), { t: personalInfo.email, k: "acc", href: `mailto:${personalInfo.email}` }, dim(")")],
                ],
            }
        if (/^rm\b/.test(rest)) return errLine("nice try. the filesystem is read-only.")
        return { lines: [[t("nice try.")]] }
    }
    if (cmd === "cd..") return { lines: [[t("did you mean "), { t: "cd ..", run: "cd .." }, t("?")]] }
    if (cmd === "sl") return { lines: [[t("did you mean "), { t: "ls", run: "ls" }, t("?")]] }

    if (READONLY.has(cmd))
        return errLine(`${cmd}: permission denied. this filesystem is read-only, so look around, but nothing here can be changed.`)
    if (NETWORK.has(cmd)) return errLine(`${cmd}: network access is disabled in this terminal.`)
    if (INSTALLERS.has(cmd)) return errLine(`${cmd}: permission denied. you are a guest here.`)
    if (EDITORS.has(cmd)) return { lines: [[t("no editor installed. good news: you can exit. bad news: there is nothing to edit.")]] }
    if (SHELLS.has(cmd)) return { lines: [[t("you are already in a shell. it is a very small one.")]] }

    switch (cmd) {
        case "help":
        case "man": {
            if (args[0]) {
                if (args[0].toLowerCase() === "hamzeh")
                    return { lines: text(`${personalInfo.name}. ${personalInfo.title}.\n${personalInfo.location}.`) }
                const u = USAGE[args[0].toLowerCase()]
                return u ? { lines: text(u) } : errLine(`no help for '${args[0]}'. try: help`)
            }
            return {
                lines: [
                    [dim("navigate  "), t("ls  cd  pwd  tree  find  open  cat")],
                    [dim("about     "), t("whoami  git log  contact  neofetch")],
                    [dim("other     "), t("history  echo  date  theme  clear  exit")],
                    [dim("tips      "), t("suggestions appear as you type: tab accepts, up/down chooses. click anything highlighted")],
                    [dim("psst: there are a few hidden commands.")],
                ],
            }
        }
        case "ls":
        case "dir":
        case "ll":
            return lsCmd(operands.length ? operands : ["."], ctx.cwd, flags.includes("l") || cmd === "ll", flags.includes("a"))
        case "pwd":
            return { lines: [[t(ctx.cwd)]] }
        case "cd": {
            if (operands.length > 1) return errLine("cd: too many arguments")
            const target = operands[0] ?? "~"
            if (target === "-") return errLine("cd: OLDPWD not set")
            const abs = resolvePath(ctx.cwd, target)
            const node = lookup(abs)
            if (!node) return errLine(`cd: no such file or directory: ${target}`)
            if (node.kind !== "dir") return errLine(`cd: not a directory: ${target}`)
            return { lines: [], cwd: abs }
        }
        case "cat":
        case "less":
        case "more": {
            if (!operands.length) return errLine(`${cmd}: missing file. try: ${cmd} about.txt`)
            const lines: Line[] = []
            for (const p of operands) {
                const node = lookup(resolvePath(ctx.cwd, p))
                if (!node) lines.push([err(`${cmd}: ${p}: No such file or directory`)])
                else if (node.kind === "dir") lines.push([err(`${cmd}: ${p}: Is a directory`)])
                else {
                    lines.push(...text(node.text))
                    if (node.href) lines.push([dim("→ "), { t: `open ${p}`, run: `open ${p}` }])
                }
            }
            return { lines }
        }
        case "tree": {
            const p = operands[0] ?? "."
            const node = lookup(resolvePath(ctx.cwd, p))
            if (!node) return errLine(`tree: ${p}: No such file or directory`)
            if (node.kind === "file") return { lines: [[t(p)]] }
            const out: Line[] = [[acc(p === "." ? "." : p)]]
            const budget = { n: 80 }
            treeLines(node, "", out, budget)
            if (budget.n <= 0) out.push([dim("…")])
            return { lines: out }
        }
        case "find":
            return findCmd(args, ctx.cwd)
        case "open":
        case "xdg-open":
        case "start": {
            const p = operands[0] ?? "."
            const node = lookup(resolvePath(ctx.cwd, p)) ?? lookup(resolvePath(HOME, p))
            if (!node) return errLine(`${cmd}: ${p}: No such file or directory`)
            if (!node.href) return errLine(`${cmd}: nothing to open for '${p}'. try: cat ${p}`)
            return { lines: [[dim(`opening ${p}...`)]], action: { type: "navigate", href: node.href } }
        }
        case "git": {
            const sub = (operands[0] ?? "").toLowerCase()
            if (sub === "log") return { lines: gitLog() }
            if (sub === "status") return { lines: text("On branch main\nnothing to commit, working tree clean") }
            return errLine("git: only 'log' and 'status' are available here.")
        }
        case "whoami":
        case "about":
            return {
                lines: [
                    [t(`${personalInfo.name}. ${personalInfo.title}.`)],
                    [dim(`${personalInfo.location}. Harvard '25, CS + statistics.`)],
                ],
            }
        case "contact":
            return {
                lines: [
                    [{ t: personalInfo.email, k: "acc", href: `mailto:${personalInfo.email}` }],
                    [{ t: "linkedin", k: "acc", href: personalInfo.linkedin }, t("  "), { t: "github", k: "acc", href: personalInfo.github }],
                ],
            }
        case "hostname":
            return { lines: [[t("hamzehhamdan.com")]] }
        case "uname":
            return { lines: [[t(flags.includes("a") ? "Linux hamzehhamdan.com 6.9-hh #1 SMP x86_64 GNU/Linux" : "Linux")]] }
        case "date":
            return { lines: [[t(new Date().toString())]] }
        case "echo": {
            const out = args
                .join(" ")
                .replace(/\$HOME\b/g, HOME)
                .replace(/\$USER\b/g, "visitor")
                .replace(/\$PWD\b/g, ctx.cwd)
                .replace(/\$SHELL\b/g, "/bin/hh-sh")
            return { lines: [[t(out)]] }
        }
        case "which": {
            if (!operands[0]) return errLine("which: missing command")
            const n = operands[0].toLowerCase()
            return COMMAND_NAMES.includes(n) ? { lines: [[t(`/usr/bin/${n}`)]] } : errLine(`${n} not found`)
        }
        case "history": {
            if (!ctx.history.length) return { lines: [] }
            return { lines: ctx.history.map((h, i): Line => [dim(`${String(i + 1).padStart(4)}  `), t(h)]) }
        }
        case "theme": {
            const want = (operands[0] ?? "").toLowerCase()
            if (want && want !== "light" && want !== "dark") return errLine("theme: choose light or dark")
            const mode = (want as "light" | "dark") || (ctx.theme === "dark" ? "light" : "dark")
            return { lines: [[dim(mode === "dark" ? "lights off." : "lights on.")]], action: { type: "theme", mode } }
        }
        case "dark":
            return { lines: [[dim("lights off.")]], action: { type: "theme", mode: "dark" } }
        case "light":
            return { lines: [[dim("lights on.")]], action: { type: "theme", mode: "light" } }
        case "clear":
        case "cls":
            return { lines: [], action: { type: "clear" } }
        case "exit":
        case "quit":
        case "logout":
            return { lines: [], action: { type: "close" } }
        case "neofetch":
            return { lines: neofetch() }
        case "cowsay":
            return { lines: cowsay(args.join(" ") || "hire hamzeh") }
        case "coffee":
            return { lines: text("brewing...\ndone. productivity +3%.") }
        case "hello":
        case "hi":
        case "hey":
            return { lines: [[t("hi. type "), { t: "help", run: "help" }, t(" to see what you can do.")]] }
        default:
            return { lines: [[t(`command not found: ${rawCmd}  `), dim("(try help)")]] }
    }
}

// ── live suggestions (ghost text + candidate strip) ───────────────────────
export type Suggestion = { value: string; label: string }

const PATH_CMDS = new Set(["ls", "ll", "dir", "cd", "cat", "less", "more", "tree", "open", "xdg-open", "start", "find"])
const SUBCOMMANDS: Record<string, string[]> = {
    git: ["log", "status"],
    theme: ["dark", "light"],
    help: [...COMMAND_NAMES, "hamzeh"],
    man: [...COMMAND_NAMES, "hamzeh"],
}

function suggest(input: string, cwd: string): Suggestion[] {
    if (!input.trim() || /^\s/.test(input)) return []

    // first word: command names
    if (!/\s/.test(input)) {
        const p = input.toLowerCase()
        return COMMAND_NAMES.filter((c) => c.startsWith(p)).map((c) => ({ value: c + " ", label: c }))
    }

    const first = input.split(/\s+/)[0].toLowerCase()
    const idx = input.search(/\S*$/)
    const head = input.slice(0, idx)
    const word = input.slice(idx)

    const sub = SUBCOMMANDS[first]
    if (sub) {
        if (head.trim().split(/\s+/).length !== 1) return []
        const w = word.toLowerCase()
        return sub.filter((c) => c.startsWith(w)).map((c) => ({ value: head + c + " ", label: c }))
    }

    if (!PATH_CMDS.has(first) || word.startsWith("-")) return []
    const slash = word.lastIndexOf("/")
    const dirPart = slash >= 0 ? word.slice(0, slash + 1) : ""
    const base = word.slice(slash + 1)
    const node = lookup(resolvePath(cwd, dirPart || "."))
    if (!node || node.kind !== "dir") return []
    return listDir(node, base.startsWith("."))
        .filter(([n]) => n.startsWith(base))
        .map(([n, child]) => ({
            value: head + dirPart + n + (child.kind === "dir" ? "/" : " "),
            label: n + (child.kind === "dir" ? "/" : ""),
        }))
}

/** Candidates for what the user is typing. The first is the one shown as ghost text. */
export function suggestions(input: string, cwd: string): Suggestion[] {
    const out = suggest(input, cwd)
    // nothing left to add when the only candidate is exactly what is typed
    if (out.length === 1 && out[0].value.trimEnd().toLowerCase() === input.trimEnd().toLowerCase()) return []
    return out
}
