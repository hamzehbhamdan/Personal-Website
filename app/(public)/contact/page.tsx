
"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Mail, Linkedin, Github, FileText, MapPin, Send, CheckCircle2, Loader2, Copy, Check } from "lucide-react";
import { personalInfo } from "@/lib/data";

type FormState = "idle" | "submitting" | "success" | "error"

const serif = { fontFamily: "var(--font-playfair), Georgia, 'Times New Roman', serif" };

export default function ContactPage() {
    const [form, setForm] = React.useState({ name: "", email: "", subject: "", message: "", botField: "" })
    const [errors, setErrors] = React.useState<Partial<typeof form>>({})
    const [status, setStatus] = React.useState<FormState>("idle")
    const [copied, setCopied] = React.useState(false)

    const copyEmail = () => {
        navigator.clipboard.writeText(personalInfo.email).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    const validate = () => {
        const next: Partial<typeof form> = {}
        if (!form.name.trim()) next.name = "Name is required."
        if (!form.email.trim()) next.email = "Email is required."
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email."
        if (!form.message.trim()) next.message = "Message is required."
        return next
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
        if (errors[e.target.name as keyof typeof errors]) {
            setErrors((prev) => ({ ...prev, [e.target.name]: undefined }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length > 0) { setErrors(errs); return }
        setStatus("submitting")
        try {
            const res = await fetch("/netlify-forms.html", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    "form-name": "contact",
                    "bot-field": form.botField ?? "",
                    name: form.name,
                    email: form.email,
                    subject: form.subject,
                    message: form.message,
                }).toString(),
            })
            if (!res.ok) throw new Error(`Form POST failed: ${res.status}`)
            setStatus("success")
            setForm({ name: "", email: "", subject: "", message: "", botField: "" })
        } catch {
            setStatus("error")
        }
    }

    const inputBase =
        "w-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 outline-none focus:border-stone-500 transition-colors"

    return (
        <main className="flex flex-col min-h-screen bg-[#f9f8f6]">
            {/* Noise texture */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "repeat",
                    backgroundSize: "300px 300px",
                    opacity: 0.028,
                }}
            />

            {/* Header */}
            <section className="relative z-10 w-full pt-16 pb-12 md:pb-16 bg-[#f9f8f6]">
                <div className="mx-auto max-w-5xl px-6 space-y-6">
                    <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-mono text-[10px] uppercase tracking-[0.28em] text-stone-400"
                    >
                        Contact
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                        className="text-4xl sm:text-5xl md:text-6xl text-stone-900 leading-tight"
                        style={serif}
                    >
                        Let&apos;s Connect
                    </motion.h1>
                </div>
            </section>

            {/* Divider */}
            <div className="relative z-10 mx-auto w-full max-w-5xl px-6">
                <div className="h-px bg-stone-200" />
            </div>

            {/* Main content */}
            <section className="relative z-10 w-full py-10 md:py-16">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="grid md:grid-cols-[1fr_440px] gap-12 md:gap-16">

                        {/* Left: contact info */}
                        <div className="space-y-10">
                            <motion.p
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-stone-500 text-lg leading-relaxed max-w-md"
                            >
                                I&apos;m always open to discussing new opportunities, collaborations,
                                and innovative projects in AI and financial technology.
                            </motion.p>

                            <div className="space-y-0 divide-y divide-stone-100">
                                {[
                                    { icon: Mail, label: "Email", value: personalInfo.email, link: `mailto:${personalInfo.email}` },
                                    { icon: Linkedin, label: "LinkedIn", value: "Hamzeh Hamdan", link: personalInfo.linkedin },
                                    { icon: Github, label: "GitHub", value: "hamzehbhamdan", link: personalInfo.github },
                                    { icon: MapPin, label: "Location", value: personalInfo.location, link: null },
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.12 + i * 0.06 }}
                                        className="flex items-center gap-4 py-4"
                                    >
                                        <div className="w-8 h-8 border border-stone-200 bg-white flex items-center justify-center shrink-0">
                                            <item.icon className="h-3.5 w-3.5 text-stone-400" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-300 mb-0.5">
                                                {item.label}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                {item.link ? (
                                                    <a
                                                        href={item.link}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[13px] text-stone-700 hover:text-[#A51C30] transition-colors block truncate"
                                                    >
                                                        {item.value}
                                                    </a>
                                                ) : (
                                                    <p className="text-[13px] text-stone-700">{item.value}</p>
                                                )}
                                                {item.label === "Email" && (
                                                    <button
                                                        onClick={copyEmail}
                                                        title={copied ? "Copied!" : "Copy email"}
                                                        className="shrink-0 text-stone-300 hover:text-stone-600 transition-colors"
                                                    >
                                                        {copied
                                                            ? <Check className="h-3.5 w-3.5 text-[#A51C30]" />
                                                            : <Copy className="h-3.5 w-3.5" />
                                                        }
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Availability badge */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex items-start gap-3 border border-stone-200 bg-white p-4"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0 animate-pulse" />
                                <p className="text-[13px] text-stone-500 leading-relaxed">
                                    Currently focusing on AI infrastructure at Cresset Capital,
                                    but open to consulting and collaborations.
                                </p>
                            </motion.div>
                        </div>

                        {/* Right: form */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                            className="border border-stone-200 bg-white"
                        >
                            {status === "success" ? (
                                <div className="flex flex-col items-center justify-center gap-6 p-12 text-center min-h-[420px]">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    >
                                        <CheckCircle2 className="h-12 w-12 text-[#A51C30]" />
                                    </motion.div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl text-stone-900" style={serif}>
                                            Message Sent!
                                        </h3>
                                        <p className="text-[13px] text-stone-500 leading-relaxed">
                                            Thanks for reaching out — I&apos;ll get back to you as
                                            soon as possible.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setStatus("idle")}
                                        className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-700 border border-stone-200 px-4 py-2 transition-colors"
                                    >
                                        Send Another
                                    </button>
                                </div>
                            ) : (
                                <div className="p-8 space-y-6">
                                    <div>
                                        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400">
                                            Send a Message
                                        </p>
                                        <p className="text-[13px] text-stone-400 mt-1">
                                            Fill in the form and your email client will open pre-filled.
                                        </p>
                                    </div>

                                    <div className="h-px bg-stone-100" />

                                    <form
                                        onSubmit={handleSubmit}
                                        noValidate
                                        name="contact"
                                        data-netlify="true"
                                        data-netlify-honeypot="bot-field"
                                        className="space-y-5"
                                    >
                                        {/* Honeypot — hidden from real users */}
                                        <input type="hidden" name="form-name" value="contact" />
                                        <p hidden>
                                            <label>
                                                Don&apos;t fill this out:{" "}
                                                <input
                                                    name="bot-field"
                                                    value={form.botField}
                                                    onChange={handleChange}
                                                />
                                            </label>
                                        </p>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label
                                                    htmlFor="name"
                                                    className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400"
                                                >
                                                    Name <span className="text-red-400">*</span>
                                                </label>
                                                <input
                                                    id="name"
                                                    name="name"
                                                    type="text"
                                                    placeholder="Jane Smith"
                                                    value={form.name}
                                                    onChange={handleChange}
                                                    className={`${inputBase} ${errors.name ? "border-red-300" : ""}`}
                                                />
                                                {errors.name && (
                                                    <p className="text-[11px] text-red-400">{errors.name}</p>
                                                )}
                                            </div>
                                            <div className="space-y-1.5">
                                                <label
                                                    htmlFor="email"
                                                    className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400"
                                                >
                                                    Email <span className="text-red-400">*</span>
                                                </label>
                                                <input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    placeholder="jane@company.com"
                                                    value={form.email}
                                                    onChange={handleChange}
                                                    className={`${inputBase} ${errors.email ? "border-red-300" : ""}`}
                                                />
                                                {errors.email && (
                                                    <p className="text-[11px] text-red-400">{errors.email}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="subject"
                                                className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400"
                                            >
                                                Subject
                                            </label>
                                            <input
                                                id="subject"
                                                name="subject"
                                                type="text"
                                                placeholder="Collaboration opportunity"
                                                value={form.subject}
                                                onChange={handleChange}
                                                className={inputBase}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="message"
                                                className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400"
                                            >
                                                Message <span className="text-red-400">*</span>
                                            </label>
                                            <textarea
                                                id="message"
                                                name="message"
                                                rows={5}
                                                placeholder="Hi Hamzeh, I'd love to discuss..."
                                                value={form.message}
                                                onChange={handleChange}
                                                className={`${inputBase} resize-none ${errors.message ? "border-red-300" : ""}`}
                                            />
                                            {errors.message && (
                                                <p className="text-[11px] text-red-400">{errors.message}</p>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={status === "submitting"}
                                            className="w-full bg-stone-900 text-white text-sm font-medium py-3 hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {status === "submitting" ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    Send Message{" "}
                                                    <Send className="h-4 w-4" />
                                                </>
                                            )}
                                        </button>

                                        {status === "error" && (
                                            <p className="text-[12px] text-red-400 text-center">
                                                Something went wrong — please try again or email me directly.
                                            </p>
                                        )}

                                        <div className="pt-2 border-t border-stone-100">
                                            <a
                                                href={personalInfo.resume}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-2 text-[13px] text-stone-400 hover:text-stone-700 transition-colors"
                                            >
                                                <FileText className="h-4 w-4" /> View Resume
                                            </a>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </section>
        </main>
    )
}
