import type { ReactNode } from "react";
import { normalizeBlogContent } from "@/lib/normalize-blog-content";

function inlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2] !== undefined) {
      parts.push(
        <strong key={`${keyPrefix}-b-${i++}`} className="font-bold text-gray-900">
          {match[2]}
        </strong>,
      );
    } else if (match[3] !== undefined) {
      parts.push(
        <em key={`${keyPrefix}-i-${i++}`} className="italic text-gray-700">
          {match[3]}
        </em>,
      );
    } else if (match[4] !== undefined && match[5] !== undefined) {
      parts.push(
        <a
          key={`${keyPrefix}-a-${i++}`}
          href={match[5]}
          className="text-primary-600 font-semibold hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {match[4]}
        </a>,
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length ? parts : [text];
}

type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

function parseBlocks(normalized: string): Block[] {
  const lines = normalized.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: line.slice(4).trim() });
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3).trim() });
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push({ type: "h2", text: line.slice(2).trim() });
      i++;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Collect paragraph lines until blank, heading, or list
    const paraLines: string[] = [line];
    i++;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (
        !next ||
        next.startsWith("#") ||
        /^[-*]\s+/.test(next)
      ) {
        break;
      }
      paraLines.push(next);
      i++;
    }
    blocks.push({ type: "p", text: paraLines.join(" ") });
  }

  return blocks;
}

export default function BlogContent({ content }: { content: string }) {
  const normalized = normalizeBlogContent(content);
  const blocks = parseBlocks(normalized);

  return (
    <div className="prose-blog max-w-none">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={i}
                className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-12 mb-4 first:mt-0"
              >
                {inlineMarkdown(block.text, `h2-${i}`)}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={i}
                className="text-xl font-black text-gray-900 mt-8 mb-3"
              >
                {inlineMarkdown(block.text, `h3-${i}`)}
              </h3>
            );
          case "ul":
            return (
              <ul
                key={i}
                className="my-5 space-y-3 pl-6 list-disc marker:text-primary-500"
              >
                {block.items.map((item, j) => (
                  <li
                    key={j}
                    className="text-base sm:text-lg text-gray-600 font-medium leading-relaxed pl-1"
                  >
                    {inlineMarkdown(item, `li-${i}-${j}`)}
                  </li>
                ))}
              </ul>
            );
          case "p":
            return (
              <p
                key={i}
                className="text-base sm:text-lg text-gray-600 font-medium leading-[1.85] mb-5 indent-0"
              >
                {inlineMarkdown(block.text, `p-${i}`)}
              </p>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
