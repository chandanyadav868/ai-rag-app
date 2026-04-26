"use client";

import React, { useEffect, useMemo, useRef } from "react";
import hljs from "highlight.js";
import markdownit from "markdown-it";

interface MarkdownProps {
  text: string;
  runCopy?: boolean;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function Markdown({ text }: MarkdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const copyPayloadRef = useRef<Record<string, string>>({});
  const copyTimeoutsRef = useRef<Record<string, number>>({});

  const renderedHtml = useMemo(() => {
    const codePayload: Record<string, string> = {};
    let codeBlockIndex = 0;

    const md = markdownit({
      html: false,
      linkify: true,
      typographer: true,
      breaks: true,
      highlight(code, language) {
        const blockId = `code-block-${codeBlockIndex++}`;
        // console.log({blockId});
        codePayload[blockId] = code;
        // console.log({codePayload});

        const normalizedLanguage = (language || "").trim().toLowerCase();
        // console.log({normalizedLanguage});
        const validLanguage = normalizedLanguage && hljs.getLanguage(normalizedLanguage);
        // console.log({validLanguage});
        const highlightedCode = validLanguage
          ? hljs.highlight(code, {
            language: normalizedLanguage,
            ignoreIllegals: true,
          }).value
          : escapeHtml(code);
        // console.log({highlightedCode});

        return `
          <div class="not-prose my-5 overflow-hidden rounded-3xl border border-white/10 bg-[#08131f] shadow-[0_16px_45px_rgba(0,0,0,0.24)]">
            <div class="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-3">
              <div class="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/45">
                <span class="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300/70"></span>
                <span>${validLanguage ? normalizedLanguage : "code"}</span>
              </div>
              <button
                type="button"
                data-copy-code-id="${blockId}"
                class="markdown-copy-button inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.09] hover:text-white"
              >
                Copy
              </button>
            </div>
            <pre class="copyingSectionScrollbar m-0 overflow-x-auto bg-transparent px-4 py-4 text-[13px] leading-7 text-slate-100"><code class="hljs language-${normalizedLanguage || "plaintext"}">${highlightedCode}</code></pre>
          </div>
        `;
      },
    });

    const defaultLinkRenderer =
      md.renderer.rules.link_open ??
      ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

    md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      token.attrSet("target", "_blank");
      token.attrSet("rel", "noreferrer noopener");
      return defaultLinkRenderer(tokens, idx, options, env, self);
    };

    copyPayloadRef.current = codePayload;
    return md.render(text ?? "");
  }, [text]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleCopyClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLButtonElement>("[data-copy-code-id]");
      if (!button) return;

      const blockId = button.dataset.copyCodeId;
      if (!blockId) return;

      const code = copyPayloadRef.current[blockId];
      if (!code) return;

      try {
        await navigator.clipboard.writeText(code);
        button.textContent = "Copied";
        button.classList.add("border-emerald-300/20", "bg-emerald-400/15", "text-emerald-100");

        if (copyTimeoutsRef.current[blockId]) {
          window.clearTimeout(copyTimeoutsRef.current[blockId]);
        }

        copyTimeoutsRef.current[blockId] = window.setTimeout(() => {
          button.textContent = "Copy";
          button.classList.remove("border-emerald-300/20", "bg-emerald-400/15", "text-emerald-100");
        }, 1800);
      } catch {
        button.textContent = "Failed";
        button.classList.add("border-red-300/20", "bg-red-400/15", "text-red-100");

        if (copyTimeoutsRef.current[blockId]) {
          window.clearTimeout(copyTimeoutsRef.current[blockId]);
        }

        copyTimeoutsRef.current[blockId] = window.setTimeout(() => {
          button.textContent = "Copy";
          button.classList.remove("border-red-300/20", "bg-red-400/15", "text-red-100");
        }, 1800);
      }
    };

    container.addEventListener("click", handleCopyClick);

    return () => {
      container.removeEventListener("click", handleCopyClick);
      Object.values(copyTimeoutsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
      copyTimeoutsRef.current = {};
    };
  }, [renderedHtml]);

  return (
    <div
      ref={containerRef}
      className="prose prose-invert max-w-none rounded-[28px] border border-white/10 bg-[#0b1724] px-4 py-4 text-white shadow-[0_14px_40px_rgba(0,0,0,0.18)] prose-headings:text-white prose-p:text-white/85 prose-strong:text-[#f2d3b8] prose-a:text-cyan-200 prose-a:no-underline hover:prose-a:text-cyan-100 prose-pre:bg-transparent prose-pre:p-0 prose-code:text-[0.92em] prose-code:text-cyan-100 prose-code:before:hidden prose-code:after:hidden prose-blockquote:border-white/10 prose-blockquote:text-white/70 prose-li:text-white/80 prose-hr:border-white/10"
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}

export default Markdown;
