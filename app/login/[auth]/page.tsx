"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Scissors, 
  Layers, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const params = useParams<{ auth: string }>();
  const router = useRouter();

  // Normalize current mode ("signin" or "signup")
  const isSignUp = params?.auth === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Google 1-Click Sign In
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMessage(null);
      await signIn("google", { callbackUrl: "/" });
    } catch (err: any) {
      setErrorMessage("Failed to initialize Google Sign-In. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  // Credentials Submission (Sign In or Sign Up)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Register new account
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          const msg = data?.message || data?.error || "Registration failed. Account may already exist.";
          setErrorMessage(typeof msg === "string" ? msg : "User already exists.");
          setIsLoading(false);
          return;
        }

        setSuccessMessage("Account created successfully! Logging you in...");
        toast.success("Account created successfully!");

        // Auto-login newly registered user
        const loginResult = await signIn("credentials", {
          redirect: false,
          email: email.trim().toLowerCase(),
          password,
        });

        if (loginResult && !loginResult.error) {
          router.push("/");
          router.refresh();
        } else {
          router.push("/login/signin");
        }
      } else {
        // Sign In existing account
        const result = await signIn("credentials", {
          redirect: false,
          email: email.trim().toLowerCase(),
          password,
        });

        if (result?.error) {
          setErrorMessage("Invalid email or password. Please try again.");
          setIsLoading(false);
          return;
        }

        toast.success("Signed in successfully!");
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#040812] text-white relative flex flex-col justify-between overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[28rem] h-[28rem] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex items-center justify-between z-10">
        <Link 
          href="/" 
          className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors group"
        >
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-cyan-500/40 transition-all">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <span>Back to Studio</span>
        </Link>

        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 overflow-hidden rounded-xl bg-cyan-500/20 p-1 ring-1 ring-cyan-500/40">
            <Image
              src="/favicorn/android-chrome-192x192.png"
              alt="PolishAI Logo"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
            PolishAI
          </span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 z-10">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-white/10 bg-[#070D18]/90 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden">
          
          {/* Left Column: Interactive Auth Form (7 cols on lg) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            
            {/* Form Header */}
            <div className="mb-6">
              {/* Tab Switcher */}
              <div className="inline-flex p-1 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <Link
                  href="/login/signin"
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    !isSignUp
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  href="/login/signup"
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isSignUp
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sign Up
                </Link>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {isSignUp
                  ? "Join PolishAI for 100% free, unlimited client-side neural AI studio tools."
                  : "Sign in to access your projects, saved presets, and cloud sync."}
              </p>
            </div>

            {/* Google 1-Click Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 text-white text-sm font-semibold flex items-center justify-center gap-3 transition-all duration-200 active:scale-98 disabled:opacity-60 shadow-lg group"
            >
              {isGoogleLoading ? (
                <Loader2 size={18} className="animate-spin text-cyan-400" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="w-full border-t border-white/10" />
              <span className="absolute bg-[#070D18] px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                or with email
              </span>
            </div>

            {/* Form Alert Banners */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-300 animate-in fade-in">
                <AlertCircle size={15} className="shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300 animate-in fade-in">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 focus:border-cyan-400 focus:bg-[#0c1424] focus:ring-2 focus:ring-cyan-500/20 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  {!isSignUp && (
                    <span className="text-[11px] text-cyan-400 hover:underline cursor-pointer">
                      Forgot?
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 focus:border-cyan-400 focus:bg-[#0c1424] focus:ring-2 focus:ring-cyan-500/20 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-white p-1"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="mt-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 size={16} className="animate-spin text-white" />}
                <span>
                  {isLoading
                    ? isSignUp ? "Creating account..." : "Signing in..."
                    : isSignUp ? "Create Free Account" : "Sign In to PolishAI"}
                </span>
              </button>
            </form>

            {/* Bottom Switch Link */}
            <p className="mt-6 text-center text-xs text-slate-400">
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <Link href="/login/signin" className="font-semibold text-cyan-400 hover:underline">
                    Sign In
                  </Link>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <Link href="/login/signup" className="font-semibold text-cyan-400 hover:underline">
                    Sign Up for Free
                  </Link>
                </>
              )}
            </p>
          </div>

          {/* Right Column: Visual Features Showcase (5 cols on lg, hidden on mobile) */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#0c1628] to-[#080d17] border-l border-white/10 p-8 flex-col justify-between relative overflow-hidden">
            {/* Background Accent Gradients */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Showcase Badge */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold mb-4">
                <Sparkles size={12} />
                <span>Next-Gen Visual AI</span>
              </div>
              <h3 className="text-xl font-extrabold text-white leading-snug mb-2">
                All-in-One Studio.<br />
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Zero Cloud Uploads.
                </span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Experience ultra-fast background removal, multi-layer canvas editing, and GIF animation running 100% privately in your browser.
              </p>
            </div>

            {/* Feature List */}
            <div className="relative z-10 flex flex-col gap-3.5 my-6">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                  <Scissors size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Neural RMBG-1.4 AI</h4>
                  <p className="text-[11px] text-slate-400">Hair, fur, and intricate edges isolated with sub-pixel precision.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">100% Private &amp; Offline</h4>
                  <p className="text-[11px] text-slate-400">Photos never touch any server or cloud database. Your data is yours.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Zap size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">100% Free &amp; Unlimited</h4>
                  <p className="text-[11px] text-slate-400">No credit limits or paywalls. Unlimited background cutouts and exports.</p>
                </div>
              </div>
            </div>

            {/* Trust Quote / Stats */}
            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>WebGPU &amp; WASM Accelerated</span>
              </div>
              <span className="font-semibold text-slate-300">v2.4 Pro Studio</span>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 py-4 text-center text-[11px] text-slate-500 z-10">
        By continuing, you agree to PolishAI&apos;s{" "}
        <Link href="/terms" className="text-slate-400 hover:text-white underline underline-offset-2">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-slate-400 hover:text-white underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </footer>
    </div>
  );
}