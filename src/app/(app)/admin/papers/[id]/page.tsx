import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ArrowLeft,
    FileText,
    CheckCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

const subjectColors: Record<string, string> = {
    Biology: "bg-green-100 text-green-700",
    Chemistry: "bg-purple-100 text-purple-700",
    Physics: "bg-blue-100 text-blue-700",
    English: "bg-orange-100 text-orange-700",
};

export default async function AdminPaperDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: paper } = await supabase
        .from("papers")
        .select("*")
        .eq("id", id)
        .single();

    if (!paper) {
        notFound();
    }

    const { data: questions } = await supabase
        .from("questions")
        .select("*, options(*)")
        .eq("paper_id", id)
        .order("created_at", { ascending: true });

    const questionsList = questions || [];

    // Subject counts
    const subjectCounts: Record<string, number> = {};
    questionsList.forEach((q) => {
        subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
    });

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800 p-8 text-white shadow-lg">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="relative">
                    <Link
                        href="/admin/papers"
                        className="inline-flex items-center gap-1.5 text-primary-200 hover:text-white text-sm font-medium mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Papers
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold">{paper.title}</h1>
                    <div className="flex items-center gap-4 mt-3 text-primary-100 text-sm">
                        <span>Year: {paper.year}</span>
                        <span>•</span>
                        <span>{paper.total_questions} questions</span>
                        <span>•</span>
                        <span>
                            Uploaded {new Date(paper.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Subject Breakdown */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card">
                <h2 className="font-semibold text-gray-900 mb-4">Subject Breakdown</h2>
                <div className="flex flex-wrap gap-3">
                    {Object.entries(subjectCounts).map(([subject, count]) => (
                        <div
                            key={subject}
                            className={`px-4 py-2 rounded-xl text-sm font-medium ${subjectColors[subject] || "bg-gray-100 text-gray-700"
                                }`}
                        >
                            {subject}: {count} questions
                        </div>
                    ))}
                </div>
            </div>

            {/* Questions List */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    All Questions ({questionsList.length})
                </h2>
                <div className="space-y-4">
                    {questionsList.map((question, idx) => (
                        <div
                            key={question.id}
                            className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden"
                        >
                            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-sm font-bold">
                                        {idx + 1}
                                    </span>
                                    <span
                                        className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${subjectColors[question.subject] ||
                                            "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {question.subject}
                                    </span>
                                </div>
                                {question.image_url && (
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        Has image
                                    </span>
                                )}
                            </div>
                            <div className="p-5">
                                <p className="text-gray-900 font-medium mb-4">
                                    {question.question_text}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {(question.options as { id: string; option_text: string; is_correct: boolean }[])?.map(
                                        (option, optIdx) => (
                                            <div
                                                key={option.id}
                                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${option.is_correct
                                                        ? "bg-green-50 border border-green-200 text-green-800"
                                                        : "bg-gray-50 border border-gray-100 text-gray-700"
                                                    }`}
                                            >
                                                <span
                                                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${option.is_correct
                                                            ? "bg-green-200 text-green-800"
                                                            : "bg-gray-200 text-gray-600"
                                                        }`}
                                                >
                                                    {String.fromCharCode(65 + optIdx)}
                                                </span>
                                                <span className="flex-1">{option.option_text}</span>
                                                {option.is_correct && (
                                                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
