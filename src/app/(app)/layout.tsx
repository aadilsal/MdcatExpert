"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    FileText,
    BarChart3,
    Upload,
    Users,
    Menu,
    X,
    Shield,
    ChevronRight,
    Ticket,
    DollarSign,
    AlertTriangle,
    Newspaper,
    BookOpen,
    Layers,
} from "lucide-react";
import UserDropdown from "./user-dropdown";
import { fetchMeCached } from "@/lib/me-client-cache";
import AnalyticsTracker from "@/components/analytics-tracker";
import MdcatLogo from "@/components/mdcat-logo";
import ThemeToggle from "@/components/landing/theme-toggle";

const studentNav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/quizzes", label: "Quizzes", icon: FileText },
    { href: "/copilot", label: "Study Copilot", icon: BookOpen },
    { href: "/flashcards", label: "Flashcards", icon: Layers },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const adminNav = [
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/quizzes", label: "Manage Quizzes", icon: FileText },
    { href: "/admin/reports", label: "Question Reports", icon: AlertTriangle, badge: true },
    { href: "/admin/upload", label: "Upload Quiz", icon: Upload },
    { href: "/admin/study-library", label: "Study Library", icon: BookOpen },
    { href: "/admin/blog", label: "Blog", icon: Newspaper },
    { href: "/admin/students", label: "Students", icon: Users },
    { href: "/admin/payments", label: "Payments", icon: DollarSign },
    { href: "/admin/discounts", label: "Discount Codes", icon: Ticket },
];

const FRIENDLY_LABELS: Record<string, string> = {
    dashboard: "Overview",
    quizzes: "Quizzes",
    quiz: "Quiz Attempt",
    copilot: "Study Copilot",
    flashcards: "Flashcards",
    analytics: "Analytics",
    login: "Overview",
    upgrade: "Upgrade",
    admin: "Control Center",
    students: "Students",
    payments: "Payments",
    discounts: "Discount Codes",
    reports: "Question Reports",
    upload: "Upload Quiz",
    "study-library": "Study Library",
    blog: "Blog",
};

// Convex document IDs are long, mostly-lowercase base32-ish strings (25+ chars,
// no spaces) — that's distinct enough from any real route segment to detect
// and avoid ever showing a raw database ID in the breadcrumb.
function looksLikeDatabaseId(segment: string) {
    return segment.length >= 20 && /^[a-z0-9]+$/i.test(segment);
}

function getBreadcrumbLabel(pathname: string) {
    const segments = pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (!last) return "Overview";

    if (looksLikeDatabaseId(last)) {
        // Prefer the parent segment's friendly label (e.g. /quiz/<id> -> "Quiz Attempt").
        const parent = segments[segments.length - 2];
        return FRIENDLY_LABELS[parent] || FRIENDLY_LABELS[last] || "Details";
    }

    return FRIENDLY_LABELS[last] || last.replace(/-/g, " ");
}

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userData, setUserData] = useState<{ name: string; email: string; role: string; emailVerificationTime?: number | null } | null>(null);
    const [openReportCount, setOpenReportCount] = useState(0);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const row = await fetchMeCached();
                if (!row) {
                    return;
                }
                if (!row.emailVerificationTime) {
                    router.replace("/verify");
                    return;
                }
                setUserData(row);
                if (row.role === "admin") {
                    const res = await fetch("/api/admin/reports?status=open", { cache: "no-store" });
                    if (res.ok) {
                        const json = await res.json();
                        setOpenReportCount(json.openCount ?? 0);
                    }
                }
            } catch (error) {
                console.error("Failed to load user profile", error);
            }
        };
        fetchUserData();
    }, []);

    const isAdmin = userData?.role === "admin";

    return (
        <div className="min-h-screen bg-[#FDFDFF] dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors duration-350">
            <AnalyticsTracker />
            {/* Mobile overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-72 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-r border-surface-border dark:border-slate-800/60 z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } lg:translate-x-0 flex flex-col shadow-xl shadow-gray-200/20 dark:shadow-none`}
            >
                {/* Logo Section */}
                <div className="h-24 flex items-center justify-between px-8 border-b border-gray-50 dark:border-slate-800 dark:border-slate-800/50 dark:border-slate-800/40 shrink-0">
                    <MdcatLogo href="/dashboard" size="sm" />
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 text-gray-400 hover:text-gray-900 dark:text-gray-100 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Scrollable Area */}
                <nav className="flex-1 overflow-y-auto p-6 space-y-10 scrollbar-none">
                    {/* Preparation Section */}
                    <div className="space-y-2">
                        <p className="px-4 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">
                            Preparation
                        </p>
                        <div className="space-y-1.5">
                            {studentNav.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`group flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${isActive
                                            ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 scale-[1.02]"
                                            : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-white"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-white" : "text-gray-400 group-hover:text-primary-600"}`} />
                                            {item.label}
                                        </div>
                                        {isActive && <motion.div layoutId="nav-glow" className="w-1 h-4 bg-white/40 rounded-full" />}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Admin Section */}
                    {isAdmin && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 px-4 mb-3">
                                <Shield className="w-3.5 h-3.5 text-primary-600" />
                                <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] leading-none">
                                    Control Center
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                {adminNav.map((item) => {
                                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                    const showBadge =
                                        "badge" in item &&
                                        item.badge &&
                                        openReportCount > 0;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`group flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${isActive
                                                ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 scale-[1.02]"
                                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-white"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-900 dark:text-gray-100"}`} />
                                                {item.label}
                                                {showBadge && (
                                                    <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-black">
                                                        {openReportCount > 99 ? "99+" : openReportCount}
                                                    </span>
                                                )}
                                            </div>
                                            {!isActive && <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </nav>

                <div className="shrink-0 p-6 border-t border-gray-50 dark:border-slate-800 dark:border-slate-800/50 dark:border-slate-800/40">
                    <div className="bg-gray-50/50 dark:bg-slate-900/45 rounded-3xl p-2 border border-surface-border dark:border-slate-800">
                        {userData ? (
                            <UserDropdown user={userData} />
                        ) : (
                            <div className="animate-pulse flex items-center gap-3 p-3">
                                <div className="w-12 h-12 bg-gray-200 rounded-2xl" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded-full w-24" />
                                    <div className="h-3 bg-gray-100 rounded-full w-16" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="lg:pl-72 transition-all duration-300">
                {/* Header (Mobile & Context) */}
                <header className="sticky top-0 z-30 h-16 lg:h-24 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl border-b border-gray-50 dark:border-slate-800 dark:border-slate-800/50 dark:border-slate-800/40 flex items-center justify-between px-6 lg:px-12">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2.5 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-100 hover:bg-surface dark:hover:bg-slate-800 rounded-xl shadow-xs transition-all pointer-events-auto"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        
                        {/* Dynamic Breadcrumb/Context Placeholder */}
                        <div className="hidden lg:flex items-center gap-2">
                            <span className="text-xs font-black text-gray-300 dark:text-slate-600 uppercase tracking-widest">Workspace</span>
                            <ChevronRight className="w-3 h-3 text-gray-300 dark:text-slate-500" />
                            <span className="text-xs font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">
                                {getBreadcrumbLabel(pathname)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                    </div>
                </header>

                {/* Page Content Rendering */}
                <main className="min-h-[calc(100vh-6rem)]">
                    <div className="max-w-7xl mx-auto p-4 sm:p-8 lg:p-12 animate-fade-in group-data-[quiz-mode=true]:p-0">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
