import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col relative overflow-hidden">
            {/* Background Orbs & Patterns */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-100/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-100/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 px-8 py-8">
                <Link href="/" className="inline-flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20 group-hover:scale-105 transition-transform">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-black text-gray-900 tracking-tight">
                        Mdcat<span className="text-primary-600">Xpert</span>
                    </span>
                </Link>
            </header>

            {/* Content */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-4 pb-20">
                {children}
            </main>

            {/* Footer */}
            <footer className="relative z-10 p-8 text-center border-t border-gray-100/50">
                <p className="text-xs text-gray-400 font-medium tracking-wider uppercase">
                    &copy; {new Date().getFullYear()} MdcatXpert. All rights reserved.
                </p>
            </footer>
        </div>
    );
}
