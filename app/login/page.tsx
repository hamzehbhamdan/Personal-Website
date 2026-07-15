import { login } from "./actions";
import { GoogleButton } from "./GoogleButton";

const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };
const mono = { fontFamily: "var(--font-geist-mono), monospace" };

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string }>;
}) {
    const { message } = await searchParams;

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-[#f9f8f6] px-6 py-12">
            <div className="w-full max-w-[400px]">
                {/* Wordmark */}
                <div className="mb-8 flex justify-center">
                    <span className="font-mono text-[15px] font-medium tracking-[0.16em] text-stone-900" style={mono}>
                        HH<span className="text-[#A51C30]">.</span>
                    </span>
                </div>

                {/* Card */}
                <div className="rounded-[14px] border border-stone-200 bg-white px-8 py-9">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-stone-400" style={mono}>
                        Private Dashboard
                    </p>
                    <h1 className="text-[27px] font-medium leading-tight text-stone-900" style={serif}>
                        Welcome back.
                    </h1>
                    <p className="mt-1.5 text-[13px] text-stone-500">Sign in to your workspace.</p>

                    <div className="my-6 h-px bg-stone-200" />

                    <form action={login} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500" style={mono}>
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                className="rounded-[8px] border border-stone-200 bg-white px-3.5 py-2.5 text-[14px] text-stone-900 outline-none transition-colors placeholder:text-stone-300 focus:border-[#A51C30]"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="password" className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500" style={mono}>
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="rounded-[8px] border border-stone-200 bg-white px-3.5 py-2.5 text-[14px] text-stone-900 outline-none transition-colors focus:border-[#A51C30]"
                            />
                        </div>

                        {message && (
                            <p className="rounded-[8px] border border-[#A51C30]/20 bg-[#faf0f1] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#A51C30]">
                                {message}
                            </p>
                        )}

                        <button
                            type="submit"
                            style={mono}
                            className="mt-1 w-full rounded-[8px] bg-[#A51C30] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#8a1728]"
                        >
                            Sign in
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-3">
                        <span className="h-px flex-1 bg-stone-200" />
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-300" style={mono}>or</span>
                        <span className="h-px flex-1 bg-stone-200" />
                    </div>

                    <GoogleButton />
                </div>

                <p className="mt-6 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-stone-300" style={mono}>
                    hamzehhamdan.com
                </p>
            </div>
        </div>
    );
}
