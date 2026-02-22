import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

interface ParsedQuestion {
    question_text: string;
    subject: string;
    options: { text: string; label: string }[];
    correct: string;
    image_url?: string;
}

const VALID_SUBJECTS = ["Biology", "Chemistry", "Physics", "English"];

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Verify admin role
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

        if (!profile || profile.role !== "admin") {
            return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
        }

        // Parse form data
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const title = formData.get("title") as string;
        const year = parseInt(formData.get("year") as string);

        if (!file || !title || !year) {
            return NextResponse.json(
                { error: "Missing required fields: file, title, year" },
                { status: 400 }
            );
        }

        // Read Excel file
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

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

            if (!VALID_SUBJECTS.includes(subject)) {
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
                text: opt.text,
                is_correct: opt.label === q.correct,
            })),
        }));

        // Insert paper, questions, and options in a single atomic transaction
        const { data: paperId, error: rpcError } = await supabase.rpc("upload_paper_batch", {
            p_title: title,
            p_year: year,
            p_total_questions: questions.length,
            p_questions: rpcQuestions,
        });

        if (rpcError || !paperId) {
            return NextResponse.json(
                { error: `Failed to upload paper: ${rpcError?.message}` },
                { status: 500 }
            );
        }

        const insertedCount = questions.length;

        return NextResponse.json({
            success: true,
            paper_id: paperId,
            total_parsed: questions.length,
            total_inserted: insertedCount,
            skipped_rows: skippedRows,
            skipped_count: skippedRows.length,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred while processing the file." },
            { status: 500 }
        );
    }
}
