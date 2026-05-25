import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { formatUserError } from "@/lib/format-user-error";

const VALID_SUBJECTS = ["Biology", "Chemistry", "Physics", "English", "General"] as const;

type ValidSubject = (typeof VALID_SUBJECTS)[number];

interface ParsedQuestion {
    question_text: string;
    subject: ValidSubject;
    options: { text: string; label: string }[];
    correct: string;
    image_url?: string;
}

function isValidSubject(s: string): s is ValidSubject {
    return (VALID_SUBJECTS as readonly string[]).includes(s);
}

function titleFromFileName(fileName: string): string {
    const base = fileName.replace(/\.[^.]+$/, "").trim();
    return base.replace(/[_-]+/g, " ").trim() || "Imported Quiz";
}

function resolveArchiveTitle(
    formTitle: string | null,
    fileName: string,
    sheetName: string,
    rows: Record<string, string>[],
): string {
    const fromForm = (formTitle ?? "").trim();
    if (fromForm) return fromForm;

    for (const row of rows) {
        const fromColumn = row["Title"]?.toString().trim();
        if (fromColumn && fromColumn !== "nan") return fromColumn;
    }

    const fromSheet = sheetName.trim();
    if (fromSheet && fromSheet.toLowerCase() !== "sheet1") return fromSheet;

    return titleFromFileName(fileName);
}

export async function POST(request: Request) {
    try {
        const token = await convexAuthNextjsToken();
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
        if (!me || me.role !== "admin") return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });

        // Parse form data
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

        // Read Excel file
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
        const title = resolveArchiveTitle(formTitle, file.name, sheetName, rows);

        if (rows.length === 0) {
            return NextResponse.json(
                { error: "Excel file is empty or could not be parsed" },
                { status: 400 }
            );
        }

        // Validate columns
        const firstRow = rows[0];
        const requiredColumns = ["Question", "A", "B", "C", "D", "Correct", "Subject"];
        const missingColumns = requiredColumns.filter(
            (col) => !(col in firstRow)
        );

        if (missingColumns.length > 0) {
            return NextResponse.json(
                {
                    error: `Missing required columns: ${missingColumns.join(", ")}. Expected: ${requiredColumns.join(", ")}`,
                },
                { status: 400 }
            );
        }

        // Parse questions
        const questions: ParsedQuestion[] = [];
        const skippedRows: number[] = [];

        rows.forEach((row, index) => {
            const questionText = row["Question"]?.toString().trim();
            const optA = row["A"]?.toString().trim();
            const optB = row["B"]?.toString().trim();
            const optC = row["C"]?.toString().trim();
            const optD = row["D"]?.toString().trim();
            const correct = row["Correct"]?.toString().trim().toUpperCase();
            const subject = row["Subject"]?.toString().trim();
            const imageUrl = row["Image"]?.toString().trim() || undefined;

            // Validate row
            if (!questionText || !optA || !optB || !optC || !optD || !correct || !subject) {
                skippedRows.push(index + 2); // +2 for 1-indexed + header
                return;
            }

            if (!["A", "B", "C", "D"].includes(correct)) {
                skippedRows.push(index + 2);
                return;
            }

            if (!isValidSubject(subject)) {
                skippedRows.push(index + 2);
                return;
            }

            questions.push({
                question_text: questionText,
                subject,
                options: [
                    { text: optA, label: "A" },
                    { text: optB, label: "B" },
                    { text: optC, label: "C" },
                    { text: optD, label: "D" },
                ],
                correct,
                image_url: imageUrl,
            });
        });

        if (questions.length === 0) {
            return NextResponse.json(
                { error: "No valid questions found in the Excel file. Check the format and try again." },
                { status: 400 }
            );
        }

        // Format questions for RPC
        const rpcQuestions = questions.map((q) => ({
            question_text: q.question_text,
            subject: q.subject,
            image_url: q.image_url || null,
            options: q.options.map((opt) => ({
                label: opt.label,
                text: opt.text,
                is_correct: opt.label === q.correct,
            })),
        }));

        // Create a staging batch for review
        const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        for (const q of rpcQuestions) {
            await fetchMutation(
                api.staging.createStagingQuestion,
                {
                    batchId,
                    questionText: q.question_text,
                    optionA: q.options[0]?.text ?? "",
                    optionB: q.options[1]?.text ?? "",
                    optionC: q.options[2]?.text ?? "",
                    optionD: q.options[3]?.text ?? "",
                    correctOption: (q.options.find((o) => o.is_correct)?.label ?? "A") as "A" | "B" | "C" | "D",
                    subject: q.subject,
                    explanation: undefined,
                    year,
                    imageUrl: q.image_url ?? undefined,
                },
                { token }
            );
        }

        return NextResponse.json({
            success: true,
            title,
            batchId,
            batch_id: batchId,
            total_parsed: questions.length,
            total_inserted: questions.length,
            skipped_rows: skippedRows,
            skipped_count: skippedRows.length,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: formatUserError(error, "An unexpected error occurred while processing the file.") },
            { status: 500 },
        );
    }
}
