import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";

export default function InfoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <header className="border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:-translate-x-1 transition-all" />
                        <span className="text-sm font-semibold text-gray-500 group-hover:text-primary-600 transition-colors">Back to Home</span>
                    </Link>

                    <Link href="/" className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <span className="hidden sm:inline text-lg font-bold text-gray-900">
                            Mdcat<span className="text-primary-600">Xpert</span>
                        </span>
                    </Link>

                    <Link
                        href="/login"
                        className="px-4 py-1.5 text-xs font-black text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
                    >
                        Login
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 py-12 sm:py-20 lg:py-24 animate-fade-in">
                <div className="max-w-4xl mx-auto px-6">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-gray-50 border-t border-gray-100 py-12">
                <div className="max-w-6xl mx-auto px-6 text-center">
                    <p className="text-sm text-gray-400 font-medium">
                        © {new Date().getFullYear()} MdcatXpert. Empowering future medical professionals.
                    </p>
                </div>
            </footer>
        </div>
    );
}
