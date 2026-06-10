export type McqOption = {
  label: string;
  text: string;
};

export type McqQuestion = {
  number: number;
  question: string;
  options: McqOption[];
  correctAnswer?: string;
};

export type Flashcard = {
  number?: number;
  question: string;
  answer: string;
};

export type CopilotBlock =
  | { type: "heading"; text: string; level?: 1 | 2 | 3 }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; items: string[] }
  | { type: "mcq"; questions: McqQuestion[] }
  | { type: "flashcard"; cards: Flashcard[] };

/** Remove markdown decoration; keep readable plain text. */
export function stripMarkdownDecorators(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLines(raw: string): string[] {
  return raw.replace(/\r\n/g, "\n").split("\n");
}

function parseMcqQuestions(text: string): McqQuestion[] {
  const parts = text.split(/(?=^#{0,3}\s*Question\s+\d+\s*$)/im);
  const questions: McqQuestion[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const headerMatch = trimmed.match(/^#{0,3}\s*Question\s+(\d+)\s*/i);
    if (!headerMatch) continue;

    const number = Number.parseInt(headerMatch[1], 10);
    const body = trimmed.slice(headerMatch[0].length).trim();
    const lines = normalizeLines(body);

    let question = "";
    const options: McqOption[] = [];
    let correctAnswer: string | undefined;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const optionMatch = trimmedLine.match(/^([A-Da-d])\)\s*(.+)$/);
      const correctMatch = trimmedLine.match(
        /^(?:Correct\s+answer|Answer)\s*:\s*(.+)$/i,
      );

      if (optionMatch) {
        options.push({
          label: optionMatch[1].toUpperCase(),
          text: stripMarkdownDecorators(optionMatch[2]),
        });
      } else if (correctMatch) {
        correctAnswer = stripMarkdownDecorators(correctMatch[1]);
      } else if (!/^#{1,6}\s/.test(trimmedLine)) {
        const cleaned = stripMarkdownDecorators(trimmedLine);
        question = question ? `${question} ${cleaned}` : cleaned;
      }
    }

    if (question || options.length > 0) {
      questions.push({ number, question, options, correctAnswer });
    }
  }

  return questions.sort((a, b) => a.number - b.number);
}

function parseFlashcards(text: string): Flashcard[] {
  const lines = normalizeLines(text);
  const cards: Flashcard[] = [];
  let current: Partial<Flashcard> | null = null;

  const flush = () => {
    if (current?.question && current?.answer) {
      cards.push({
        number: current.number,
        question: current.question,
        answer: current.answer,
      });
    }
    current = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "---") {
      flush();
      continue;
    }

    const cardHeader = trimmed.match(/^#{0,3}\s*(?:Card|Flashcard)\s+(\d+)\s*$/i);
    if (cardHeader) {
      flush();
      current = { number: Number.parseInt(cardHeader[1], 10) };
      continue;
    }

    const questionMatch = trimmed.match(
      /^(?:#{0,3}\s*)?(?:\*\*)?(?:Q(?:uestion)?)(?:\*\*)?\s*:\s*(.+)$/i,
    );
    const answerMatch = trimmed.match(
      /^(?:#{0,3}\s*)?(?:\*\*)?(?:A(?:nswer)?)(?:\*\*)?\s*:\s*(.+)$/i,
    );

    if (questionMatch) {
      if (current?.question) flush();
      current = {
        ...current,
        question: stripMarkdownDecorators(questionMatch[1]),
      };
      continue;
    }

    if (answerMatch) {
      if (!current) current = {};
      current.answer = stripMarkdownDecorators(answerMatch[1]);
      flush();
      continue;
    }

    if (current?.question && !current.answer) {
      current.question = `${current.question} ${stripMarkdownDecorators(trimmed)}`;
    } else if (current?.answer) {
      current.answer = `${current.answer} ${stripMarkdownDecorators(trimmed)}`;
    }
  }

  flush();
  return cards;
}

function parseGenericBlocks(text: string): CopilotBlock[] {
  const lines = normalizeLines(text);
  const blocks: CopilotBlock[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({
      type: "paragraph",
      text: stripMarkdownDecorators(paragraph.join(" ")),
    });
    paragraph = [];
  };

  const flushBullets = () => {
    if (bullets.length === 0) return;
    blocks.push({ type: "bullet", items: bullets.map(stripMarkdownDecorators) });
    bullets = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "---") {
      flushParagraph();
      flushBullets();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushBullets();
      const level = headingMatch[1].length as 1 | 2 | 3;
      blocks.push({
        type: "heading",
        text: stripMarkdownDecorators(headingMatch[2]),
        level,
      });
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      bullets.push(bulletMatch[1]);
      continue;
    }
    if (numberedMatch) {
      flushParagraph();
      bullets.push(numberedMatch[1]);
      continue;
    }

    flushBullets();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushBullets();
  return blocks;
}

export function parseCopilotContent(raw: string): CopilotBlock[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const blocks: CopilotBlock[] = [];
  let body = trimmed;

  const topHeading = trimmed.match(/^#\s+(.+?)(?:\n|$)/);
  if (topHeading) {
    blocks.push({
      type: "heading",
      text: stripMarkdownDecorators(topHeading[1]),
      level: 1,
    });
    body = trimmed.slice(topHeading[0].length).trim();
  }

  const mcqs = parseMcqQuestions(body);
  if (mcqs.length > 0) {
    blocks.push({ type: "mcq", questions: mcqs });
    return blocks;
  }

  const flashcards = parseFlashcards(body);
  if (flashcards.length > 0) {
    blocks.push({ type: "flashcard", cards: flashcards });
    return blocks;
  }

  return blocks.length > 0
    ? [...blocks, ...parseGenericBlocks(body)]
    : parseGenericBlocks(trimmed);
}
