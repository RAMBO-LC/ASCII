import { useState, type ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';

/**
 * Dependency-free markdown renderer covering what the mentor emits:
 * fenced code blocks, headings, bold, inline code, lists, links, paragraphs.
 */
export function Markdown({ content }: { content: string }) {
  const blocks = splitBlocks(content);
  return (
    <div className="space-y-2.5 text-sm leading-relaxed">
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}

type Block =
  | { kind: 'code'; lang: string; code: string }
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'para'; text: string };

function splitBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const fence = /```(\w*)\n([\s\S]*?)(?:```|$)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const pushText = (text: string): void => {
    for (const chunk of text.split(/\n{2,}/)) {
      const t = chunk.trim();
      if (!t) continue;
      const heading = /^(#{1,3})\s+(.*)$/.exec(t);
      if (heading) {
        blocks.push({
          kind: 'heading',
          level: heading[1].length,
          text: heading[2],
        });
        continue;
      }
      const lines = t.split('\n').map((l) => l.trim());
      const isList = lines.every((l) => /^([-*]|\d+\.)\s+/.test(l));
      if (isList && lines.length > 0) {
        const ordered = /^\d+\./.test(lines[0]);
        blocks.push({
          kind: 'list',
          ordered,
          items: lines.map((l) => l.replace(/^([-*]|\d+\.)\s+/, '')),
        });
        continue;
      }
      blocks.push({ kind: 'para', text: t });
    }
  };
  while ((m = fence.exec(content)) !== null) {
    pushText(content.slice(last, m.index));
    blocks.push({
      kind: 'code',
      lang: m[1] || 'text',
      code: m[2].replace(/\n$/, ''),
    });
    last = m.index + m[0].length;
  }
  pushText(content.slice(last));
  return blocks;
}

function Block({ block }: { block: Block }) {
  if (block.kind === 'code') return <CodeBlock lang={block.lang} code={block.code} />;
  if (block.kind === 'heading') {
    const cls =
      block.level === 1
        ? 'text-base font-bold'
        : block.level === 2
          ? 'text-[15px] font-bold'
          : 'text-sm font-semibold';
    return <div className={cls}>{<Inline text={block.text} />}</div>;
  }
  if (block.kind === 'list') {
    const Tag = block.ordered ? 'ol' : 'ul';
    return (
      <Tag
        className={
          block.ordered
            ? 'list-decimal space-y-1 pl-5'
            : 'list-disc space-y-1 pl-5'
        }
      >
        {block.items.map((item, i) => (
          <li key={i}>
            <Inline text={item} />
          </li>
        ))}
      </Tag>
    );
  }
  return (
    <p className="whitespace-pre-wrap break-words">
      <Inline text={block.text} />
    </p>
  );
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-black/60">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {lang}
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          aria-label="Copy code"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[12.5px] leading-relaxed text-zinc-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** Inline bold, code, and links. */
function Inline({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const re =
    /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((?:https?:\/\/)[^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  const pushPlain = (t: string): void => {
    if (t) parts.push(<span key={`p-${k++}`}>{t}</span>);
  };
  while ((m = re.exec(text)) !== null) {
    pushPlain(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) {
      parts.push(
        <strong key={`b-${k++}`} className="font-semibold">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else if (tok.startsWith('`')) {
      parts.push(
        <code
          key={`c-${k++}`}
          className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[12.5px]"
        >
          {tok.slice(1, -1)}
        </code>,
      );
    } else {
      const lm = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok);
      if (lm) {
        parts.push(
          <a
            key={`a-${k++}`}
            href={lm[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
          >
            {lm[1]}
          </a>,
        );
      } else {
        pushPlain(tok);
      }
    }
    last = m.index + tok.length;
  }
  pushPlain(text.slice(last));
  return <>{parts}</>;
}
