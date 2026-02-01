import { login } from "./actions";
import { Zap, Lock, Mail, ArrowRight } from "lucide-react";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string; error?: string }>;
}) {
    const params = await searchParams;

    return (
        <div className="h-screen w-full bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-sm relative z-10">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-2xl">
                        <Zap size={24} className="text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tighter mb-2">NEURAL ACCESS</h1>
                    <p className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">Restricted Entry // Admin Only</p>
                </div>

                <form className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Identity</label>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-indigo-500/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-indigo-500/50 transition-colors">
                                <div className="pl-4 text-white/30"><Mail size={16} /></div>
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="access@neural.link"
                                    required
                                    className="w-full bg-transparent border-none p-4 text-xs font-bold focus:outline-none placeholder:text-white/10 autofill:bg-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Key</label>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-indigo-500/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-indigo-500/50 transition-colors">
                                <div className="pl-4 text-white/30"><Lock size={16} /></div>
                                <input
                                    name="password"
                                    type="password"
                                    placeholder="••••••••••••"
                                    required
                                    className="w-full bg-transparent border-none p-4 text-xs font-bold focus:outline-none placeholder:text-white/10"
                                />
                            </div>
                        </div>
                    </div>

                    {(params.message || params.error) && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-xs font-bold text-center">
                            {params.message || params.error}
                        </div>
                    )}

                    <button
                        formAction={login}
                        className="w-full p-4 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2 mt-4"
                    >
                        Initialize Session <ArrowRight size={14} />
                    </button>
                </form>

                <p className="text-[9px] text-center text-white/20 mt-8 uppercase tracking-widest font-bold">
                    Secure Connection • Encrypted v4.2
                </p>
            </div>
        </div>
    );
}
