
import Image from "next/image";
import Link from "next/link";
import {
    GraduationCap,
    Briefcase,
    Award,
    BookOpen,
    Users,
    Trophy,
    MapPin,
    Mail,
    Phone,
    Linkedin,
    Github,
    FileText,
    Sparkles,
    Target,
    Heart
} from "lucide-react";

import { personalInfo, education, experience, harvardActivities } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function AboutPage() {
    return (
        <main className="flex flex-col min-h-screen">
            {/* Hero Section with Split Layout */}
            <section className="relative py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-background">
                <div className="container px-4 md:px-6 mx-auto">
                    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
                        {/* Left: Text Content */}
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                <Sparkles className="h-4 w-4" />
                                About Me
                            </div>
                            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight whitespace-nowrap">
                                Solving Problems with <span className="text-primary">AI</span>
                            </h1>
                            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                                {personalInfo.fullBio}
                            </p>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="text-center p-4 rounded-lg bg-muted/50">
                                    <div className="text-2xl font-bold text-primary">2025</div>
                                    <div className="text-xs text-muted-foreground">Harvard Grad</div>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-muted/50">
                                    <div className="text-2xl font-bold text-primary">10+</div>
                                    <div className="text-xs text-muted-foreground">Projects</div>
                                </div>
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex flex-wrap gap-3 pt-2">
                                <Button asChild size="lg">
                                    <Link href="/contact">
                                        <Mail className="mr-2 h-4 w-4" />
                                        Get in Touch
                                    </Link>
                                </Button>
                                <Button variant="outline" size="lg" asChild>
                                    <a href={personalInfo.resume} target="_blank" rel="noreferrer">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Download Resume
                                    </a>
                                </Button>
                            </div>
                        </div>

                        {/* Right: Portrait with Decorative Elements */}
                        <div className="relative">
                            <div className="relative max-w-2xl mx-auto">
                                {/* Decorative background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl transform rotate-3"></div>
                                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl shadow-2xl">
                                    <Image
                                        src="/portrait.png"
                                        alt="Hamzeh Hamdan"
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* My Journey Section */}
            <section className="py-16 md:py-24 bg-muted/30">
                <div className="container px-4 md:px-6 mx-auto max-w-6xl">
                    <div className="text-left mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">My Journey</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl">
                            From Harvard classrooms to building AI solutions in finance
                        </p>
                    </div>

                    <div className="space-y-8">
                        {/* Journey Card 1: Passion Origin */}
                        <Card className="border-l-4 border-l-primary">
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Target className="h-5 w-5 text-primary" />
                                    </div>
                                    <CardTitle>Where It All Began</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="text-muted-foreground leading-relaxed">
                                <p>
                                    My passion for AI ignited during my first semester at Harvard, when I gained early access to ChatGPT a year before its public release.
                                    This experience transformed my academic path—I redirected my fascination for mathematics into statistics, where I studied the mathematical
                                    models behind artificial intelligence, while pursuing computer science to master the practical implementation. This dual foundation led me
                                    to explore everything from cross-market economic spillovers in my senior thesis to building AI agents for campus data.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Journey Card 2: What Drives Me */}
                        <Card className="border-l-4 border-l-primary">
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Sparkles className="h-5 w-5 text-primary" />
                                    </div>
                                    <CardTitle>What Drives Me</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="text-muted-foreground leading-relaxed">
                                <p>
                                    What drives me is the intersection of <strong className="text-foreground">advanced technology and real-world impact</strong>.
                                    Whether it's developing generative AI tools that increase efficiency by 93% at Comcast, building portfolio optimization
                                    algorithms using quantum computing principles at MIT's iQuHACK, or creating AI-driven solutions for financial services at
                                    Cresset Capital, I'm passionate about bridging the gap between cutting-edge research and practical application.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Journey Card 3: Teaching & Mentorship */}
                        <Card className="border-l-4 border-l-primary">
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Heart className="h-5 w-5 text-primary" />
                                    </div>
                                    <CardTitle>Teaching & Mentorship</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="text-muted-foreground leading-relaxed">
                                <p>
                                    Beyond the technical work, I'm passionate about <strong className="text-foreground">teaching and mentorship</strong>.
                                    I currently mentor middle and high school students interested in coding and AI, and have taught workshops internationally—from
                                    AI courses at Harvard Summer Camp to public speaking workshops in Dubai, Abu Dhabi, Istanbul, and Izmir. I believe sharing knowledge
                                    is just as important as building innovative solutions. If you're looking for mentorship, I'd love to hear from you.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Journey Card 4: Looking Forward */}
                        <Card className="border-l-4 border-l-primary">
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Briefcase className="h-5 w-5 text-primary" />
                                    </div>
                                    <CardTitle>Looking Forward</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="text-muted-foreground leading-relaxed">
                                <p>
                                    Today, I'm focused on leveraging AI to solve complex challenges in financial technology, but I'm always excited to
                                    explore new opportunities where data science, machine learning, and strategic thinking can create meaningful change.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Education Section */}
            <section className="py-16 md:py-24">
                <div className="container px-4 md:px-6 mx-auto max-w-6xl">
                    <div className="text-left mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Education</h2>
                        <p className="text-lg text-muted-foreground">
                            Academic foundation in Computer Science and Statistics
                        </p>
                    </div>

                    <Card className="mb-8">
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-lg bg-primary/10">
                                        <GraduationCap className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl">{education.institution}</CardTitle>
                                        <CardDescription className="text-base mt-1">{education.degree}</CardDescription>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="w-fit">{education.date}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-primary" />
                                        Computer Science
                                    </h4>
                                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                                        {education.courses.cs.map((course, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-primary mt-1">•</span>
                                                <span>{course.split('(')[0].trim()}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-primary" />
                                        Statistics
                                    </h4>
                                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                                        {education.courses.stats.map((course, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-primary mt-1">•</span>
                                                <span>{course.split('(')[0].trim()}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-primary" />
                                        Mathematics
                                    </h4>
                                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                                        {education.courses.math.map((course, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-primary mt-1">•</span>
                                                <span>{course.split('(')[0].trim()}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Senior Thesis */}
                    <Card className="border-primary/20">
                        <CardHeader>
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-primary/10">
                                    <Award className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <Badge variant="outline" className="mb-2">Senior Thesis</Badge>
                                    <CardTitle className="text-xl leading-snug">{education.thesis.title}</CardTitle>
                                    <CardDescription className="mt-3 text-base leading-relaxed">
                                        {education.thesis.description}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" asChild>
                                <a href={education.thesis.link} target="_blank" rel="noreferrer">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Read Full Thesis
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* College Activities */}
            <section className="py-16 md:py-24 bg-muted/30">
                <div className="container px-4 md:px-6 mx-auto max-w-6xl">
                    <div className="text-left mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">College Activities</h2>
                        <p className="text-lg text-muted-foreground">
                            Extracurricular achievements and community impact
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {harvardActivities.filter(a => !a.title.includes("Senior Thesis") && !a.title.includes("iQuHACK")).map((activity, i) => (
                            <Card key={i} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg leading-tight">{activity.title}</CardTitle>
                                            <Badge variant="secondary" className="mt-2">{activity.role}</Badge>
                                        </div>
                                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                            {activity.role.includes("Board") ? <Users className="h-5 w-5 text-primary" /> :
                                                activity.role.includes("Award") || activity.role.includes("Winner") ? <Trophy className="h-5 w-5 text-primary" /> :
                                                    activity.role.includes("Instructor") ? <GraduationCap className="h-5 w-5 text-primary" /> :
                                                        <Award className="h-5 w-5 text-primary" />}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        {activity.details.map((detail, j) => (
                                            <li key={j} className="flex items-start gap-2">
                                                <span className="text-primary mt-1 shrink-0">•</span>
                                                <span>{detail}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact CTA */}
            <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-background">
                <div className="container px-4 md:px-6 mx-auto max-w-3xl text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Let's Work Together</h2>
                    <p className="text-lg text-muted-foreground mb-8">
                        I'm always open to discussing new opportunities, collaborations, and innovative projects in AI and financial technology.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button size="lg" asChild>
                            <Link href="/contact">
                                <Mail className="mr-2 h-4 w-4" />
                                Contact Me
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild>
                            <Link href="/projects">
                                <Briefcase className="mr-2 h-4 w-4" />
                                View My Work
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </main>
    );
}
