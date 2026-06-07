import MdcatLogo from "@/components/mdcat-logo";
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
                <MdcatLogo size="md" priority />
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
