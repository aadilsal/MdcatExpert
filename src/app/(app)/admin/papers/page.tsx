import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
    Upload,
    FileText,
    Calendar,
    Hash,
    Clock,
    Trash2,
    Eye,
    BarChart3,
    TrendingUp,
    Users,
} from "lucide-react";
import { DeletePaperButton } from "./delete-button";


export const dynamic = "force-dynamic";

export default async function AdminPapersPage() {
    const supabase = await createClient();

    const { data: papers, error } = await supabase
        .from("papers")
        .select("*")
        .order("created_at", { ascending: false });

    // Get some stats
    const { count: totalQuestions } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true });

    const { count: totalStudents } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "student");

    const { count: totalAttempts } = await supabase
        .from("attempts")
        .select("*", { count: "exact", head: true });

    const papersList = papers || [];

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header with gradient */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900 p-8 text-white shadow-lg">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
                        <p className="mt-2 text-gray-300 max-w-lg">
                            Manage papers, track student performance, and keep your MDCAT
                            content up to date.
                        </p>
                    </div>
                    <Link
                        href="/admin/upload"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-sm text-sm shrink-0"
                    >
                        <Upload className="w-4 h-4" />
                        Upload Paper
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: "Total Papers",
                        value: papersList.length.toString(),
                        icon: FileText,
                        bgLight: "bg-blue-50",
                        textColor: "text-blue-700",
                    },
                    {
                        label: "Total Questions",
                        value: (totalQuestions || 0).toString(),
                        icon: BarChart3,
                        bgLight: "bg-purple-50",
                        textColor: "text-purple-700",
                    },
                    {
                        label: "Students",
                        value: (totalStudents || 0).toString(),
                        icon: Users,
                        bgLight: "bg-emerald-50",
                        textColor: "text-emerald-700",
                    },
                    {
                        label: "Total Attempts",
                        value: (totalAttempts || 0).toString(),
                        icon: TrendingUp,
                        bgLight: "bg-orange-50",
                        textColor: "text-orange-700",
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white rounded-xl border border-gray-100 p-5 shadow-card hover:shadow-card-hover transition-all duration-300 group"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    {stat.label}
                                </p>
                                <p className={`text-3xl font-bold mt-1 ${stat.textColor}`}>
                                    {stat.value}
                                </p>
                            </div>
                            <div
                                className={`w-11 h-11 rounded-xl ${stat.bgLight} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                            >
                                <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Papers List */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Uploaded Papers
                </h2>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4">
                        Failed to load papers: {error.message}
                    </div>
                )}

                {papersList.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
                        <div className="p-14 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">
                                No papers uploaded yet
                            </h3>
                            <p className="text-sm text-gray-500 mb-5">
                                Upload your first MDCAT paper to get started.
                            </p>
                            <Link
                                href="/admin/upload"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm text-sm"
                            >
                                <Upload className="w-4 h-4" />
                                Upload Paper
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {papersList.map((paper) => (
                            <div
                                key={paper.id}
                                className="bg-white rounded-xl border border-gray-100 p-5 shadow-card hover:shadow-card-hover transition-all duration-300 group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <FileText className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <span className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-semibold">
                                        {paper.year}
                                    </span>
                                </div>

                                <h3 className="font-semibold text-gray-900 mb-3 text-lg">
                                    {paper.title}
                                </h3>

                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-5">
                                    <span className="flex items-center gap-1.5">
                                        <Hash className="w-3.5 h-3.5" />
                                        {paper.total_questions} questions
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(paper.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        ~{Math.ceil(paper.total_questions * 0.9)} min
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                    <Link
                                        href={`/admin/papers/${paper.id}`}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Preview
                                    </Link>
                                    {/* <DeletePaperButton paperId={paper.id} paperTitle={paper.title} /> */}
                                    <DeletePaperButton paperId={paper.id} paperTitle={paper.title} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
