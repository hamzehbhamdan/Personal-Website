
import { login } from "./actions";
import { GoogleButton } from "./GoogleButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>;
}) {
    const { message } = await searchParams;

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
            <Card className="w-full max-w-sm shadow-lg border-opacity-50">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
                    <CardDescription className="text-center">
                        Enter your email to sign in to your account
                    </CardDescription>
                </CardHeader>
                <form action={login}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                className="bg-background/50"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="bg-background/50"
                            />
                        </div>
                        {message && (
                            <div className="text-sm text-red-500 text-center font-medium bg-red-50 p-2 rounded-md dark:bg-red-900/30">
                                {message}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full font-semibold" type="submit">Sign in</Button>
                    </CardFooter>
                </form>
                <CardFooter className="flex-col gap-4 pt-0">
                    <div className="flex w-full items-center gap-3">
                        <span className="h-px flex-1 bg-border" />
                        <span className="text-xs uppercase text-muted-foreground">or</span>
                        <span className="h-px flex-1 bg-border" />
                    </div>
                    <GoogleButton />
                </CardFooter>
            </Card>
        </div>
    );
}
