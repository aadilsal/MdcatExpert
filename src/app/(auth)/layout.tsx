import MdcatLogo from "@/components/mdcat-logo";
import ThemeToggle from "@/components/landing/theme-toggle";
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-gray-900 dark:text-gray-100 flex flex-col relative overflow-hidden transition-colors duration-350">
            {/* Background Orbs & Patterns */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-100/30 dark:bg-primary-950/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-100/20 dark:bg-emerald-950/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.01] pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 px-8 py-8 flex items-center justify-between">
                <MdcatLogo size="md" priority />
                <ThemeToggle />
            </header>

            {/* Content */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-4 pb-20">
                {children}
            </main>

            {/* Footer */}
            <footer className="relative z-10 p-8 text-center border-t border-gray-100/50 dark:border-slate-800/40">
                <p className="text-xs text-gray-400 dark:text-slate-500 font-medium tracking-wider uppercase">
                    &copy; {new Date().getFullYear()} MdcatXpert. All rights reserved.
                </p>
            </footer>
        </div>
    );
}
