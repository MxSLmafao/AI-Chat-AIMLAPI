import { useMemo } from "react";
import MarkdownIt from "markdown-it";
import katex from "katex";
import "katex/dist/katex.min.css";

const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true
});

// Add LaTeX support
const originalRender = md.render.bind(md);
md.render = (src: string) => {
  // Replace LaTeX blocks with rendered KaTeX
  const content = src.replace(/\$\$([\s\S]*?)\$\$|\$((?!\$)[\s\S]*?)\$/g, (match, block, inline) => {
    const tex = block || inline;
    try {
      return katex.renderToString(tex, {
        displayMode: !!block,
        throwOnError: false
      });
    } catch (e) {
      console.error("KaTeX error:", e);
      return match; // Return original text if rendering fails
    }
  });

  return originalRender(content);
};

interface MessageFormatterProps {
  content: string;
  className?: string;
}

export function MessageFormatter({ content, className = "" }: MessageFormatterProps) {
  const formattedContent = useMemo(() => {
    try {
      return md.render(content);
    } catch (e) {
      console.error("Markdown rendering error:", e);
      return content;
    }
  }, [content]);

  return (
    <div 
      className={`prose dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedContent }} 
    />
  );
}
