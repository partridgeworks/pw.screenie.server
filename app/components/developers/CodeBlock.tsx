"use client";

interface CodeBlockProps {
  code: string;
  language?: string;
}

/**
 * A terminal-style code block component with dark background and monospaced font.
 * Ideal for displaying code examples, terminal commands, or API responses.
 */
export default function CodeBlock({ code, language }: CodeBlockProps) {
  return (
    <div className="relative">
      {language && (
        <div className="absolute top-0 right-0 px-3 py-1 text-xs text-neutral-content/60 bg-neutral-focus rounded-bl-lg rounded-tr-lg">
          {language}
        </div>
      )}
      <pre className="bg-neutral text-neutral-content p-4 rounded-lg overflow-x-auto font-mono text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
