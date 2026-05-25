import * as XLSX from "xlsx";

export const VALID_SUBJECTS = ["Biology", "Chemistry", "Physics", "English", "General"] as const;
export type ValidSubject = (typeof VALID_SUBJECTS)[number];

export interface ParsedQuizRow {
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct: string;
    subject: ValidSubject;
    image_url?: string;
    title?: string;
    /** 1-based Excel row number for skip reporting */
    excel_row: number;
}

export interface SheetDiagnostic {
    name: string;
    status: "imported" | "no_headers" | "empty" | "all_rows_invalid";
    parsed_count: number;
    skipped_count: number;
}

export interface ParseWorkbookResult {
    rows: ParsedQuizRow[];
    sheets_parsed: string[];
    /** Tabs that had the right headers but every data row failed validation */
    sheets_recognized: string[];
    title_hints: string[];
    skipped_rows: number[];
    diagnostics: SheetDiagnostic[];
}

const SUBJECT_ALIASES: Record<string, ValidSubject> = {
    biology: "Biology",
    chemistry: "Chemistry",
    physics: "Physics",
    english: "English",
    general: "General",
};

function normalizeHeader(cell: unknown): string {
    return String(cell ?? "")
        .replace(/\uFEFF/g, "")
        .trim()
        .toLowerCase();
}

type ColumnMap = {
    question: number;
    optionA: number;
    optionB: number;
    optionC: number;
    optionD: number;
    correct: number;
    subject: number;
    image: number;
    title: number;
};

function buildColumnMap(headerRow: unknown[]): ColumnMap | null {
    const map: Partial<ColumnMap> = {};

    headerRow.forEach((cell, index) => {
        const h = normalizeHeader(cell);
        if (!h) return;

        if (h === "question" || h === "questions") map.question = index;
        else if (h === "a" || h === "option a" || h === "opt a" || h === "option_a") map.optionA = index;
        else if (h === "b" || h === "option b" || h === "opt b" || h === "option_b") map.optionB = index;
        else if (h === "c" || h === "option c" || h === "opt c" || h === "option_c") map.optionC = index;
        else if (h === "d" || h === "option d" || h === "opt d" || h === "option_d") map.optionD = index;
        else if (h === "correct" || h === "answer" || h === "correct option") map.correct = index;
        else if (h === "subject" || h === "subjects") map.subject = index;
        else if (h === "image" || h === "image url" || h === "image_url") map.image = index;
        else if (h === "title") map.title = index;
    });

    if (
        map.question === undefined ||
        map.optionA === undefined ||
        map.optionB === undefined ||
        map.optionC === undefined ||
        map.optionD === undefined ||
        map.correct === undefined
    ) {
        return null;
    }

    return map as ColumnMap;
}

function findHeaderRowIndex(matrix: unknown[][]): number {
    for (let i = 0; i < Math.min(matrix.length, 10); i++) {
        const row = matrix[i];
        if (!Array.isArray(row)) continue;
        if (row.some((cell) => normalizeHeader(cell) === "question")) return i;
    }
    return 0;
}

function cellValue(row: unknown[], index: number | undefined): string {
    if (index === undefined) return "";
    const v = row[index];
    if (v === null || v === undefined) return "";
    return String(v).trim();
}

/**
 * Accepts Correct values like "C", "c", "C)", "C) playing", "(C)", or option text "playing".
 */
export function normalizeCorrectAnswer(
    raw: string,
    options: { A: string; B: string; C: string; D: string },
): "A" | "B" | "C" | "D" | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    const upper = trimmed.toUpperCase();
    if (upper === "A" || upper === "B" || upper === "C" || upper === "D") {
        return upper;
    }

    const letterPrefix = trimmed.match(/^[\s(]*([A-Da-d])(?:\s*[\).:\-–—]|\s*\)|\s+)/);
    if (letterPrefix) {
        return letterPrefix[1].toUpperCase() as "A" | "B" | "C" | "D";
    }

    const letterOnly = trimmed.match(/^[\s(]*([A-Da-d])[\s).]*$/);
    if (letterOnly) {
        return letterOnly[1].toUpperCase() as "A" | "B" | "C" | "D";
    }

    const normalized = trimmed.toLowerCase();
    for (const label of ["A", "B", "C", "D"] as const) {
        const opt = options[label].trim().toLowerCase();
        if (!opt) continue;
        if (opt === normalized) return label;
        if (normalized.includes(opt) || opt.includes(normalized)) return label;
    }

    return null;
}

function resolveSubject(
    raw: string,
    sheetName: string,
): ValidSubject | null {
    const trimmed = raw.trim();
    if (trimmed && (VALID_SUBJECTS as readonly string[]).includes(trimmed)) {
        return trimmed as ValidSubject;
    }

    const fromAlias = SUBJECT_ALIASES[trimmed.toLowerCase()];
    if (fromAlias) return fromAlias;

    const fromSheet = SUBJECT_ALIASES[sheetName.trim().toLowerCase()];
    if (fromSheet) return fromSheet;

    return null;
}

function parseSheet(
    sheet: XLSX.WorkSheet,
    sheetName: string,
): {
    parsed: ParsedQuizRow[];
    skipped_rows: number[];
    status: SheetDiagnostic["status"];
} {
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: "",
        raw: false,
    }) as unknown[][];

    if (matrix.length < 2) {
        return { parsed: [], skipped_rows: [], status: "empty" };
    }

    const headerRowIndex = findHeaderRowIndex(matrix);
    const headerRow = matrix[headerRowIndex];
    if (!Array.isArray(headerRow)) {
        return { parsed: [], skipped_rows: [], status: "no_headers" };
    }

    const columns = buildColumnMap(headerRow);
    if (!columns) return { parsed: [], skipped_rows: [], status: "no_headers" };

    const parsed: ParsedQuizRow[] = [];
    const skipped_rows: number[] = [];

    for (let i = headerRowIndex + 1; i < matrix.length; i++) {
        const row = matrix[i];
        if (!Array.isArray(row)) continue;

        const excelRow = i + 1;
        const questionText = cellValue(row, columns.question);
        const optionA = cellValue(row, columns.optionA);
        const optionB = cellValue(row, columns.optionB);
        const optionC = cellValue(row, columns.optionC);
        const optionD = cellValue(row, columns.optionD);
        const correctRaw = cellValue(row, columns.correct);
        const subjectRaw = columns.subject !== undefined ? cellValue(row, columns.subject) : "";
        const imageUrl = columns.image !== undefined ? cellValue(row, columns.image) : "";
        const titleHint = columns.title !== undefined ? cellValue(row, columns.title) : "";

        if (!questionText) continue;

        const options = { A: optionA, B: optionB, C: optionC, D: optionD };
        const subject = resolveSubject(subjectRaw, sheetName);
        const correct = normalizeCorrectAnswer(correctRaw, options);

        if (!subject || !optionA || !optionB || !optionC || !optionD || !correct) {
            skipped_rows.push(excelRow);
            continue;
        }

        parsed.push({
            question_text: questionText,
            option_a: optionA,
            option_b: optionB,
            option_c: optionC,
            option_d: optionD,
            correct,
            subject,
            image_url: imageUrl || undefined,
            title: titleHint || undefined,
            excel_row: excelRow,
        });
    }

    const status: SheetDiagnostic["status"] =
        parsed.length > 0 ? "imported" : skipped_rows.length > 0 ? "all_rows_invalid" : "empty";

    return { parsed, skipped_rows, status };
}

export function buildParseErrorMessage(result: ParseWorkbookResult): string {
    if (result.rows.length > 0) return "";

    if (result.sheets_recognized.length > 0) {
        const tabs = result.sheets_recognized.join(", ");
        const rows =
            result.skipped_rows.length > 0
                ? ` Problem rows (Excel): ${result.skipped_rows.join(", ")}.`
                : "";
        return (
            `Found worksheet layout on: ${tabs}, but every question row was rejected.${rows} ` +
            `Check that Correct is A, B, C, or D (formats like "C" or "C) playing" are OK), options are filled, ` +
            `and Subject is valid or the tab is named Biology, Chemistry, Physics, or English.`
        );
    }

    const unrecognized = result.diagnostics
        .filter((d) => d.status === "no_headers")
        .map((d) => d.name);
    if (unrecognized.length > 0) {
        return (
            `No question tables found. Tabs without the required headers: ${unrecognized.join(", ")}. ` +
            `Each data sheet needs columns: Question, A, B, C, D, Correct (Subject optional if the tab name is a subject).`
        );
    }

    return (
        "No valid question sheets found. Each tab needs columns: Question, A, B, C, D, Correct " +
        "(Subject optional if the tab is named Biology, Chemistry, Physics, or English)."
    );
}

/** Parse all worksheets that match the MDCAT column layout (multi-tab workbooks supported). */
export function parseQuizWorkbook(workbook: XLSX.WorkBook): ParseWorkbookResult {
    const rows: ParsedQuizRow[] = [];
    const sheets_parsed: string[] = [];
    const sheets_recognized: string[] = [];
    const title_hints: string[] = [];
    const skipped_rows: number[] = [];
    const diagnostics: SheetDiagnostic[] = [];

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) continue;

        const { parsed: sheetRows, skipped_rows: sheetSkipped, status } = parseSheet(sheet, sheetName);

        diagnostics.push({
            name: sheetName,
            status,
            parsed_count: sheetRows.length,
            skipped_count: sheetSkipped.length,
        });

        if (status === "no_headers" || status === "empty") continue;

        sheets_recognized.push(sheetName);
        skipped_rows.push(...sheetSkipped);

        if (sheetRows.length > 0) {
            sheets_parsed.push(sheetName);
            rows.push(...sheetRows);
            for (const r of sheetRows) {
                if (r.title) title_hints.push(r.title);
            }
        }
    }

    return { rows, sheets_parsed, sheets_recognized, title_hints, skipped_rows, diagnostics };
}

export function resolveArchiveTitleFromWorkbook(
    formTitle: string,
    fileName: string,
    workbook: XLSX.WorkBook,
    parseResult: ParseWorkbookResult,
): string {
    const fromForm = formTitle.trim();
    if (fromForm) return fromForm;

    const fromColumn = parseResult.title_hints.find((t) => t.trim());
    if (fromColumn) return fromColumn;

    if (parseResult.sheets_parsed.length === 1) {
        const name = parseResult.sheets_parsed[0].trim();
        if (name && name.toLowerCase() !== "sheet1") return name;
    }

    if (parseResult.sheets_parsed.length > 1) {
        return parseResult.sheets_parsed.join(" / ");
    }

    const base = fileName.replace(/\.[^.]+$/, "").trim();
    return base.replace(/[_-]+/g, " ").trim() || "Imported Quiz";
}
