import { useReactToPrint } from "react-to-print";
import React, { useCallback, useMemo, useRef, useState } from 'react'
import MarkdownEditor from '@uiw/react-markdown-editor';

function RIghtSide() {
    const [newContent, setNewContent] = useState("");
    const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
    const [llmInput, setLlmInput] = useState("");
    const [llmLoading, setLlmLoading] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);

    const llmResponseStyle = async () => {
        if (!llmInput) return;

        const combinedPrompt = `Here is my current markdown content:${newContent}Instruction: ${llmInput}Please rewrite the markdown content above following the instruction. Return only the improved markdown, no extra commentary.`;
        const payload = { prompt: combinedPrompt, model: "gemma-4-31b-it", system: "" };

        setLlmLoading(true);
        setNewContent("");
        try {
            const res = await fetch('/api/gemini/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => null);
                throw new Error(`Request failed: ${res.status} ${text || ''}`);
            }

            try {
                const json = await res.json();
                setNewContent(json.raw.candidates[0].content.parts[1].text);
            } catch {
                const text = await res.text();
                setNewContent(text);
            }

            setLlmInput("");
        } catch {
            setNewContent('Error getting response from LLM.');
        } finally {
            setLlmLoading(false);
        }
    };


    const title2 = {
        name: 'title2',
        keyCommand: 'title2',
        button: { 'aria-label': 'Add title text' },
        icon: (
            <svg width="12" height="12" viewBox="0 0 512 512">
                <path fill="currentColor" d="M496 80V48c0-8.837-7.163-16-16-16H320c-8.837 0-16 7.163-16 16v32c0 8.837 7.163 16 16 16h37.621v128H154.379V96H192c8.837 0 16-7.163 16-16V48c0-8.837-7.163-16-16-16H32c-8.837 0-16 7.163-16 16v32c0 8.837 7.163 16 16 16h37.275v320H32c-8.837 0-16 7.163-16 16v32c0 8.837 7.163 16 16 16h160c8.837 0 16-7.163 16-16v-32c0-8.837-7.163-16-16-16h-37.621V288H357.62v128H320c-8.837 0-16 7.163-16 16v32c0 8.837 7.163 16 16 16h160c8.837 0 16-7.163 16-16v-32c0-8.837-7.163-16-16-16h-37.275V96H480c8.837 0 16-7.163 16-16z" />
            </svg>
        ),
        execute: async () => {
            console.log("title2");
            await downloadPdfFromContent()
        },
    };

    const handlePrint = useReactToPrint({
        contentRef: previewRef,

        documentTitle: "The Echo of Liberty",

        pageStyle: `
        @page {
            size: A4;
            margin: 0;
        }

        body {
            margin: 0;
            padding: 0;
        }

        .print-container {
            width: 100%;
            min-height: 100vh;
            padding: 40px;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
        }
    `
    });

    const downloadPdfFromContent = useCallback(async () => {
        try {
            console.log(previewRef.current);

            if (!previewRef.current) {
                alert("Please Click the Preview Button");
                return;
            }

            handlePrint();

        } catch (error) {
            console.error("PDF download failed", error);
            alert("Failed to generate PDF");
        }
    }, [previewRef.current]);

    return (
        <aside
            className="hidden xl:flex flex-col w-[500px] shrink-0 border-l border-white/10 bg-[#081422]/80 backdrop-blur-xl"
            style={{ height: '90vh' }}
        >

            {/* ── DIV 1: Toggle buttons (never shrinks) ── */}
            <div className="shrink-0 flex items-center gap-2 px-5 py-3 border-b border-white/10">
                <button
                    onClick={() => setViewMode('editor')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors
                        ${viewMode === 'editor'
                            ? 'bg-white text-black'
                            : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    Editor
                </button>
                <button
                    onClick={() => setViewMode('preview')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors
                        ${viewMode === 'preview'
                            ? 'bg-white text-black'
                            : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    Preview
                </button>
                <button
                    onClick={async () => await downloadPdfFromContent()}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors`}
                >
                    PDF GENERATE
                </button>
            </div>

            {/* ── DIV 2: Editor / Preview (takes all remaining space, scrolls when content overflows) ── */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'unset', scrollbarGutter: 'stable', scrollbarColor: '#727272 #f2090900' }}>

                {viewMode === 'editor' && (
                    <MarkdownEditor
                        theme="dark"
                        enablePreview={false}
                        toolbars={[
                            "undo", "redo", "bold", "italic", "header", "strike",
                            "underline", "quote", "olist", "ulist", "todo", "link",
                            "image", "code", "codeBlock", title2
                        ]}
                        style={{
                            width: '100%',
                            height: '100%',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'pre-wrap',
                        }}
                        value={newContent}
                        onChange={(value) => setNewContent(value)}
                    />
                )}

                {viewMode === 'preview' && (
                    <div className="px-5 py-4" ref={previewRef}>
                        <div
                            className="prose prose-invert max-w-none bg-white/5 p-4 rounded-lg"
                            style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                        >
                            <MarkdownEditor.Markdown source={newContent} />
                        </div>
                    </div>
                )}
            </div>

            {/* ── DIV 3: LLM textarea (never shrinks, always visible at bottom) ── */}
            <div
                className="shrink-0 border-t border-white/10 px-5 py-4 flex flex-col gap-2"
                style={{ background: 'rgba(6, 15, 26, 0.94)' }}
            >
                <label
                    htmlFor="llm-input"
                    className="text-xs font-semibold tracking-widest text-white/50 uppercase"
                >
                    Ask for an advanced explanation
                </label>

                <textarea
                    id="llm-input"
                    value={llmInput}
                    onChange={(e) => setLlmInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) llmResponseStyle();
                    }}
                    placeholder="e.g. explain in more depth, rewrite formally…"
                    rows={3}
                    className="w-full p-2 rounded-md bg-white/5 text-white text-sm border border-white/10 focus:outline-none focus:border-white/30 resize-none transition-colors placeholder:text-white/30"
                />

                <div className="flex items-center gap-2">
                    <button
                        onClick={llmResponseStyle}
                        disabled={llmLoading || !llmInput.trim()}
                        className="px-4 py-1.5 rounded-md bg-white text-black text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/90 transition-opacity"
                    >
                        {llmLoading ? 'Asking…' : 'Ask LLM'}
                    </button>

                    <button
                        onClick={() => setLlmInput('')}
                        disabled={!llmInput}
                        className="px-3 py-1.5 rounded-md bg-white/10 text-white text-sm hover:bg-white/20 disabled:opacity-40 transition-colors"
                    >
                        Clear
                    </button>

                    <span className="ml-auto text-white/25 text-xs select-none">
                        Ctrl + Enter
                    </span>
                </div>
            </div>

        </aside>
    );
}

export default RIghtSide;