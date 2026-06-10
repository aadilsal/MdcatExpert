import { notFound } from "next/navigation";
import { Suspense } from "react";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import QuizEditorClient from "./quiz-editor-client";

export const dynamic = "force-dynamic";

export default async function AdminQuizDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const token = await convexAuthNextjsToken();
    if (!token) notFound();
    const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
    if (!me || me.role !== "admin") notFound();

    const quiz = await fetchQuery(api.quizzes.getQuizById, { quizId: id as Id<"quizzes"> }, { token });
    if (!quiz) notFound();

    const [questionsList, openReportCount] = await Promise.all([
        fetchQuery(api.quizzes.getQuizQuestions, { quizId: quiz._id }, { token }),
        fetchQuery(api.questionReports.countOpenReportsForQuiz, { quizId: quiz._id }, { token }),
    ]);

    type QRow = NonNullable<(typeof questionsList)[number]>;
    const questions = (questionsList ?? [])
        .filter((q): q is QRow => Boolean(q?._id))
        .map((q, idx) => ({
            id: String(q!._id),
            order: q!.order ?? idx + 1,
            question_text: q!.questionText ?? "",
            option_a: q!.optionA ?? "",
            option_b: q!.optionB ?? "",
            option_c: q!.optionC ?? "",
            option_d: q!.optionD ?? "",
            correct_option: q!.correctOption ?? "A",
            subject: q!.subject ?? "General",
            explanation: q!.explanation ?? "",
            image_url: q!.imageUrl ?? null,
        }));

    return (
        <Suspense fallback={<div className="p-10 text-center text-gray-500 dark:text-gray-400">Loading…</div>}>
            <QuizEditorClient
                quizId={String(quiz._id)}
                quizTitle={quiz.title}
                quizYear={quiz.year}
                questions={questions}
                openReportCount={openReportCount ?? 0}
            />
        </Suspense>
    );
}
