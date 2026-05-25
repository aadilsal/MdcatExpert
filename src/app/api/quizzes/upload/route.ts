import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { formatUserError } from "@/lib/format-user-error";
import {
    buildParseErrorMessage,
    parseQuizWorkbook,
    resolveArchiveTitleFromWorkbook,
} from "@/lib/xlsx-quiz-parser";

export async function POST(request: Request) {
    try {
        const token = await convexAuthNextjsToken();
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
        if (!me || me.role !== "admin") {
            return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const formTitle = (formData.get("title") as string | null) ?? "";
        const yearRaw = formData.get("year") as string;
        const year = parseInt(yearRaw, 10);

        if (!file) {
            return NextResponse.json({ error: "No file provided." }, { status: 400 });
        }
        if (!yearRaw || !Number.isInteger(year) || year <= 0) {
            return NextResponse.json(
                { error: "Please enter a valid release year (e.g., 2024)." },
                { status: 400 },
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const parseResult = parseQuizWorkbook(workbook);

        if (parseResult.rows.length === 0) {
            return NextResponse.json(
                { error: buildParseErrorMessage(parseResult) },
                { status: 400 },
            );
        }

        const title = resolveArchiveTitleFromWorkbook(formTitle, file.name, workbook, parseResult);
        const questions = parseResult.rows;
        const totalRows = questions.length;

        const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        for (const q of questions) {
            await fetchMutation(
                api.staging.createStagingQuestion,
                {
                    batchId,
                    questionText: q.question_text,
                    optionA: q.option_a,
                    optionB: q.option_b,
                    optionC: q.option_c,
                    optionD: q.option_d,
                    correctOption: q.correct as "A" | "B" | "C" | "D",
                    subject: q.subject,
                    explanation: undefined,
                    year,
                    imageUrl: q.image_url,
                },
                { token },
            );
        }

        return NextResponse.json({
            success: true,
            title,
            batchId,
            batch_id: batchId,
            sheets_parsed: parseResult.sheets_parsed,
            total_parsed: totalRows,
            total_inserted: totalRows,
            skipped_rows: parseResult.skipped_rows,
            skipped_count: parseResult.skipped_rows.length,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: formatUserError(error, "An unexpected error occurred while processing the file.") },
            { status: 500 },
        );
    }
}
