import React from "react";
import { ProjectPlanPreview, ProjectPlan } from "./project-plan-preview";
import { ExternalLink } from "lucide-react";

interface MessageContentRendererProps {
  content: string | { text?: string; projectPlan?: ProjectPlan };
}

// Parse markdown formatting inline
function parseMarkdownInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let currentIndex = 0;
  let keyCounter = 0;

  // Pattern priorities (order matters):
  // 1. URLs
  // 2. Bold + Italic (***text*** or ___text___)
  // 3. Bold (**text** or __text__)
  // 4. Italic (*text* or _text_)
  
  const patterns = [
    // URLs
    { regex: /(https?:\/\/[^\s]+)/g, type: 'url' },
    // Bold + Italic
    { regex: /\*\*\*([^*]+)\*\*\*/g, type: 'bold-italic' },
    { regex: /___([^_]+)___/g, type: 'bold-italic' },
    // Bold
    { regex: /\*\*([^*]+)\*\*/g, type: 'bold' },
    { regex: /__([^_]+)__/g, type: 'bold' },
    // Italic
    { regex: /\*([^*]+)\*/g, type: 'italic' },
    { regex: /_([^_]+)_/g, type: 'italic' },
  ];

  const matches: Array<{ index: number; length: number; type: string; match: string; content?: string }> = [];

  // Find all matches
  patterns.forEach(({ regex, type }) => {
    const regexCopy = new RegExp(regex.source, regex.flags);
    let match;
    while ((match = regexCopy.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        type,
        match: match[0],
        content: match[1]
      });
    }
  });

  // Sort by index
  matches.sort((a, b) => a.index - b.index);

  // Remove overlapping matches (keep first)
  const validMatches = [];
  let lastEnd = 0;
  for (const match of matches) {
    if (match.index >= lastEnd) {
      validMatches.push(match);
      lastEnd = match.index + match.length;
    }
  }

  // Build nodes
  validMatches.forEach((match) => {
    // Add text before match
    if (match.index > currentIndex) {
      nodes.push(text.substring(currentIndex, match.index));
    }

    // Add formatted match
    const key = `md-${keyCounter++}`;
    switch (match.type) {
      case 'url':
        nodes.push(
          <a
            key={key}
            href={match.match}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
          >
            {match.match}
            <ExternalLink className="w-3 h-3 inline" />
          </a>
        );
        break;
      case 'bold-italic':
        nodes.push(
          <strong key={key} className="font-bold italic">
            {match.content}
          </strong>
        );
        break;
      case 'bold':
        nodes.push(
          <strong key={key} className="font-bold">
            {match.content}
          </strong>
        );
        break;
      case 'italic':
        nodes.push(
          <em key={key} className="italic">
            {match.content}
          </em>
        );
        break;
    }

    currentIndex = match.index + match.length;
  });

  // Add remaining text
  if (currentIndex < text.length) {
    nodes.push(text.substring(currentIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

// Parse block-level markdown (headings, lists, blockquotes)
function parseMarkdownBlocks(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let keyCounter = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Headings
    const h6Match = trimmed.match(/^#{6}\s+(.+)$/);
    const h5Match = trimmed.match(/^#{5}\s+(.+)$/);
    const h4Match = trimmed.match(/^#{4}\s+(.+)$/);
    const h3Match = trimmed.match(/^#{3}\s+(.+)$/);
    const h2Match = trimmed.match(/^#{2}\s+(.+)$/);
    const h1Match = trimmed.match(/^#{1}\s+(.+)$/);

    if (h6Match) {
      blocks.push(
        <h6 key={`h6-${keyCounter++}`} className="text-sm font-bold mt-4 mb-2">
          {parseMarkdownInline(h6Match[1])}
        </h6>
      );
      i++;
      continue;
    }
    if (h5Match) {
      blocks.push(
        <h5 key={`h5-${keyCounter++}`} className="text-base font-bold mt-4 mb-2">
          {parseMarkdownInline(h5Match[1])}
        </h5>
      );
      i++;
      continue;
    }
    if (h4Match) {
      blocks.push(
        <h4 key={`h4-${keyCounter++}`} className="text-lg font-bold mt-4 mb-2">
          {parseMarkdownInline(h4Match[1])}
        </h4>
      );
      i++;
      continue;
    }
    if (h3Match) {
      blocks.push(
        <h3 key={`h3-${keyCounter++}`} className="text-xl font-bold mt-4 mb-2">
          {parseMarkdownInline(h3Match[1])}
        </h3>
      );
      i++;
      continue;
    }
    if (h2Match) {
      blocks.push(
        <h2 key={`h2-${keyCounter++}`} className="text-2xl font-bold mt-4 mb-2">
          {parseMarkdownInline(h2Match[1])}
        </h2>
      );
      i++;
      continue;
    }
    if (h1Match) {
      blocks.push(
        <h1 key={`h1-${keyCounter++}`} className="text-3xl font-bold mt-4 mb-2">
          {parseMarkdownInline(h1Match[1])}
        </h1>
      );
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().substring(1).trim());
        i++;
      }
      blocks.push(
        <blockquote key={`quote-${keyCounter++}`} className="border-l-4 border-muted-foreground/30 pl-4 my-3 italic text-muted-foreground">
          {quoteLines.map((qLine, idx) => (
            <div key={idx}>{parseMarkdownInline(qLine)}</div>
          ))}
        </blockquote>
      );
      continue;
    }

    // Ordered list
    if (trimmed.match(/^\d+\.\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s+/)) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push(
        <ol key={`ol-${keyCounter++}`} className="list-decimal list-inside my-2 space-y-1">
          {listItems.map((item, idx) => (
            <li key={idx}>{parseMarkdownInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Unordered list
    if (trimmed.match(/^[-*+]\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^[-*+]\s+/)) {
        listItems.push(lines[i].trim().replace(/^[-*+]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={`ul-${keyCounter++}`} className="list-disc list-inside my-2 space-y-1">
          {listItems.map((item, idx) => (
            <li key={idx}>{parseMarkdownInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Empty line
    if (trimmed === '') {
      blocks.push(<div key={`br-${keyCounter++}`} className="h-2" />);
      i++;
      continue;
    }

    // Regular paragraph
    blocks.push(
      <p key={`p-${keyCounter++}`} className="my-1">
        {parseMarkdownInline(line)}
      </p>
    );
    i++;
  }

  return blocks;
}

export function MessageContentRenderer({ content }: MessageContentRendererProps) {
  // Handle plain string content
  if (typeof content === "string") {
    return <div>{parseMarkdownBlocks(content)}</div>;
  }

  // Handle structured content with project plan
  const { text, projectPlan } = content;

  // Parse text to detect inline project plan markers
  if (text && projectPlan) {
    const parts = text.split("{{PROJECT_PLAN}}");
    
    return (
      <div>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part && <div>{parseMarkdownBlocks(part)}</div>}
            {index < parts.length - 1 && (
              <ProjectPlanPreview plan={projectPlan} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Just project plan, no text
  if (projectPlan) {
    return <ProjectPlanPreview plan={projectPlan} />;
  }

  // Just text, no project plan
  if (text) {
    return <div>{parseMarkdownBlocks(text)}</div>;
  }

  return null;
}