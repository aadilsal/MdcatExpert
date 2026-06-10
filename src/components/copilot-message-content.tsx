"use client";

import {
  parseCopilotContent,
  type CopilotBlock,
  type McqQuestion,
  type Flashcard,
} from "@/lib/parse-copilot-content";

function McqCard({ question }: { question: McqQuestion }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-muted/80 dark:bg-slate-800/50 p-4 space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-primary-600">
        Question {question.number}
      </p>
      {question.question && (
        <p className="font-bold text-gray-900 dark:text-gray-100 leading-relaxed">{question.question}</p>
      )}
      {question.options.length > 0 && (
        <ul className="space-y-2">
          {question.options.map((opt) => (
            <li
              key={opt.label}
              className="flex gap-2.5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
            >
              <span className="font-black text-gray-500 dark:text-gray-400 shrink-0">{opt.label})</span>
              <span>{opt.text}</span>
            </li>
          ))}
        </ul>
      )}
      {question.correctAnswer && (
        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 px-3 py-2 rounded-xl">
          Correct answer: {question.correctAnswer}
        </p>
      )}
    </div>
  );
}

function FlashcardItem({ card, index }: { card: Flashcard; index: number }) {
  const label = card.number ?? index + 1;
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-muted/80 dark:bg-slate-800/50 p-4 space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-primary-600">
        Card {label}
      </p>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
          Question
        </p>
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-relaxed">{card.question}</p>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
          Answer
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{card.answer}</p>
      </div>
    </div>
  );
}

function BlockView({ block }: { block: CopilotBlock }) {
  switch (block.type) {
    case "heading":
      if (block.level === 1) {
        return (
          <p className="text-base font-black text-gray-900 dark:text-gray-100 tracking-tight">{block.text}</p>
        );
      }
      return (
        <p className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wide">
          {block.text}
        </p>
      );
    case "paragraph":
      return <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{block.text}</p>;
    case "bullet":
      return (
        <ul className="space-y-1.5 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <span className="text-primary-500 font-black shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "mcq":
      return (
        <div className="space-y-3">
          {block.questions.map((q) => (
            <McqCard key={q.number} question={q} />
          ))}
        </div>
      );
    case "flashcard":
      return (
        <div className="space-y-3">
          {block.cards.map((card, i) => (
            <FlashcardItem key={`${card.number ?? i}-${card.question}`} card={card} index={i} />
          ))}
        </div>
      );
    default:
      return null;
  }
}

export function CopilotMessageContent({ content }: { content: string }) {
  const blocks = parseCopilotContent(content);

  if (blocks.length === 0) {
    return <p className="text-sm font-medium leading-relaxed text-gray-700 dark:text-gray-300">{content}</p>;
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => (
        <BlockView key={`${block.type}-${i}`} block={block} />
      ))}
    </div>
  );
}
