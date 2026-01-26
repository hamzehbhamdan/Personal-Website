
import { Mail, Phone, Linkedin, Github, FileText, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { personalInfo } from "@/lib/data";

export default function ContactPage() {
    return (
        <main className="container mx-auto px-4 py-8 sm:px-8 space-y-12">
            <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight">Contact</h1>
                <p className="text-xl text-muted-foreground max-w-2xl">
                    Let's build something together. I'm always open to discussing new opportunities, collaborations, and innovative projects in AI and financial technology.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                        <CardDescription>Feel free to reach out through any of these channels.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <a href={`mailto:${personalInfo.email}`} className="text-sm font-medium hover:underline">
                                {personalInfo.email}
                            </a>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">
                                {personalInfo.phone}
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Linkedin className="h-5 w-5 text-muted-foreground" />
                            <a href={personalInfo.linkedin} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline">
                                LinkedIn Profile
                            </a>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Github className="h-5 w-5 text-muted-foreground" />
                            <a href={personalInfo.github} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline">
                                GitHub Profile
                            </a>
                        </div>
                        <div className="flex items-center space-x-4">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">
                                {personalInfo.location}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Resources</CardTitle>
                        <CardDescription>Download my resume or view other documents.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button className="w-full justify-start" size="lg" asChild>
                            <a href={personalInfo.resume} target="_blank" rel="noreferrer">
                                <FileText className="mr-2 h-5 w-5" /> Download Resume
                            </a>
                        </Button>
                        <div className="pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-2">Availability</h4>
                            <p className="text-sm text-muted-foreground">
                                I'm currently focused on building AI solutions at Cresset Capital, but I'm always interested in discussing consulting opportunities, collaborations, and innovative projects in AI and financial technology.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
