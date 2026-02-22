"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    LayoutDashboard,
    FileText,
    BarChart3,
    Upload,
    Users,
    Menu,
    X,
    Shield,
    ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import UserDropdown from "./user-dropdown";

const studentNav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/papers", label: "Papers", icon: FileText },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const adminNav = [
    { href: "/admin/papers", label: "Manage Papers", icon: FileText },
    { href: "/admin/upload", label: "Upload Paper", icon: Upload },
    { href: "/admin/students", label: "Students", icon: Users },
];

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userData, setUserData] = useState<{ name: string; email: string; role: string } | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from("users")
                    .select("name, role")
                    .eq("id", user.id)
                    .single();

                setUserData({
                    name: profile?.name || "Student",
                    email: user.email || "",
                    role: profile?.role || "student"
                });
            }
        };
        fetchUserData();
    }, []);

    const isAdmin = userData?.role === "admin";

    return (
        <div className="min-h-screen bg-[#FDFDFF]">
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
                className={`fixed top-0 left-0 h-full w-72 bg-white/70 backdrop-blur-2xl border-r border-gray-100 z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } lg:translate-x-0 flex flex-col shadow-xl shadow-gray-200/20`}
            >
                {/* Logo Section */}
                <div className="h-24 flex items-center justify-between px-8 border-b border-gray-50/50 shrink-0">
                    <Link href="/dashboard" className="flex items-center gap-3 active:scale-95 transition-transform">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-black text-gray-900 tracking-tight">
                            Mdcat<span className="text-primary-600">Xpert</span>
                        </span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
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
                                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
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
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`group flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${isActive
                                                ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-[1.02]"
                                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-900"}`} />
                                                {item.label}
                                            </div>
                                            {!isActive && <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </nav>

                {/* User Section Bottom */}
                <div className="shrink-0 p-6 border-t border-gray-50/50">
                    <div className="bg-gray-50/50 rounded-3xl p-2 border border-gray-100">
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
                <header className="sticky top-0 z-30 h-16 lg:h-24 bg-white/40 backdrop-blur-xl border-b border-gray-50/50 flex items-center justify-between px-6 lg:px-12 pointer-events-none">
                    <div className="flex items-center gap-4 pointer-events-auto">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2.5 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-xl shadow-sm transition-all"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Dynamic Breadcrumb/Context Placeholder */}
                    <div className="hidden lg:flex items-center gap-2 pointer-events-auto">
                        <span className="text-xs font-black text-gray-300 uppercase tracking-widest">Workspace</span>
                        <ChevronRight className="w-3 h-3 text-gray-300" />
                        <span className="text-xs font-black text-primary-600 uppercase tracking-widest">
                            {pathname === "/dashboard" ? "Overview" : pathname.split("/").pop()?.replace("-", " ")}
                        </span>
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
