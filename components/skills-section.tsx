import { Code2, Brain, BarChart2, Cloud } from "lucide-react"
import { AnimatedSection } from "@/components/animated-section"

const skillGroups = [
    {
        label: "Languages",
        icon: Code2,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        skills: ["Python", "TypeScript", "JavaScript", "SQL", "R"],
    },
    {
        label: "AI & ML",
        icon: Brain,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        skills: ["LangChain", "OpenAI API", "PyTorch", "RAG", "LLM Agents", "TensorFlow"],
    },
    {
        label: "Data Science",
        icon: BarChart2,
        color: "text-green-500",
        bg: "bg-green-500/10",
        skills: ["Pandas", "NumPy", "Scikit-learn", "Jupyter", "Streamlit"],
    },
    {
        label: "Web & Cloud",
        icon: Cloud,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        skills: ["React", "Next.js", "Azure", "Supabase", "FastAPI", "Git"],
    },
]

export function SkillsSection() {
    return (
        <section className="w-full py-20 md:py-28 bg-background border-t dot-grid">
            <div className="container px-4 md:px-12 lg:px-24 mx-auto max-w-7xl space-y-12">
                <AnimatedSection>
                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/60">
                            Technical Stack
                        </p>
                        <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Skills</h2>
                    </div>
                </AnimatedSection>

                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {skillGroups.map((group, i) => (
                        <AnimatedSection key={group.label} delay={i * 0.08}>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${group.bg}`}>
                                        <group.icon className={`h-4 w-4 ${group.color}`} />
                                    </div>
                                    <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                        {group.label}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {group.skills.map((skill) => (
                                        <span
                                            key={skill}
                                            className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-background border border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors duration-200 cursor-default shadow-sm"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    )
}
