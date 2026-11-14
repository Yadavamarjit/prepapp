import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Split into paragraphs / lines
  const lines = content.split('\n');

  // Simple, clean stateful parser for standard Markdown features:
  // ### Heading 3, #### Heading 4, **bold**, *italic*, lists (- or *), code, horizontal rules
  const renderLine = (line: string, index: number) => {
    const trimmed = line.trim();

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***') {
      return <hr key={index} className="my-3 border-t border-slate-300 dark:border-slate-700" />;
    }

    // Heading 3: ###
    if (trimmed.startsWith('### ')) {
      const text = trimmed.replace(/^###\s+/, '');
      return (
        <h3 key={index} className="text-sm font-bold text-[#1E252B] dark:text-white mt-3 mb-1.5 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1">
          {formatInline(text)}
        </h3>
      );
    }

    // Heading 4: ####
    if (trimmed.startsWith('#### ')) {
      const text = trimmed.replace(/^####\s+/, '');
      return (
        <h4 key={index} className="text-xs font-bold text-[#36624B] dark:text-[#88D4A8] mt-2 mb-1">
          {formatInline(text)}
        </h4>
      );
    }

    // Unordered List item: - or *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const text = trimmed.replace(/^[-*]\s+/, '');
      return (
        <div key={index} className="flex items-start gap-2 pl-2 my-1 text-xs text-[#2A333C] dark:text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-[#36624B] dark:bg-[#88D4A8] mt-1.5 flex-shrink-0" />
          <span className="leading-relaxed">{formatInline(text)}</span>
        </div>
      );
    }

    // Numbered item: e.g. 1. or 2.
    if (/^\d+\.\s+/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (match) {
        return (
          <div key={index} className="flex items-start gap-2 pl-2 my-1 text-xs text-[#2A333C] dark:text-slate-300">
            <span className="font-bold text-[#36624B] dark:text-[#88D4A8] text-[11px] min-w-[16px]">
              {match[1]}.
            </span>
            <span className="leading-relaxed">{formatInline(match[2])}</span>
          </div>
        );
      }
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      const text = trimmed.replace(/^>\s+/, '');
      return (
        <blockquote key={index} className="pl-3 border-l-2 border-[#36624B] dark:border-[#88D4A8] my-2 text-xs italic text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-r-lg">
          {formatInline(text)}
        </blockquote>
      );
    }

    // Empty line
    if (!trimmed) {
      return <div key={index} className="h-1.5" />;
    }

    // Standard paragraph
    return (
      <p key={index} className="text-xs leading-relaxed text-[#2A333C] dark:text-slate-300 my-1">
        {formatInline(line)}
      </p>
    );
  };

  // Helper to parse **bold**, *italic*, and `code` spans
  const formatInline = (str: string): React.ReactNode => {
    // Regex splits by: **bold**, *italic*, `code`
    const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-bold text-[#1E252B] dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={pIdx} className="italic text-slate-700 dark:text-slate-300">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={pIdx} className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[#1E252B] dark:text-[#88D4A8] font-mono text-[11px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return <div className="space-y-1">{lines.map(renderLine)}</div>;
};

