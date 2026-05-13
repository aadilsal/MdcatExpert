import Link from "next/link";
import {
    Upload,
    FileText,
    Hash,
    Eye,
    BarChart3,
    TrendingUp,
    Users,
} from "lucide-react";
import { DeleteQuizButton } from "./delete-button";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";


export const dynamic = "force-dynamic";

export default async function AdminQuizzesPage() {
    const token = await convexAuthNextjsToken();
    if (!token) {
        return <div className="p-10 text-center text-gray-500">Unauthorized</div>;
    }

    const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
    if (!me || me.role !== "admin") {
        return <div className="p-10 text-center text-gray-500">Forbidden</div>;
    }

    const quizzesList = (await fetchQuery(api.quizzes.getQuizzes, {}, { token })) ?? [];
    const totalQuestions = (quizzesList ?? []).reduce((s, q) => s + Number(q.totalQuestions ?? 0), 0);
    const users = await fetchQuery(api.users.listUsers, {}, { token });
    const totalStudents = (users ?? []).filter((u) => (u.role ?? "student") === "student").length;
    const totalAttempts = 0;

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header with gradient */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-gray-900 via-gray-800 to-primary-900 p-8 text-white shadow-lg">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
                        <p className="mt-2 text-gray-300 max-w-lg">
                            Manage quizzes, track student performance, and keep your MDCAT
                            content up to date.
                        </p>
                    </div>
                    <Link
                        href="/admin/upload"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-sm text-sm shrink-0"
                    >
                        <Upload className="w-4 h-4" />
                        Upload Quiz
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: "Total Quizzes",
                        value: quizzesList.length.toString(),
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

            {/* Quizzes List */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Uploaded Quizzes
                </h2>

                {quizzesList.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
                        <div className="p-14 text-center">
                            <div className="w-16 h-16 bg-linear-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">
                                No quizzes uploaded yet
                            </h3>
                            <p className="text-sm text-gray-500 mb-5">
                                Upload your first MDCAT quiz to get started.
                            </p>
                            <Link
                                href="/admin/upload"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm text-sm"
                            >
                                <Upload className="w-4 h-4" />
                                Upload Quiz
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {quizzesList.map((quiz) => (
                            <div
                                key={quiz._id}
                                className="bg-white rounded-xl border border-gray-100 p-5 shadow-card hover:shadow-card-hover transition-all duration-300 group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-linear-to-br from-primary-100 to-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <FileText className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <span className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-semibold">
                                        {quiz.year}
                                    </span>
                                </div>

                                <h3 className="font-semibold text-gray-900 mb-3 text-lg">
                                    {quiz.title}
                                </h3>

                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-5">
                                    <span className="flex items-center gap-1.5 font-bold text-primary-600">
                                        <Hash className="w-3.5 h-3.5" />
                                        {quiz.subject}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Hash className="w-3.5 h-3.5" />
                                        {quiz.totalQuestions} questions
                                    </span>
                                    {quiz.isPremium && (
                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase">
                                            Premium
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                    <Link
                                        href={`/admin/quizzes/${quiz._id}`}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Preview
                                    </Link>
                                    <DeleteQuizButton quizId={String(quiz._id)} quizTitle={quiz.title} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
