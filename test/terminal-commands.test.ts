import { describe, it, expect } from "vitest"
import { runCommand, suggestions, shortHash, CHIPS, MAX_INPUT, type TerminalContext } from "@/lib/terminal/commands"
import { HOME, lookup, resolvePath, promptPath } from "@/lib/terminal/fs"
import { experience, projects } from "@/lib/data"

const ctx = (over: Partial<TerminalContext> = {}): TerminalContext => ({ cwd: HOME, history: [], theme: "light", ...over })
const out = (r: ReturnType<typeof runCommand>) => r.lines.map((l) => l.map((s) => s.t).join("")).join("\n")

describe("paths", () => {
    it("resolves ~, relative, absolute, .. and .", () => {
        expect(resolvePath(HOME, "~")).toBe(HOME)
        expect(resolvePath(HOME, "projects")).toBe(`${HOME}/projects`)
        expect(resolvePath(`${HOME}/projects`, "..")).toBe(HOME)
        expect(resolvePath(HOME, "/etc/motd")).toBe("/etc/motd")
        expect(resolvePath(HOME, "./a/../projects/")).toBe(`${HOME}/projects`)
        expect(resolvePath("/", "..")).toBe("/")
    })
    it("never resolves prototype names", () => {
        expect(lookup(`${HOME}/__proto__`)).toBeUndefined()
        expect(lookup(`${HOME}/constructor`)).toBeUndefined()
    })
    it("prompt path uses ~", () => {
        expect(promptPath(HOME)).toBe("~")
        expect(promptPath(`${HOME}/projects`)).toBe("~/projects")
        expect(promptPath("/etc")).toBe("/etc")
    })
})

describe("navigation", () => {
    it("ls lists directories as clickable cd commands", () => {
        const r = runCommand("ls", ctx())
        const segs = r.lines.flat()
        expect(segs.find((s) => s.t === "projects/")?.run).toBe("cd projects")
        expect(segs.find((s) => s.t === "about.txt")?.run).toBe("cat about.txt")
        expect(out(r)).not.toContain(".plan")
    })
    it("ls -a shows hidden files; ls -l is one entry per line", () => {
        expect(out(runCommand("ls -a", ctx()))).toContain(".plan")
        expect(runCommand("ls -l", ctx()).lines.length).toBeGreaterThan(5)
    })
    it("cd changes cwd and reports no output; bad paths error", () => {
        expect(runCommand("cd projects", ctx()).cwd).toBe(`${HOME}/projects`)
        expect(runCommand("cd", ctx({ cwd: "/etc" })).cwd).toBe(HOME)
        expect(runCommand("cd ..", ctx({ cwd: `${HOME}/projects` })).cwd).toBe(HOME)
        expect(runCommand("cd /", ctx()).cwd).toBe("/")
        expect(runCommand("cd nope", ctx()).cwd).toBeUndefined()
        expect(out(runCommand("cd nope", ctx()))).toContain("no such file")
        expect(out(runCommand("cd about.txt", ctx()))).toContain("not a directory")
    })
    it("pwd prints the cwd", () => {
        expect(out(runCommand("pwd", ctx({ cwd: `${HOME}/blog` })))).toBe(`${HOME}/blog`)
    })
    it("cat prints files, errors on dirs and missing files", () => {
        expect(out(runCommand("cat about.txt", ctx()))).toContain("Software Engineer")
        expect(out(runCommand("cat projects", ctx()))).toContain("Is a directory")
        expect(out(runCommand("cat nope.txt", ctx()))).toContain("No such file")
        expect(out(runCommand("cat /etc/motd", ctx()))).toContain("welcome")
    })
    it("cat on a page-backed file offers an open shortcut", () => {
        const r = runCommand(`cat projects/${projects[0].slug}.md`, ctx())
        expect(r.lines.flat().some((s) => s.run?.startsWith("open "))).toBe(true)
    })
    it("tree lists the structure without hidden files", () => {
        const o = out(runCommand("tree", ctx()))
        expect(o).toContain("projects/")
        expect(o).not.toContain(".plan")
    })
    it("open navigates for pages and files, errors otherwise", () => {
        expect(runCommand("open thesis", ctx()).action).toEqual({ type: "navigate", href: "/thesis" })
        expect(runCommand("open projects", ctx()).action).toEqual({ type: "navigate", href: "/projects" })
        expect(runCommand("open thesis", ctx({ cwd: `${HOME}/projects` })).action).toEqual({ type: "navigate", href: "/thesis" })
        expect(runCommand("open resume.pdf", ctx()).action?.type).toBe("navigate")
        expect(runCommand("open about.txt", ctx()).action).toBeUndefined()
        expect(runCommand("open nope", ctx()).action).toBeUndefined()
    })
})

describe("read-only guard", () => {
    it.each(["mv a b", "cp a b", "rm -rf /", "rm about.txt", "mkdir x", "touch x", "chmod 777 x", "kill 1", "dd if=a of=b"])(
        "refuses %s with no side effects",
        (c) => {
            const r = runCommand(c, ctx())
            expect(r.action).toBeUndefined()
            expect(r.cwd).toBeUndefined()
            expect(r.lines[0][0].k).toBe("err")
        }
    )
    it("blocks redirects, pipes and chaining", () => {
        expect(out(runCommand("echo hi > about.txt", ctx()))).toContain("read-only")
        expect(out(runCommand("ls | cat", ctx()))).toContain("one command at a time")
        expect(out(runCommand("ls; rm x", ctx()))).toContain("one command at a time")
    })
    it("blocks network, installers, shells and editors politely", () => {
        expect(out(runCommand("curl example.com", ctx()))).toContain("network access is disabled")
        expect(out(runCommand("npm i left-pad", ctx()))).toContain("guest")
        expect(out(runCommand("bash", ctx()))).toContain("already in a shell")
        expect(out(runCommand("vim", ctx()))).toContain("no editor")
    })
    it("git only supports log and status", () => {
        expect(runCommand("git log", ctx()).lines).toHaveLength(experience.length + 1)
        expect(out(runCommand("git status", ctx()))).toContain("working tree clean")
        expect(out(runCommand("git push", ctx()))).toContain("only 'log' and 'status'")
    })
})

describe("easter eggs and utilities", () => {
    it("sudo hire hamzeh and other sudo", () => {
        expect(out(runCommand("sudo hire hamzeh", ctx()))).toContain("sudoers")
        expect(out(runCommand("sudo rm -rf /", ctx()))).toContain("read-only")
        expect(out(runCommand("sudo anything", ctx()))).toBe("nice try.")
        expect(out(runCommand("sudo make me a sandwich", ctx()))).toBe("nice try.")
    })
    it("theme switching", () => {
        expect(runCommand("theme dark", ctx()).action).toEqual({ type: "theme", mode: "dark" })
        expect(runCommand("theme", ctx({ theme: "dark" })).action).toEqual({ type: "theme", mode: "light" })
        expect(runCommand("dark", ctx()).action).toEqual({ type: "theme", mode: "dark" })
        expect(runCommand("light", ctx()).action).toEqual({ type: "theme", mode: "light" })
        expect(out(runCommand("theme purple", ctx()))).toContain("light or dark")
    })
    it("clear, exit", () => {
        expect(runCommand("clear", ctx()).action).toEqual({ type: "clear" })
        expect(runCommand("exit", ctx()).action).toEqual({ type: "close" })
    })
    it("fortune is gone", () => {
        expect(out(runCommand("fortune", ctx()))).toContain("command not found")
    })
    it("fun commands produce output", () => {
        for (const c of ["neofetch", "cowsay hi", "coffee", "hello", "whoami", "hostname", "uname -a", "date"]) {
            expect(runCommand(c, ctx()).lines.length).toBeGreaterThan(0)
        }
    })
    it("history echoes prior commands; echo expands safe variables only", () => {
        expect(out(runCommand("history", ctx({ history: ["ls", "pwd"] })))).toContain("pwd")
        expect(out(runCommand("echo $HOME $USER", ctx()))).toBe(`${HOME} visitor`)
        expect(out(runCommand("echo $SECRET", ctx()))).toBe("$SECRET")
    })
    it("help and typo hints", () => {
        expect(out(runCommand("help", ctx()))).toContain("navigate")
        expect(out(runCommand("help cd", ctx()))).toContain("change directory")
        expect(out(runCommand("cd..", ctx()))).toContain("did you mean")
        expect(out(runCommand("zzz", ctx()))).toContain("command not found")
    })
    it("caps input length and ignores empty input", () => {
        expect(runCommand("   ", ctx()).lines).toEqual([])
        expect(out(runCommand("echo " + "a".repeat(1000), ctx())).length).toBeLessThanOrEqual(MAX_INPUT)
    })
    it("unknown command output is plain text, not markup", () => {
        expect(out(runCommand("<script>", ctx()))).toContain("command not found")
    })
    it("shortHash is stable and 7 chars", () => {
        expect(shortHash("a")).toBe(shortHash("a"))
        expect(shortHash("a")).toHaveLength(7)
    })
    it("every chip runs without an error line", () => {
        for (const c of CHIPS) expect(runCommand(c, ctx()).lines[0]?.[0]?.k).not.toBe("err")
    })
})

describe("find", () => {
    it("friendly mode: a bare word searches names, case-insensitively", () => {
        const o = out(runCommand("find BASEBALL", ctx()))
        expect(o).toContain("baseball-analytics-creating-a-betting-edge.md")
        expect(o).toContain("./projects/")
    })
    it("supports -name globs, -iname, and -type", () => {
        expect(out(runCommand('find -name "*.txt"', ctx()))).toContain("./about.txt")
        expect(out(runCommand('find . -iname "ABOUT*"', ctx()))).toContain("./about.txt")
        const dirs = runCommand("find . -type d", ctx()).lines.flat()
        expect(dirs.every((s) => s.t.endsWith("/") || s.run?.startsWith("cd "))).toBe(true)
    })
    it("accepts a starting path and returns clickable results", () => {
        const segs = runCommand('find projects -name "*.md"', ctx()).lines.flat()
        expect(segs.length).toBeGreaterThan(5)
        expect(segs[0].run?.startsWith("cat ")).toBe(true)
        const dir = runCommand("find / -name projects", ctx()).lines.flat()[0]
        expect(dir.run).toBe("cd /home/hamzeh/projects")
    })
    it("reports no matches, bad paths, and refuses -delete / -exec", () => {
        expect(out(runCommand("find zzzqqq", ctx()))).toBe("no matches")
        expect(out(runCommand("find nope -name x", ctx()))).toContain("No such file")
        expect(out(runCommand("find . -delete", ctx()))).toContain("disabled")
        expect(out(runCommand("find . -exec rm {}", ctx()))).toContain("disabled")
    })
    it("caps the number of results", () => {
        const lines = runCommand("find /", ctx()).lines
        expect(lines.length).toBeLessThanOrEqual(51)
    })
})

describe("suggestions (ghost text + strip)", () => {
    const vals = (i: string, cwd = HOME) => suggestions(i, cwd).map((s) => s.value)
    const labels = (i: string, cwd = HOME) => suggestions(i, cwd).map((s) => s.label)

    it("suggests commands for the first word, in order", () => {
        expect(vals("neo")).toEqual(["neofetch "])
        expect(labels("c")).toContain("cat")
        expect(labels("c")).toContain("cd")
        expect(labels("fi")).toContain("find")
        expect(labels("for")).toEqual([])
    })
    it("suggests paths for path commands, with trailing / on directories", () => {
        expect(vals("cd pro")).toEqual(["cd projects/"])
        expect(vals("cat ab")).toEqual(["cat about.txt "])
        expect(vals("cd /et")).toEqual(["cd /etc/"])
        expect(labels("cd ")).toContain("projects/")
        expect(vals("cat projects/redes")).toEqual(["cat projects/redesigning-opportunity.md "])
        expect(vals("find pro")).toEqual(["find projects/"])
    })
    it("hides dotfiles unless the word starts with a dot", () => {
        expect(labels("cat ")).not.toContain(".plan")
        expect(labels("cat .")).toContain(".plan")
    })
    it("suggests subcommands for git, theme, help", () => {
        expect(vals("git l")).toEqual(["git log "])
        expect(vals("theme d")).toEqual(["theme dark "])
        expect(labels("help fi")).toContain("find")
    })
    it("stays quiet when there is nothing to add", () => {
        expect(suggestions("", HOME)).toEqual([])
        expect(suggestions("   ", HOME)).toEqual([])
        expect(suggestions(" ls", HOME)).toEqual([])
        expect(suggestions("ls", HOME)).toEqual([])
        expect(suggestions("cat about.txt", HOME)).toEqual([])
        expect(suggestions("cd zz", HOME)).toEqual([])
        expect(suggestions("rm ", HOME)).toEqual([])
        expect(suggestions("ls -", HOME)).toEqual([])
    })
    it("works from other directories", () => {
        expect(vals("cat redes", `${HOME}/projects`)).toEqual(["cat redesigning-opportunity.md "])
        expect(vals("cd ..", `${HOME}/projects`)).toEqual([])
    })
})
